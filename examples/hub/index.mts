import { Host, Hub } from '@sinclair/carbon'

export class ApplicationHubService extends Hub.Service {
  public configuration(): RTCConfiguration {
    return { iceServers: [] }
  }
  authorize(claims: Record<string, string>) {
    return claims.address
  }
}
Host.listen({ port: 5010 }, { '/hub': new ApplicationHubService() })
