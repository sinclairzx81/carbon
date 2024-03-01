import { Runtime, Dns, Assert, Test } from '@sinclair/carbon'

Test.describe('Dns', () => {
  Test.exclude(() => Runtime.isBrowser())

  Test.it('Should lookup all google.com', async () => {
    const results = await Dns.lookup('google.com')
    Assert.isTrue(results.some((value) => value.family === 'IPv4'))
    Assert.isTrue(results.some((value) => value.family === 'IPv6'))
  })
  Test.it('Should lookup IPv4 google.com', async () => {
    const results = await Dns.lookup('google.com', { family: 'IPv4' })
    Assert.isTrue(results.some((value) => value.family === 'IPv4'))
    Assert.isFalse(results.some((value) => value.family === 'IPv6'))
  })
  Test.it('Should lookup IPv6 google.com', async () => {
    const results = await Dns.lookup('google.com', { family: 'IPv6' })
    Assert.isFalse(results.some((value) => value.family === 'IPv4'))
    Assert.isTrue(results.some((value) => value.family === 'IPv6'))
  })
})
