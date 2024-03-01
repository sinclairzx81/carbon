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
const Ws = await Runtime.dynamicImport<typeof import('ws')>('ws')
const Http = await Runtime.dynamicImport<typeof import('node:http')>('node:http')
import type { Server as HttpServer, IncomingMessage as HttpIncomingMessage, ServerResponse as HttpServerResponse } from 'node:http'
import type { WebSocketServer } from 'ws'
import type { Duplex } from 'node:stream'

import * as Core from '../core/index.mjs'
import * as Async from '../../async/index.mjs'
import * as System from '../../system/index.mjs'
import * as Dispose from '../../dispose/index.mjs'
import { IncomingMessageToRequest } from './request.mjs'
import { UpgradeMap } from './upgrade.mjs'

export class Listener implements Dispose.Dispose {
  readonly #deferredClose: Async.Deferred<void>
  readonly #wsserver: WebSocketServer
  readonly #server: HttpServer
  readonly #options: Core.ListenOptions
  readonly #callback: Core.ListenCallback
  #closed: boolean
  constructor(options: Core.ListenOptions, callback: Core.ListenCallback) {
    this.#deferredClose = new Async.Deferred<void>()
    this.#options = options
    this.#callback = callback
    this.#wsserver = new Ws.WebSocketServer({ noServer: true })
    this.#server = new Http.Server()
    this.#server.on('request', (request, response) => this.#onRequest(request, response))
    this.#server.on('upgrade', (request, socket, head) => this.#onUpgrade(request, socket, head))
    this.#server.on('close', () => this.#onClose())
    this.#listen(options)
    this.#closed = false
  }
  // ----------------------------------------------------------------
  // Dispose
  // ----------------------------------------------------------------
  public async [Symbol.asyncDispose]() {
    return await this.dispose()
  }
  public async dispose(): Promise<void> {
    if (this.#closed) return
    this.#closed = true
    this.#server.closeAllConnections()
    this.#server.close()
    return this.#deferredClose.promise()
  }
  // ----------------------------------------------------------------
  // GetRequestInfo
  // ----------------------------------------------------------------
  #getRequestInfo(incomingMessage: HttpIncomingMessage) {
    const remote = {
      address: incomingMessage.socket.remoteAddress ?? '',
      port: incomingMessage.socket.remotePort ?? 0,
    }
    const local = {
      address: incomingMessage.socket.localAddress ?? '',
      port: incomingMessage.socket.localPort ?? 0,
    }
    return { remote, local }
  }
  // ----------------------------------------------------------------
  // OnUpgrade
  // ----------------------------------------------------------------
  async #onUpgrade(incomingMessage: HttpIncomingMessage, socket: Duplex, head: Buffer) {
    const request = IncomingMessageToRequest.map(incomingMessage, this.#options)
    UpgradeMap.set(request, {
      wsserver: this.#wsserver,
      incomingMessage: incomingMessage,
      socket: socket,
      head: head,
    })
    const info = this.#getRequestInfo(incomingMessage)
    const response = await this.#callback(request, info)
    if (response.status !== 200) socket.destroy()
  }
  // ----------------------------------------------------------------
  // OnRequest
  // ----------------------------------------------------------------
  async #onRequest(incomingMessage: HttpIncomingMessage, serverResponse: HttpServerResponse) {
    const request = IncomingMessageToRequest.map(incomingMessage, this.#options)
    const info = this.#getRequestInfo(incomingMessage)
    const response = await this.#callback(request, info)
    this.#writeHeader(serverResponse, response)
    await this.#writeResponse(serverResponse, response)
  }
  // ----------------------------------------------------------------
  // Request
  // ----------------------------------------------------------------
  async #onClose() {
    await Async.delay(System.listenerCloseDelay)
    this.#deferredClose.resolve(void 0)
  }
  // ----------------------------------------------------------------
  // WriteResponse
  // ----------------------------------------------------------------
  #writeHeader(serverResponse: HttpServerResponse, response: Response) {
    const headers = Object.fromEntries(response.headers.entries())
    serverResponse.writeHead(response.status, response.statusText, headers)
  }
  async #writeResponse(serverResponse: HttpServerResponse, response: Response) {
    if (response.body === null) return serverResponse.end()
    const reader = response.body.getReader()
    while (true) {
      const next = await reader.read()
      if (next.value !== undefined) {
        serverResponse.write(next.value)
      }
      if (next.done) break
    }
    serverResponse.end()
  }
  // ----------------------------------------------------------------
  // Listen
  // ----------------------------------------------------------------
  #listen(options: Core.ListenOptions) {
    // prettier-ignore
    return typeof options.hostname === 'string' 
      ? this.#server.listen(options.port, options.hostname) 
      : this.#server.listen(options.port)
  }
}
