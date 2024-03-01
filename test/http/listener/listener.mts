import { Test, Http, Assert, Runtime } from '@sinclair/carbon'

// --------------------------------------------------------------------------
// Fixtures
// --------------------------------------------------------------------------
async function assertedFetch() {
  const result = await Http.fetch(`http://localhost:5000/`).then((res) => res.text())
  Assert.isEqual(result, 'hello')
}
// --------------------------------------------------------------------------
// Test
// --------------------------------------------------------------------------
Test.describe('Http:Listener', () => {
  Test.exclude(() => Runtime.isBrowser())

  Test.it('Should listen then close', async () => {
    const listener = await Http.listen({ port: 5000 }, () => new Response('hello'))
    await listener.dispose()
  })
  Test.it('Should listen then close x 16', async () => {
    for (let i = 0; i < 16; i++) {
      const listener = await Http.listen({ port: 5000 }, () => new Response('hello'))
      await listener.dispose()
    }
  })
  Test.it('Should listen fetch then close', async () => {
    const listener = await Http.listen({ port: 5000 }, () => new Response('hello'))
    await assertedFetch()
    await listener.dispose()
  })
  Test.it('Should listen fetch then close (sequential x 64)', async () => {
    const listener = await Http.listen({ port: 5000 }, () => new Response('hello'))
    for (let i = 0; i < 64; i++) await assertedFetch()
    await listener.dispose()
  })
  // todo
  // Test.it('Should listen fetch then close (parallel x 64)', async () => {
  //   const listener = Http.listen({ port: 5000 }, () => new Response('hello'))
  //   const tasks = Array.from({ length: 64 }).map((_, i) => assertedFetch())
  //   await Promise.all(tasks)
  //   await listener.dispose()
  // })
})
