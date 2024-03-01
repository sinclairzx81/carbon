import { Fs, Buffer } from '@sinclair/carbon'

const fs = await Fs.open('files')

await fs.write('hello.txt', Buffer.encode('hello world'))
const blob = await fs.blob('hello.txt')

const url = await URL.createObjectURL(blob)

const text = await fetch(url).then((res) => res.text())
console.log('result', text)
