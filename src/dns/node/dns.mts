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

import * as Runtime from '../../runtime/index.mjs'
import * as Core from '../core/index.mjs'
const Dns = await Runtime.dynamicImport<typeof import('node:dns')>('node:dns')

// ------------------------------------------------------------------
// Family
// ------------------------------------------------------------------
function encodeFamily(family: Core.Family | unknown) {
  return family === 'IPv4' ? 4 : family === 'IPv6' ? 6 : undefined
}
function decodeFamily(family: number): Core.Family {
  return family === 4 ? 'IPv4' : family === 6 ? 'IPv6' : 'Any'
}
// ------------------------------------------------------------------
// Lookup
// ------------------------------------------------------------------
// prettier-ignore
export function lookup(hostname: string, options: Core.LookupOptions = { family: 'Any' }): Promise<Core.LookupResult[]> {
  return new Promise((resolve, reject) => {
    Dns.lookup(hostname, { all: true, family: encodeFamily(options.family) }, (error, results) => {
      if (error !== null) return reject(error)
      resolve(results.map((result) => {
          const family = decodeFamily(result.family)
          return { family, address: result.address }
      }))
    })
  })
}
