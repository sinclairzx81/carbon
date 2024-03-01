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

import * as Runtime from '../../runtime/index.mjs'
import * as Async from '../../async/index.mjs'
import * as System from '../../system/index.mjs'
import { Hub } from '../../hub/index.mjs'
import { Device, Peer } from './device.mjs'

const barrier = new Async.Barrier({ paused: true })
const listens = new Map<number, Listener>()
// ------------------------------------------------------------------
// System
// ------------------------------------------------------------------
System.onHub((hub) => setDevice(hub))
// ------------------------------------------------------------------
// Listener
// ------------------------------------------------------------------
export type ListenCallback = (peer: Peer, datachannel: RTCDataChannel) => any

export interface ListenOptions {
  port: number
}
export class Listener {
  #acceptCallback: ListenCallback
  #disposeCallback: Function
  constructor(acceptCallback: ListenCallback, disposeCallback: Function) {
    this.#acceptCallback = acceptCallback
    this.#disposeCallback = disposeCallback
  }
  public accept(peer: Peer, datachannel: RTCDataChannel) {
    this.#acceptCallback(peer, datachannel)
  }
  public dispose() {
    this.#disposeCallback()
  }
}
export function listen(options: ListenOptions, callback: ListenCallback): Listener {
  const listener = new Listener(callback, () => listens.delete(options.port))
  listens.set(options.port, listener)
  return listener
}
// ------------------------------------------------------------------
// Connect
// ------------------------------------------------------------------
export async function connect(remoteAddress: string, port: number) {
  await barrier.wait()
  return await device!.connect(remoteAddress, port)
}
// ------------------------------------------------------------------
// Internal
// ------------------------------------------------------------------
let device: Device | null = null
function onListenEvent(event: [Peer, RTCDataChannel]) {
  const [peer, datachannel] = event
  const listener = listens.get(parseInt(datachannel.label))
  if (!listener) return datachannel.close()
  listener.accept(peer, datachannel)
}
function setDevice(hub: Hub) {
  if (!Runtime.isBrowser()) return
  if (device !== null) device.dispose()
  device = new Device(hub)
  device.listen((event) => onListenEvent(event))
  barrier.resume()
}
