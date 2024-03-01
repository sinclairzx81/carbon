import { Fs, Buffer } from '@sinclair/carbon'

// open directory as file system root
const fs = await Fs.open('filesystem')

// write a file to the root
await fs.write('hello/world.txt', Buffer.encode('hello world'))

// read a file from the root
console.log(Buffer.decode(await fs.read('hello/world.txt')))

// delete the file
await fs.delete('hello/world.txt')

// close the file system
await fs.close()
