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

import { Stopwatch } from './stopwatch.mjs'

export type BenchmarkAsyncFunction = (index: number) => Promise<any>

export interface BenchmarkAsyncOptions {
  concurrency: number
  iterations: number
}
export interface BenchmarkAsyncResult {
  iterations: number
  concurrency: number
  elapsed: number
}
/** Runs an asynchronous function for the configured iterations and concurrency values and returns the elapsed result */
export function runAsync(options: BenchmarkAsyncOptions, callback: BenchmarkAsyncFunction) {
  let index = 0
  return new Promise<BenchmarkAsyncResult>((resolve, reject) => {
    let [thrown, running, complete, stopwatch] = [false, 0, 0, new Stopwatch()]
    function execute() {
      running += 1
      callback(index++)
        .then(() => {
          running -= 1
          complete += 1
          return !thrown && complete + running < options.iterations
            ? execute()
            : resolve({
                iterations: options.iterations,
                concurrency: options.concurrency,
                elapsed: stopwatch.elapsed(),
              })
        })
        .catch((error) => {
          reject(error)
          thrown = true
        })
    }
    // run up to concurrency limit
    for (let _ = 0; _ < options.iterations; _++) {
      if (running < options.concurrency) execute()
      else break
    }
  })
}
