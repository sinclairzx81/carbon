import { Type, Rpc, Host, Benchmark, Runtime, Assert } from '@sinclair/carbon'

// ------------------------------------------------------------------
// Contract
// ------------------------------------------------------------------
export const MathContract = Rpc.Contract({
  encoding: 'application/x-msgpack',
  service: {
    add: Type.Function([Type.Number(), Type.Number()], Type.Number()),
    sub: Type.Function([Type.Number(), Type.Number()], Type.Number()),
    mul: Type.Function([Type.Number(), Type.Number()], Type.Number()),
    div: Type.Function([Type.Number(), Type.Number()], Type.Number()),
  },
})
// ------------------------------------------------------------------
// Service
// ------------------------------------------------------------------
export class MathService extends Rpc.Service<typeof MathContract> {
  constructor() {
    super(MathContract)
  }
  add = this.method('add', (identity, a, b) => a + b)
  sub = this.method('sub', (identity, a, b) => a - b)
  mul = this.method('mul', (identity, a, b) => a * b)
  div = this.method('div', (identity, a, b) => a / b)
}
Host.listen(
  { port: 5000 },
  {
    '/math': new MathService(),
  },
)
// ------------------------------------------------------------------
// Client
// ------------------------------------------------------------------
const protocol = Runtime.isBrowser() ? 'webrtc' : 'ws'
const client = new Rpc.Client(MathContract, `${protocol}://localhost:5000/math`)
const result = await Benchmark.runAsync({ concurrency: 1, iterations: 10 }, async (index) => {
  const R1 = await client.call('add', 1, 2)
  const R2 = await client.call('sub', 1, 2)
  const R3 = await client.call('mul', 1, 2)
  const R4 = await client.call('div', 1, 2)
  console.log(R1, R2, R3, R4)
  Assert.isEqual([R1, R2, R3, R4], [3, -1, 2, 0.5])
})

console.log(result)
