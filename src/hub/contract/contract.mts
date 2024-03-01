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

import * as Rpc from '../../rpc/index.mjs'
import * as Type from '../../type/index.mjs'

// ------------------------------------------------------------------
// NetworkMessage
// ------------------------------------------------------------------
export type NetworkMessage = Type.Static<typeof NetworkMessage>
export const NetworkMessage = Type.Object({
  to: Type.String(),
  from: Type.String(),
  data: Type.Unknown(),
})
// ------------------------------------------------------------------
// Send
// ------------------------------------------------------------------
export type SendRequest = Type.Static<typeof SendRequest>
export type SendResponse = Type.Static<typeof SendResponse>
export const SendRequest = NetworkMessage
export const SendResponse = Type.Void()
// ------------------------------------------------------------------
// Configuration
// ------------------------------------------------------------------
export type ConfigurationRequest = Type.Static<typeof ConfigurationRequest>
export type ConfigurationResponse = Type.Static<typeof ConfigurationResponse>
export const ConfigurationRequest = Type.Object({})
export const ConfigurationResponse = Type.Object({ configuration: Type.Unsafe<RTCConfiguration>(Type.Any()) })
// ------------------------------------------------------------------
// Address
// ------------------------------------------------------------------
export type AddressRequest = Type.Static<typeof AddressRequest>
export type AddressResponse = Type.Static<typeof AddressResponse>
export const AddressRequest = Type.Object({})
export const AddressResponse = Type.Object({ address: Type.String() })
// ------------------------------------------------------------------
// Receive
// ------------------------------------------------------------------
export type ReceiveRequest = Type.Static<typeof ReceiveRequest>
export type ReceiveResponse = Type.Static<typeof ReceiveResponse>
export const ReceiveRequest = NetworkMessage
export const ReceiveResponse = Type.Void()
// ------------------------------------------------------------------
// Contract
// ------------------------------------------------------------------
export const ServiceContract = Rpc.Contract({
  encoding: 'application/json',
  service: {
    configuration: Type.Function([ConfigurationRequest], ConfigurationResponse),
    address: Type.Function([AddressRequest], AddressResponse),
    send: Type.Function([SendRequest], SendResponse),
  },
  client: {
    receive: Type.Function([ReceiveRequest], ReceiveResponse),
  },
})
