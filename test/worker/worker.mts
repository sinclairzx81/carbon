import { Test, Assert, Worker, Process, Runtime, Os, Async } from '@sinclair/carbon'

async function createWorker() {
  const worker = new Worker.Worker('test/worker/echo.mjs')
  await Async.delay(10)
  return worker
}
Test.describe('Worker:Worker', () => {
  Test.exclude(() => Runtime.isNode() && Os.name() === 'darwin')
  Test.exclude(() => Runtime.isBrowser())

  // ----------------------------------------------------------------
  // Lifetime
  // ----------------------------------------------------------------
  Test.it('Should start and terminate worker', async () => {
    const worker = await createWorker()
    worker.terminate()
  })
  Test.it('Should start, send and terminate worker', async () => {
    const worker = await createWorker()
    worker.send('hello')
    worker.terminate()
  })
  // ----------------------------------------------------------------
  // Echo
  // ----------------------------------------------------------------
  Test.it('Should start, send, receive and terminate worker 1', async () => {
    const worker = await createWorker()
    const input = 'hello world'
    let output: any = null
    worker.on('message', (event) => {
      output = event.data
    })
    worker.send(input)
    await Async.delay(100)
    Assert.isEqual(input, output)
  })
  Test.it('Should start, send, receive and terminate worker 2', async () => {
    const worker = await createWorker()
    const input = 1000
    let output: any = null
    worker.on('message', (event) => {
      output = event.data
    })
    worker.send(input)
    await Async.delay(100)
    Assert.isEqual(input, output)
  })
  Test.it('Should start, send, receive and terminate worker 3', async () => {
    const worker = await createWorker()
    const input = { x: 1, y: 2, z: 3 }
    let output: any = null
    worker.on('message', (event) => {
      output = event.data
    })
    worker.send(input)
    await Async.delay(100)
    Assert.isEqual(input, output)
  })
})
