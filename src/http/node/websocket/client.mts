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

import * as Runtime from '../../../runtime/index.mjs'
import * as Events from '../../../events/index.mjs'

const Ws = await Runtime.dynamicImport<typeof import('ws')>('ws')
import type { Event as WsEvent, MessageEvent as WsMessageEvent, ErrorEvent as WsErrorEvent, CloseEvent as WsCloseEvent } from 'ws'

export class WebSocket {
  readonly #socket: InstanceType<typeof Ws.WebSocket>
  readonly #events: Events.Events
  #closed: boolean
  constructor(endpoint: string) {
    this.#closed = false
    this.#events = new Events.Events()
    this.#socket = new Ws.WebSocket(endpoint)
    this.#socket.binaryType = 'arraybuffer'
    this.#socket.addEventListener('open', (value) => this.#onOpen(value))
    this.#socket.addEventListener('message', (value) => this.#onMessage(value))
    this.#socket.addEventListener('error', (value) => this.#onError(value))
    this.#socket.addEventListener('close', (value) => this.#onClose(value))
  }
  // ----------------------------------------------------------------
  // WebSocket
  // ----------------------------------------------------------------
  public on(event: 'open', handler: Events.EventHandler<Event>): Events.EventListener
  public on(event: 'message', handler: Events.EventHandler<MessageEvent>): Events.EventListener
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
  public close(code?: number): void {
    if (this.#closed) return
    this.#closed = true
    this.#socket.close(code)
  }
  // ----------------------------------------------------------------
  // Events
  // ----------------------------------------------------------------
  #onOpen(value: WsEvent) {
    this.#events.send('open', value)
  }
  #onMessage(value: WsMessageEvent) {
    const event = new MessageEvent('message', { data: value.data })
    this.#events.send('message', event)
  }
  #onError(value: WsErrorEvent) {
    this.#events.send('error', value)
  }
  #onClose(value: WsCloseEvent) {
    this.#closed = true
    this.#events.send('close', value)
  }
}
