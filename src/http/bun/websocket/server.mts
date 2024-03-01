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

import type { ServerWebSocket as BunServerWebSocket } from 'bun'
import * as Events from '../../../events/index.mjs'
import * as Async from '../../../async/index.mjs'

export class ServerWebSocket {
  readonly #events: Events.Events
  readonly #barrier: Async.Barrier
  #socket!: BunServerWebSocket<ServerWebSocket>
  #closed: boolean
  constructor(barrier: Async.Barrier) {
    this.#barrier = barrier
    this.#events = new Events.Events()
    this.#closed = false
  }
  // ----------------------------------------------------------------
  // Events
  // ----------------------------------------------------------------
  public on(event: 'message', handler: Events.EventHandler<MessageEvent>): Events.EventListener
  public on(event: 'ping', handler: Events.EventHandler<MessageEvent>): Events.EventListener
  public on(event: 'pong', handler: Events.EventHandler<MessageEvent>): Events.EventListener
  public on(event: 'error', handler: Events.EventHandler<Event>): Events.EventListener
  public on(event: 'close', handler: Events.EventHandler<CloseEvent>): Events.EventListener
  public on(event: string, handler: Events.EventHandler<any>): Events.EventListener {
    return this.#events.on(event, handler)
  }
  // ----------------------------------------------------------------
  // Properties
  // ----------------------------------------------------------------
  public get binaryType(): BinaryType {
    return this.#socket.binaryType as BinaryType
  }
  // ----------------------------------------------------------------
  // Methods
  // ----------------------------------------------------------------
  public send(value: string | ArrayBufferLike | ArrayBufferView): void {
    if (this.#closed) return
    this.#socket.send(value as any)
  }
  public ping(data?: string): void {
    if (this.#closed) return
    this.#socket.ping(data)
  }
  public pong(data?: string): void {
    if (this.#closed) return
    this.#socket.pong(data)
  }
  public close(code?: number): void {
    if (this.#closed) return
    this.#closed = true
    this.#socket.close(code)
  }
  // ----------------------------------------------------------------
  // Exterior Bun Listener Interface
  // ----------------------------------------------------------------
  public onOpen(socket: BunServerWebSocket<ServerWebSocket>) {
    this.#socket = socket
    this.#socket.binaryType = 'arraybuffer'
    // This barrier is shared by the listener. Resuming here will
    // cause the waiting listener to dispatch the server socket
    // on the upgrade callback.
    this.#barrier.resume()
  }
  public onMessage(value: globalThis.Buffer | string) {
    // prettier-ignore
    const event = (value instanceof globalThis.Buffer) 
      ? new MessageEvent('message', { data: value.buffer }) 
      : new MessageEvent('message', { data: value })
    this.#events.send('message', event)
  }
  public onPing(value: globalThis.Buffer) {
    const event = value instanceof globalThis.Buffer ? new MessageEvent('message', { data: value.buffer }) : new MessageEvent('message', { data: value })
    this.#events.send('ping', event)
  }
  public onPong(value: globalThis.Buffer) {
    const event = value instanceof globalThis.Buffer ? new MessageEvent('message', { data: value.buffer }) : new MessageEvent('message', { data: value })
    this.#events.send('pong', event)
  }
  public onClose(code: number, message: string) {
    this.#closed = true
    this.#events.send('close', void 0)
  }
}
