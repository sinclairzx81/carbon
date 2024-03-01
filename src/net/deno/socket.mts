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

import * as Core from '../core/index.mjs'
import * as Stream from '../../stream/index.mjs'

export class Socket implements Stream.Read<Uint8Array>, Stream.Write<Uint8Array> {
  readonly #socket: Deno.Conn
  readonly #buffer: Uint8Array
  constructor(socket: Deno.Conn) {
    this.#socket = socket
    this.#buffer = new Uint8Array(65536)
  }
  // ----------------------------------------------------------------
  // Properties
  // ----------------------------------------------------------------
  public get local(): Core.Address {
    const address = this.#socket.localAddr.transport === 'tcp' ? this.#socket.localAddr.hostname : ''
    const port = this.#socket.localAddr.transport === 'tcp' ? this.#socket.localAddr.port : 0
    return { address, port }
  }
  public get remote(): Core.Address {
    const address = this.#socket.remoteAddr.transport === 'tcp' ? this.#socket.remoteAddr.hostname : ''
    const port = this.#socket.remoteAddr.transport === 'tcp' ? this.#socket.remoteAddr.port : 0
    return { address, port }
  }
  // ----------------------------------------------------------------
  // Stream.Read<Uint8Array>
  // ----------------------------------------------------------------
  public async *[Symbol.asyncIterator](): AsyncIterableIterator<Uint8Array> {
    while (true) {
      const next = await this.read()
      if (next === null) return
      yield next
    }
  }
  public async read(): Promise<Uint8Array | null> {
    const read = await this.#socket.read(this.#buffer)
    if (read === null) return null
    return this.#buffer.slice(0, read)
  }
  // ----------------------------------------------------------------
  // Stream.Write<Uint8Array>
  // ----------------------------------------------------------------
  public async write(value: Uint8Array): Promise<void> {
    await this.#socket.write(value)
  }
  public async close(): Promise<void> {
    this.#socket.close()
  }
}
