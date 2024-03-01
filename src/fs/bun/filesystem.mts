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
import * as Buffer from '../../buffer/index.mjs'
import * as Path from '../../path/index.mjs'
import * as Core from '../core/index.mjs'
import * as Util from '../core/util.mjs'

const Fs = await Runtime.dynamicImport<typeof import('node:fs')>('node:fs')

export class FileSystem {
  readonly #directory: string
  constructor(directory: string) {
    this.#directory = Path.resolve(directory)
  }
  [Symbol.dispose]() {
    this.close()
  }
  // Note: As of Bun 1.0.20, the Fs implementation doesn't support byte offsets into the file. Because of this,
  // the following readable implementation reads the entire file in a linear fashion and only emits bytes when
  // those bytes fall within the start and end ranges. This implementation should be revised once Bun supports
  // file slicing via its Blob interface.
  public readable(path: string, start: number = 0, end: number = Number.MAX_SAFE_INTEGER): ReadableStream<Uint8Array> {
    Util.assertReadRange(start, end)
    let [read, outer] = [0, { start, end }]
    let resolvedPath = this.#resolvePath(path)
    let reader: ReadableStreamDefaultReader<Uint8Array>
    return new ReadableStream({
      start: async (controller) => {
        if (!(await this.#isFileExists(path))) return controller.close()
        reader = Bun.file(resolvedPath).stream().getReader()
      },
      pull: async (controller) => {
        const next = await reader.read()
        if (next.value) {
          const inner = { start: read, end: read + next.value.length }
          read = read + next.value.length
          const range = this.#intersectRange(outer, inner)
          if (range !== null) {
            controller.enqueue(next.value.slice(range[0], range[1]))
          } else {
            controller.enqueue(new Uint8Array(0))
          }
        }
        if (next.done) {
          controller.close()
        }
      },
    })
  }
  public writable(path: string): WritableStream<Uint8Array> {
    this.#ensureDirectoryCreated(path)
    const resolvedpath = this.#resolvePath(path)
    const file = Bun.file(resolvedpath)
    const writer = file.writer()
    return new WritableStream({
      write: async (value: Uint8Array) => {
        writer.write(value)
        await writer.flush()
      },
      close: async () => {
        writer.end()
      },
    })
  }
  public async mkdir(path: string): Promise<void> {
    const resolvedPath = this.#resolvePath(path)
    await Fs.promises.mkdir(resolvedPath, { recursive: true })
  }
  public async readdir(path: string): Promise<string[]> {
    const resolvedPath = this.#resolvePath(path)
    const stat = await Fs.promises.stat(resolvedPath).catch(() => null)
    if (stat === null || !stat.isDirectory()) return []
    return Fs.promises.readdir(resolvedPath)
  }
  public async exists(path: string): Promise<boolean> {
    const resolvedPath = this.#resolvePath(path)
    const stat = await Fs.promises.stat(resolvedPath).catch(() => null)
    if (stat === null) return false
    return stat.isFile() || stat.isDirectory()
  }
  public async stat(path: string): Promise<Core.Stat> {
    const resolvedPath = this.#resolvePath(path)
    const stat = await Fs.promises.stat(resolvedPath)
    const statPath = this.#resolveStatPath(resolvedPath)
    if (stat.isFile()) return { type: 'file', path: statPath, created: stat.mtime.getTime(), size: stat.size }
    if (stat.isDirectory()) return { type: 'directory', path: statPath }
    throw Error('Unknown to stat path')
  }
  public async delete(path: string): Promise<void> {
    const resolvedPath = this.#resolvePath(path)
    const stat = await Fs.promises.stat(resolvedPath).catch(() => null)
    if (stat === null) return
    if (stat.isDirectory()) {
      await Fs.promises.rm(resolvedPath, { recursive: true })
    }
    if (stat.isFile()) {
      await Fs.promises.unlink(resolvedPath)
    }
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
  #intersectRange(outer: { start: number; end: number }, inner: { start: number; end: number }): [number, number] | null {
    const intersectedLower = Math.max(outer.start, inner.start)
    const intersectedUpper = Math.min(outer.end, inner.end)
    return intersectedLower <= intersectedUpper ? [intersectedLower, intersectedUpper] : null
  }
  async #isFileExists(path: string) {
    const resolvedPath = this.#resolvePath(path)
    const stat = await Fs.promises.stat(resolvedPath).catch(() => null)
    if (stat === null) return false
    return stat.isFile()
  }
  #ensureDirectoryCreated(path: string) {
    const resolvedPath = this.#resolvePath(path)
    const dirname = Path.dirname(resolvedPath)
    Fs.mkdirSync(dirname, { recursive: true })
  }
}
