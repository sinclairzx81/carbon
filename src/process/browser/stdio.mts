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

import * as Buffer from '../../buffer/index.mjs'

// ------------------------------------------------------------------
// ConsoleBuffer
//
// Buffers and dispatches content to the console, this class will
// dispatch buffers when receiving newline characters, or after
// timeout delay.
// ------------------------------------------------------------------
class ConsoleBuffer {
  readonly #buffers: Uint8Array[]
  readonly #interval: number
  constructor(private readonly dispatch: (content: string) => void) {
    this.#interval = setInterval(() => this.#flush(), 50) as never
    this.#buffers = []
  }
  public write(buffer: Uint8Array) {
    this.#buffers.push(buffer)
  }
  public close() {
    clearInterval(this.#interval)
  }
  #collect() {
    const length = this.#buffers.reduce((acc, c) => acc + c.length, 0)
    let [index, collect] = [0, new Uint8Array(length)]
    while (this.#buffers.length > 0) {
      const buffer = this.#buffers.shift()!
      collect.set(buffer, index)
      index += buffer.length
    }
    return collect
  }
  #dispatch(buffer: Uint8Array, start: number, end: number) {
    const slice = buffer.slice(start, end)
    this.dispatch(Buffer.decode(slice))
  }
  #flush() {
    if (this.#buffers.length === 0) return
    let [pointer, buffer] = [0, this.#collect()]
    for (let i = 0; i < buffer.length; i++) {
      const ch = buffer[i]
      if (ch === 10) {
        this.#dispatch(buffer, pointer, i)
        i = i + 1
        pointer = i
      }
    }
    this.#dispatch(buffer, pointer, buffer.length)
  }
}

// ------------------------------------------------------------------
// StdIn
// ------------------------------------------------------------------
export const stdin = new ReadableStream<Uint8Array>({})
// ------------------------------------------------------------------
// Stdout
// ------------------------------------------------------------------
const stdout_buffer = new ConsoleBuffer((content) => console.log(content))
export const stdout = new WritableStream<Uint8Array>({
  write: (chunk) => stdout_buffer.write(chunk),
})
// ------------------------------------------------------------------
// StdErr
// ------------------------------------------------------------------
const stderr_buffer = new ConsoleBuffer((content) => console.error(content))
export const stderr = new WritableStream<Uint8Array>({
  write: (chunk) => stderr_buffer.write(chunk),
})
