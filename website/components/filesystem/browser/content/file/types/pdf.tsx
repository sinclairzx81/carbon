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
import * as State from '../../../state/index.js'
import { Fs } from '@sinclair/carbon'

export interface PdfProperties {
  filesystem: Fs.FileSystem
}
export function Pdf(props: PdfProperties) {
  const { stat } = React.useContext(State.Context)
  const [url, setUrl] = React.useState<string | null>(null)
  React.useEffect(() => {
    load()
    return () => {
      if (url === null) return
      URL.revokeObjectURL(url)
    }
  }, [stat])
  async function load() {
    const blob = new Blob([await props.filesystem.blob(stat.path)], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    setUrl(url)
  }
  return (
    url && (
      <div className="filesystem-browser-content-file pdf">
        <iframe src={url} />
      </div>
    )
  )
}