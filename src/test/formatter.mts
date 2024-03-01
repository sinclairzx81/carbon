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

import * as Value from '../value/index.mjs'

export namespace ValueFormatter {
  function formatTypedArray(value: Value.TypedArrayType): string {
    // prettier-ignore
    return (
      Value.IsInt8Array(value) ? `Int8Array { length: ${value.length} }` :
      Value.IsUint8Array(value) ? `Uint8Array { length: ${value.length} }` : 
      Value.IsUint8ClampedArray(value) ? `Uint8ClampedArray { length: ${value.length} }` : 
      Value.IsInt16Array(value) ? `Int16Array { length: ${value.length} }` : 
      Value.IsUint16Array(value) ? `Uint16Array { length: ${value.length} }` : 
      Value.IsInt32Array(value) ? `Int32Array { length: ${value.length} }` : 
      Value.IsUint32Array(value) ? `Uint32Array { length: ${value.length} }` : 
      Value.IsFloat32Array(value) ? `Float32Array { length: ${value.length} }` : 
      Value.IsFloat64Array(value) ? `Float64Array { length: ${value.length} }` : 
      Value.IsBigInt64Array(value) ? `BigInt64Array { length: ${value.length} }` : 
      Value.IsBigUint64Array(value) ? `BigUint64Array { length: ${value.length} }` : 
      (() => { throw new Error('Unknown typed array') })()
    )
  }
  function formatArray(value: unknown[]): string {
    const elements: string = value.map((value) => format(value)).join(', ')
    return `Array { length: ${value.length} } [${elements}]`
  }
  function formatInstanceObject(value: Value.ObjectType) {
    return `${value.constructor.name}`
  }
  function formatObject(value: Value.ObjectType) {
    return JSON.stringify(value)
  }
  // prettier-ignore
  export function format(value: unknown): string {
    return (
      Value.IsTypedArray(value) ? formatTypedArray(value) : 
      Value.IsArray(value) ? formatArray(value) : 
      Value.IsInstanceObject(value) ? formatInstanceObject(value) : 
      Value.IsObject(value) ? formatObject(value) : `${value}`
    )
  }
}
