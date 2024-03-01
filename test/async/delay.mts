import { Async, Test, Assert } from '@sinclair/carbon'

Test.describe('Async:delay', () => {
  Test.it('Should delay', async () => {
    const start = Date.now()
    await Async.delay(10)
    const delta = Date.now() - start
    Assert.isTrue(delta >= 5) // window of error
  })
})
