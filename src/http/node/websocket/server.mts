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

import * as Events from '../../../events/index.mjs'
import * as Buffer from '../../../buffer/index.mjs'
import type { WebSocket as WsWebSocket } from 'ws'

export class ServerWebSocket {
  readonly #events: Events.Events
  readonly #socket: WsWebSocket
  #closed: boolean
  constructor(socket: WsWebSocket) {
    this.#closed = false
    this.#events = new Events.Events()
    this.#socket = socket
    this.#socket.binaryType = 'arraybuffer'
    this.#socket.on('message', (value) => this.#onMessage(value))
    this.#socket.on('ping', (value) => this.#onPing(value))
    this.#socket.on('pong', (value) => this.#onPong(value))
    this.#socket.on('error', (error) => this.#onError(error))
    this.#socket.on('close', () => this.#onClose())
  }
  // ----------------------------------------------------------------
  // ServerWebSocket
  // ----------------------------------------------------------------
  public on(event: 'message', handler: Events.EventHandler<MessageEvent>): Events.EventListener
  public on(event: 'ping', handler: Events.EventHandler<MessageEvent>): Events.EventListener
  public on(event: 'pong', handler: Events.EventHandler<MessageEvent>): Events.EventListener
  public on(event: 'error', handler: Events.EventHandler<Event>): Events.EventListener
  public on(event: 'close', handler: Events.EventHandler<CloseEvent>): Events.EventListener
  public on(event: string, handler: Events.EventHandler<any>): Events.EventListener {
    return this.#events.on(event, handler)
  }
  public get binaryType(): BinaryType {
    return this.#socket.binaryType as any
  }
  public set binaryType(value: BinaryType) {
    this.#socket.binaryType = value as any
  }
  public send(value: string | ArrayBufferLike | ArrayBufferView): void {
    if (this.#closed) return
    this.#socket.send(value as any)
  }
  public ping(data?: unknown, mask?: boolean): void {
    if (this.#closed) return
    this.#socket.ping(data, mask)
  }
  public pong(data?: unknown, mask?: boolean): void {
    if (this.#closed) return
    this.#socket.pong(data, mask)
  }
  public close(code?: number): void {
    if (this.#closed) return
    this.#closed = true
    this.#socket.close(code)
  }
  // ----------------------------------------------------------------
  // Events
  // ----------------------------------------------------------------
  #onMessage(value: any /* WebSocket.RawData */) {
    // prettier-ignore
    const event = (value instanceof Uint8Array) 
      ? new MessageEvent('message', { data: Buffer.decode(value) }) 
      : new MessageEvent('message', { data: value })
    this.#events.send('message', event)
  }
  #onPing(value: any /* WebSocket.RawData */) {
    this.#events.send('message', value.data)
  }
  #onPong(value: any /* WebSocket.RawData */) {
    this.#events.send('message', value.data)
  }
  #onError(value: any) {
    this.#events.send('error', value)
  }
  #onClose() {
    this.#closed = true
    this.#events.send('close', void 0)
  }
}
