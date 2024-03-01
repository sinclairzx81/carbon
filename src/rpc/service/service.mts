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
import { Type, TSchema, TString } from '../../type/index.mjs'
import * as Encoding from '../../encoding/index.mjs'
import * as Contract from '../contract/index.mjs'

/** JsonRpc 2.0 Http Service */
export class Service<Contract extends Contract.RpcContract, Identity extends TSchema = TString> {
  #onAuthorizeCallback: Contract.RpcServerAuthorizeCallback<Identity>
  #onConnectCallback: Contract.RpcServerConnectCallback<Identity>
  #onCloseCallback: Contract.RpcServerCloseCallback<Identity>

  readonly #methods: Map<keyof Contract['service'], Contract.ServiceMethod>
  readonly #encoding: Contract.JsonRpcEncoding
  readonly #identity: Identity
  readonly #contract: Contract

  constructor(contract: Contract, identity?: Identity) {
    this.#encoding = new Contract.JsonRpcEncoding(this.#resolveEncoding(contract))
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
  // Request: Handler
  // ----------------------------------------------------------------
  async #readRpcRequest(_request: Request) {
    const arraybuffer = await _request.arrayBuffer()
    const uint8array = new Uint8Array(arraybuffer)
    return this.#encoding.request.decode(uint8array)
  }
  // prettier-ignore
  public async fetch(request: Request): Promise<Response> {
    // --------------------------------------------------------------
    // Verb
    // --------------------------------------------------------------
    if(request.method !== 'POST') return new Response('Not found', { status: 404 })
    // --------------------------------------------------------------
    // Request
    // --------------------------------------------------------------
    const rpc_request = await this.#readRpcRequest(request).catch(() => undefined)
    if(rpc_request === undefined) return this.#createResponseError({ jsonrpc: '2.0', method: 'unknown' }, { 
      code: Contract.JsonRpcErrorCode.ParseError,
      message: 'Unable to parse request',
    })
    
    // --------------------------------------------------------------
    // Method
    // --------------------------------------------------------------
    const method = this.#methods.get(rpc_request.method)
    if(method === undefined) return this.#createResponseError(rpc_request, {
      code: Contract.JsonRpcErrorCode.MethodNotFound,
      message: `Method '${rpc_request.method}' not found`
    })
    // --------------------------------------------------------------
    // Identity
    // --------------------------------------------------------------
    const identity = await this.#resolveIdentity(request).catch(() => undefined)
    if(identity === undefined) return this.#createResponseError(rpc_request, { 
      code: Contract.JsonRpcErrorCode.AuthorizationError,
      message: 'Unable to authorize request'
    })
    // --------------------------------------------------------------
    // Connect
    // --------------------------------------------------------------
    const connect = await this.#emitConnect(identity).catch(() => undefined)
    if(connect === undefined) return this.#createResponseError(rpc_request, {
      code: Contract.JsonRpcErrorCode.InternalError,
      message: `An error occured while processing this request`
    })
    // --------------------------------------------------------------
    // Result
    // --------------------------------------------------------------
    const result = await method.call(identity, rpc_request.params ?? [] as any).catch(error => error)
    // --------------------------------------------------------------
    // No Reply
    // --------------------------------------------------------------
    if(rpc_request.id === undefined || rpc_request.id === null) {
      return await this.#emitClose(identity).catch(() => undefined).then(() => new Response(''))
    }
    // --------------------------------------------------------------
    // Error Handling
    // --------------------------------------------------------------
    if(result instanceof Contract.RpcException) {
      return await this.#emitClose(identity).catch(() => undefined).then(() => this.#createResponseError(rpc_request, {
        code: result.code,
        message: result.message,
        data: result.data
      }))
    }
    if(result instanceof Error) {
      return await this.#emitClose(identity).catch(() => undefined).then(() => this.#createResponseError(rpc_request, {
        code: Contract.JsonRpcErrorCode.InternalError,
        message: `An error occured while processing this request`
      }))
    }
    // --------------------------------------------------------------
    // Response
    // --------------------------------------------------------------
    return await this.#emitClose(identity).catch(() => undefined).then(() => this.#createResponseResult(rpc_request, result))
  }
  // ----------------------------------------------------------------
  // Internal
  // ----------------------------------------------------------------
  async #resolveIdentity(request: Request): Promise<Identity> {
    const connectionId = Crypto.randomUUID()
    return (await this.#onAuthorizeCallback(connectionId, request)) as Identity
  }
  async #emitConnect(identity: Identity) {
    await this.#onConnectCallback(identity)
    return null
  }
  async #emitClose(identity: Identity) {
    await this.#onCloseCallback(identity)
    return null
  }
  #createResponseResult(request: Contract.JsonRpcRequest, result: unknown): Response {
    const arraybuffer = this.#encoding.response.encode({ jsonrpc: '2.0', id: request.id ?? null, result })
    const headers = { 'Content-Type': this.#contract.encoding, 'Content-Length': arraybuffer.length.toString() }
    return new Response(arraybuffer, { headers, status: 200 })
  }
  #createResponseError(request: Contract.JsonRpcRequest, error: { code: number; message: string; data?: unknown }): Response {
    const arraybuffer = this.#encoding.response.encode({ jsonrpc: '2.0', id: request.id ?? null, error })
    const headers = { 'Content-Type': this.#contract.encoding, 'Content-Length': arraybuffer.length.toString() }
    return new Response(arraybuffer, { headers, status: 200 })
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
