import { Encoding, Assert, Test } from '@sinclair/carbon'

Test.describe('Encoding:MsgPack', () => {
  const encoding = new Encoding.MsgPackEncoding()
  Test.it('Should encode and decode string', () => {
    const value = 'hello'
    const encoded = encoding.encode(value)
    const decoded = encoding.decode(encoded)
    Assert.isEqual(value, decoded)
  })
  Test.it('Should encode and decode number', () => {
    const value = 1234
    const encoded = encoding.encode(value)
    const decoded = encoding.decode(encoded)
    Assert.isEqual(value, decoded)
  })
  Test.it('Should encode and decode boolean 1', () => {
    const value = true
    const encoded = encoding.encode(value)
    const decoded = encoding.decode(encoded)
    Assert.isEqual(value, decoded)
  })
  Test.it('Should encode and decode boolean 2', () => {
    const value = false
    const encoded = encoding.encode(value)
    const decoded = encoding.decode(encoded)
    Assert.isEqual(value, decoded)
  })
  Test.it('Should encode and decode null', () => {
    const value = null
    const encoded = encoding.encode(value)
    const decoded = encoding.decode(encoded)
    Assert.isEqual(value, decoded)
  })
  // Test.it('Should encode and decode undefined', () => {
  //   const value = undefined
  //   const encoded = encoding.encode(value)
  //   const decoded = encoding.decode(encoded)
  //   Assert.isEqual(value, decoded)
  // })
  Test.it('Should encode and decode array', () => {
    const value = [1, 2, 3, 'hello', 'world', true]
    const encoded = encoding.encode(value)
    const decoded = encoding.decode(encoded)
    Assert.isEqual(value, decoded)
  })
  Test.it('Should encode and decode object', () => {
    const value = { x: 1, y: 'hello', z: true }
    const encoded = encoding.encode(value)
    const decoded = encoding.decode(encoded)
    Assert.isEqual(value, decoded)
  })
  Test.it('Should encode and decode Uint8Array', () => {
    const value = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8])
    const encoded = encoding.encode(value)
    const decoded = encoding.decode(encoded)
    Assert.isEqual(value, decoded)
  })
  Test.it('Should encode and decode Date', () => {
    const value = new Date(12345)
    const encoded = encoding.encode(value)
    const decoded = encoding.decode(encoded)
    Assert.isEqual(value, decoded)
  })
})
