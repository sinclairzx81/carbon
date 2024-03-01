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
  public readable(path: string, start?: number, end?: number): ReadableStream<Uint8Array> {
    Util.assertReadRange(start, end)
    end = end === undefined ? undefined : end - 1 // inline with slice
    let readable: ReturnType<typeof Fs.createReadStream>
    return new ReadableStream<Uint8Array>({
      start: async (controller) => {
        if (!(await this.#isFileExists(path))) return controller.close()
        readable = Fs.createReadStream(this.#resolvePath(path), { start, end })
        readable.on('data', (buffer: Buffer) => {
          controller.enqueue(new Uint8Array(buffer.buffer))
          readable.pause()
        })
        readable.on('error', (error) => controller.error(error))
        readable.on('end', () => controller.close())
        readable.pause()
      },
      pull: async () => {
        readable.resume()
      },
    })
  }
  public writable(path: string): WritableStream<Uint8Array> {
    let writable: ReturnType<typeof Fs.createWriteStream>
    return new WritableStream<Uint8Array>({
      start: async (controller) => {
        try {
          await this.#ensureDirectoryCreated(path)
          const resolvedPath = this.#resolvePath(path)
          writable = Fs.createWriteStream(resolvedPath, { flags: 'w' })
        } catch (error) {
          controller.error(error)
        }
      },
      write: async (value, controller) => {
        await new Promise<void>((resolve, reject) => {
          writable.write(value, (error) => {
            if (error) {
              controller.error(error)
              reject(error)
            } else {
              resolve()
            }
          })
        })
      },
      close: async () => {
        await new Promise<void>((resolve, reject) => {
          writable.close((error) => {
            if (error) return reject(error)
            resolve()
          })
        })
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
  public async exists(path: string) {
    const resolvedPath = this.#resolvePath(path)
    const stat = await Fs.promises.stat(resolvedPath).catch(() => null)
    if (stat === null) return false
    return stat.isFile() || stat.isDirectory()
  }
  public async stat(path: string): Promise<Core.Stat> {
    const resolvedPath = this.#resolvePath(path)
    const stat = await Fs.promises.stat(resolvedPath)
    const statPath = this.#statPath(resolvedPath)
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
  #statPath(resolvedPath: string) {
    return Util.resolveStatPath(this.#directory, resolvedPath)
  }
  async #isFileExists(path: string) {
    const resolvedPath = this.#resolvePath(path)
    const stat = await Fs.promises.stat(resolvedPath).catch(() => null)
    if (stat === null) return false
    return stat.isFile()
  }
  // Note: Have observed that Node 20.10.0 will resolve the promise before the directories have
  // been created recursively. This is critical error in Node, but not one I have a lot of
  // control over. Below we use the synchronous mode.
  #ensureDirectoryCreated(path: string) {
    const resolvedPath = this.#resolvePath(path)
    const dirname = Path.dirname(resolvedPath)
    Fs.mkdirSync(dirname, { recursive: true })
  }
}
