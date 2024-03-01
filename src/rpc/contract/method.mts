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

import { Type, TFunction, StaticDecode, StaticEncode, TParameters, TSchema, TReturnType, Evaluate } from '../../type/index.mjs'
import { TypeCompiler, TypeCheck } from '../../type/compiler/index.mjs'
import { RpcException } from './exception.mjs'
import { JsonRpcErrorCode } from './protocol.mjs'

// ------------------------------------------------------------------
// ServiceMethod
// ------------------------------------------------------------------
export type ServiceMethodCallback<Identity extends TSchema, Method extends TFunction> = (identity: StaticDecode<Identity>, ...params: ServiceMethodParameters<Method['parameters']>) => ServiceMethodReturnType<Method['returns']>
export type ServiceMethodParameters<T extends TSchema[]> = T extends [infer L extends TSchema, ...infer R extends TSchema[]] ? [Evaluate<StaticDecode<L>>, ...ServiceMethodParameters<R>] : []
export type ServiceMethodReturnType<T extends TSchema> = Promise<StaticDecode<T>> | StaticDecode<T>
export class ServiceMethod<Identity extends TSchema = TSchema, Method extends TFunction = TFunction> {
  readonly #identity: TypeCheck<Identity>
  readonly #parameters: TypeCheck<TParameters<Method>>
  readonly #returns: TypeCheck<TReturnType<Method>>
  #callback: ServiceMethodCallback<Identity, Method>
  constructor(identity: Identity, func: Method) {
    this.#identity = TypeCompiler.Compile(identity)
    this.#parameters = TypeCompiler.Compile(Type.Parameters(func))
    this.#returns = TypeCompiler.Compile(Type.ReturnType(func))
    this.#callback = () => {
      throw new RpcException('Service method not implemented', JsonRpcErrorCode.MethodNotImplemented, {})
    }
  }
  /** Sets or overrides the method implementation */
  public impl(callback: ServiceMethodCallback<Identity, Method>): ServiceMethod<Identity, Method> {
    this.#callback = callback
    return this
  }
  /** Calls this method. Will throw if error */
  public async call(identity: StaticDecode<Identity>, parameters: StaticEncode<TParameters<Method>>): Promise<StaticDecode<TReturnType<Method>>> {
    const _identity = this.#identity.Decode(identity)
    const _parameters = this.#parameters.Decode(parameters)
    const _result = await this.#callback.apply(this.#callback, [_identity, ..._parameters] as any)
    return this.#returns.Encode(_result)
  }
}
// ------------------------------------------------------------------
// ClientMethod
// ------------------------------------------------------------------
export type ClientMethodCallback<T extends TFunction> = (...params: ClientMethodParameters<T['parameters']>) => ClientMethodReturnType<T['returns']>
export type ClientMethodParameters<T extends TSchema[]> = T extends [infer L extends TSchema, ...infer R extends TSchema[]] ? [StaticDecode<L>, ...ClientMethodParameters<R>] : []
export type ClientMethodReturnType<T extends TSchema> = Promise<StaticDecode<T>> | StaticDecode<T>
export class ClientMethod<Method extends TFunction = TFunction> {
  readonly #parameters: TypeCheck<TParameters<Method>>
  readonly #returns: TypeCheck<TReturnType<Method>>
  #callback: ClientMethodCallback<Method>
  constructor(func: Method) {
    this.#parameters = TypeCompiler.Compile(Type.Parameters(func))
    this.#returns = TypeCompiler.Compile(Type.ReturnType(func))
    this.#callback = () => {
      throw new RpcException('Client method not implemented', JsonRpcErrorCode.MethodNotImplemented, {})
    }
  }
  /** Sets or overrides the method implementation */
  public impl(callback: ClientMethodCallback<Method>): ClientMethod<Method> {
    this.#callback = callback
    return this
  }
  /** Calls this method. Will throw if error */
  public async call(parameters: StaticEncode<TParameters<Method>>): Promise<StaticDecode<TReturnType<Method>>> {
    const _parameters = this.#parameters.Decode(parameters) as unknown[]
    const _result = await this.#callback.apply(this.#callback, _parameters as any)
    return this.#returns.Encode(_result)
  }
}
