import { Crypto, Assert, Test } from '@sinclair/carbon'

Test.describe('Crypto', () => {
  Test.it('Should generate randomUUID', () => {
    const uuid = Crypto.randomUUID()
    Assert.isTypeOf(uuid, 'string')
  })
})
