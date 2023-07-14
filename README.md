# Telos Web Wallet

Main Net: [wallet.telos.net](https://wallet.telos.net) [![Netlify Status](https://api.netlify.com/api/v1/badges/94bdf507-97aa-4569-8ce0-dd9313048e14/deploy-status)](https://app.netlify.com/sites/wallet-mainnet/deploys)

Test Net: [wallet-dev.telos.net](https://wallet-dev.telos.net) [![Netlify Status](https://api.netlify.com/api/v1/badges/626e6746-848f-4b60-ba52-134e8f71fa39/deploy-status)](https://app.netlify.com/sites/wallet-testnet/deploys)

Development : [wallet-staging.netlify.app](https://wallet-staging.netlify.app/) [![Netlify Status](https://api.netlify.com/api/v1/badges/b568365c-3e5e-4ebf-8c9b-5bc64c15de6e/deploy-status)](https://app.netlify.com/sites/wallet-staging/deploys)

[![GitHub release (latest by date)](https://img.shields.io/github/v/release/telosnetwork/telos-wallet?url=https://github.com/telosnetwork/telos-wallet/releases/latest&style=for-the-badge)](https://github.com/telosnetwork/telos-wallet/releases/latest)

![License](https://img.shields.io/github/license/telosnetwork/telos-wallet?style=for-the-badge)

## Native Features
- Account Creation
- Tokens, Balances, NFTs
- Transfer TLOS to and from EVM
- Profile Management (avatar, name, status, bio)
- Staking/Unstaking REX
- Buy Resources (CPU/NET/RAM)
- dApp List

## Recent Contributions

![Alt](https://repobeats.axiom.co/api/embed/5f8947a293178e9e8998c1327f9d71f9bc6a123c.svg "Repobeats analytics image")

## Installation

### Install yarn package manager
Follow the installation instructions at [classic.yarnpkg.com](https://classic.yarnpkg.com/en/)

### Add Vue and Quasar packages
```bash
yarn global add @vue/cli
yarn global add @quasar/cli
```

### Note regarding Node version from [quasar docs](https://quasar.dev/quasar-cli/installation)

Do not use uneven versions of Node i.e. 13, 15, etc. These versions are not tested with Quasar and often cause issues due to their experimental nature. We highly recommend always using the LTS version of Node.

It is recommended to use Node version 16 if you experience issues running the application with other versions.

Using nvm: `nvm use 16`

### Clone repo
```bash
git clone https://github.com/telosnetwork/telos-wallet
```

### Install the dependencies
```bash
cd telos-wallet && yarn
```

### Restore .env file
```bash
cp .env.example .env
```
### Start the app in development mode (hot-code reloading, error reporting, etc.)

```bash
yarn dev
```

### Lint the files

```bash
yarn lint
```
### Run tests

```bash
yarn test
```

### Build the app for production
```bash
yarn build
cd dist/spa
quasar serve
```

### Customize the configuration

See [Configuring quasar.conf.js](https://quasar.dev/quasar-cli/quasar-conf-js).

## Docs and Relevant Links

### Creating testnet account

1. Generate private and public keys in [Anchor](https://greymass.com/en/anchor/) or at [app.telos.net/accounts/add](https://app.telos.net/accounts/add)
2. Go to [app.telos.net/testnet/developers](https://app.telos.net/testnet/developers)
3. Enter information and create account, optionally seed account from test net faucet

### Links

**Main Net Block Explorer**

[explorer.telos.net](https://explorer.telos.net)

**Test Net Block Explorer**

[explorer-test.telos.net](https://explorer-test.telos.net)


**Documentation**

[docs.telos.net](https://docs.telos.net/)

