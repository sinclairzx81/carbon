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

import * as Async from '../../async/index.mjs'
import * as Core from '../core/index.mjs'
import { Listener } from './listener.mjs'
import { ServerWebSocket, WebSocket } from './websocket/index.mjs'
import { UpgradeMap } from './upgrade.mjs'

// ------------------------------------------------------------------
// Fetch
// ------------------------------------------------------------------
export function fetch(input: URL | Request | string, init?: RequestInit): Promise<Response> {
  return globalThis.fetch(input, init)
}
// ------------------------------------------------------------------
// Listen
// ------------------------------------------------------------------
export async function listen(options: Core.ListenOptions, callback: Core.ListenCallback): Promise<Core.Listener> {
  const listener = new Listener(options, callback)
  await listener.listening
  return listener
}
// ------------------------------------------------------------------
// Connect
// ------------------------------------------------------------------
export function connect(endpoint: string): Promise<WebSocket> {
  const socket = new WebSocket(endpoint)
  const deferred = new Async.Deferred<WebSocket>()
  socket.on('open', () => deferred.resolve(socket))
  socket.on('error', (error) => deferred.reject(error))
  return deferred.promise()
}
// ------------------------------------------------------------------
// Upgrade
// ------------------------------------------------------------------
export async function upgrade(request: Request, callback: Core.UpgradeCallback): Promise<Response> {
  // Dereference the associated UpgradeData with this Request.
  const upgrade = UpgradeMap.get(request)
  if (upgrade === undefined) return new Response('Unable to dereference associated Server from Request', { status: 500 })
  // Attempt to upgrade
  try {
    upgrade.wsserver.handleUpgrade(upgrade.incomingMessage, upgrade.socket, upgrade.head, (websocket: any) => {
      websocket.binaryType = 'arraybuffer'
      callback(new ServerWebSocket(websocket))
    })
  } catch {}

  return new Response('') // ignored
}
