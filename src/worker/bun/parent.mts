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

declare var self: Worker

import * as Runtime from '../../runtime/index.mjs'
const WorkerThreads = await Runtime.dynamicImport<typeof import('node:worker_threads')>('node:worker_threads')

import * as Events from '../../events/index.mjs'

export namespace Parent {
  const events = new Events.Events()
  if (isWorker()) {
    self.addEventListener('messageerror', (event) => events.send('messageerror', event))
    self.addEventListener('message', (event) => events.send('message', event))
    self.addEventListener('close', (event) => events.send('close', event))
  }
  export function on(event: 'messageerror', handler: Events.EventHandler<MessageEvent>): Events.EventListener
  export function on(event: 'message', handler: Events.EventHandler<MessageEvent>): Events.EventListener
  export function on(event: 'close', handler: Events.EventHandler<Event>): Events.EventListener
  export function on(event: string, handler: Events.EventHandler<any>): Events.EventListener {
    return events.on(event, handler)
  }
  export function send(value: unknown): void {
    if (isWorker()) self.postMessage(value)
  }

  function isWorker(): boolean {
    return !WorkerThreads.isMainThread || WorkerThreads.parentPort !== null
  }
}
