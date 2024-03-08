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

import * as Common from '../common/index.mjs'
import * as Core from '../core/index.mjs'

export const system = 'windows'
export const sep = '\\'
export const delimiter = ';'

export function resolve(...args: string[]): string {
  let resolvedDevice = ''
  let resolvedTail = ''
  let resolvedAbsolute = false

  for (let i = args.length - 1; i >= -1; i--) {
    let path
    if (i >= 0) {
      path = args[i]
      // Skip empty entries
      if (path.length === 0) {
        continue
      }
    } else if (resolvedDevice.length === 0) {
      path = Common.cwd
    } else {
      // Windows has the concept of drive-specific current working
      // directories. If we've resolved a drive letter but not yet an
      // absolute path, get cwd for that drive, or the process cwd if
      // the drive cwd is not available. We're sure the device is not
      // a UNC path at this points, because UNC paths are always absolute.
      path = Common.env.get(`=${resolvedDevice}`) || Common.cwd

      // Verify that a cwd was found and that it actually points
      // to our drive. If not, default to the drive's root.
      if (path === undefined || (path.slice(0, 2).toLowerCase() !== resolvedDevice.toLowerCase() && path.charCodeAt(2) === Common.PathUtil.CHAR_BACKWARD_SLASH)) {
        path = `${resolvedDevice}\\`
      }
    }

    const len = path.length
    let rootEnd = 0
    let device = ''
    let isAbsolute = false
    const code = path.charCodeAt(0)

    // Try to match a root
    if (len === 1) {
      if (Common.PathUtil.isPathSeparator(code)) {
        // `path` contains just a path separator
        rootEnd = 1
        isAbsolute = true
      }
    } else if (Common.PathUtil.isPathSeparator(code)) {
      // Possible UNC root

      // If we started with a separator, we know we at least have an
      // absolute path of some kind (UNC or otherwise)
      isAbsolute = true

      if (Common.PathUtil.isPathSeparator(path.charCodeAt(1))) {
        // Matched double path separator at beginning
        let j = 2
        let last = j
        // Match 1 or more non-path separators
        while (j < len && !Common.PathUtil.isPathSeparator(path.charCodeAt(j))) {
          j++
        }
        if (j < len && j !== last) {
          const firstPart = path.slice(last, j)
          // Matched!
          last = j
          // Match 1 or more path separators
          while (j < len && Common.PathUtil.isPathSeparator(path.charCodeAt(j))) {
            j++
          }
          if (j < len && j !== last) {
            // Matched!
            last = j
            // Match 1 or more non-path separators
            while (j < len && !Common.PathUtil.isPathSeparator(path.charCodeAt(j))) {
              j++
            }
            if (j === len || j !== last) {
              // We matched a UNC root
              device = `\\\\${firstPart}\\${path.slice(last, j)}`
              rootEnd = j
            }
          }
        }
      } else {
        rootEnd = 1
      }
    } else if (Common.PathUtil.isWindowsDeviceRoot(code) && path.charCodeAt(1) === Common.PathUtil.CHAR_COLON) {
      // Possible device root
      device = path.slice(0, 2)
      rootEnd = 2
      if (len > 2 && Common.PathUtil.isPathSeparator(path.charCodeAt(2))) {
        // Treat separator following drive name as an absolute path
        // indicator
        isAbsolute = true
        rootEnd = 3
      }
    }

    if (device.length > 0) {
      if (resolvedDevice.length > 0) {
        if (device.toLowerCase() !== resolvedDevice.toLowerCase())
          // This path points to another device so it is not applicable
          continue
      } else {
        resolvedDevice = device
      }
    }

    if (resolvedAbsolute) {
      if (resolvedDevice.length > 0) break
    } else {
      resolvedTail = `${path.slice(rootEnd)}\\${resolvedTail}`
      resolvedAbsolute = isAbsolute
      if (isAbsolute && resolvedDevice.length > 0) {
        break
      }
    }
  }

  // At this point the path should be resolved to a full absolute path,
  // but handle relative paths to be safe (might happen when Process.cwd()
  // fails)

  // Normalize the tail path
  resolvedTail = Common.PathUtil.normalizeString(resolvedTail, !resolvedAbsolute, '\\', Common.PathUtil.isPathSeparator)

  return resolvedAbsolute ? `${resolvedDevice}\\${resolvedTail}` : `${resolvedDevice}${resolvedTail}` || '.'
}

