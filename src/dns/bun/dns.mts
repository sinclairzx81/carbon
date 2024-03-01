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

export function encodeFamily(family: Core.Family) {
  return family === 'IPv6' ? 'IPv6' : family === 'IPv4' ? 'IPv4' : 'any'
}
// prettier-ignore
export function decodeFamily(family: string | number | undefined): Core.Family {
  return (
    family === 0 ? 'Any' : 
    family === 4 ? 'IPv4' :
    family === 6 ? 'IPv6' :
    family === 'IPv6' ? 'IPv6' :
    family === 'IPv4' ? 'IPv4' :
    'Any'
  )
}
export async function lookup(hostname: string, options: Core.LookupOptions = { family: 'Any' }): Promise<Core.LookupResult[]> {
  const results = await Bun.dns.lookup(hostname, { family: encodeFamily(options.family) })
  return results.map((result) => {
    const family = decodeFamily(result.family)
    return { family, address: result.address }
  })
}
