import { Http } from '@sinclair/carbon'

// listen on the given port
const listener = await Http.listen({ port: 5000 }, (request) => {
  return new Response('hello world')
})

// fetch
const message = await Http.fetch(`http://localhost:5000`).then((res) => res.text())

console.log(message)

// dispose of the listener
await listener.dispose()