export function normalize(path: string): string {
  const len = path.length
  if (len === 0) return '.'
  let rootEnd = 0
  let device
  let isAbsolute = false
  const code = path.charCodeAt(0)

  // Try to match a root
  if (len === 1) {
    // `path` contains just a single char, exit early to avoid
    // unnecessary work
    return Common.PathUtil.isPosixPathSeparator(code) ? '\\' : path
  }
  if (Common.PathUtil.isPathSeparator(code)) {
    // Possible UNC root

    // If we started with a separator, we know we at least have an absolute
    // path of some kind (UNC or otherwise)
    isAbsolute = true

    if (Common.PathUtil.isPathSeparator(path.charCodeAt(1))) {
      // Matched double path separator at beginning
      let j = 2
      let last = j
      // Match 1 or more non-path separators
      while (j < len && !Common.PathUtil.isPathSeparator(path.charCodeAt(j))) {
        j++
      }
      if (j < len && j !== last) {
        const firstPart = path.slice(last, j)
        // Matched!
        last = j
        // Match 1 or more path separators
        while (j < len && Common.PathUtil.isPathSeparator(path.charCodeAt(j))) {
          j++
        }
        if (j < len && j !== last) {
          // Matched!
          last = j
          // Match 1 or more non-path separators
          while (j < len && !Common.PathUtil.isPathSeparator(path.charCodeAt(j))) {
            j++
          }
          if (j === len) {
            // We matched a UNC root only
            // Return the normalized version of the UNC root since there
            // is nothing left to process
            return `\\\\${firstPart}\\${path.slice(last)}\\`
          }
          if (j !== last) {
            // We matched a UNC root with leftovers
            device = `\\\\${firstPart}\\${path.slice(last, j)}`
            rootEnd = j
          }
        }
      }
    } else {
      rootEnd = 1
    }
  } else if (Common.PathUtil.isWindowsDeviceRoot(code) && path.charCodeAt(1) === Common.PathUtil.CHAR_COLON) {
    // Possible device root
    device = path.slice(0, 2)
    rootEnd = 2
    if (len > 2 && Common.PathUtil.isPathSeparator(path.charCodeAt(2))) {
      // Treat separator following drive name as an absolute path
      // indicator
      isAbsolute = true
      rootEnd = 3
    }
  }

  let tail = rootEnd < len ? Common.PathUtil.normalizeString(path.slice(rootEnd), !isAbsolute, '\\', Common.PathUtil.isPathSeparator) : ''
  if (tail.length === 0 && !isAbsolute) tail = '.'
  if (tail.length > 0 && Common.PathUtil.isPathSeparator(path.charCodeAt(len - 1))) tail += '\\'
  if (device === undefined) {
    return isAbsolute ? `\\${tail}` : tail
  }
  return isAbsolute ? `${device}\\${tail}` : `${device}${tail}`
}

export function isAbsolute(path: string): boolean {
  const len = path.length
  if (len === 0) return false

  const code = path.charCodeAt(0)
  return (
    Common.PathUtil.isPathSeparator(code) ||
    // Possible device root
    (len > 2 && Common.PathUtil.isWindowsDeviceRoot(code) && path.charCodeAt(1) === Common.PathUtil.CHAR_COLON && Common.PathUtil.isPathSeparator(path.charCodeAt(2)))
  )
}

