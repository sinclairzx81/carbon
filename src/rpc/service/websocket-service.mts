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

import * as Crypto from '../../crypto/index.mjs'
import * as Http from '../../http/index.mjs'

import { Type, TSchema, TString } from '../../type/index.mjs'
import * as Encoding from '../../encoding/index.mjs'
import * as Contract from '../contract/index.mjs'

/** JsonRpc 2.0 WebSocket Service. Supports Bidirectional Rpc communication */
export class WebSocketService<Contract extends Contract.RpcContract, Identity extends TSchema = TString> {
  #onAuthorizeCallback: Contract.RpcServerAuthorizeCallback<Identity>
  #onConnectCallback: Contract.RpcServerConnectCallback<Identity>
  #onCloseCallback: Contract.RpcServerCloseCallback<Identity>

  readonly #responder: Contract.Responder
  readonly #sockets: Map<string, Http.ServerWebSocket>
  readonly #methods: Map<keyof Contract['service'], Contract.ServiceMethod>
  readonly #encoding: Contract.JsonRpcEncoding
  readonly #identity: Identity
  readonly #contract: Contract

  constructor(contract: Contract, identity?: Identity) {
    this.#responder = new Contract.Responder()
    this.#encoding = new Contract.JsonRpcEncoding(this.#resolveEncoding(contract))
    this.#sockets = new Map<string, Http.ServerWebSocket>()
    this.#methods = new Map<keyof Contract['service'], Contract.ServiceMethod>()
    this.#identity = identity ?? (Type.String() as unknown as Identity)
    this.#contract = contract
    this.#onAuthorizeCallback = (socketId) => socketId
    this.#onConnectCallback = () => {}
    this.#onCloseCallback = () => {}
    this.#setupMethods()
  }
  // ----------------------------------------------------------------
  // Events
  // ----------------------------------------------------------------
  public event(name: 'authorize', callback: Contract.RpcServerAuthorizeCallback<Identity>): Contract.RpcServerAuthorizeCallback<Identity>
  public event(name: 'connect', callback: Contract.RpcServerConnectCallback<Identity>): Contract.RpcServerConnectCallback<Identity>
  public event(name: 'close', callback: Contract.RpcServerCloseCallback<Identity>): Contract.RpcServerCloseCallback<Identity>
  public event(name: string, callback: (...args: any[]) => any): any {
    // prettier-ignore
    switch(name) {
      case 'authorize': this.#onAuthorizeCallback = callback; return callback
      case 'connect': this.#onConnectCallback = callback; return callback
      case 'close': this.#onCloseCallback = callback; return callback
      default: this.#throw(`Unknown event name '${name}'`)
    }
  }
  // ----------------------------------------------------------------
  // Methods
  // ----------------------------------------------------------------
  public method<Name extends keyof Contract['service']>(name: Name, callback: Contract.ServiceMethodCallback<Identity, Contract['service'][Name]>): Contract.ServiceMethodCallback<Identity, Contract['service'][Name]> {
    if (!this.#methods.has(name)) this.#throw(`Method '${name as string}' does not exist on service contract`)
    const method = this.#methods.get(name)!
    method.impl(callback as Contract.ServiceMethodCallback<any, any>)
    return callback
  }
  // ----------------------------------------------------------------
  // Client
  // ----------------------------------------------------------------
  // prettier-ignore
  public async call<Method extends keyof Contract['client']>(socketId: string, method: Method, ...params: Contract.RpcParameters<Contract['client'][Method]>): Promise<Contract.RpcReturnType<Contract['client'][Method]>> {
    const socket = this.#sockets.get(socketId)
    if (socket === undefined) return
    const handle = this.#responder.handle()
    socket.send(this.#createRequest({
      jsonrpc: '2.0',
      id: handle,
      method: method as string,
      params: params,
    }))
    return this.#responder.wait(handle)
  }
  // prettier-ignore
  public send<Method extends keyof Contract['client']>(socketId: string, method: Method, ...params: Contract.RpcParameters<Contract['client'][Method]>): void {
    const socket = this.#sockets.get(socketId)
    if (socket === undefined) return
    socket.send(this.#createRequest({
      jsonrpc: '2.0',
      method: method as string,
      params: params,
    }))
  }
  // ----------------------------------------------------------------
  // Service
  // ----------------------------------------------------------------
  public async fetch(request: Request): Promise<Response> {
    const socketId = Crypto.randomUUID()
    const identity = await this.#resolveIdentity(request, socketId).catch(() => undefined)
    if (identity === undefined) return new Response('Authorization', { status: 401 })
    return Http.upgrade(request, (socket) => {
      socket.on('close', () => {
        this.#sockets.delete(socketId)
        this.#onClose(socket, identity)
      })
      socket.on('message', (event) => {
        this.#onMessage(socket, identity, event)
      })
      this.#sockets.set(socketId, socket)
      this.#onConnect(socket, identity)
    })
  }
  // ----------------------------------------------------------------
  // Socket: Events
  // ----------------------------------------------------------------
  #onConnect(socket: Http.ServerWebSocket, identity: Identity) {
    this.#emitConnect(identity)
  }
  #onClose(socket: Http.ServerWebSocket, identity: Identity) {
    this.#emitClose(identity)
  }
  // prettier-ignore
  #onMessage(socket: Http.ServerWebSocket, identity: Identity, event: MessageEvent<any>) {
    try {
      const data = event.data instanceof ArrayBuffer ? new Uint8Array(event.data) : event.data
      const result = this.#encoding.unknown.decode(data)
      switch (result.type) {
        case 'JsonRpcRequest': return this.#onRequest(socket, identity, result.request).catch(console.error)
        case 'JsonRpcResponse': return this.#onResponse(socket, identity, result.response)
        default: this.#throw('Unknown')
      }
    } catch(error) { 
      return socket.send(this.#createResponseError({ jsonrpc: '2.0', method: 'unknown' }, {
        code: Contract.JsonRpcErrorCode.ParseError,
        message: `Unable to parse request`,
      }))
    }
  }
  // ----------------------------------------------------------------
  // Request
  // ----------------------------------------------------------------
  // prettier-ignore
  async #onRequest(socket: Http.ServerWebSocket, identity: Identity, request: Contract.JsonRpcRequest) {
    // --------------------------------------------------------------
    // Method
    // --------------------------------------------------------------
    const method = this.#methods.get(request.method)
    if (method === undefined) {
      return this.#shouldRespond(request) ? socket.send(this.#createResponseError(request, {
        code: Contract.JsonRpcErrorCode.MethodNotFound,
        message: `Method '${request.method}' not found`,
      })): undefined
    }
    // --------------------------------------------------------------
    // Result
    // --------------------------------------------------------------
    const result = await method.call(identity, request.params ?? ([] as any)).catch((error) => error)
    // --------------------------------------------------------------
    // No Reply
    // --------------------------------------------------------------
    if(!this.#shouldRespond(request)) return 
    // --------------------------------------------------------------
    // Errors
    // --------------------------------------------------------------
    if (result instanceof Contract.RpcException) {
      return socket.send(this.#createResponseError(request, {
        code: result.code,
        message: result.message,
        data: result.data,
      }))
    }
    if (result instanceof Error) {
      return socket.send(this.#createResponseError(request, {
        code: Contract.JsonRpcErrorCode.InternalError,
        message: `An error occured while processing this request`,
      }))
    }
    // --------------------------------------------------------------
    // Respond
    // --------------------------------------------------------------
    return this.#shouldRespond(request) ? socket.send(this.#createResponseResult(request, result)) : undefined
  }
  // ----------------------------------------------------------------
  // Response
  // ----------------------------------------------------------------
  #onResponse(socket: Http.ServerWebSocket, identity: Identity, response: Contract.JsonRpcResponse) {
    if (typeof response.id !== 'string' || !this.#responder.has(response.id)) return
    if (response.error === undefined && response.result === undefined) return
    if (response.error !== undefined && response.result !== undefined) return
    if (response.error) {
      const exception = new Contract.RpcException(response.error.message, response.error.code, response.error.data)
      return this.#responder.reject(response.id, exception)
    }
    if (response.result) return this.#responder.resolve(response.id, response.result)
  }
  // ----------------------------------------------------------------
  // Internal
  // ----------------------------------------------------------------
  async #resolveIdentity(request: Request, socketId: string): Promise<Identity> {
    return (await this.#onAuthorizeCallback(socketId, request)) as Identity
  }
  async #emitConnect(identity: Identity) {
    await this.#onConnectCallback(identity)
    return null
  }
  async #emitClose(identity: Identity) {
    await this.#onCloseCallback(identity)
    return null
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
  // prettier-ignore
  #resolveEncoding(contract: Contract.RpcContract): Encoding.Encoding {
    switch (contract.encoding) {
      case 'application/json': return new Encoding.JsonEncoding()
      case 'application/x-msgpack': return new Encoding.MsgPackEncoding()
      default: this.#throw(`Unknown contract encoding '${contract.encoding}'`)
    }
  }
  #setupMethods() {
    for (const name of Object.keys(this.#contract.service)) {
      const type = this.#contract.service[name]
      const method = new Contract.ServiceMethod(this.#identity, type)
      this.#methods.set(name, method)
    }
  }
  // ----------------------------------------------------------------
  // Throw
  // ----------------------------------------------------------------
  #throw(message: string): never {
    throw new Error(message)
  }
}
