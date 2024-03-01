import { Http, Assert, Test, Runtime } from '@sinclair/carbon'

// ------------------------------------------------------------------
// Fixtures
// ------------------------------------------------------------------
const nextMessage = (function () {
  let ordinal = 0
  return () => `response:${ordinal++}`
})()
async function selectRequestProperty<T extends (info: Http.RequestInfo) => unknown>(callback: T): Promise<ReturnType<T>> {
  let property: any = null
  let message = nextMessage()
  const listener = await Http.listen({ port: 5000 }, async (request, info) => {
    property = await callback(info)
    return new Response(message)
  })
  const response = await Http.fetch(`http://localhost:5000`)
  const text = await response.text()
  await listener.dispose()
  Assert.isEqual(text, message)
  return property
}
// ------------------------------------------------------------------
// Test
// ------------------------------------------------------------------
Test.describe('Http:Request:RequestInfo', () => {
  Test.exclude(() => Runtime.isBrowser())

  // ----------------------------------------------------------------
  // local.address
  // ----------------------------------------------------------------
  Test.it('Should have local address', async () => {
    const value = await selectRequestProperty((request) => request.local.address)
    Assert.isTypeOf(value, 'string')
  })
  // ----------------------------------------------------------------
  // local.address
  // ----------------------------------------------------------------
  Test.it('Should have local port', async () => {
    const value = await selectRequestProperty((request) => request.local.port)
    Assert.isTypeOf(value, 'number')
  })
  // ----------------------------------------------------------------
  // remote.address
  // ----------------------------------------------------------------
  Test.it('Should have remote address', async () => {
    const value = await selectRequestProperty((request) => request.remote.address)
    Assert.isTypeOf(value, 'string')
  })
  // ----------------------------------------------------------------
  // remote.port
  // ----------------------------------------------------------------
  Test.it('Should have remote port', async () => {
    const value = await selectRequestProperty((request) => request.remote.port)
    Assert.isTypeOf(value, 'number')
  })
})
