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
      throw new Runtime.RuntimeNotSupportedException('Fs')
  }
}
const Core = await Resolve()

export { Stat, DirectoryStat, FileStat } from './core/index.mjs'
export class FileSystem extends Core.FileSystem {}

/** Opens a directory or indexeddb database as a file system root */
export const open = Core.open
/** Removes a directory or indexeddb database acting as a file system root */
export const remove = Core.remove
