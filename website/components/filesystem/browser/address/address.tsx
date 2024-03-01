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

import './address.css'

import * as React from 'react'
import * as State from '../state/index.js'
import { Fs, Path } from '@sinclair/carbon'

// ------------------------------------------------------------------
// Navigation
// ------------------------------------------------------------------
interface NavigationProperties {
  filesystem: Fs.FileSystem
}
function Navigation(props: NavigationProperties) {
  const { stat, setStat } = React.useContext(State.Context)
  interface Item {
    path: string
    name: string
  }
  function resolveItems(path: string): Item[] {
    const buffer: Item[] = []
    while (true) {
      const basename = Path.basename(path)
      const name = basename === '' ? '/' : basename
      buffer.push({ path, name })
      if (path === '/') break
      path = Path.dirname(path)
    }
    return buffer.reverse()
  }
  async function onItemClick(item: Item) {
    setStat(await props.filesystem.stat(item.path))
  }
  const items = resolveItems(stat.path)
  return (
    <div className="filesystem-browser-address-navigation">
      {items.map((item) => {
        return (
          <span onClick={() => onItemClick(item)} key={item.path}>
            {item.name}
          </span>
        )
      })}
    </div>
  )
}
// ------------------------------------------------------------------
// CreateDirectory
// ------------------------------------------------------------------
interface CreateDirectoryProperties {
  filesystem: Fs.FileSystem
}
export function CreateDirectory(props: CreateDirectoryProperties) {
  const { stat, setStat } = React.useContext(State.Context)
  const [input, setInput] = React.useState('')
  async function createDirectory() {
    const path = Path.join(stat.path, input)
    setInput('')
    await props.filesystem.mkdir(path)
    setStat(stat)
  }
  function onChange(event: React.ChangeEvent<HTMLInputElement>) {
    setInput(event.target.value)
  }
  async function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Enter') return
    createDirectory()
  }
  return (
    stat.type === 'directory' && (
      <div className="filesystem-browser-address-create-directory">
        <input type="text" value={input} onChange={onChange} onKeyDown={onKeyDown} placeholder="Create Directory"></input>
      </div>
    )
  )
}
// ------------------------------------------------------------------
// Address
// ------------------------------------------------------------------
export interface AddressProperties {
  filesystem: Fs.FileSystem
}
// prettier-ignore
export function Address(props: AddressProperties) {
  return (
    <div className="filesystem-browser-address">
      <Navigation filesystem={props.filesystem} />
      <CreateDirectory filesystem={props.filesystem} />
    </div>
  )
}
