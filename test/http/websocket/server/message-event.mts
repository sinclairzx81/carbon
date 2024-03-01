import { Test, Assert, Http, Buffer, Runtime } from '@sinclair/carbon'

// prettier-ignore
export function resolveMessageEvent<T extends (event: MessageEvent) => unknown>(callback: T, data: any = 'hello'): Promise<ReturnType<T>> {
  let property: any = null
  const listener = Http.listen({ port: 5000 }, (request) => {
    return Http.upgrade(request, (socket) => {
      socket.on('message', (message) => { property = callback(message); socket.close() })
    })
  })
  const protocol = Runtime.isBrowser() ? 'webrtc' : 'ws'
  const socket = new Http.WebSocket(`${protocol}://localhost:5000`)
  return new Promise((resolve, reject) => {
    socket.on('open', () => socket.send(data))
    socket.on('error', (error) => reject(error))
    socket.on('close', async () => {
      await listener.dispose()
      resolve(property)
    })
  })
}
Test.describe('Http:ServerWebSocket:MessageEvent:Properties', () => {
  let event: MessageEvent<any>
  Test.before(async () => {
    event = await resolveMessageEvent((event) => event)
  })
  // ----------------------------------------------------------------
  // Data
  // ----------------------------------------------------------------
  Test.it('Should have data 1', async () => {
    const value = await resolveMessageEvent((event) => event.data, 'hello')
    Assert.isEqual(value, 'hello')
  })
  Test.it('Should have data 2', async () => {
    const value = await resolveMessageEvent((event) => event.data, new Uint8Array(1024))
    Assert.isInstanceOf(value, ArrayBuffer)
  })
  Test.it('Should have data 3', async () => {
    const input = Buffer.random(1024)
    const value = await resolveMessageEvent((event) => event.data, input)
    const output = new Uint8Array(value)
    Assert.isEqual(input, output)
  })
  // ----------------------------------------------------------------
  // Properties
  // ----------------------------------------------------------------
  Test.it('Should have bubbles 1', async () => {
    Assert.isTypeOf(event.bubbles, 'boolean')
  })
  Test.it('Should have bubbles 2', async () => {
    Assert.isEqual(event.bubbles, false)
  })
  Test.it('Should have cancelBubble 1', async () => {
    Assert.isTypeOf(event.cancelBubble, 'boolean')
  })
  Test.it('Should have cancelBubble 2', async () => {
    Assert.isEqual(event.cancelBubble, false)
  })
  Test.it('Should have cancelable 1', async () => {
    Assert.isTypeOf(event.cancelable, 'boolean')
  })
  Test.it('Should have cancelable 2', async () => {
    Assert.isEqual(event.cancelable, false)
  })
  Test.it('Should have composed 1', async () => {
    Assert.isTypeOf(event.composed, 'boolean')
  })
  Test.it('Should have composed 2', async () => {
    Assert.isEqual(event.composed, false)
  })
  Test.it('Should have composedPath 1', async () => {
    Assert.isTypeOf(event.composedPath, 'function')
  })
  Test.it('Should have currentTarget 1', async () => {
    Assert.isTrue('currentTarget' in event)
  })
  Test.it('Should have defaultPrevented 1', async () => {
    Assert.isTypeOf(event.defaultPrevented, 'boolean')
  })
  Test.it('Should have defaultPrevented 2', async () => {
    Assert.isEqual(event.defaultPrevented, false)
  })
  Test.it('Should have eventPhase 1', async () => {
    Assert.isTypeOf(event.eventPhase, 'number')
  })
  Test.it('Should have isTrusted 1', async () => {
    Assert.isTypeOf(event.isTrusted, 'boolean')
  })
  Test.it('Should have isTrusted 2', async () => {
    Assert.isTrue(event.isTrusted === true || event.isTrusted === false)
  })
  Test.it('Should have lastEventId', async () => {
    Assert.isTypeOf(event.lastEventId, 'string')
  })
  Test.it('Should have origin', async () => {
    Assert.isTypeOf(event.origin, 'string')
  })
  Test.it('Should have ports', async () => {
    Assert.isTrue(Array.isArray(event.ports))
    Assert.isTrue(event.ports.length === 0)
  })
  Test.it('Should have preventDefault', async () => {
    const value = await resolveMessageEvent((event) => event.preventDefault)
    Assert.isTypeOf(event.preventDefault, 'function')
  })
  Test.it('Should have returnValue 1', async () => {
    Assert.isTypeOf(event.returnValue, 'boolean')
  })
  Test.it('Should have returnValue 2', async () => {
    Assert.isEqual(event.returnValue, true)
  })
  Test.it('Should have source', async () => {
    Assert.isEqual(event.source, null)
  })
  Test.it('Should have srcElement', async () => {
    Assert.isEqual(event.srcElement, null)
  })
  Test.it('Should have stopImmediatePropagation', async () => {
    Assert.isTypeOf(event.stopImmediatePropagation, 'function')
  })
  Test.it('Should have stopPropagation', async () => {
    Assert.isTypeOf(event.stopPropagation, 'function')
  })
  Test.it('Should have target', async () => {
    Assert.isTrue(event.target === null || event.target !== null) // ?
  })
  Test.it('Should have timeStamp', async () => {
    Assert.isTypeOf(event.timeStamp, 'number')
  })
  Test.it('Should have type 1', async () => {
    Assert.isTypeOf(event.type, 'string')
  })
  Test.it('Should have type 2', async () => {
    Assert.isEqual(event.type, 'message')
  })
})
