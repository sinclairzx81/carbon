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
import * as Core from '../core/index.mjs'
import { Listener } from './listener.mjs'
import { Socket } from './socket.mjs'

const Net = await Runtime.dynamicImport<typeof import('node:net')>('node:net')

// ------------------------------------------------------------------
// Listen
// ------------------------------------------------------------------
export function listen(options: Core.ListenOptions, callback: Core.ListenCallback): Core.Listener {
  return new Listener(options, callback)
}

// ------------------------------------------------------------------
// Connect
// ------------------------------------------------------------------
export function connect(options: Core.ConnectOptions): Promise<Core.Socket> {
  return new Promise((resolve, reject) => {
    const socket = Net.connect(options.port)
    socket.once('connect', () => resolve(new Socket(socket)))
    socket.once('error', (error) => reject(error))
    socket.once('end', () => reject(new Error('TcpSocket: socket unexpectedly closed')))
  })
}
