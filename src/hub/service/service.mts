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

import * as Type from '../../type/index.mjs'
import * as Qs from '../../qs/index.mjs'
import * as Rpc from '../../rpc/index.mjs'
import * as Crypto from '../../crypto/index.mjs'
import * as Contract from '../contract/contract.mjs'

// ------------------------------------------------------------------
// NetworkServiceIdentity
// ------------------------------------------------------------------
type ServiceIdentity = Type.Static<typeof ServiceIdentity>
const ServiceIdentity = Type.Object({
  socketId: Type.String(),
  address: Type.String(),
})
// ------------------------------------------------------------------
// Service
// ------------------------------------------------------------------
/** A WebSocket Rpc service that supports connections from RemoteNetwork instances */
export class Service extends Rpc.WebSocketService<typeof Contract.ServiceContract, typeof ServiceIdentity> {
  readonly #users: Map<ServiceIdentity['address'], ServiceIdentity>
  constructor() {
    super(Contract.ServiceContract, ServiceIdentity)
    this.#users = new Map<string, ServiceIdentity>()
  }
  // ----------------------------------------------------------------
  // Authorization
  // ----------------------------------------------------------------
  public authorize(_claims: Record<string, string>): string | Promise<string> {
    return Crypto.randomUUID()
  }
  public configuration(): RTCConfiguration {
    return { iceServers: [] }
  }
  // ----------------------------------------------------------------
  // Methods
  // ----------------------------------------------------------------
  onConfiguration = this.method('configuration', () => {
    return { configuration: this.configuration() }
  })
  onAddress = this.method('address', (identity) => {
    return { address: identity.address }
  })
  onSend = this.method('send', (identity, request) => {
    const target = this.#users.get(request.to)
    if (target === undefined) return
    this.send(target.socketId, 'receive', {
      to: target.address,
      from: identity.address,
      data: request.data,
    })
  })
  // ----------------------------------------------------------------
  // Events
  // ----------------------------------------------------------------
  onAuthorize = this.event('authorize', async (socketId: string, request: Request) => {
    const claims = Qs.parse(new URL(request.url).search)
    const address = await this.authorize(claims)
    if (typeof address !== 'string') throw Error('Authorize returned non-string address')
    if (this.#users.has(address)) throw Error('Address in use')
    return { address, socketId }
  })
  onConnect = this.event('connect', (identity) => {
    this.#users.set(identity.address, identity)
  })
  onClose = this.event('close', (identity) => {
    this.#users.delete(identity.address)
  })
}
