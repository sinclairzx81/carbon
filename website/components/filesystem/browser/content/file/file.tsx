/*--------------------------------------------------------------------------

@sinclair/carbon

The MIT License (MIT)

Copyright (c) 2024 Haydn Paterson (sinclair) <haydn.developer@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

---------------------------------------------------------------------------*/

import * as React from 'react'
import * as State from '../../state/index.js'
import * as Types from './types/index.js'
import { Fs, Mime } from '@sinclair/carbon'

function isAudio(mime: string) {
  return ['audio/mpeg'].includes(mime)
}
function isImage(mime: string) {
  return ['image/png', 'image/jpeg'].includes(mime)
}
function isPdf(mime: string) {
  return ['application/pdf'].includes(mime)
}
function isText(mime: string) {
  return ['text/plain', 'text/html', 'application/javascript', 'application/typescript'].includes(mime)
}
function isVideo(mime: string) {
  return ['video/mp4'].includes(mime)
}
export interface FileProperties {
  filesystem: Fs.FileSystem
}
export function File(props: FileProperties) {
  const { stat } = React.useContext(State.Context)
  const mime = Mime.lookup(stat.path)
  console.log(mime)
  if (isAudio(mime)) return <Types.Audio filesystem={props.filesystem} />
  if (isImage(mime)) return <Types.Image filesystem={props.filesystem} />
  if (isPdf(mime)) return <Types.Pdf filesystem={props.filesystem} />
  if (isText(mime)) return <Types.Text filesystem={props.filesystem} />
  if (isVideo(mime)) return <Types.Video filesystem={props.filesystem} />
  return <div className="filesystem-browser-content-file"></div>
}
