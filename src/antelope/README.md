## Antelope library

Antelope is a TypeScript library that streamlines the process of developing blockchain applications for the Antelope Alliance, which includes platforms like EOS, Telos, WAX, UX and their respectives EVMs. The library enables MetaMask-based authentication for EVM blockchains as long as any UAL-compatible wallet for native Antelope blockchains. Utilizing Pinia as a storage solution, Antelope maintains and stores application data, and leverages observables from RxJS to trigger internal events, to which developers can subscribe and respond.

It is essential to note that Antelope is still a work in progress, and its architecture is subject to design changes. This library incorporates the experiences of multiple developers and is built from code fragments currently in use by websites under the Telos Network group. The objective is to aggregate all this code into a singular library and subsequently adapt the websites to implement this new library.


## External dependencies
```typescript
import { App } from 'vue';
import { Authenticator, RpcEndpoint } from "universal-authenticator-library";
import { Subject, BehaviorSubject, filter } from 'rxjs';
import { StoreCallback } from '@quasar/app-webpack';
import { store } from 'quasar/wrappers';
import { createPinia, defineStore } from 'pinia';
import { ethers } from 'ethers';
import { ExternalProvider } from '@ethersproject/providers';
```