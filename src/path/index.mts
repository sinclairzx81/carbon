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
import * as Os from '../os/index.mjs'

async function Resolve(): Promise<typeof import('./core/index.mjs')> {
  if (Runtime.name() === 'browser') {
    return await import('./posix/index.mjs')
  }
  switch (Os.type()) {
    case 'win32':
      return await import('./windows/index.mjs')
    default:
      return await import('./posix/index.mjs')
  }
}

const Core = await Resolve()
export const basename = Core.basename
export const delimiter = Core.delimiter
export const dirname = Core.dirname
export const extname = Core.extname
export const format = Core.format
export const isAbsolute = Core.isAbsolute
export const join = Core.join
export const normalize = Core.normalize
export const parse = Core.parse
export const relative = Core.relative
export const resolve = Core.resolve
export const sep = Core.sep
export const system = Core.system
export const toNamespacedPath = Core.toNamespacedPath
