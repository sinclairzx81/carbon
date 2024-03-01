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

import * as Events from '../../../../events/index.mjs'
import * as Core from '../../../core/index.mjs'
import { CarbonWebSocket, StandardWebSocket } from './index.mjs'

export class WebSocket {
  readonly #socket: Core.WebSocket
  constructor(endpoint: string) {
    this.#socket = endpoint.startsWith('webrtc://') ? new CarbonWebSocket(endpoint) : new StandardWebSocket(endpoint)
  }
  // ----------------------------------------------------------------
  // WebSocket
  // ----------------------------------------------------------------
  public on(event: 'open', handler: Events.EventHandler<Event>): Events.EventListener
  public on(event: 'message', handler: Events.EventHandler<MessageEvent>): Events.EventListener
  public on(event: 'error', handler: Events.EventHandler<Event>): Events.EventListener
  public on(event: 'close', handler: Events.EventHandler<CloseEvent>): Events.EventListener
  public on(event: string, handler: Events.EventHandler<any>): Events.EventListener {
    return this.#socket.on(event, handler)
  }
  public get binaryType(): BinaryType {
    return this.#socket.binaryType
  }
  public send(value: string | ArrayBufferLike | ArrayBufferView): void {
    this.#socket.send(value)
  }
  public close(code?: number): void {
    this.#socket.close(code)
  }
}