export function join(...args: string[]): string {
  if (args.length === 0) return '.'

  let joined: string | undefined
  let firstPart: string | undefined
  for (let i = 0; i < args.length; ++i) {
    const arg = args[i]
    if (arg.length > 0) {
      if (joined === undefined) joined = firstPart = arg
      else joined += `\\${arg}`
    }
  }
  if (firstPart === undefined) throw Error('Path: join() firstPart undefined')
  if (joined === undefined) return '.'

  // Make sure that the joined path doesn't start with two slashes, because
  // normalize() will mistake it for a UNC path then.
  //
  // This step is skipped when it is very clear that the user actually
  // intended to point at a UNC path. This is assumed when the first
  // non-empty string arguments starts with exactly two slashes followed by
  // at least one more non-slash character.
  //
  // Note that for normalize() to treat a path as a UNC path it needs to
  // have at least 2 components, so we don't filter for that here.
  // This means that the user can use join to construct UNC paths from
  // a server name and a share name; for example:
  //   path.join('//server', 'share') -> '\\\\server\\share\\')
  let needsReplace = true
  let slashCount = 0
  if (Common.PathUtil.isPathSeparator(firstPart.charCodeAt(0))) {
    ++slashCount
    const firstLen = firstPart.length
    if (firstLen > 1 && Common.PathUtil.isPathSeparator(firstPart.charCodeAt(1))) {
      ++slashCount
      if (firstLen > 2) {
        if (Common.PathUtil.isPathSeparator(firstPart.charCodeAt(2))) ++slashCount
        else {
          // We matched a UNC path in the first part
          needsReplace = false
        }
      }
    }
  }
  if (needsReplace) {
    // Find any more consecutive slashes we need to replace
    while (slashCount < joined.length && Common.PathUtil.isPathSeparator(joined.charCodeAt(slashCount))) {
      slashCount++
    }

    // Replace the slashes if needed
    if (slashCount >= 2) joined = `\\${joined.slice(slashCount)}`
  }

  return normalize(joined)
}

export function relative(from: string, to: string): string {
  if (from === to) return ''

  const fromOrig = resolve(from)
  const toOrig = resolve(to)

  if (fromOrig === toOrig) return ''

  from = fromOrig.toLowerCase()
  to = toOrig.toLowerCase()

  if (from === to) return ''

  // Trim any leading backslashes
  let fromStart = 0
  while (fromStart < from.length && from.charCodeAt(fromStart) === Common.PathUtil.CHAR_BACKWARD_SLASH) {
    fromStart++
  }
  // Trim trailing backslashes (applicable to UNC paths only)
  let fromEnd = from.length
  while (fromEnd - 1 > fromStart && from.charCodeAt(fromEnd - 1) === Common.PathUtil.CHAR_BACKWARD_SLASH) {
    fromEnd--
  }
  const fromLen = fromEnd - fromStart

  // Trim any leading backslashes
  let toStart = 0
  while (toStart < to.length && to.charCodeAt(toStart) === Common.PathUtil.CHAR_BACKWARD_SLASH) {
    toStart++
  }
  // Trim trailing backslashes (applicable to UNC paths only)
  let toEnd = to.length
  while (toEnd - 1 > toStart && to.charCodeAt(toEnd - 1) === Common.PathUtil.CHAR_BACKWARD_SLASH) {
    toEnd--
  }
  const toLen = toEnd - toStart

  // Compare paths to find the longest common path from root
  const length = fromLen < toLen ? fromLen : toLen
  let lastCommonSep = -1
  let i = 0
  for (; i < length; i++) {
    const fromCode = from.charCodeAt(fromStart + i)
    if (fromCode !== to.charCodeAt(toStart + i)) break
    else if (fromCode === Common.PathUtil.CHAR_BACKWARD_SLASH) lastCommonSep = i
  }

  // We found a mismatch before the first common path separator was seen, so
  // return the original `to`.
  if (i !== length) {
    if (lastCommonSep === -1) return toOrig
  } else {
    if (toLen > length) {
      if (to.charCodeAt(toStart + i) === Common.PathUtil.CHAR_BACKWARD_SLASH) {
        // We get here if `from` is the exact base path for `to`.
        // For example: from='C:\\foo\\bar'; to='C:\\foo\\bar\\baz'
        return toOrig.slice(toStart + i + 1)
      }
      if (i === 2) {
        // We get here if `from` is the device root.
        // For example: from='C:\\'; to='C:\\foo'
        return toOrig.slice(toStart + i)
      }
    }
    if (fromLen > length) {
      if (from.charCodeAt(fromStart + i) === Common.PathUtil.CHAR_BACKWARD_SLASH) {
        // We get here if `to` is the exact base path for `from`.
        // For example: from='C:\\foo\\bar'; to='C:\\foo'
        lastCommonSep = i
      } else if (i === 2) {
        // We get here if `to` is the device root.
        // For example: from='C:\\foo\\bar'; to='C:\\'
        lastCommonSep = 3
      }
    }
    if (lastCommonSep === -1) lastCommonSep = 0
  }

  let out = ''
  // Generate the relative path based on the path difference between `to` and
  // `from`
  for (i = fromStart + lastCommonSep + 1; i <= fromEnd; ++i) {
    if (i === fromEnd || from.charCodeAt(i) === Common.PathUtil.CHAR_BACKWARD_SLASH) {
      out += out.length === 0 ? '..' : '\\..'
    }
  }

  toStart += lastCommonSep

  // Lastly, append the rest of the destination (`to`) path that comes after
  // the common path parts
  if (out.length > 0) return `${out}${toOrig.slice(toStart, toEnd)}`

  if (toOrig.charCodeAt(toStart) === Common.PathUtil.CHAR_BACKWARD_SLASH) ++toStart
  return toOrig.slice(toStart, toEnd)
}

