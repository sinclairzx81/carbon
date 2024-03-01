import { Http, Fs, Buffer } from '@sinclair/carbon'

const fs = await Fs.open('filesystem1')
fs.write('hello', Buffer.encode('Hello'))

const socket = new Http.WebSocket('ws://localhost:5001')
socket.on('open', () => console.log('open'))
socket.on('error', () => console.log('error'))
