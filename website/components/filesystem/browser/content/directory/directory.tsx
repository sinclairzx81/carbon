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

import './directory.css'

import * as React from 'react'
import * as State from '../../state/index.js'
import * as Types from './types/index.js'
import { Fs, Path } from '@sinclair/carbon'

// ------------------------------------------------------------------
// FileSystem API - webkitGetAsEntry
// ------------------------------------------------------------------
function isFileSystemDirectoryEntry(entry: FileSystemEntry): entry is FileSystemDirectoryEntry {
  return entry.isDirectory
}
function isFileSystemFileEntry(entry: FileSystemEntry): entry is FileSystemFileEntry {
  return entry.isFile
}
async function readFileSystemDirectoryEntry(entry: FileSystemDirectoryEntry): Promise<FileSystemEntry[]> {
  return new Promise((resolve, reject) => {
    entry.createReader().readEntries(
      (entries) => resolve(entries),
      (error) => reject(error),
    )
  })
}
async function readFileSystemFileEntry(entry: FileSystemFileEntry): Promise<File> {
  return new Promise((resolve, reject) => {
    entry.file(
      (file) => resolve(file),
      (error) => reject(error),
    )
  })
}
async function* enumerateFileSystemFileEntries(entry: FileSystemEntry): AsyncIterableIterator<FileSystemFileEntry> {
  if (isFileSystemFileEntry(entry)) return yield await entry
  if (isFileSystemDirectoryEntry(entry)) {
    for (const directoryEntry of await readFileSystemDirectoryEntry(entry)) {
      for await (const file of enumerateFileSystemFileEntries(directoryEntry)) {
        yield await file
      }
    }
  }
}
// ------------------------------------------------------------------
// Directory Component
// ------------------------------------------------------------------
export interface DirectoryProperties {
  filesystem: Fs.FileSystem
}
// prettier-ignore
export function Directory(props: DirectoryProperties) {
  const { stat, setStat } = React.useContext(State.Context)
  const [isDragging, setIsDragging] = React.useState<boolean>(false)
  const [stats, setStats] = React.useState<Fs.Stat[]>([])
  async function load() {
    const names = await props.filesystem.readdir(stat.path)
    const stats = await Promise.all(names.map(async content => {
      const path = Path.join(stat.path, content)
      return await props.filesystem.stat(path)
    }))
    setStats(stats)
  }
  const onDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(true)
  }
  const onDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(false)
    const entries: any[] = []
    for(const item of event.dataTransfer.items) {
      const entry = item.webkitGetAsEntry()
      if(entry === null) continue
      entries.push(entry)
    }
    for(const entry of entries) {
      for await(const fileEntry of enumerateFileSystemFileEntries(entry)) {
        const path = Path.join(stat.path, fileEntry.fullPath)
        const writer = props.filesystem.writable(path)
        const file = await readFileSystemFileEntry(fileEntry)
        await file.stream().pipeTo(writer)
      }
    }
    setStat(stat)
  }
  const handleDragLeave = () => {
    setIsDragging(false)
  }
  React.useEffect(() => {
    load()
  }, [stat])
  return <div className='filesystem-browser-content-directory'
    onDragOver={onDragOver}
    onDrop={onDrop}
    onDragLeave={handleDragLeave}
  >
    {stats.map(stat => {
      return stat.type === 'directory'
        ? <Types.Directory key={stat.path} filesystem={props.filesystem} stat={stat} />
        : <Types.File key={stat.path} filesystem={props.filesystem} stat={stat} />
    })}
  </div>
}
