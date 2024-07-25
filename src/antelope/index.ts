/* eslint-disable @typescript-eslint/no-explicit-any */
import { App, toRaw } from 'vue';
import { BehaviorSubject, Subject } from 'rxjs';
import { Store } from 'pinia';

import { AntelopeConfig, AntelopeDebug } from 'src/antelope/config';
import installPinia from 'src/antelope/stores';

import { ChainModel } from 'src/antelope/stores/chain';

import { AntelopeWallets } from 'src/antelope/wallets';
import { AccountModel } from 'src/antelope/stores/account';

import { useFeedbackStore } from 'src/antelope/stores/feedback';
import { usePlatformStore } from 'src/antelope/stores/platform';
import { useProfileStore } from 'src/antelope/stores/profile';
import { useResourcesStore } from 'src/antelope/stores/resources';
import { useUserStore } from 'src/antelope/stores/user';
import { useChainStore } from 'src/antelope/stores/chain';
import { useContractStore } from 'src/antelope/stores/contract';
import { useEVMStore } from 'src/antelope/stores/evm';
import { useTokensStore } from 'src/antelope/stores/tokens';
import { useNftsStore } from 'src/antelope/stores/nfts';
import { useAccountStore } from 'src/antelope/stores/account';
import { useAllowancesStore } from 'src/antelope/stores/allowances';
import { useBalancesStore } from 'src/antelope/stores/balances';
import { useHistoryStore } from 'src/antelope/stores/history';
import { useRexStore } from 'src/antelope/stores/rex';

// provide typings for `this.$store`
declare module '@vue/runtime-core' {
    interface ComponentCustomProperties {
        $store: Store;
    }
}

const events = {
    onClear: new Subject<{label:string}>(),
    onLoggedIn: new Subject<AccountModel>(),
    onLoggedOut: new Subject<void>(),
    onNetworkChanged: new Subject<{label:string, chain:ChainModel}>(),
    onAccountChanged: new BehaviorSubject<{label:string, account:AccountModel|null}>({ label: '', account: null }),
    onChainIndexerReady: new BehaviorSubject<{label:string, ready:boolean}>({ label: '', ready: false }),
    onErrorMessage: new Subject<{name: string, message:string}>(),
};
export const getEvents = () => events;

export class Antelope {
    constructor(
        public config: AntelopeConfig,
        public wallets: AntelopeWallets,
    ) {
        //
    }

    init(app: App) {
        if (this.config.app) {
            throw new Error('Antelope has already been initialized.');
        }
        // do not access pinia stores before this line
        installPinia(app);

        // inintialize config and wallets
        this.config.init(app);
        this.wallets.init();

        // each time the user changes the network,
        // we need to reset the current web3 provider instance
        events.onNetworkChanged.subscribe(() => {
            this.wallets.resetWeb3Provider();
        });


        // call for the first time useXStore for all X stores in Antelope library
        const stores = this.stores;

        // call init to all stores
        Object.keys(stores).forEach((key) => {
            const store = (stores as unknown as {[k:string]:{init?:()=>void}})[key];
            if (store.init) {
                store.init();
            }
        });

        // Initializing store
        stores.user.loadUsers();
    }

    get stores() {
        return {
            account: useAccountStore(),
            allowances: useAllowancesStore(),
            balances: useBalancesStore(),
            chain: useChainStore(),
            contract: useContractStore(),
            evm: useEVMStore(),
            feedback: useFeedbackStore(),
            history: useHistoryStore(),
            nfts: useNftsStore(),
            platform: usePlatformStore(),
            profile: useProfileStore(),
            resources: useResourcesStore(),
            rex: useRexStore(),
            tokens: useTokensStore(),
            user: useUserStore(),
        };
    }

    // events for antelope
    get events() {
        return events;
    }

    // shortcut to get debug config
    get debug() {
        return this.config.debug;
    }

    extractStoreState(store: Store) {
        const state = store.$state;
        const result: Record<string, unknown> = {};
        Object.keys(state).forEach((key) => {
            const value = toRaw((state as any)[key] as never);
            if (key.substring(0, 2) === '__') {
                result[key] = value;
            }
        });
        return result;
    }

    /**
     * This function prints the state of the store in the console
     */
    print() {
        if (this.config.debug.isDebugging()) {
            console.log('--- Antelope lib ---');
            console.log('Config: ', [this.config]);
            console.log('Wallets:', [this.wallets]);
            console.log('   --- Stores ---   ');
            const stores = this.stores;
            Object.keys(stores).forEach((key) => {
                const titlecase = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);
                const eventName = `${titlecase(key)}:`;
                console.log(eventName.padEnd(10, ' '), [this.extractStoreState((stores as any)[key])]);
            });
        }
    }
}

const antelope = new Antelope(new AntelopeConfig(new AntelopeDebug()), new AntelopeWallets());
export const getAntelope = () => antelope;
export const installAntelope = (app: App) => {
    if (app.config.globalProperties.$antelope) {
        console.warn(
            'Antelope has already been installed. Vue.use(Antelope) should be called only once.\n' +
            'If you need to get the instance of Antelope, use getAntelope().');
        return antelope;
    }
    antelope.init(app);
    app.config.globalProperties.$antelope = antelope;
    return antelope;
};







export { useFeedbackStore } from 'src/antelope/stores/feedback';
export { usePlatformStore } from 'src/antelope/stores/platform';
export { useProfileStore } from 'src/antelope/stores/profile';
export { useResourcesStore } from 'src/antelope/stores/resources';
export { useUserStore } from 'src/antelope/stores/user';
export { useChainStore } from 'src/antelope/stores/chain';
export { useContractStore } from 'src/antelope/stores/contract';
export { useEVMStore } from 'src/antelope/stores/evm';
export { useTokensStore } from 'src/antelope/stores/tokens';
export { useNftsStore } from 'src/antelope/stores/nfts';
export { useAccountStore } from 'src/antelope/stores/account';
export { useAllowancesStore } from 'src/antelope/stores/allowances';
export { useBalancesStore } from 'src/antelope/stores/balances';
export { useHistoryStore } from 'src/antelope/stores/history';
export { useRexStore } from 'src/antelope/stores/rex';


// this constant is used for a temporal workaround for the multi-context issue
// https://github.com/telosnetwork/telos-wallet/issues/582

export const CURRENT_CONTEXT = 'current';
