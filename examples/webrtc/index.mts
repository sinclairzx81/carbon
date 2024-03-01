declare const document: any

import { Http, Hub } from '@sinclair/carbon'

Hub.set(new Hub.Local())

console.log('Application Started', await Hub.get().address())

const ui = {
  connect: {
    text: document.getElementById('connect-text'),
    button: document.getElementById('connect-button'),
  },
  fetch: {
    text: document.getElementById('fetch-text'),
    button: document.getElementById('fetch-button'),
  },
}
ui.connect.button.onclick = async () => {
  console.log(ui.connect.text.value)

  Hub.set(
    new Hub.Remote('ws://localhost:5010/hub', {
      address: ui.connect.text.value,
    }),
  )
  console.log('Set with Local')
}
ui.fetch.button.onclick = async () => {
  const response = await Http.fetch(`webrtc://${ui.fetch.text.value}:5000`)
  const text = await response.text()
  console.log('fetched:', text)
}
Http.listen({ port: 5000 }, (request) => {
  console.log('have request')
  return new Response(`Hello from ${ui.connect.text.value}`)
})
