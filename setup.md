# Carbon

Unified Network and Microservice Framework For JavaScript

## Setup

Carbon was primarily developed on Ubuntu 22.04.2 LTS running on WSL2, although any Linux distribution should be fine. Carbon is configured for various npm tasks can execute example code across each platform. It also has testing infrastructure to test each platform locally. Before running any of these, you will need to install each platforms.

## Chrome

The following installs Chrome

```bash
$ sudo apt-get install libxss1 libappindicator1 libindicator7
$ wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
$ sudo apt install ./google-chrome*.deb -y
```

## Node          

The following installs Node

```bash
$ curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
$ nvm install --lts

```
## Bun

The following installs Bun

```bash
$ curl -fsSL https://bun.sh/install | bash
```

## Deno

The following installs Deno

```bash
curl -fsSL https://deno.land/x/install/install.sh | sh
```