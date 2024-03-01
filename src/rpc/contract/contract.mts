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

import { TFunction, TSchema, StaticDecode, Evaluate } from '../../type/index.mjs'

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------
export type Awaitable<T> = Promise<T> | T

// ------------------------------------------------------------------
// Signatures
// ------------------------------------------------------------------
export type RpcParametersResolve<T extends TSchema[]> = T extends [infer L extends TSchema, ...infer R extends TSchema[]] ? [StaticDecode<L>, ...RpcParametersResolve<R>] : []
export type RpcParameters<T extends TFunction<TSchema[], TSchema>> = RpcParametersResolve<T['parameters']>
export type RpcReturnType<T extends TFunction<TSchema[], TSchema>> = StaticDecode<T['returns']>

// ------------------------------------------------------------------
// Service Functions
// ------------------------------------------------------------------
export type RpcServerAuthorizeCallback<Identity extends TSchema> = (socketId: string, request: Request) => Awaitable<StaticDecode<Identity>>
export type RpcServerConnectCallback<Identity extends TSchema> = (identity: StaticDecode<Identity>) => Awaitable<unknown>
export type RpcServerCloseCallback<Identity extends TSchema> = (identity: StaticDecode<Identity>) => Awaitable<unknown>
export type RpcServerMethodCallback<Identity extends TSchema, Contract extends RpcContract, Method extends keyof Contract['service']> = (
  identity: StaticDecode<Identity>,
  ...params: RpcParameters<Contract['service'][Method]>
) => Awaitable<RpcReturnType<Contract['service'][Method]>>

// ------------------------------------------------------------------
// Contract
// ------------------------------------------------------------------
export type RpcContractEncoding = 'application/json' | 'application/x-msgpack'

export interface RpcContract {
  /** The message encoding to be used */
  encoding: RpcContractEncoding
  /** The service methods for this contract */
  service: Record<string, TFunction<TSchema[], TSchema>>
  /** The client methods for this contract */
  client: Record<string, TFunction<TSchema[], TSchema>>
}
export type RpcContractResolve<T extends Partial<RpcContract>> = Evaluate<{
  encoding: undefined extends T['encoding'] ? 'application/json' : T['encoding']
  service: undefined extends T['service'] ? {} : T['service']
  client: undefined extends T['client'] ? {} : T['client']
}>
export function Contract<T extends Partial<RpcContract>>(options: T): RpcContractResolve<T> {
  return {
    encoding: options.encoding ?? 'application/json',
    service: options.service ?? {},
    client: options.client ?? {},
  } as RpcContractResolve<T>
}
