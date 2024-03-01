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

// ------------------------------------------------------------------
// Runtime: DynamicImport
// ------------------------------------------------------------------
/**
 * Dynamically imports a module to prevent bundling infrastructure from including the module. This
 * function is typically used to import core node modules while preventing bundlers from importing
 * that same functionality.
 */
export function dynamicImport<T = any>(name: string): Promise<T> {
  return new Function('name', `return import(name);`)(name) as Promise<T>
}
// ------------------------------------------------------------------
// Runtime: Resolve
// ------------------------------------------------------------------
export type RuntimeType = 'browser' | 'node' | 'deno' | 'bun' | 'unknown'

export function isBun() {
  return ('self' in globalThis && 'Bun' in globalThis.self) || 'Bun' in globalThis
}
export function isDeno() {
  return ('self' in globalThis && 'Deno' in globalThis.self) || 'Deno' in globalThis
}
export function isNode() {
  if (isBun()) return false
  return ('self' in globalThis && 'process' in globalThis.self) || 'process' in globalThis
}
export function isBrowser() {
  if (isBun()) return false
  if (isDeno()) return false
  return ('self' in globalThis && 'addEventListener' in globalThis.self) || 'window' in globalThis
}
/** Resolves the JavaScript runtime environment */
export function name(): RuntimeType {
  return isBrowser() ? 'browser' : isBun() ? 'bun' : isDeno() ? 'deno' : isNode() ? 'node' : 'unknown'
}
