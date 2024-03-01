<div align='center'>

<h1>Carbon</h1>

<p>Common Platform Abstraction Layer for Node Deno Bun and Web Browsers</p>

<img src="carbon.png?raw=true" />

<br />
<br />

[![Test](https://github.com/sinclairzx81/carbon/actions/workflows/test.yml/badge.svg)](https://github.com/sinclairzx81/carbon/actions/workflows/test.yml) [![npm version](https://badge.fury.io/js/%40sinclair%2Fcarbon.svg)](https://badge.fury.io/js/%40sinclair%2Fcarbon) [![License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

</div>


## Install

```bash
$ npm install @sinclair/carbon
```

## Usage

Run the same code in Node, Bun, Deno and Web Browser environments.

```typescript
import { Http } from '@sinclair/carbon'

Http.listen({ port: 5000 }, request => new Response('hello http'))

const text = await Http.fetch('http://localhost:5000').then(r => r.text())
```

## Overview

Carbon is a platform abstraction layer built for Node, Deno, Bun and Browser environments. It implements a uniform Web Standard API on top of each platform to expose core network and storage capabilities as well as provides http and file system emulation support for Browsers. Carbon is written to allow web service applications to be developed uniformly across all major JavaScript server environments as well as to provide options to move some server out from centralized clouds and into a decentralized peer to peer Browser network.

Carbon is built to serve as a foundation for developing portable server side applications capable of running across all major JavaScript environments. It is written to express core level functionality provided by each platform in a consistent way, as well as to provide some higher level communication functionality related to IPC and RPC.

License MIT

## Contents

- [Overview](#Overview)
- [Http](#Http)
- [Fs](#Fs)
- [Hub](#Hub)
- [Contribute](#Contribute)


## Http

Carbon implements Web API for both Server and Client side of an Http connection.

### Server

The following creates an Http server that listens on port 5000. The callback must return a valid Response object.

```typescript
import { Http, Runtime } from '@sinclair/carbon'

Http.listen({ port: 5000 }, (request, info) => {

  return new Response(`hello from ${Runtime.name()}`)
})
```

### Fetch

The following issues a fetch Request to the above server. When running the above server in Browser environments, the Http namespace supports the `webrtc://` protocol specifier that will establish the connection over a WebRTC transport.

```typescript
const response = await Http.fetch(`http://localhost:5000`)

const text = await response.text()
```

## Fs

Carbon Fs is a file system device that enables read and write access to some storage medium. Typically this medium will be a directory on disk, but may also be a IndexedDB database when running in Browser environments.

### Open

Carbon Fs requires a file system to be opened prior to use. Once opened, the file system will be treated as a isolated root meaning files can only be written to locations under that root. 

```typescript
import { Fs, Buffer } from '@sinclair/carbon'

// open the 'files' directory as a file system root
const fs = await Fs.open('./files')

// write file
await fs.write('/file.txt', Buffer.encode('hello'))

// read file
const content = Buffer.decode(await fs.read('/file.txt'))
```

### Hub

Carbon supports localhost connections over WebRTC. The term localhost is used to describe connections made within a single browser instance. To support connecting browsers across the public internet, the browser must be connected to a public signalling service, what Carbon refers to as a Hub.

### Service

Carbon provides a built in signalling Hub. This is provided as a Rpc service type and can be hosted on a Rpc Host. This service needs to be accessible to the page, so would typically by run on a public internet host.

```typescript
import { Host, Hub } from '@sinclair/carbon'

Host.listen({ port: 5010 }, { '/hub': new Hub.Service() })
```

### Remote

The following connects to the above Hub running over localhost. When setting the Hub, Carbon will use it as the WebRTC signalling backend. Hubs provide additional information, such as the peers address on the network.

```typescript
import { Http, Hub } from '@sinclair/carbon'

Hub.set(new Hub.Remote('ws://localhost:5010/hub'))

const address = await Hub.get().address()
```

## Contribute

Carbon is open to community contribution. However, please ensure to submit an issue before submitting a PR.