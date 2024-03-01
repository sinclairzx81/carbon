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

import type { Readable, Writable } from 'node:stream'

function intoReadableStream(readable: Readable): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start: (controller) => {
      readable.on('error', (error) => controller.error(error))
      readable.on('data', (buffer) => {
        controller.enqueue(new Uint8Array(buffer.buffer))
        readable.pause()
      })
      readable.pause()
      // note: in CI environments the .setRawMode() function may not be available to the
      // node process. This was observed for GH actions on Node 18.x. The TypeScript node
      // definitions do not suggest this function is optional.
      // if (typeof process.stdin.setRawMode === 'function') {
      //   process.stdin.setRawMode(true)
      // }
    },
    pull: () => {
      readable.resume()
    },
  })
}
function intoWritableStream(writable: Writable): WritableStream<Uint8Array> {
  return new WritableStream({
    write: (chunk, controller) => {
      return new Promise((resolve, reject) => {
        writable.write(chunk, (error) => {
          if (error) {
            controller.error(error)
            reject(error)
            return
          }
          resolve()
        })
      })
    },
    close: () => {
      return new Promise((resolve) => writable.end(() => resolve()))
    },
  })
}

export const stdin = intoReadableStream(process.stdin)
export const stdout = intoWritableStream(process.stdout)
export const stderr = intoWritableStream(process.stderr)
