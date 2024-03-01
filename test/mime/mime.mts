import { Test, Assert, Mime } from '@sinclair/carbon'

Test.describe('Mime', () => {
  Test.it('Should return default mime types', () => {
    Assert.isEqual(Mime.lookup('file.png'), 'image/png')
    Assert.isEqual(Mime.lookup('file.mp4'), 'video/mp4')
    Assert.isEqual(Mime.lookup('file.txt'), 'text/plain')
    Assert.isEqual(Mime.lookup('file.json'), 'application/json')
    Assert.isEqual(Mime.lookup('file.xml'), 'application/xml')
  })
  Test.it('Should return application octet-stream for unknown', () => {
    Assert.isEqual(Mime.lookup('file.unknown'), 'application/octet-stream')
  })
  Test.it('Should return registered type', () => {
    Mime.set('.unknown', 'application/unknown')
    Assert.isEqual(Mime.lookup('file.unknown'), 'application/unknown')
  })
})
