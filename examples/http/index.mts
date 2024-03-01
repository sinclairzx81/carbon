import { Http, Runtime, Benchmark } from '@sinclair/carbon'

const listener = Http.listen({ port: 5000 }, () => new Response('hello world'))

const result = await Benchmark.runAsync({ concurrency: 32, iterations: 1000 }, async () => {
  const protocol = Runtime.isBrowser() ? 'webrtc' : 'http'
  await Http.fetch(`${protocol}://localhost:5000`).then((res) => res.text())
})
await listener.dispose()
console.log(result)
