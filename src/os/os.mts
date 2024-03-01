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

export type OsType = 'win32' | 'linux' | 'darwin' | 'unknown'

function resolveBrowser() {
  const userAgent = globalThis.navigator.userAgent.toLowerCase()
  return userAgent.includes('windows') ? 'win32' : userAgent.includes('linux') ? 'linux' : userAgent.includes('darwin') ? 'darwin' : 'unknown'
}
function resolveBun() {
  // supports: 'aix', 'android', 'darwin', 'freebsd', 'haiku', 'linux', 'openbsd', 'sunos', 'win32', 'cygwin', 'netbsd'
  switch (process.platform) {
    case 'win32':
      return 'win32'
    case 'linux':
      return 'linux'
    case 'darwin':
      return 'darwin'
    default:
      return 'unknown'
  }
}
function resolveDeno() {
  const global: Record<string, any> = globalThis
  switch (global['Deno'].build.os) {
    case 'windows':
      return 'win32'
    case 'linux':
      return `linux`
    case 'darwin':
      return 'darwin'
    default:
      return 'unknown'
  }
}
function resolveNode() {
  // supports: 'aix', 'android', 'darwin', 'freebsd', 'haiku', 'linux', 'openbsd', 'sunos', 'win32', 'cygwin', 'netbsd'
  switch (process.platform) {
    case 'win32':
      return 'win32'
    case 'linux':
      return 'linux'
    case 'darwin':
      return 'darwin'
    default:
      return 'unknown'
  }
}
/** Returns the operating system type */
export function type(): OsType {
  switch (Runtime.name()) {
    case 'browser':
      return resolveBrowser()
    case 'bun':
      return resolveBun()
    case 'deno':
      return resolveDeno()
    case 'node':
      return resolveNode()
    case 'unknown':
      return 'unknown'
  }
}
