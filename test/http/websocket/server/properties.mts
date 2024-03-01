import { Test, Assert, Http, Runtime } from '@sinclair/carbon'

export function resolveSocket<T extends (socket: Http.ServerWebSocket) => unknown>(callback: T): Promise<ReturnType<T>> {
  let property: any = null
  const listener = Http.listen({ port: 5000 }, (request) => {
    return Http.upgrade(request, (socket) => {
      property = callback(socket)
      socket.close()
    })
  })
  const protocol = Runtime.isBrowser() ? 'webrtc' : 'ws'
  const socket = new Http.WebSocket(`${protocol}://localhost:5000`)
  return new Promise((resolve, reject) => {
    socket.on('error', (error) => reject(error))
    socket.on('close', async () => {
      await listener.dispose()
      resolve(property)
    })
  })
}
Test.describe('Http:ServerWebSocket:Properties', () => {
  let socket: Http.ServerWebSocket
  Test.before(async () => {
    socket = await resolveSocket((socket) => socket)
  })
  Test.it('Should have binaryType 1', async () => {
    Assert.isTypeOf(socket.binaryType, 'string')
  })
  Test.it('Should have binaryType 2', async () => {
    Assert.isEqual(socket.binaryType, 'arraybuffer')
  })
  Test.it('Should have close', async () => {
    Assert.isTypeOf(socket.close, 'function')
  })
  Test.it('Should have on', async () => {
    Assert.isTypeOf(socket.on, 'function')
  })
  Test.it('Should have ping', async () => {
    Assert.isTypeOf(socket.ping, 'function')
  })
  Test.it('Should have pong', async () => {
    Assert.isTypeOf(socket.pong, 'function')
  })
  Test.it('Should have send', async () => {
    Assert.isTypeOf(socket.send, 'function')
  })
})
