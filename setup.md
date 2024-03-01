# Carbon Development Setup

Carbon was developed on Ubuntu 22.04.2 LTS running on WSL2, however any Linux distribution should be fine. This projects package.json is configured to run the various example scripts across each runtime which is how new functionality is tested interactively. It is also configured to run unit tests across each runtime. Before running any of these, you will need to install the following.

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