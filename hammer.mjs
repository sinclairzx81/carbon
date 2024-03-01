// --------------------------------------------------------------------------
// Targets
// --------------------------------------------------------------------------
const targets = {
  start: 'target/start',
  test: 'target/test',
  build: 'target/build',
  website: 'target/website',
}
// --------------------------------------------------------------------------
// Shell
// --------------------------------------------------------------------------
const delay_shell = (command = '', ms = 200) => delay(ms).then(() => shell(command))
// --------------------------------------------------------------------------
// Clean
// --------------------------------------------------------------------------
export async function clean() {
  await folder('target').delete()
}
// -------------------------------------------------------------------------------
// Format
// -------------------------------------------------------------------------------
export async function format() {
  await shell('prettier --no-semi --single-quote --print-width 240 --trailing-comma all --write src test examples website hammer.mjs')
}
// -------------------------------------------------------------------------------
// Upgrade
// -------------------------------------------------------------------------------
export async function upgrade() {
  await shell('bun upgrade')
  await shell('deno upgrade')
}
// --------------------------------------------------------------------------
// Build
// --------------------------------------------------------------------------
async function build_and_watch_example(example) {
  await shell(`hammer watch examples/${example}/index.mts --dist ${targets.start} --platform node`)
}
async function build_test() {
  await shell(`hammer build test/index.mts --dist ${targets.test} --platform node`)
}
async function build_package() {
  await folder(targets.build).delete()
  await shell(`tsc -p src/tsconfig.json --declaration --outDir ${targets.build}`)
  await folder(targets.build).add('package.json')
  await folder(targets.build).add('readme.md')
  await folder(targets.build).add('license')
  await shell(`cd ${targets.build} && npm pack`)
}
export async function build() {
  await build_package()
}
// --------------------------------------------------------------------------
// Start
// --------------------------------------------------------------------------
// prettier-ignore
export async function start_website() {
  await Promise.all([
    shell(`hammer serve website/index.html --dist ${targets.website}`), 
    shell(`hammer run examples/hub/index.mts --dist target/hub`)
  ])
}
// prettier-ignore
export async function start_browser(example = 'default') {
  await Promise.all([
    shell(`hammer serve examples/${example}/index.html --dist ${targets.start}`), 
    shell(`hammer run examples/hub/index.mts --dist target/hub`)
  ])
}
export async function start_bun(example = 'default') {
  const watch = build_and_watch_example(example)
  const start = delay_shell(`bun run --watch ./${targets.start}/index.mjs`)
  await Promise.all([watch, start])
}
export async function start_deno(example = 'default') {
  const watch = build_and_watch_example(example)
  const start = delay_shell(`deno run --allow-all --unstable --watch --reload ./${targets.start}/index.mjs`)
  await Promise.all([watch, start])
}
export async function start_node(example = 'default') {
  const watch = build_and_watch_example(example)
  const start = delay_shell(`node --watch ./${targets.start}/index.mjs`)
  await Promise.all([watch, start])
}
export async function start(example = 'default') {
  await start_node(example)
}
// --------------------------------------------------------------------------
// Test
// --------------------------------------------------------------------------
// prettier-ignore
export async function test_browser(filter = '') {
  await build_test(targets)
  const server = require('http').createServer((_, res) => res.end('<html><head></head></html>')).listen(5010)
  await shell(`drift url http://localhost:5010 wait 1000 run ./${targets.test}/index.mjs args ${filter}`)
  server.close()
}
export async function test_bun(filter = '') {
  await build_test(targets)
  await shell(`bun run ./${targets.test}/index.mjs ${filter}`)
}
export async function test_deno(filter = '') {
  await build_test(targets)
  await shell(`deno run --allow-net --allow-read --allow-write --allow-env --reload --no-prompt --quiet --unstable ./${targets.test}/index.mjs ${filter}`)
}
export async function test_node(filter = '') {
  await build_test(targets)
  await shell(`node ./${targets.test}/index.mjs ${filter}`)
}
export async function test(filter = '') {
  await test_browser(filter)
  await test_bun(filter)
  await test_deno(filter)
  await test_node(filter)
}
