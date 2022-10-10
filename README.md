# Telos web wallet

Running at:

https://wallet.telos.net [![Netlify Status](https://api.netlify.com/api/v1/badges/94bdf507-97aa-4569-8ce0-dd9313048e14/deploy-status)](https://app.netlify.com/sites/wallet-mainnet/deploys)

https://wallet-dev.telos.net [![Netlify Status](https://api.netlify.com/api/v1/badges/626e6746-848f-4b60-ba52-134e8f71fa39/deploy-status)](https://app.netlify.com/sites/wallet-testnet/deploys)

## CI/CD NOTE

Push to `develop` branch always first, this will auto-deploy wallet-dev.telos.net & wallet-stage.telos.net and once changes look good and are reviewed merge into master which will auto-deploy to wallet.telos.net

## Install the dependencies

```bash
yarn
```

### Start the app in development mode (hot-code reloading, error reporting, etc.)

```bash
quasar dev
```

### Lint the files

```bash
yarn run lint
```

### Build the app for production

```bash
quasar build
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

