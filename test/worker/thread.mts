import { Test, Assert, Worker } from '@sinclair/carbon'

Test.describe('Worker:Thread', () => {
  Test.it('Should return true for isMainThread', () => {
    Assert.isTrue(Worker.isMainThread)
  })
  Test.it('Should return workerData', () => {
    Assert.isTypeOf(Worker.workerData, 'object')
    Assert.isFalse(Worker.workerData === null)
  })
})
