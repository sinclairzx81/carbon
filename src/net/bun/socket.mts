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

import * as Net from 'node:net'
import * as Channel from '../../channel/index.mjs'
import * as Core from '../core/index.mjs'
import * as Stream from '../../stream/index.mjs'

export class Socket implements Stream.Read<Uint8Array>, Stream.Write<Uint8Array> {
  readonly #channel: Channel.Channel<Uint8Array>
  readonly #socket: Net.Socket
  #closed: boolean
  constructor(socket: Net.Socket) {
    this.#channel = new Channel.Channel<Uint8Array>()
    this.#socket = socket
    this.#socket.on('data', (data) => this.#onData(data))
    this.#socket.on('error', (error) => this.#onError(error))
    this.#socket.on('close', () => this.#onClose())
    this.#closed = false
  }
  // ----------------------------------------------------------------
  // Properties
  // ----------------------------------------------------------------
  public get local(): Core.Address {
    const address = this.#socket.localAddress ?? ''
    const port = this.#socket.localPort ?? 0
    return { address, port }
  }
  public get remote(): Core.Address {
    const address = this.#socket.remoteAddress ?? ''
    const port = this.#socket.remotePort ?? 0
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
  public read(): Promise<Uint8Array | null> {
    return this.#channel.receive()
  }
  // ----------------------------------------------------------------
  // Stream.Write<Uint8Array>
  // ----------------------------------------------------------------
  public write(value: Uint8Array): Promise<void> {
    this.#assertNotClosed()
    return new Promise((resolve, reject) => {
      this.#socket.write(value, (error) => {
        return error ? reject(error) : resolve()
      })
    })
  }
  public close(): Promise<void> {
    this.#closed = true
    return new Promise((resolve) => {
      this.#socket.end(() => resolve())
    })
  }
  // ----------------------------------------------------------------
  // Readable: Internal
  // ----------------------------------------------------------------
  #onData(buffer: Buffer) {
    this.#channel.send(buffer)
  }
  #onError(error: Error) {
    this.#channel.error(error)
  }
  #onClose() {
    this.#closed = true
    this.#channel.end()
  }
  // ----------------------------------------------------------------
  // Assert
  // ----------------------------------------------------------------
  #assertNotClosed() {
    if (!this.#closed) return
    throw new Error('Socket is closed')
  }
}
