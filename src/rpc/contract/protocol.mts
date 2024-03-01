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

import { TypeCompiler } from '../../type/compiler/index.mjs'
import { Type, Static } from '../../type/index.mjs'
import { Encoding } from '../../encoding/index.mjs'

// ------------------------------------------------------------------
// Protocol Codes
// ------------------------------------------------------------------
export enum JsonRpcErrorCode {
  // Standard
  ParseError = -32700,
  InvalidRequest = -32600,
  MethodNotFound = -32601,
  InvalidParams = -32602,
  InternalError = -32603,
  // Framework
  MethodNotImplemented = -32000,
  UnexpectedResponse = -32001,
  AuthorizationError = -32002,
}
// ------------------------------------------------------------------
// Protocol Types
// ------------------------------------------------------------------
export type JsonRpcIdentifier = Static<typeof JsonRpcIdentifier>
export const JsonRpcIdentifier = Type.Union([Type.String(), Type.Number(), Type.Null()])
export type JsonRpcError = Static<typeof JsonRpcError>
export const JsonRpcError = Type.Object({
  code: Type.Integer(),
  message: Type.String(),
  data: Type.Optional(Type.Unknown()),
})
export type JsonRpcRequest = Static<typeof JsonRpcRequest>
export const JsonRpcRequest = Type.Object({
  jsonrpc: Type.Literal('2.0'),
  id: Type.Optional(JsonRpcIdentifier),
  method: Type.String(),
  params: Type.Optional(Type.Array(Type.Unknown())),
})
export type JsonRpcResponse = Static<typeof JsonRpcResponse>
export const JsonRpcResponse = Type.Object({
  jsonrpc: Type.Literal('2.0'),
  result: Type.Optional(Type.Unknown()),
  error: Type.Optional(JsonRpcError),
  id: JsonRpcIdentifier,
})
// ------------------------------------------------------------------
// Checks
// ------------------------------------------------------------------
const JsonRpcRequestCheck = TypeCompiler.Compile(JsonRpcRequest)
const JsonRpcResponseCheck = TypeCompiler.Compile(JsonRpcResponse)
// ------------------------------------------------------------------
// Encoding
// ------------------------------------------------------------------
export class JsonRpcRequestEncoding {
  readonly #encoding: Encoding
  constructor(encoding: Encoding) {
    this.#encoding = encoding
  }
  public encode(value: JsonRpcRequest): Uint8Array {
    if (JsonRpcRequestCheck.Check(value)) return this.#encoding.encode(value)
    throw Error('JsonRpcRequest: Invalid value')
  }
  public decode(value: Uint8Array): JsonRpcRequest {
    const decoded = this.#encoding.decode(value)
    if (JsonRpcRequestCheck.Check(decoded)) return decoded
    throw Error('JsonRpcRequest: Invalid value')
  }
}
// ------------------------------------------------------------------
// JsonRpcResponseEncoding
// ------------------------------------------------------------------
class JsonRpcResponseEncoding {
  readonly #encoding: Encoding
  constructor(encoding: Encoding) {
    this.#encoding = encoding
  }
  public encode(value: JsonRpcResponse): Uint8Array {
    if (JsonRpcResponseCheck.Check(value)) return this.#encoding.encode(value)
    throw Error('JsonRpcResponseEncoder: Invalid value')
  }
  public decode(value: Uint8Array): JsonRpcResponse {
    const decoded = this.#encoding.decode(value)
    if (JsonRpcResponseCheck.Check(decoded)) return decoded
    throw Error('JsonRpcResponseDecoder: Invalid value')
  }
}
// prettier-ignore
export type JsonRpcUnknownDecodeResult = {
  type: 'JsonRpcRequest'
  request: JsonRpcRequest
} | {
  type: 'JsonRpcResponse',
  response: JsonRpcResponse
}
class JsonRpcUnknownEncoding {
  readonly #encoding: Encoding
  constructor(encoding: Encoding) {
    this.#encoding = encoding
  }
  public decode(value: Uint8Array): JsonRpcUnknownDecodeResult {
    const decoded = this.#encoding.decode(value)
    if (JsonRpcRequestCheck.Check(decoded)) return { type: 'JsonRpcRequest', request: decoded }
    if (JsonRpcResponseCheck.Check(decoded)) return { type: 'JsonRpcResponse', response: decoded }
    throw Error('JsonRpcResponseDecoder: Invalid value')
  }
}
export class JsonRpcEncoding {
  readonly #requestEncoding: JsonRpcRequestEncoding
  readonly #responseEncoding: JsonRpcResponseEncoding
  readonly #unknownEncoding: JsonRpcUnknownEncoding
  constructor(encoding: Encoding) {
    this.#requestEncoding = new JsonRpcRequestEncoding(encoding)
    this.#responseEncoding = new JsonRpcResponseEncoding(encoding)
    this.#unknownEncoding = new JsonRpcUnknownEncoding(encoding)
  }
  public get unknown(): JsonRpcUnknownEncoding {
    return this.#unknownEncoding
  }
  public get request(): JsonRpcRequestEncoding {
    return this.#requestEncoding
  }
  public get response(): JsonRpcResponseEncoding {
    return this.#responseEncoding
  }
}
