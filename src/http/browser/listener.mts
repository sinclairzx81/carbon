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

import * as Dispose from '../../dispose/index.mjs'
import * as Async from '../../async/index.mjs'
import * as System from '../../system/index.mjs'
import * as Buffer from '../../buffer/index.mjs'
import * as Stream from '../../stream/index.mjs'
import * as Net from '../../net/index.mjs'
import * as Core from '../core/index.mjs'
import * as Signal from './signal.mjs'
import { ServerWebSocket } from './index.mjs'

export const UpgradeMap = new WeakMap<Request, Core.UpgradeCallback>()

export interface ListenerRequestInit {
  url: string
  method: string
  headers: Record<PropertyKey, string>
}
export interface ListenerResponseInit {
  headers: Record<PropertyKey, string>
  statusText: string
  status: number
}
export class Listener implements Dispose.Dispose {
  readonly #callback: Core.ListenCallback
  readonly #options: Core.ListenOptions
  readonly #listener: Net.Listener
  constructor(options: Core.ListenOptions, callback: Core.ListenCallback) {
    this.#options = { port: options.port, hostname: options.hostname ?? 'localhost' }
    this.#listener = Net.listen(options, (socket) => this.#onRequest(socket))
    this.#callback = callback
  }
  async [Symbol.asyncDispose](): Promise<void> {
    await this.dispose()
  }
  async dispose(): Promise<void> {
    await this.#listener.dispose()
    await Async.delay(System.listenerCloseDelay)
  }
  // prettier-ignore
  async #readListenerRequestInit(stream: Stream.FrameDuplex): Promise<ListenerRequestInit | null> {
    const buffer = await stream.read()
    if (buffer === null) return null
    const decoded = Buffer.decode(buffer)
    const init = JSON.parse(decoded) as ListenerRequestInit
    return (
      typeof init.url === 'string' &&
      typeof init.method === 'string' &&
      typeof init.headers === 'object' &&
      init.headers !== null
    ) ? init : null
  }
  async #sendResponse(response: Response, stream: Stream.FrameDuplex) {
    await stream.write(
      Buffer.encode(
        JSON.stringify({
          headers: Object.fromEntries(response.headers.entries()),
          status: response.status,
          statusText: response.statusText,
        } as ListenerResponseInit),
      ),
    )
    if (response.body === null) {
      return await stream.close()
    }
    const reader = response.body.getReader()
    while (true) {
      const next = await reader.read()
      if (next.value !== undefined) await stream.write(next.value)
      if (next.done) break
    }
    await stream.close()
  }
  #createReadableFromRequestInit(listenerRequestInit: ListenerRequestInit, stream: Stream.FrameDuplex) {
    if (['HEAD', 'GET'].includes(listenerRequestInit.method)) return null
    return new ReadableStream({
      pull: async (controller) => {
        const next = await stream.read()
        if (next === null || Buffer.equals(next, Signal.REQUEST_END)) {
          return controller.close()
        } else {
          controller.enqueue(next)
        }
      },
    })
  }
  // prettier-ignore
  async #onRequest(socket: Net.Socket) {
    const stream = new Stream.FrameDuplex(socket)
    const listenerRequestInit = await this.#readListenerRequestInit(stream)
    if (listenerRequestInit === null) return await stream.close()
    const url = new URL(`http://${this.#options.hostname}:${this.#options.port}${listenerRequestInit.url}`)
    const headers = new Headers(listenerRequestInit.headers)
    const body = this.#createReadableFromRequestInit(listenerRequestInit, stream)
    const request = new Request(url, {
      method: listenerRequestInit.method,
      headers: headers,
      body: body,
      duplex: 'half',
    } as RequestInit)
    const response = await this.#callback(request, {
      local: socket.local,
      remote: socket.remote,
    })
    if(UpgradeMap.has(request)) {
      const callback = UpgradeMap.get(request)!
      await stream.write(Signal.WEBSOCKET)
      callback(new ServerWebSocket(stream))
    } else {
      await stream.write(Signal.RESPONSE)
      await this.#sendResponse(response, stream)
    }
  }
}
