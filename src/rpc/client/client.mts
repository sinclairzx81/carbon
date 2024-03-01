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

import * as Http from '../../http/index.mjs'
import * as Encoding from '../../encoding/index.mjs'
import * as Contract from '../contract/index.mjs'

export class Client<Contract extends Contract.RpcContract> {
  readonly #encoding: Contract.JsonRpcEncoding
  #ordinal: number
  constructor(public readonly contract: Contract, public readonly endpoint: string, public readonly headers: Record<string, string> = {}) {
    this.#encoding = new Contract.JsonRpcEncoding(this.#resolveEncoding(contract))
    this.#ordinal = 0
  }
  // ----------------------------------------------------------------
  // Client
  // ----------------------------------------------------------------
  /** Calls a service method and returns the result */
  public async call<Name extends keyof Contract['service']>(name: Name, ...params: Contract.ClientMethodParameters<Contract['service'][Name]['parameters']>): Promise<Contract.ClientMethodReturnType<Contract['service'][Name]['returns']>> {
    const id = this.#ordinal++
    const rpc_request = this.#encoding.request.encode({ jsonrpc: '2.0', id, method: name as string, params: params })
    const response = await Http.fetch(this.endpoint, { headers: this.headers, method: 'post', body: rpc_request })
    const arrayBuffer = await response.arrayBuffer()
    if (response.status !== 200) {
      throw new Contract.RpcException('Endpoint responded with status 404 ', Contract.JsonRpcErrorCode.UnexpectedResponse, {
        endpoint: this.endpoint,
        arrayBuffer,
      })
    }
    const rpc_response = this.#tryDecode(arrayBuffer)
    if (rpc_response === undefined)
      throw new Contract.RpcException('Unable to decode response', Contract.JsonRpcErrorCode.ParseError, {
        endpoint: this.endpoint,
        arrayBuffer,
      })
    if (rpc_response.error) throw new Contract.RpcException(rpc_response.error.message, rpc_response.error.code, rpc_response.error.data)
    return rpc_response.result!
  }
  /** Sends to a service method and ignores the result */
  public send<Name extends keyof Contract['service']>(name: Name, ...params: Contract.ClientMethodParameters<Contract['service'][Name]['parameters']>): void {
    const rpc_request = this.#encoding.request.encode({ jsonrpc: '2.0', method: name as string, params: params })
    // Should use navigator.sendBeacon()
    Http.fetch(this.endpoint, { method: 'post', body: rpc_request })
      .then((res) => res.arrayBuffer())
      .catch(() => {})
  }
  // ----------------------------------------------------------------
  // Internal
  // ----------------------------------------------------------------
  #tryDecode(arrayBuffer: ArrayBuffer): Contract.JsonRpcResponse | undefined {
    try {
      return this.#encoding.response.decode(new Uint8Array(arrayBuffer))
    } catch {
      return undefined
    }
  }
  // prettier-ignore
  #resolveEncoding(contract: Contract.RpcContract): Encoding.Encoding {
    switch (contract.encoding) {
      case 'application/json': return new Encoding.JsonEncoding()
      case 'application/x-msgpack': return new Encoding.MsgPackEncoding()
      default: this.#throw(`Unknown contract encoding '${contract.encoding}'`)
    }
  }
  #throw(message: string): never {
    throw Error(message)
  }
}
