import { Buffer, Net } from '@sinclair/carbon'

// start listener on port 5002
const listener = await Net.listen({ port: 5002 }, (socket) => {
  socket.write(Buffer.encode('hello 1\n'))
  socket.write(Buffer.encode('hello 2\n'))
  socket.write(Buffer.encode('hello 3\n'))
  socket.close()
})

// connect to listener and receive data.
const socket = await Net.connect({ port: 5002 })
for await (const buffer of socket) {
  console.log(Buffer.decode(buffer))
}
console.log('done')

await listener.dispose()