export function toNamespacedPath(path: string): string {
  // Note: this will *probably* throw somewhere.
  if (typeof path !== 'string' || path.length === 0) return path

  const resolvedPath = resolve(path)

  if (resolvedPath.length <= 2) return path

  if (resolvedPath.charCodeAt(0) === Common.PathUtil.CHAR_BACKWARD_SLASH) {
    // Possible UNC root
    if (resolvedPath.charCodeAt(1) === Common.PathUtil.CHAR_BACKWARD_SLASH) {
      const code = resolvedPath.charCodeAt(2)
      if (code !== Common.PathUtil.CHAR_QUESTION_MARK && code !== Common.PathUtil.CHAR_DOT) {
        // Matched non-long UNC root, convert the path to a long UNC path
        return `\\\\?\\UNC\\${resolvedPath.slice(2)}`
      }
    }
  } else if (Common.PathUtil.isWindowsDeviceRoot(resolvedPath.charCodeAt(0)) && resolvedPath.charCodeAt(1) === Common.PathUtil.CHAR_COLON && resolvedPath.charCodeAt(2) === Common.PathUtil.CHAR_BACKWARD_SLASH) {
    // Matched device root, convert the path to a long UNC path
    return `\\\\?\\${resolvedPath}`
  }

  return path
}

export function dirname(path: string): string {
  const len = path.length
  if (len === 0) return '.'
  let rootEnd = -1
  let offset = 0
  const code = path.charCodeAt(0)

  if (len === 1) {
    // `path` contains just a path separator, exit early to avoid
    // unnecessary work or a dot.
    return Common.PathUtil.isPathSeparator(code) ? path : '.'
  }

  // Try to match a root
  if (Common.PathUtil.isPathSeparator(code)) {
    // Possible UNC root

    rootEnd = offset = 1

    if (Common.PathUtil.isPathSeparator(path.charCodeAt(1))) {
      // Matched double path separator at beginning
      let j = 2
      let last = j
      // Match 1 or more non-path separators
      while (j < len && !Common.PathUtil.isPathSeparator(path.charCodeAt(j))) {
        j++
      }
      if (j < len && j !== last) {
        // Matched!
        last = j
        // Match 1 or more path separators
        while (j < len && Common.PathUtil.isPathSeparator(path.charCodeAt(j))) {
          j++
        }
        if (j < len && j !== last) {
          // Matched!
          last = j
          // Match 1 or more non-path separators
          while (j < len && !Common.PathUtil.isPathSeparator(path.charCodeAt(j))) {
            j++
          }
          if (j === len) {
            // We matched a UNC root only
            return path
          }
          if (j !== last) {
            // We matched a UNC root with leftovers

            // Offset by 1 to include the separator after the UNC root to
            // treat it as a "normal root" on top of a (UNC) root
            rootEnd = offset = j + 1
          }
        }
      }
    }
    // Possible device root
  } else if (Common.PathUtil.isWindowsDeviceRoot(code) && path.charCodeAt(1) === Common.PathUtil.CHAR_COLON) {
    rootEnd = len > 2 && Common.PathUtil.isPathSeparator(path.charCodeAt(2)) ? 3 : 2
    offset = rootEnd
  }

  let end = -1
  let matchedSlash = true
  for (let i = len - 1; i >= offset; --i) {
    if (Common.PathUtil.isPathSeparator(path.charCodeAt(i))) {
      if (!matchedSlash) {
        end = i
        break
      }
    } else {
      // We saw the first non-path separator
      matchedSlash = false
    }
  }

  if (end === -1) {
    if (rootEnd === -1) return '.'

    end = rootEnd
  }
  return path.slice(0, end)
}

