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

import * as Runtime from '../runtime/index.mjs'

async function Resolve(): Promise<typeof import('./core/index.mjs')> {
  switch (Runtime.name()) {
    case 'browser':
      return await import('./browser/index.mjs')
    case 'bun':
      return await import('./bun/index.mjs')
    case 'deno':
      return await import('./deno/index.mjs')
    case 'node':
      return await import('./node/index.mjs')
    default:
      throw Error('Process: Platform not supported')
  }
}
const Core = await Resolve()
/** Returns the arguments passed to this process */
export const args = Core.args
/** Returns true if read from the main thread */
export const isMainThread = Core.isMainThread
/** Returns the path to process entry module */
export const mainModule = Core.mainModule
/** Returns the current working directory */
export const cwd = Core.cwd
/** Returns environment variables accessible to this process */
export const env = Core.env
/** Terminates this process with the given exit code */
export const exit = Core.exit
/** Returns memory usage metric for this process */
export const memoryUsage = Core.memoryUsage
/** The standard error stream */
export const stderr = Core.stderr
/** The standard in stream */
export const stdin = Core.stdin
/** The standard out stream */
export const stdout = Core.stdout
/** The tty for this process if available */
export const tty = Core.tty
