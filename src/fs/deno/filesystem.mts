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

import * as Buffer from '../../buffer/index.mjs'
import * as Path from '../../path/index.mjs'
import * as Core from '../core/index.mjs'
import * as Util from '../core/util.mjs'

export class FileSystem {
  readonly #directory: string
  constructor(directory: string) {
    this.#directory = Path.resolve(directory)
  }
  [Symbol.dispose]() {
    this.close()
  }
  public readable(path: string, start: number = 0, end: number = Number.MAX_SAFE_INTEGER): ReadableStream<Uint8Array> {
    Util.assertReadRange(start, end)
    let file: Deno.FsFile
    let buffer = new Uint8Array(16384)
    let expect = end - start
    let length = 0
    return new ReadableStream({
      start: async (controller) => {
        if (!(await this.#isFileExists(path))) return controller.close()
        file = await Deno.open(this.#resolvePath(path), { read: true })
        await file.seek(start ?? 0, Deno.SeekMode.Start)
      },
      pull: async (controller) => {
        const read = await file.read(buffer)
        if (read === null) {
          file.close()
          controller.close()
        } else {
          const chunk = buffer.slice(0, read)
          length += read
          const exceed = length >= expect
          const end = exceed ? read - (length - expect) : read
          controller.enqueue(chunk.slice(0, end))
          if (exceed) {
            controller.close()
            file.close()
          }
        }
      },
    })
  }
  public writable(path: string): WritableStream<Uint8Array> {
    let file: Deno.FsFile
    return new WritableStream({
      // prettier-ignore
      start: async () => {
        await this.#ensureDirectoryCreated(path)
        const exists = await this.exists(path)
        const options: Deno.OpenOptions = exists
          ? { truncate: true, write: true }
          : { create: true, write: true }
        const resolvedPath = this.#resolvePath(path)
        file = await Deno.open(resolvedPath, options)
      },
      write: async (value: Uint8Array) => {
        await file.write(value)
      },
      close: async () => {
        await file.close()
      },
    })
  }
  public async mkdir(path: string): Promise<void> {
    const resolvedPath = this.#resolvePath(path)
    await Deno.mkdir(resolvedPath, { recursive: true })
  }
  public async readdir(path: string): Promise<string[]> {
    const resolvedPath = this.#resolvePath(path)
    const stat = await Deno.stat(resolvedPath).catch(() => null)
    if (stat === null || !stat.isDirectory) return []
    const buffer: string[] = []
    for await (const content of Deno.readDir(resolvedPath)) {
      buffer.push(content.name)
    }
    return buffer
  }
  public async exists(path: string) {
    const resolvedPath = this.#resolvePath(path)
    const stat = await Deno.stat(resolvedPath).catch(() => null)
    if (stat === null) return false
    return stat.isFile || stat.isDirectory
  }
  public async stat(path: string): Promise<Core.Stat> {
    const resolvedPath = this.#resolvePath(path)
    const stat = await Deno.stat(resolvedPath)
    const statPath = this.#resolveStatPath(resolvedPath)
    const created = stat.mtime === null ? 0 : stat.mtime.getTime()
    if (stat.isFile) return { type: 'file', path: statPath, size: stat.size, created }
    if (stat.isDirectory) return { type: 'directory', path: statPath }
    throw new Error('')
  }
  public async delete(path: string): Promise<void> {
    const resolvedPath = this.#resolvePath(path)
    await Deno.remove(resolvedPath, { recursive: true })
  }
  // Blob streams from remote sources do not seem possible in Node, Deno and Bun as there
  // doesn't appear to be a way to resolve a bytes from external sources. Would be interested
  // to find out if there was a way to construct a Blob from Readable sources.
  public async blob(path: string): Promise<Blob> {
    const uint8Array = await this.read(path)
    return new Blob([uint8Array.buffer])
  }
  public async read(path: string, start?: number, end?: number): Promise<Uint8Array> {
    const reader = this.readable(path, start, end).getReader()
    const buffers: Uint8Array[] = []
    while (true) {
      const next = await reader.read()
      if (next.value) {
        buffers.push(next.value)
      }
      if (next.done) {
        break
      }
    }
    return Buffer.concat(buffers)
  }
  public async write(path: string, value: Uint8Array): Promise<void> {
    const writer = this.writable(path).getWriter()
    await writer.write(value)
    await writer.close()
  }
  public close(): void {}
  // ----------------------------------------------------------------
  // Internal
  // ----------------------------------------------------------------
  #resolvePath(path: string) {
    return Util.resolvePath(this.#directory, path)
  }
  #resolveStatPath(resolvedPath: string) {
    return Util.resolveStatPath(this.#directory, resolvedPath)
  }
  async #isFileExists(path: string) {
    const resolvedPath = this.#resolvePath(path)
    const stat = await Deno.stat(resolvedPath).catch(() => null)
    if (stat === null) return false
    return stat.isFile
  }
  async #ensureDirectoryCreated(path: string) {
    const resolvedPath = this.#resolvePath(path)
    const dirname = Path.dirname(resolvedPath)
    await Deno.mkdir(dirname, { recursive: true })
  }
}