export function basename(path: string, ext?: string): string {
  let start = 0
  let end = -1
  let matchedSlash = true

  // Check for a drive letter prefix so as not to mistake the following
  // path separator as an extra separator at the end of the path that can be
  // disregarded
  if (path.length >= 2 && Common.PathUtil.isWindowsDeviceRoot(path.charCodeAt(0)) && path.charCodeAt(1) === Common.PathUtil.CHAR_COLON) {
    start = 2
  }

  if (ext !== undefined && ext.length > 0 && ext.length <= path.length) {
    if (ext === path) return ''
    let extIdx = ext.length - 1
    let firstNonSlashEnd = -1
    for (let i = path.length - 1; i >= start; --i) {
      const code = path.charCodeAt(i)
      if (Common.PathUtil.isPathSeparator(code)) {
        // If we reached a path separator that was not part of a set of path
        // separators at the end of the string, stop now
        if (!matchedSlash) {
          start = i + 1
          break
        }
      } else {
        if (firstNonSlashEnd === -1) {
          // We saw the first non-path separator, remember this index in case
          // we need it if the extension ends up not matching
          matchedSlash = false
          firstNonSlashEnd = i + 1
        }
        if (extIdx >= 0) {
          // Try to match the explicit extension
          if (code === ext.charCodeAt(extIdx)) {
            if (--extIdx === -1) {
              // We matched the extension, so mark this as the end of our path
              // component
              end = i
            }
          } else {
            // Extension does not match, so our result is the entire path
            // component
            extIdx = -1
            end = firstNonSlashEnd
          }
        }
      }
    }

    if (start === end) end = firstNonSlashEnd
    else if (end === -1) end = path.length
    return path.slice(start, end)
  }
  for (let i = path.length - 1; i >= start; --i) {
    if (Common.PathUtil.isPathSeparator(path.charCodeAt(i))) {
      // If we reached a path separator that was not part of a set of path
      // separators at the end of the string, stop now
      if (!matchedSlash) {
        start = i + 1
        break
      }
    } else if (end === -1) {
      // We saw the first non-path separator, mark this as the end of our
      // path component
      matchedSlash = false
      end = i + 1
    }
  }

  if (end === -1) return ''
  return path.slice(start, end)
}

export function extname(path: string): string {
  let start = 0
  let startDot = -1
  let startPart = 0
  let end = -1
  let matchedSlash = true
  // Track the state of characters (if any) we see before our first dot and
  // after any path separator we find
  let preDotState = 0

  // Check for a drive letter prefix so as not to mistake the following
  // path separator as an extra separator at the end of the path that can be
  // disregarded

  if (path.length >= 2 && path.charCodeAt(1) === Common.PathUtil.CHAR_COLON && Common.PathUtil.isWindowsDeviceRoot(path.charCodeAt(0))) {
    start = startPart = 2
  }

  for (let i = path.length - 1; i >= start; --i) {
    const code = path.charCodeAt(i)
    if (Common.PathUtil.isPathSeparator(code)) {
      // If we reached a path separator that was not part of a set of path
      // separators at the end of the string, stop now
      if (!matchedSlash) {
        startPart = i + 1
        break
      }
      continue
    }
    if (end === -1) {
      // We saw the first non-path separator, mark this as the end of our
      // extension
      matchedSlash = false
      end = i + 1
    }
    if (code === Common.PathUtil.CHAR_DOT) {
      // If this is our first dot, mark it as the start of our extension
      if (startDot === -1) startDot = i
      else if (preDotState !== 1) preDotState = 1
    } else if (startDot !== -1) {
      // We saw a non-dot and non-path separator before our dot, so we should
      // have a good chance at having a non-empty extension
      preDotState = -1
    }
  }

  if (
    startDot === -1 ||
    end === -1 ||
    // We saw a non-dot character immediately before the dot
    preDotState === 0 ||
    // The (right-most) trimmed path component is exactly '..'
    (preDotState === 1 && startDot === end - 1 && startDot === startPart + 1)
  ) {
    return ''
  }
  return path.slice(startDot, end)
}

export function format(obj: Core.PathObject): string {
  return Common.PathUtil.format(sep, obj)
}

