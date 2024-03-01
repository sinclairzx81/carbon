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
const WorkerThreads = await Runtime.dynamicImport<typeof import('node:worker_threads')>('node:worker_threads')
import type { Worker as WorkerThreadsWorker } from 'node:worker_threads'

import * as Core from '../core/index.mjs'
import * as Events from '../../events/index.mjs'

export class Worker {
  readonly #worker: WorkerThreadsWorker
  readonly #events: Events.Events
  #terminated: boolean
  constructor(workerPath: string, options: Core.WorkerOptions = {}) {
    this.#events = new Events.Events()
    this.#worker = new WorkerThreads.Worker(workerPath, options)
    this.#worker.on('messageerror', (event) => this.#onMessageError(event))
    this.#worker.on('message', (event) => this.#onMessage(event))
    this.#worker.on('error', (event) => this.#onError(event))
    this.#terminated = false
  }
  public on(event: 'messageerror', handler: Events.EventHandler<MessageEvent>): Events.EventListener
  public on(event: 'message', handler: Events.EventHandler<MessageEvent>): Events.EventListener
  public on(event: 'error', handler: Events.EventHandler<ErrorEvent>): Events.EventListener
  public on(event: string, handler: Events.EventHandler<any>): Events.EventListener {
    return this.#events.on(event, handler)
  }
  public send(value: unknown, transferList: Transferable[] = []): void {
    if (!this.#terminated) this.#worker.postMessage(value, transferList as any)
  }
  public terminate(): void {
    this.#terminated = true
    this.#worker.terminate()
    this.#worker.unref()
  }
  #onMessageError(data: any) {
    this.#events.send('messageerror', new MessageEvent('message', { data }))
  }
  #onMessage(data: any) {
    this.#events.send('message', new MessageEvent('message', { data }))
  }
  #onError(event: Error) {
    this.#events.send('error', event)
  }
}
