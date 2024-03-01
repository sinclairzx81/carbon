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

import type { Stat } from './stat.mjs'

export declare class FileSystem {
  constructor(...args: never[])
  /** Returns a ReadableStream for the given path. If the path does not exist an empty Readable is returned. */
  public readable(path: string, start?: number, end?: number): ReadableStream<Uint8Array>
  /** Returns a WritableStream for the given path. If the path exists the file will be overwritten. */
  public writable(path: string): WritableStream<Uint8Array>
  /** Creates a directory. If directory exists, no action */
  public mkdir(path: string): Promise<void>
  /** Returns the contents of this directory */
  public readdir(path: string): Promise<string[]>
  /** Returns true if the given key exists. */
  public exists(path: string): Promise<boolean>
  /** Returns a stat object for the given path. Throws if key not found */
  public stat(path: string): Promise<Stat>
  /** Deletes a file with the given key.*/
  public delete(path: string): Promise<void>
  /** Reads a buffer from a file. */
  public read(path: string, start?: number, end?: number): Promise<Uint8Array>
  /** Reads the given path as a Blob */
  public blob(path: string): Promise<Blob>
  /** Writes a buffer for the given key. Will override if file exists. */
  public write(path: string, value: Uint8Array): Promise<void>
  /** Closes this File System */
  public close(): void
}