export function parse(path: string): Core.PathObject {
  const ret = { root: '', dir: '', base: '', ext: '', name: '' }
  if (path.length === 0) return ret

  const len = path.length
  let rootEnd = 0
  let code = path.charCodeAt(0)

  if (len === 1) {
    if (Common.PathUtil.isPathSeparator(code)) {
      // `path` contains just a path separator, exit early to avoid
      // unnecessary work
      ret.root = ret.dir = path
      return ret
    }
    ret.base = ret.name = path
    return ret
  }
  // Try to match a root
  if (Common.PathUtil.isPathSeparator(code)) {
    // Possible UNC root

    rootEnd = 1
    if (Common.PathUtil.isPathSeparator(path.charCodeAt(1))) {
      // Matched double path separator at beginning
      let j = 2
      let last = j
      // Match 1 or more non-path separators
      while (j < len && !Common.PathUtil.isPathSeparator(path.charCodeAt(j))) {
        j++
      }
      if (j < len && j !== last) {
        // Matched!
        last = j
        // Match 1 or more path separators
        while (j < len && Common.PathUtil.isPathSeparator(path.charCodeAt(j))) {
          j++
        }
        if (j < len && j !== last) {
          // Matched!
          last = j
          // Match 1 or more non-path separators
          while (j < len && !Common.PathUtil.isPathSeparator(path.charCodeAt(j))) {
            j++
          }
          if (j === len) {
            // We matched a UNC root only
            rootEnd = j
          } else if (j !== last) {
            // We matched a UNC root with leftovers
            rootEnd = j + 1
          }
        }
      }
    }
  } else if (Common.PathUtil.isWindowsDeviceRoot(code) && path.charCodeAt(1) === Common.PathUtil.CHAR_COLON) {
    // Possible device root
    if (len <= 2) {
      // `path` contains just a drive root, exit early to avoid
      // unnecessary work
      ret.root = ret.dir = path
      return ret
    }
    rootEnd = 2
    if (Common.PathUtil.isPathSeparator(path.charCodeAt(2))) {
      if (len === 3) {
        // `path` contains just a drive root, exit early to avoid
        // unnecessary work
        ret.root = ret.dir = path
        return ret
      }
      rootEnd = 3
    }
  }
  if (rootEnd > 0) ret.root = path.slice(0, rootEnd)

  let startDot = -1
  let startPart = rootEnd
  let end = -1
  let matchedSlash = true
  let i = path.length - 1

  // Track the state of characters (if any) we see before our first dot and
  // after any path separator we find
  let preDotState = 0

  // Get non-dir info
  for (; i >= rootEnd; --i) {
    code = path.charCodeAt(i)
    if (Common.PathUtil.isPathSeparator(code)) {
      // If we reached a path separator that was not part of a set of path
      // separators at the end of the string, stop now
      if (!matchedSlash) {
        startPart = i + 1
        break
      }
      continue
    }
    if (end === -1) {
      // We saw the first non-path separator, mark this as the end of our
      // extension
      matchedSlash = false
      end = i + 1
    }
    if (code === Common.PathUtil.CHAR_DOT) {
      // If this is our first dot, mark it as the start of our extension
      if (startDot === -1) startDot = i
      else if (preDotState !== 1) preDotState = 1
    } else if (startDot !== -1) {
      // We saw a non-dot and non-path separator before our dot, so we should
      // have a good chance at having a non-empty extension
      preDotState = -1
    }
  }

  if (end !== -1) {
    if (
      startDot === -1 ||
      // We saw a non-dot character immediately before the dot
      preDotState === 0 ||
      // The (right-most) trimmed path component is exactly '..'
      (preDotState === 1 && startDot === end - 1 && startDot === startPart + 1)
    ) {
      ret.base = ret.name = path.slice(startPart, end)
    } else {
      ret.name = path.slice(startPart, startDot)
      ret.base = path.slice(startPart, end)
      ret.ext = path.slice(startDot, end)
    }
  }

  // If the directory is the root, use the entire root as the `dir` including
  // the trailing slash if any (`C:\abc` -> `C:\`). Otherwise, strip out the
  // trailing slash (`C:\abc\def` -> `C:\abc`).
  if (startPart > 0 && startPart !== rootEnd) ret.dir = path.slice(0, startPart - 1)
  else ret.dir = ret.root

  return ret
}
