import { Test, Assert, Http, Runtime } from '@sinclair/carbon'

export async function getWebSocketProperty<T extends (socket: Http.WebSocket) => unknown>(callback: T): Promise<ReturnType<T>> {
  let property: any = null
  const listener = await Http.listen({ port: 5000 }, (request) => {
    return Http.upgrade(request, (socket) => {
      socket.close()
    })
  })

  const socket = new Http.WebSocket(`ws://localhost:5000`)
  property = callback(socket)
  return new Promise((resolve, reject) => {
    socket.on('error', (error) => reject(error))
    socket.on('close', async () => {
      await listener.dispose()
      resolve(property)
    })
  })
}
Test.describe('Http:WebSocket:Properties', () => {
  Test.exclude(() => Runtime.isBrowser())

  let socket!: Http.WebSocket
  Test.before(async () => {
    socket = await getWebSocketProperty((socket) => socket)
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
  Test.it('Should have send', async () => {
    Assert.isTypeOf(socket.send, 'function')
  })
})
