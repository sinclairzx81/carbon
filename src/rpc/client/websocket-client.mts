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

import * as Async from '../../async/index.mjs'
import * as Http from '../../http/index.mjs'
import * as Encoding from '../../encoding/index.mjs'
import * as Contract from '../contract/index.mjs'

export class WebSocketClient<Contract extends Contract.RpcContract> {
  readonly #methods: Map<keyof Contract['client'], Contract.ClientMethod>
  readonly #socket: Http.WebSocket
  readonly #encoding: Contract.JsonRpcEncoding
  readonly #responder: Contract.Responder
  readonly #barrier: Async.Barrier
  #closed: boolean
  constructor(public readonly contract: Contract, public readonly endpoint: string, public readonly query: Record<string, string> = {}) {
    this.#methods = new Map<string, Contract.ClientMethod>()
    this.#barrier = new Async.Barrier({ paused: true })
    this.#responder = new Contract.Responder()
    this.#encoding = new Contract.JsonRpcEncoding(this.#resolveEncoding(contract))
    this.#socket = new Http.WebSocket(endpoint)
    this.#socket.on('open', () => this.#onOpen())
    this.#socket.on('message', (event) => this.#onMessage(event))
    this.#socket.on('error', () => this.#onError())
    this.#socket.on('close', () => this.#onClose())
    this.#closed = false
    this.#setupMethods()
  }
  // ----------------------------------------------------------------
  // Methods
  // ----------------------------------------------------------------
  public method<Name extends keyof Contract['client']>(name: Name, callback: Contract.ClientMethodCallback<Contract['client'][Name]>): Contract.ClientMethodCallback<Contract['client'][Name]> {
    if (!this.#methods.has(name)) this.#throw(`Method '${name as string}' does not exist on service contract`)
    const method = this.#methods.get(name)!
    method.impl(callback as never)
    return callback
  }
  // ----------------------------------------------------------------
  // Client
  // ----------------------------------------------------------------
  /** Calls a service method and returns the result */
  public async call<Name extends keyof Contract['service']>(name: Name, ...params: Contract.ClientMethodParameters<Contract['service'][Name]['parameters']>): Promise<Contract.ClientMethodReturnType<Contract['service'][Name]['returns']>> {
    await this.#barrier.wait()
    this.#assertIsOpen()
    const handle = this.#responder.handle()
    const request = this.#createRequest({ jsonrpc: '2.0', id: handle, method: name as string, params: params })
    this.#socket.send(request)
    return this.#responder.wait(handle)
  }
  /** Sends to a service method and ignores the result */
  public send<Name extends keyof Contract['service']>(name: Name, ...params: Contract.ClientMethodParameters<Contract['service'][Name]['parameters']>): void {
    this.#barrier.wait().then(() => {
      this.#assertIsOpen()
      const request = this.#createRequest({ jsonrpc: '2.0', method: name as string, params: params })
      this.#socket.send(request)
    })
  }
  /** Dispose of this client */
  public dispose() {
    this.#socket.close()
  }
  // ----------------------------------------------------------------
  // Events
  // ----------------------------------------------------------------
  #onOpen() {
    this.#barrier.resume()
  }
  // prettier-ignore
  #onMessage(event: MessageEvent<any>) {
    try {
      const data = event.data instanceof ArrayBuffer ? new Uint8Array(event.data) : event.data
      const response = this.#encoding.unknown.decode(data)
      switch(response.type) {
        case 'JsonRpcRequest': return this.#onRequest(response.request)
        case 'JsonRpcResponse': return this.#onResponse(response.response)
      }
    } catch(error) {
      // todo
    }
  }
  #onClose() {
    this.#closed = true
  }
  #onError() {}
  // ----------------------------------------------------------------
  // Request
  // ----------------------------------------------------------------
  async #onRequest(request: Contract.JsonRpcRequest) {
    // --------------------------------------------------------------
    // Method
    // --------------------------------------------------------------
    const method = this.#methods.get(request.method)
    if (method === undefined) {
      return this.#shouldRespond(request)
        ? this.#socket.send(
            this.#createResponseError(request, {
              code: Contract.JsonRpcErrorCode.MethodNotFound,
              message: `Method '${request.method}' not found`,
            }),
          )
        : undefined
    }
    // --------------------------------------------------------------
    // Result
    // --------------------------------------------------------------
    const result = await method.call(request.params ?? ([] as any)).catch((error) => error)
    // --------------------------------------------------------------
    // No Reply
    // --------------------------------------------------------------
    if (!this.#shouldRespond(request)) return
    // --------------------------------------------------------------
    // Errors
    // --------------------------------------------------------------
    if (result instanceof Contract.RpcException) {
      return this.#socket.send(
        this.#createResponseError(request, {
          code: result.code,
          message: result.message,
          data: result.data,
        }),
      )
    }
    if (result instanceof Error) {
      return this.#socket.send(
        this.#createResponseError(request, {
          code: Contract.JsonRpcErrorCode.InternalError,
          message: `An error occured while processing this request`,
        }),
      )
    }
    // --------------------------------------------------------------
    // Respond
    // --------------------------------------------------------------
    return this.#shouldRespond(request) ? this.#socket.send(this.#createResponseResult(request, result)) : undefined
  }
  #onResponse(response: Contract.JsonRpcResponse) {
    if (response.id === undefined || typeof response.id !== 'string') return
    if (!this.#responder.has(response.id)) return
    if (response.error) {
      const exception = new Contract.RpcException(response.error.message, response.error.code, response.error.data)
      this.#responder.reject(response.id, exception)
    } else {
      this.#responder.resolve(response.id, response.result!)
    }
  }
  // ----------------------------------------------------------------
  // Internal
  // ----------------------------------------------------------------
  // prettier-ignore
  #resolveEncoding(contract: Contract.RpcContract): Encoding.Encoding {
    switch (contract.encoding) {
      case 'application/json': return new Encoding.JsonEncoding()
      case 'application/x-msgpack': return new Encoding.MsgPackEncoding()
      default: this.#throw(`Unknown contract encoding '${contract.encoding}'`)
    }
  }
  #shouldRespond(request: Contract.JsonRpcRequest) {
    return request.id !== null && request.id !== undefined
  }
  #createRequest(request: Contract.JsonRpcRequest): Uint8Array {
    return this.#encoding.request.encode(request)
  }
  #createResponseResult(request: Contract.JsonRpcRequest, result: unknown): Uint8Array {
    return this.#encoding.response.encode({ jsonrpc: '2.0', id: request.id ?? null, result })
  }
  #createResponseError(request: Contract.JsonRpcRequest, error: { code: number; message: string; data?: unknown }): Uint8Array {
    return this.#encoding.response.encode({ jsonrpc: '2.0', id: request.id ?? null, error })
  }
  // ----------------------------------------------------------------
  // Asserts
  // ----------------------------------------------------------------
  #assertIsOpen() {
    if (this.#closed) this.#throw('Socket is closed')
  }
  #throw(message: string): never {
    throw Error(message)
  }
  // ----------------------------------------------------------------
  // Internal
  // ----------------------------------------------------------------
  #setupMethods() {
    for (const name of Object.keys(this.contract.client)) {
      const type = this.contract.client[name]
      const method = new Contract.ClientMethod(type)
      this.#methods.set(name, method)
    }
  }
}
