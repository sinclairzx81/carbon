import { Test, Assert, Os } from '@sinclair/carbon'

Test.describe('Os:resolve', () => {
  Test.it('Should return operating system string', async () => {
    const result = Os.type()
    Assert.isTrue(result === 'win32' || result === 'darwin' || result === 'linux')
  })
})
