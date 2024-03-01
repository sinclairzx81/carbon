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

export interface PathObject {
  dir?: string
  root?: string
  base?: string
  name?: string
  ext?: string
}

/** The platform-specific pathing system  */
export declare let system: 'windows' | 'posix'

/** Provides the platform-specific path segment separator */
export declare let sep: string

/** Provides the platform-specific path delimiter */
export declare let delimiter: string

/** The Path.resolve() method resolves a sequence of paths or path segments into an absolute path. */
export declare function resolve(...args: string[]): string

/** The Path.normalize() method normalizes the given path, resolving '..' and '.' segments. */
export declare function normalize(path: string): string

/** The Path.isAbsolute() method determines if path is an absolute path. */
export declare function isAbsolute(path: string): boolean

/** The path.join() method joins all given path segments together using the platform-specific separator as a delimiter, then normalizes the resulting path. */
export declare function join(...args: string[]): string

/** The Path.relative() method returns the relative path from from to to based on the current working directory. If from and to each resolve to the same path (after calling Path.resolve() on each), a zero-length string is returned. */
export declare function relative(from: string, to: string): string

/** On Windows systems only, returns an equivalent namespace-prefixed path for the given path. If path is not a string, path will be returned without modifications. */
export declare function toNamespacedPath(path: string): string

/** The Path.dirname() method returns the directory name of a path, similar to the Unix dirname command. Trailing directory separators are ignored. */
export declare function dirname(path: string): string

/** The Path.basename() method returns the last portion of a path, similar to the Unix basename command. Trailing directory separators are ignored. */
export declare function basename(path: string, ext?: string): string

/** The Path.extname() method returns the extension of the path, from the last occurrence of the . (period) character to end of string in the last portion of the path. If there is no . in the last portion of the path, or if there are no . characters other than the first character of the basename of path, an empty string is returned. */
export declare function extname(path: string): string

/** The Path.format() method returns a path string from an object. This is the opposite of Path.parse(). */
export declare function format(obj: PathObject): string

/** The Path.parse() method returns an object whose properties represent significant elements of the path. Trailing directory separators are ignored. */
export declare function parse(path: string): PathObject
