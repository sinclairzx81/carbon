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

import * as Events from '../../events/index.mjs'
import * as Core from '../core/index.mjs'

export namespace tty {
  // ------------------------------------------------------------------
  // State
  // ------------------------------------------------------------------
  const events = new Events.Events<{ resize: Core.TtySize }>()
  const current = { columns: 0, rows: 0 }
  const interval = 30
  let polling = false
  // ------------------------------------------------------------------
  // Resize
  // ------------------------------------------------------------------
  function equal(current: Core.TtySize, next: Core.TtySize) {
    return current.columns === next.columns && current.rows === next.rows
  }
  function signal() {
    const next = size()
    if (equal(current, next)) return
    current.columns = next.columns
    current.rows = next.rows
    events.send('resize', { ...current })
  }
  function start() {
    if (polling) return
    polling = true
    const handle = setInterval(() => {
      if (events.count('resize') === 0) {
        clearInterval(handle)
        polling = false
        return
      }
      signal()
    }, interval)
  }
  // ------------------------------------------------------------------
  // Core
  // ------------------------------------------------------------------
  export function supported(): boolean {
    return Deno.isatty(Deno.stdout.rid) && typeof Deno.consoleSize === 'function'
  }
  export function size(): Core.TtySize {
    if (supported()) {
      return Deno.consoleSize()
    } else {
      return { columns: 0, rows: 0 }
    }
  }
  export function on(event: 'resize', handler: Events.EventHandler<Core.TtySize>): Events.EventListener {
    if (event === 'resize') start()
    return events.on(event, handler)
  }
}
