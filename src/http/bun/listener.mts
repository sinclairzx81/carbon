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

import type { Server as BunServer, ServerWebSocket as BunServerWebSocket } from 'bun'

import * as Async from '../../async/index.mjs'
import * as Dispose from '../../dispose/index.mjs'
import * as System from '../../system/index.mjs'
import * as Core from '../core/index.mjs'
import { ServerWebSocket } from './index.mjs'

export const UpgradeMap = new WeakMap<Request, Core.UpgradeCallback>()

export class Listener implements Dispose.Dispose {
  readonly #callback: Core.ListenCallback
  readonly #server: BunServer
  readonly #options: Core.ListenOptions
  constructor(options: Core.ListenOptions, callback: Core.ListenCallback) {
    const hostname = typeof options.hostname === 'string' ? { hostname: options.hostname } : {}
    const port = { port: options.port }
    this.#options = options
    this.#callback = callback
    // prettier-ignore
    this.#server = Bun.serve<ServerWebSocket>({
      ...hostname, ...port,
      fetch: (request, server) => this.#onFetch(request, server),
      websocket: {
        close:   (ws, code, message) => this.#onWebSocketClose(ws, code, message),
        message: (ws, message)       => this.#onWebSocketMessage(ws, message),
        ping:    (ws, buffer)        => this.#onWebSocketPing(ws, buffer),
        pong:    (ws, buffer)        => this.#onWebSocketPong(ws, buffer),
        open:    (ws)                => this.#onWebSocketOpen(ws),
      },
    })
  }
  // ----------------------------------------------------------------
  // Dispose
  // ----------------------------------------------------------------
  public async [Symbol.asyncDispose]() {
    return await this.dispose()
  }
  public async dispose(): Promise<void> {
    this.#server.stop(true)
    await Async.delay(System.listenerCloseDelay)
  }
  // ----------------------------------------------------------------
  // Fetch
  // ----------------------------------------------------------------
  // prettier-ignore
  #getRequestInfo(request: Request, server: BunServer) {
    const remote = server.requestIP(request) ?? { address: '', port: 0 }
    const local = { address: this.#options.hostname ?? '', port: this.#options.port }
    return { remote, local }
  }
  #patchRequest(request: Request): Request {
    const patched: any = request
    request.blob = async () => new Blob([new Uint8Array(await patched.arrayBuffer())])
    patched.isHistoryNavigation = false
    patched.isReloadNavigation = false
    patched.keepalive = false
    return patched
  }
  async #onFetch(request: Request, server: BunServer) {
    const patched = this.#patchRequest(request)
    const info = this.#getRequestInfo(request, server)
    const response = await this.#callback(patched, info)
    if (UpgradeMap.has(request)) {
      const callback = UpgradeMap.get(request)!
      const barrier = new Async.Barrier({ paused: true })
      const socket = new ServerWebSocket(barrier)
      const upgradeOk = server.upgrade(request, { data: socket })
      if (!upgradeOk) return new Response('Request failed to upgrade', { status: 500 })
      await barrier.wait() // waiting for server socket open event
      callback(socket)
      return undefined
    } else {
      return response
    }
  }
  // ----------------------------------------------------------------
  // WebSocket
  // ----------------------------------------------------------------
  async #onWebSocketOpen(ws: BunServerWebSocket<ServerWebSocket>) {
    ws.data.onOpen(ws)
  }
  async #onWebSocketMessage(ws: BunServerWebSocket<ServerWebSocket>, message: Buffer | string) {
    ws.data.onMessage(message)
  }
  async #onWebSocketPing(ws: BunServerWebSocket<ServerWebSocket>, buffer: globalThis.Buffer) {
    ws.data.onPing(buffer)
  }
  async #onWebSocketPong(ws: BunServerWebSocket<ServerWebSocket>, buffer: globalThis.Buffer) {
    ws.data.onPong(buffer)
  }
  async #onWebSocketClose(ws: BunServerWebSocket<ServerWebSocket>, code: number, message: string) {
    ws.data.onClose(code, message)
  }
}
