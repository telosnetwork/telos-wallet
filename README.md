# Telos web wallet

Running at:

https://wallet.telos.net (mainnet)
https://wallet-dev.telos.net (testnet)

## CI/CD NOTE

Push to `developer` branch always first, this will auto-deploy wallet-dev.telos.net & wallet-stage.telos.net and once changes look good and are reviewed merge into master which will auto-deploy to wallet.telos.net

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

1. Generate private and public keys. (Anchor/https://app.telos.net/accounts/add)
2. Go to: https://app.telos.net/testnet/developers
3. Enter information and create account

### Links

**Mainnet Block Explorer**
https://eosauthority.com/dashboard?network=telos

**testnet Block Explorer**
https://eosauthority.com/dashboard?network=telostest

**Telos Quasar Template**
A template for using Vue+Quasar to build a Telos webapp

https://template.telos.net

**telosnetwork/ui-template**
Telos UI Template in Vue/Quasar. Contribute to telosnetwork/ui-template development by creating an account on GitHub.

https://github.com/telosnetwork/ui-template

**Testnet Faucet**
https://app.telos.net/testnet/developers

**transfer example**
https://template.telos.net/transfer

**Courses**
https://training.eos.io/collections

**APIs**
http://api.telos.net/v1/docs/index.html

https://hyperion.docs.eosrio.io/endpoint/#telos
