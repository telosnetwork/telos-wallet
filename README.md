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
