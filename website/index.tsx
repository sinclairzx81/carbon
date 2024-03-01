import * as React from 'react'
import * as ReactDom from 'react-dom/client'
import * as Components from './components/index.js'

import { Fs, Buffer } from '@sinclair/carbon'

// await Fs.remove('default')
const fs = await Fs.open('default')
await fs.write('folder1/file1', Buffer.encode('data'))
await fs.write('folder1/file2', Buffer.encode('data'))
await fs.write('folder1/file3', Buffer.encode('data'))
await fs.write('folder1/file4', Buffer.encode('data'))
await fs.write('folder2/file1', Buffer.encode('data'))
await fs.write('folder2/file2', Buffer.encode('data'))
await fs.write('folder2/file3', Buffer.encode('data'))
await fs.write('folder2/file4', Buffer.encode('data'))
await fs.write('file1', Buffer.encode('data'))
await fs.write('file2', Buffer.encode('data'))
await fs.write('file3', Buffer.encode('data'))
await fs.write('file4', Buffer.encode('data'))

const root = ReactDom.createRoot(document.getElementById('container')!)

root.render(<Components.FileSystem.Browser filesystem={fs} />)
