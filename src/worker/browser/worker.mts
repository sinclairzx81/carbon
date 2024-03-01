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

import * as Core from '../core/index.mjs'
import * as Events from '../../events/index.mjs'

export class Worker {
  readonly #worker: globalThis.Worker
  readonly #events: Events.Events
  constructor(workerPath: string, options?: Core.WorkerOptions) {
    this.#events = new Events.Events()
    this.#worker = new globalThis.Worker(workerPath, { type: 'module' })
    this.#worker.addEventListener('messageerror', (event) => this.#onMessageError(event))
    this.#worker.addEventListener('message', (event) => this.#onMessage(event))
    this.#worker.addEventListener('error', (event) => this.#onError(event))
  }
  public on(event: 'message', handler: Events.EventHandler<MessageEvent>): Events.EventListener
  public on(event: 'messageerror', handler: Events.EventHandler<MessageEvent>): Events.EventListener
  public on(event: 'error', handler: Events.EventHandler<ErrorEvent>): Events.EventListener
  public on(event: string, handler: Events.EventHandler<any>): Events.EventListener {
    return this.#events.on(event, handler)
  }
  public send(value: unknown, transferList: Transferable[] = []): void {
    this.#worker.postMessage(value, transferList)
  }
  public terminate(): void {
    this.#worker.terminate()
  }
  #onMessageError(event: MessageEvent) {
    this.#events.send('messageerror', event)
  }
  #onMessage(event: MessageEvent) {
    this.#events.send('message', event)
  }
  #onError(event: ErrorEvent) {
    this.#events.send('error', event)
  }
}
