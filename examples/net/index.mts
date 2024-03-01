import { Net, Buffer, Benchmark } from '@sinclair/carbon'
import { Value } from '@sinclair/typebox/value'

const buffer = Buffer.random(100000)
console.log('sent', Value.Hash(buffer))

Net.listen({ port: 5002 }, (socket) => {
  socket.write(buffer)
  socket.close()
})

Benchmark.runAsync({ concurrency: 32, iterations: 1000 }, async () => {
  const buffers: any[] = []
  for await (const buffer of await Net.connect({ port: 5002 })) {
    buffers.push(buffer)
  }
  console.log('recv', Value.Hash(Buffer.concat(buffers)))
})
