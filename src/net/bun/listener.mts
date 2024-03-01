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

const Net = await Runtime.dynamicImport<typeof import('node:net')>('node:net')
import * as Runtime from '../../runtime/index.mjs'
import type { Socket as NetSocket } from 'node:net'

import * as Core from '../core/index.mjs'
import * as System from '../../system/index.mjs'
import * as Async from '../../async/index.mjs'
import * as Dispose from '../../dispose/index.mjs'
import { Socket } from './socket.mjs'

export class Listener implements Dispose.Dispose {
  readonly #deferredClose: Async.Deferred
  readonly #server: InstanceType<typeof Net.Server>
  readonly #callback: Core.ListenCallback
  #closed: boolean
  constructor(options: Core.ListenOptions, callback: Core.ListenCallback) {
    this.#deferredClose = new Async.Deferred()
    this.#callback = callback
    this.#server = new Net.Server()
    this.#server.on('connection', (socket) => this.#onConnection(socket))
    this.#server.on('close', () => this.#onClose())
    this.#server.listen(options.port)
    this.#closed = false
  }
  // ----------------------------------------------------------------
  // Dispose
  // ----------------------------------------------------------------
  public async [Symbol.asyncDispose]() {
    return await this.dispose()
  }
  public async dispose() {
    if (this.#closed) return
    this.#closed = true
    this.#server.close()
    await this.#deferredClose.promise()
  }
  // ----------------------------------------------------------------
  // Events
  // ----------------------------------------------------------------
  #onConnection(socket: NetSocket) {
    this.#callback(new Socket(socket))
  }
  async #onClose() {
    await Async.delay(System.listenerCloseDelay)
    this.#deferredClose.resolve(void 0)
  }
}
