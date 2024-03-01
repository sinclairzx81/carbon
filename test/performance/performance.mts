import { Performance, Test, Assert } from '@sinclair/carbon'

Test.describe('Performance:now', () => {
  Test.it('Should return a number', () => {
    const result = Performance.now()
    Assert.isTypeOf(result, 'number')
  })
})
