/*--------------------------------------------------------------------------

@sinclair/carbon

The MIT License (MIT)

Copyright (c) 2024 Haydn Paterson (sinclair) <haydn.developer@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

---------------------------------------------------------------------------*/

import * as Async from '../../async/index.mjs'
import * as Events from '../../events/index.mjs'
import { Dispose } from '../../dispose/index.mjs'
import { Hub, Message } from '../../hub/index.mjs'

// ------------------------------------------------------------------
// Device: Message
// ------------------------------------------------------------------
export type DeviceMessage = DeviceCandidate | DeviceDescription

export type DeviceCandidate = {
  type: 'candidate'
  candidate: RTCIceCandidate | null
}
export type DeviceDescription = {
  type: 'description'
  description: RTCSessionDescription
}
export interface Peer {
  connection: RTCPeerConnection
  datachannels: Set<RTCDataChannel>
  localAddress: string
  remoteAddress: string
  makingOffer: boolean
  ignoreOffer: boolean
}
// ------------------------------------------------------------------
// Device
// ------------------------------------------------------------------
export class Device implements Dispose {
  #hub: Hub
  #events: Events.Events
  #peers: Map<string, Peer>
  #mutex: Async.Mutex
  constructor(hub: Hub) {
    this.#hub = hub
    this.#hub.receive((message) => this.#onDeviceMessage(message))
    this.#peers = new Map<string, Peer>()
    this.#events = new Events.Events()
    this.#mutex = new Async.Mutex()
    this.#setupLocalhost().catch(console.error)
  }
  /** Listens for incoming data channels */
  public listen(callback: Events.EventHandler<[Peer, RTCDataChannel]>) {
    this.#events.on('datachannel', callback as never)
  }
  /** Connects to a remote peer */
  public async connect(remoteAddress: string, port: number): Promise<[Peer, RTCDataChannel]> {
    const open = new Async.Deferred()
    const peer = await this.#createPeer(await this.#resolveAddress(remoteAddress))
    const datachannel = peer.connection.createDataChannel(port.toString(), { ordered: true, maxRetransmits: 16 })
    datachannel.addEventListener('open', () => {
      peer.datachannels.add(datachannel)
      open.resolve()
    })
    datachannel.addEventListener('close', () => {
      peer.datachannels.delete(datachannel)
    })
    setTimeout(() => open.reject(new Error(`Connection to '${remoteAddress}:${port}' timed out`)), 4000)
    await open.promise()
    return [peer, datachannel]
  }
  [Symbol.asyncDispose](): Promise<void> {
    return this.dispose()
  }
  async dispose(): Promise<void> {
    await this.#terminateConnections()
  }
  // ------------------------------------------------------------------
  // SendToNetwork
  // ------------------------------------------------------------------
  #sendToNetwork(request: { to: string; data: DeviceMessage }) {
    if (['loopback:0', 'loopback:1'].includes(request.to)) {
      const from = request.to === 'loopback:0' ? 'loopback:1' : 'loopback:0'
      this.#onDeviceMessage({ from, to: request.to, data: request.data })
    } else {
      this.#hub.send({ to: request.to, data: request.data })
    }
  }
  // ------------------------------------------------------------------
  // Hub: Events
  // ------------------------------------------------------------------
  async #onDeviceDescription(message: Message<DeviceDescription>) {
    const lock = await this.#mutex.lock()
    try {
      const peer = await this.#createPeer(message.from)
      const [collision, polite] = [this.#isCollision(peer, message.data), this.#isPolite(peer.localAddress, peer.remoteAddress)]
      peer.ignoreOffer = !polite && collision
      if (peer.ignoreOffer) return
      await peer.connection.setRemoteDescription(message.data.description)
      if (message.data.description.type == 'offer') {
        await peer.connection.setLocalDescription()
        const [to, description] = [peer.remoteAddress, peer.connection.localDescription!]
        this.#sendToNetwork({ to, data: { type: 'description', description } })
      }
    } finally {
      lock.dispose()
    }
  }
  async #onDeviceCandidate(message: Message<DeviceCandidate>) {
    if (message.data.candidate === null) return
    const peer = await this.#createPeer(message.from)
    try {
      await peer.connection.addIceCandidate(message.data.candidate)
    } catch (error) {
      if (peer.ignoreOffer) return
      throw error
    }
  }
  #onDeviceMessage(message: Message) {
    const data = message.data as DeviceMessage
    // prettier-ignore
    switch (data.type) {
      case 'description': return this.#onDeviceDescription(message as never)
      case 'candidate': return this.#onDeviceCandidate(message as never)
    }
  }
  // ------------------------------------------------------------------
  // Peer: Events
  // ------------------------------------------------------------------
  async #onPeerNegotiationNeeded(peer: Peer, event: Event) {
    const lock = await this.#mutex.lock()
    peer.makingOffer = true
    try {
      await peer.connection.setLocalDescription()
      const [description, to] = [peer.connection.localDescription!, peer.remoteAddress]
      const data: DeviceDescription = { type: 'description', description }
      this.#sendToNetwork({ to, data })
    } catch (error) {
      console.warn(error)
    } finally {
      peer.makingOffer = false
      lock.dispose()
    }
  }
  #onPeerIceCandidate(peer: Peer, event: RTCPeerConnectionIceEvent) {
    this.#sendToNetwork({ to: peer.remoteAddress, data: { type: 'candidate', candidate: event.candidate } })
  }
  #onPeerConnectionStateChange(peer: Peer, event: Event) {
    if (peer.connection.iceConnectionState !== 'disconnected') return
    this.#terminateConnection(peer.remoteAddress)
  }
  #onPeerDataChannel(peer: Peer, event: RTCDataChannelEvent) {
    const datachannel = event.channel
    event.channel.addEventListener('close', () => peer.datachannels.delete(datachannel))
    peer.datachannels.add(datachannel)
    this.#events.send('datachannel', [peer, datachannel])
  }
  // ----------------------------------------------------------------
  // Collision
  // ----------------------------------------------------------------
  #isCollision(peer: Peer, data: DeviceDescription) {
    return data.description.type === 'offer' && (peer.makingOffer || peer.connection.signalingState !== 'stable')
  }
  #isPolite(addressA: string, addressB: string) {
    const sorted = [addressA, addressB].sort()
    return addressA === sorted[0]
  }
  // ----------------------------------------------------------------
  // ResolvePeer
  // ----------------------------------------------------------------
  // prettier-ignore
  async #createPeer(remoteAddress: string): Promise<Peer> {
    if (this.#peers.has(remoteAddress)) return this.#peers.get(remoteAddress)!
    const configuration = await this.#hub.configuration()
    const localAddress = await this.#hub.address()
    const connection = new RTCPeerConnection(configuration)
    const peer: Peer = { connection, datachannels: new Set<RTCDataChannel>(), localAddress, remoteAddress, makingOffer: false, ignoreOffer: true }
    this.#peers.set(remoteAddress, peer)
    peer.connection.addEventListener('iceconnectionstatechange', (event) => this.#onPeerConnectionStateChange(peer, event))
    peer.connection.addEventListener('icegatheringstatechange', (event) => this.#onPeerConnectionStateChange(peer, event))
    peer.connection.addEventListener('signalingstatechange', (event) => this.#onPeerConnectionStateChange(peer, event))
    peer.connection.addEventListener('negotiationneeded', (event) => this.#onPeerNegotiationNeeded(peer, event))
    peer.connection.addEventListener('icecandidate', (event) => this.#onPeerIceCandidate(peer, event))
    peer.connection.addEventListener('datachannel', (event) => this.#onPeerDataChannel(peer, event))
    return peer
  }
  // ----------------------------------------------------------------
  // Address
  // ----------------------------------------------------------------
  async #resolveAddress(remoteAddress: string): Promise<string> {
    const localAddress = await this.#hub.address()
    return remoteAddress === 'localhost' || remoteAddress === localAddress ? 'loopback:1' : remoteAddress
  }
  // ----------------------------------------------------------------
  // Terminate
  // ----------------------------------------------------------------
  async #terminateConnections() {
    for (const peer of this.#peers.values()) {
      peer.datachannels.clear()
      peer.connection.close()
    }
    this.#peers.clear()
  }
  async #terminateConnection(remoteAddress: string) {
    const lock = await this.#mutex.lock()
    try {
      const targetAddress = await this.#resolveAddress(remoteAddress)
      if (!this.#peers.has(targetAddress)) return
      if (['loopback:0', 'loopback:1'].includes(targetAddress)) {
        if (this.#peers.has('loopback:0') && this.#peers.has('loopback:1')) {
          const localhost0 = this.#peers.get('loopback:0')!
          const localhost1 = this.#peers.get('loopback:1')!
          this.#peers.delete('loopback:0')
          this.#peers.delete('loopback:1')
          localhost1.connection.close()
          localhost0.connection.close()
          await this.#setupLocalhost()
        }
      } else {
        const peer = this.#peers.get(targetAddress)!
        peer.datachannels.clear()
        peer.connection.close()
      }
    } finally {
      lock.dispose()
    }
  }
  // ----------------------------------------------------------------
  // Localhost
  // ----------------------------------------------------------------
  async #setupLocalhost(): Promise<void> {
    const configuration = await this.#hub.configuration()
    {
      // loopback:0
      const connection = new RTCPeerConnection(configuration)
      const peer: Peer = { connection, datachannels: new Set<RTCDataChannel>(), localAddress: 'loopback:0', remoteAddress: 'loopback:1', makingOffer: false, ignoreOffer: false }
      connection.addEventListener('iceconnectionstatechange', (event) => this.#onPeerConnectionStateChange(peer, event))
      connection.addEventListener('icegatheringstatechange', (event) => this.#onPeerConnectionStateChange(peer, event))
      connection.addEventListener('signalingstatechange', (event) => this.#onPeerConnectionStateChange(peer, event))
      connection.addEventListener('negotiationneeded', (event) => this.#onPeerNegotiationNeeded(peer, event))
      connection.addEventListener('icecandidate', (event) => this.#onPeerIceCandidate(peer, event))
      connection.addEventListener('datachannel', (event) => this.#onPeerDataChannel(peer, event))
      this.#peers.set(peer.remoteAddress, peer)
    }
    {
      // loopback:1
      const connection = new RTCPeerConnection(configuration)
      const peer: Peer = { connection, datachannels: new Set<RTCDataChannel>(), localAddress: 'loopback:1', remoteAddress: 'loopback:0', makingOffer: false, ignoreOffer: false }
      connection.addEventListener('iceconnectionstatechange', (event) => this.#onPeerConnectionStateChange(peer, event))
      connection.addEventListener('icegatheringstatechange', (event) => this.#onPeerConnectionStateChange(peer, event))
      connection.addEventListener('signalingstatechange', (event) => this.#onPeerConnectionStateChange(peer, event))
      connection.addEventListener('negotiationneeded', (event) => this.#onPeerNegotiationNeeded(peer, event))
      connection.addEventListener('icecandidate', (event) => this.#onPeerIceCandidate(peer, event))
      connection.addEventListener('datachannel', (event) => this.#onPeerDataChannel(peer, event))
      this.#peers.set(peer.remoteAddress, peer)
    }
  }
}
