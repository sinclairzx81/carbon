import { Test, Process, Runtime } from '@sinclair/carbon'
import './async/index.mjs'
import './buffer/index.mjs'
import './channel/index.mjs'
import './crypto/index.mjs'
import './encoding/index.mjs'
import './events/index.mjs'
import './fs/index.mjs'
import './http/index.mjs'
import './mime/index.mjs'
import './net/index.mjs'
import './os/index.mjs'
import './performance/index.mjs'
import './worker/index.mjs'

// ------------------------------------------------------------------
// Run
// ------------------------------------------------------------------
declare const Drift: any
function filter() {
  return Runtime.isBrowser() ? Drift.args[0] : Process.args[0]
}
function terminate(code: number) {
  return Runtime.isBrowser() ? Drift.close(code) : Process.exit(code)
}
Test.run({ filter: filter() }).then((result) => {
  return result.success ? terminate(0) : terminate(1)
})
