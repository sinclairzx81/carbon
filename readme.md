<div align='center'>

<h1>Carbon</h1>

<p>Compatibility Layer for Node Deno and Bun</p>

<img src="https://github.com/sinclairzx81/carbon/blob/main/carbon.png?raw=true" />

<br />
<br />

[![Test](https://github.com/sinclairzx81/carbon/actions/workflows/test.yml/badge.svg)](https://github.com/sinclairzx81/carbon/actions/workflows/test.yml) [![npm version](https://badge.fury.io/js/%40sinclair%2Fcarbon.svg)](https://badge.fury.io/js/%40sinclair%2Fcarbon) [![License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

</div>


## Install

```bash
$ npm install @sinclair/carbon
```

## Overview

Carbon is a cross platform compatibility layer for Node, Deno and Bun. It is written as a set of foundational API's that provide a uniform way to drive core level functionality provided by modern JavaScript runtimes.

License MIT

## Imports

Carbon uses a top level import scheme to bring in API's. The following imports a few of them.

```typescript
import { Http, Fs, Runtime, Async, Channel } from '@sinclair/carbon'
```
Individual API functions can be imported via submodule path.

```typescript
import { listen, fetch } from '@sinclair/carbon/http'
```

## Features

Carbon provides several API's that provide a uniform way to interface with core functionality provided by each runtime. It is built exclusively for ESM and uses platform detection + dynamic ESM imports to load specialized implementations for each runtime. For performance, Carbon targets the core standard interfaces specific to each runtime as these are expected to be the most optimized. Carbon internally avoids using Node compatibility interfaces where ever possible.

Carbon offers the following API's



| Feature         | Info                                    | Node   | Deno   | Bun   | Browser |
| ---             | ---                                     | ---    | ---    | ---   | ---     |
| Ansi            | Ansi Terminal Codes                     | Yes    | Yes    | Yes   | Yes     |
| Assert          | Value Assertions                        | Yes    | Yes    | Yes   | Yes     |
| Async           | Async Utils                             | Yes    | Yes    | Yes   | Yes     |
| Benchmark       | Performance Measurements                | Yes    | Yes    | Yes   | Yes     |
| Buffer          | Operations on Uint8Array Buffers        | Yes    | Yes    | Yes   | Yes     |
| Channel         | Multi Sender Single Receiver Channels   | Yes    | Yes    | Yes   | Yes     |
| Crypto          | Web Crypto API                          | Yes    | Yes    | Yes   | Yes     |
| Dns             | Dns Lookup                              | Yes    | Yes    | Yes   | No      |
| Encoding        | Json and Binary Buffer Encoding         | Yes    | Yes    | Yes   | Yes     |
| Events          | Event Emitters                          | Yes    | Yes    | Yes   | Yes     |
| Fs              | Isolated File System                    | Yes    | Yes    | Yes   | Yes     |
| Http            | Http and WebSockets                     | Yes    | Yes    | Yes   | Partial |
| Mime            | Mime Types                              | Yes    | Yes    | Yes   | Yes     |
| Net             | Tcp Listeners and Sockets               | Yes    | Yes    | Yes   | No      |
| Os              | Operating System Resolver               | Yes    | Yes    | Yes   | Yes     |
| Path            | Pathing Utils (Windows and Posix)       | Yes    | Yes    | Yes   | Yes     |
| Performance     | Web Performance API                     | Yes    | Yes    | Yes   | Yes     |
| Process         | Standard IO and TTY                     | Yes    | Yes    | Yes   | Partial |
| Qs              | Query String Parsing                    | Yes    | Yes    | Yes   | Yes     |
| Runtime         | JavaScript Runtime Resolver             | Yes    | Yes    | Yes   | Yes     |
| Stream          | Stream Interfaces                       | Yes    | Yes    | Yes   | Yes     |
| Test            | Unit Testing                            | Yes    | Yes    | Yes   | Yes     |
| Type            | Type System (TypeBox)                   | Yes    | Yes    | Yes   | Yes     |
| Url             | Url Parsing                             | Yes    | Yes    | Yes   | Yes     |
| Value           | Value Operations (TypeBox)              | Yes    | Yes    | Yes   | Yes     |
| Worker          | Web Workers                             | Yes    | Yes    | Yes   | Yes     |

## Http Server

The following starts an Http listener

```typescript
import { Http } from '@sinclair/carbon'

const listener = await Http.listen({ port: 5000 }, request => {

  return new Response('hello world')
})
```

## WebSocket Server

The following upgrades an Http request into a WebSocket

```typescript
import { Http } from '@sinclair/carbon'

const listener = await Http.listen({ port: 5000 }, request => {

  return Http.upgrade(request, socket => {

    socket.send('hello world')
  })
})
```