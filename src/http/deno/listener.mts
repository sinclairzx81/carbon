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
import * as Async from '../../async/index.mjs'
import * as System from '../../system/index.mjs'
import * as Dispose from '../../dispose/index.mjs'

export class Listener implements Dispose.Dispose {
  readonly #server: Deno.Server
  readonly #listenCallback: Core.ListenCallback
  readonly #abort: AbortController
  readonly #options: Core.ListenOptions
  constructor(options: Core.ListenOptions, listenCallback: Core.ListenCallback) {
    this.#options = options
    this.#listenCallback = listenCallback
    this.#abort = new AbortController()
    const onListen = { onListen: () => {} }
    const hostname = typeof options.hostname === 'string' ? { hostname: options.hostname } : {}
    const port = { port: options.port }
    const signal = { signal: this.#abort.signal }
    this.#server = Deno.serve(
      {
        ...onListen,
        ...signal,
        ...port,
        ...hostname,
      },
      (request, info) => this.#onFetch(request, info),
    )
  }
  // ----------------------------------------------------------------
  // Dispose
  // ----------------------------------------------------------------
  public [Symbol.dispose]() {
    this.dispose()
  }
  public async [Symbol.asyncDispose]() {
    return await this.dispose()
  }
  public async dispose(): Promise<void> {
    this.#abort.abort()
    await this.#server.finished
    await Async.delay(System.listenerCloseDelay)
  }
  // ----------------------------------------------------------------
  // Fetch
  // ----------------------------------------------------------------
  #getRequestInfo(info: Deno.ServeHandlerInfo) {
    const remote = {
      address: info.remoteAddr.hostname,
      port: info.remoteAddr.port,
    }
    const local = {
      address: this.#options.hostname || '',
      port: this.#options.port,
    }
    return { remote, local }
  }
  #patchRequest(request: Request): Request {
    const patched: any = request
    patched.cache = 'default'
    patched.credentials = 'include'
    patched.destination = ''
    patched.integrity = ''
    patched.isHistoryNavigation = false
    patched.isReloadNavigation = false
    patched.keepalive = false
    patched.mode = 'cors'
    patched.referrerPolicy = ''
    return request
  }
  async #onFetch(request: Request, info: Deno.ServeHandlerInfo): Promise<Response> {
    const patched = this.#patchRequest(request)
    try {
      return this.#listenCallback(patched, this.#getRequestInfo(info))
    } catch (error) {
      return new Response('Internal Server Error', { status: 500 })
    }
  }
}
