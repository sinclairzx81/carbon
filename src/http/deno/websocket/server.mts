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

export class ServerWebSocket {
  readonly #socket: globalThis.WebSocket
  readonly #events: Events.Events
  #closed: boolean
  constructor(socket: globalThis.WebSocket) {
    this.#events = new Events.Events()
    this.#closed = false
    this.#socket = socket
    this.#socket.binaryType = 'arraybuffer'
    this.#socket.addEventListener('open', () => this.#onOpen())
    this.#socket.addEventListener('message', (event) => this.#onMessage(event))
    this.#socket.addEventListener('error', (event) => this.#onError(event))
    this.#socket.addEventListener('close', () => this.#onClose())
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
    return this.#socket.binaryType
  }
  public set binaryType(value: BinaryType) {
    this.#socket.binaryType = value
  }
  public send(value: string | ArrayBufferLike | ArrayBufferView): void {
    if (this.#closed) return
    this.#socket.send(value)
  }
  public ping(value?: string): void {
    if (this.#closed) return
    //this.#socket.ping(data, mask)
  }
  public pong(value?: string): void {
    if (this.#closed) return
    //this.#socket.pong(data, mask)
  }
  public close(code?: number): void {
    if (this.#closed) return
    this.#closed = true
    this.#socket.close(code)
  }
  // ----------------------------------------------------------------
  // Events
  // ----------------------------------------------------------------
  #onOpen() {}
  #onMessage(event: MessageEvent) {
    this.#events.send('message', event)
  }
  #onError(event: Event) {
    this.#events.send('error', event)
  }
  #onClose() {
    this.#closed = true
    this.#events.send('close', void 0)
  }
}
