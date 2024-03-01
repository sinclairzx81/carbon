import { Assert, Test } from '@sinclair/carbon'

// ------------------------------------------------------------------
// Fixtures
// ------------------------------------------------------------------
async function selectResponseProperty<T extends (response: Response) => unknown>(callback: T): Promise<ReturnType<T>> {
  return callback(new Response('12345', { status: 201, statusText: 'FooBar' })) as any
}
// ------------------------------------------------------------------
// Test
// ------------------------------------------------------------------
Test.describe('Http:Response:Properties', () => {
  // ----------------------------------------------------------------
  // arrayBuffer
  // ----------------------------------------------------------------
  Test.it('Should have property arrayBuffer', async () => {
    const value = await selectResponseProperty((response) => response.arrayBuffer)
    Assert.isTypeOf(value, 'function')
  })
  // ----------------------------------------------------------------
  // blob
  // ----------------------------------------------------------------
  Test.it('Should have property blob', async () => {
    const value = await selectResponseProperty((response) => response.blob)
    Assert.isTypeOf(value, 'function')
  })
  // ----------------------------------------------------------------
  // body
  // ----------------------------------------------------------------
  Test.it('Should have property body', async () => {
    const value = await selectResponseProperty((response) => response.body)
    Assert.isInstanceOf(value, ReadableStream)
  })
  // ----------------------------------------------------------------
  // bodyUsed
  // ----------------------------------------------------------------
  Test.it('Should have property bodyUsed', async () => {
    const value = await selectResponseProperty((response) => response.bodyUsed)
    Assert.isEqual(value, false)
  })
  // ----------------------------------------------------------------
  // clone
  // ----------------------------------------------------------------
  Test.it('Should have property clone', async () => {
    const value = await selectResponseProperty((response) => response.clone)
    Assert.isTypeOf(value, 'function')
  })
  // ----------------------------------------------------------------
  // formData
  // ----------------------------------------------------------------
  Test.it('Should have property formData', async () => {
    const value = await selectResponseProperty((response) => response.formData)
    Assert.isTypeOf(value, 'function')
  })
  // ----------------------------------------------------------------
  // headers
  // ----------------------------------------------------------------
  Test.it('Should have property headers', async () => {
    const value = await selectResponseProperty((response) => response.headers)
    Assert.isInstanceOf(value, Headers)
  })
  // ----------------------------------------------------------------
  // json
  // ----------------------------------------------------------------
  Test.it('Should have property json 1', async () => {
    const value = await selectResponseProperty((response) => response.json)
    Assert.isTypeOf(value, 'function')
  })
  Test.it('Should have property json 2', async () => {
    const value = await selectResponseProperty((response) => response.json())
    Assert.isEqual(value, 12345)
  })
  // ----------------------------------------------------------------
  // ok
  // ----------------------------------------------------------------
  Test.it('Should have property ok 1', async () => {
    const value = await selectResponseProperty((response) => response.ok)
    Assert.isTypeOf(value, 'boolean')
  })
  Test.it('Should have property ok 2', async () => {
    const value = await selectResponseProperty((response) => response.ok)
    Assert.isEqual(value, true)
  })
  // ----------------------------------------------------------------
  // redirected
  // ----------------------------------------------------------------
  Test.it('Should have property redirected', async () => {
    const value = await selectResponseProperty((response) => response.redirected)
    Assert.isTypeOf(value, 'boolean')
  })
  // ----------------------------------------------------------------
  // status
  // ----------------------------------------------------------------
  Test.it('Should have property status 1', async () => {
    const value = await selectResponseProperty((response) => response.status)
    Assert.isTypeOf(value, 'number')
  })
  Test.it('Should have property status 2', async () => {
    const value = await selectResponseProperty((response) => response.status)
    Assert.isEqual(value, 201)
  })
  // ----------------------------------------------------------------
  // statusText
  // ----------------------------------------------------------------
  Test.it('Should have property statusText 1', async () => {
    const value = await selectResponseProperty((response) => response.statusText)
    Assert.isTypeOf(value, 'string')
  })
  Test.it('Should have property statusText 2', async () => {
    const value = await selectResponseProperty((response) => response.statusText)
    Assert.isEqual(value, 'FooBar')
  })
  // ----------------------------------------------------------------
  // text
  // ----------------------------------------------------------------
  Test.it('Should have property text 1', async () => {
    const value = await selectResponseProperty((response) => response.text)
    Assert.isTypeOf(value, 'function')
  })
  Test.it('Should have property text 2', async () => {
    const value = await selectResponseProperty((response) => response.text())
    Assert.isEqual(value, '12345')
  })
  // ----------------------------------------------------------------
  // type
  // ----------------------------------------------------------------
  Test.it('Should have property type', async () => {
    const value = await selectResponseProperty((response) => response.type)
    Assert.isTypeOf(value, 'string')
  })
  // ----------------------------------------------------------------
  // url
  // ----------------------------------------------------------------
  Test.it('Should have property url', async () => {
    const value = await selectResponseProperty((response) => response.url)
    Assert.isTypeOf(value, 'string')
  })
})
