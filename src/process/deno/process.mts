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

import * as Qs from '../../qs/index.mjs'
import * as Url from '../../url/index.mjs'

// ------------------------------------------------------------------
// Deno is somewhat broken, both in that the searchParams are passed
// as strings (not Map), and that there's no way to obtain the
// mainModule from a thread. When spawning worker threads we pass
// this information via query parameter, this code resolves it.
// ------------------------------------------------------------------
interface ProcessParameters {
  isMainThread: boolean
  mainModule: string
}
function resolveProcessParameters(): ProcessParameters {
  if (typeof Deno.mainModule === 'string') {
    return {
      isMainThread: true,
      mainModule: Url.fileUrlToPath(Deno.mainModule),
    }
  }
  if (typeof globalThis.location.search === 'string') {
    const parsed = Qs.parse(globalThis.location.search)
    if ('mainModule' in parsed && typeof parsed.mainModule === 'string') {
      return {
        isMainThread: false,
        mainModule: decodeURIComponent(parsed.mainModule),
      }
    }
  }
  return {
    isMainThread: false,
    mainModule: '',
  }
}
export function cwd(): string {
  return Deno.cwd()
}
export function exit(exitcode: number): never {
  return Deno.exit(exitcode)
}
const parameters = resolveProcessParameters()
export const isMainThread = parameters.isMainThread
export const mainModule = parameters.mainModule
export const args = Deno.args
export const env = new Map<string, string>(Object.entries(Deno.env.toObject()))
