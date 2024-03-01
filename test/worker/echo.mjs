// ------------------------------------------------------------------
// Runtime: Resolution
// ------------------------------------------------------------------
function isBun() {
  return ('self' in globalThis && 'Bun' in globalThis.self) || 'Bun' in globalThis
}
function isDeno() {
  return ('self' in globalThis && 'Deno' in globalThis.self) || 'Deno' in globalThis
}
function isNode() {
  if (isBun()) return false
  return ('self' in globalThis && 'process' in globalThis.self) || 'process' in globalThis
}
function isBrowser() {
  if (isBun()) return false
  if (isDeno()) return false
  return ('self' in globalThis && 'addEventListener' in globalThis.self) || 'window' in globalThis
}
function resolve() {
  return isBrowser() ? 'browser' : isBun() ? 'bun' : isDeno() ? 'deno' : isNode() ? 'node' : 'unknown'
}
// ------------------------------------------------------------------
// Runtime: Echo
// ------------------------------------------------------------------
async function echoBun() {
  self.onmessage = (message) => self.postMessage(message.data)
}
async function echoDeno() {
  self.onmessage = (message) => self.postMessage(message.data)
}
async function echoNode() {
  const WorkerThreads = await import('node:worker_threads')
  WorkerThreads.parentPort.addListener('message', (event) => WorkerThreads.parentPort.postMessage(event))
}
const runtime = resolve()
if (runtime === 'bun') echoBun()
if (runtime === 'deno') echoDeno()
if (runtime === 'node') echoNode()
