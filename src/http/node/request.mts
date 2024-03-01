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

import * as Core from '../core/index.mjs'
import * as http from 'node:http'

export namespace IncomingMessageToRequest {
  function mapReadableStream(request: http.IncomingMessage) {
    return new ReadableStream<Uint8Array>({
      start: (controller) => {
        request.on('data', (buffer) => {
          controller.enqueue(new Uint8Array(buffer.buffer))
          request.pause()
        })
        request.on('error', (error) => controller.error(error))
        request.on('end', () => controller.close())
        request.pause()
      },
      pull: () => {
        request.resume()
      },
    })
  }
  function mapUrl(request: http.IncomingMessage, options: Core.ListenOptions) {
    const hostname = options.hostname ?? 'localhost'
    const url = request.url ?? ''
    return new URL(`http://${hostname}:${options.port}${url}`)
  }
  function mapMethod(request: http.IncomingMessage) {
    return (request.method ?? 'GET').toUpperCase()
  }
  function mapBody(request: http.IncomingMessage, method: string) {
    return method === 'GET' || method === 'HEAD' ? null : mapReadableStream(request)
  }
  function mapHeaders(request: http.IncomingMessage): HeadersInit {
    return request.headers as HeadersInit
  }
  export function map(request: http.IncomingMessage, options: Core.ListenOptions): Request {
    const method = mapMethod(request)
    const body = mapBody(request, method)
    const cache = 'default'
    const credentials = 'include'
    const duplex = 'half'
    const headers = mapHeaders(request)
    const url = mapUrl(request, options)
    const init = { headers, method, body, cache, credentials, duplex } as RequestInit
    return new Request(url, init)
  }
}
