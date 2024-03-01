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

import * as Events from '../../events/index.mjs'
import * as Rpc from '../../rpc/index.mjs'
import * as Qs from '../../qs/index.mjs'
import * as Contract from '../contract/index.mjs'
import { Hub, Message, MessageCallback } from '../hub.mjs'

/** A remote Hub connection */
export class Remote implements Hub {
  readonly #client: Rpc.WebSocketClient<typeof Contract.ServiceContract>
  readonly #events: Events.Events
  constructor(endpoint: string, claims: Record<PropertyKey, string> = {}) {
    this.#client = new Rpc.WebSocketClient(Contract.ServiceContract, `${endpoint}?${Qs.stringify(claims)}`)
    this.#client.method('receive', (message) => this.#onReceive(message))
    this.#events = new Events.Events()
  }
  public async configuration(): Promise<RTCConfiguration> {
    const { configuration } = await this.#client.call('configuration', {})
    return configuration
  }
  public async address(): Promise<string> {
    const { address } = await this.#client.call('address', {})
    return address
  }
  public send(message: { to: string; data: unknown }): void {
    return this.#client.send('send', { ...message, from: '' })
  }
  public receive(handler: MessageCallback): void {
    this.#events.on('message', handler)
  }
  public dispose() {
    this.#events.dispose()
    this.#client.dispose()
  }
  #onReceive(message: Message) {
    this.#events.send('message', message)
  }
}
