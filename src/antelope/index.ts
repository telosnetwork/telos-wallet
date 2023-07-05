import { App } from 'vue';
import { Subject } from 'rxjs';
import { Store } from 'pinia';

import { AntelopeConfig, chainNetworkNames } from 'src/antelope/config/';
import installPinia from 'src/antelope/stores';

import { AccountModel } from 'src/antelope/stores/account';
import { ChainModel } from 'src/antelope/stores/chain';

import {
    useAccountStore,
    useBalancesStore,
    useChainStore,
    useContractStore,
    useEVMStore,
    useFeedbackStore,
    useHistoryStore,
    useNftsStore,
    usePlatformStore,
    useProfileStore,
    useResourcesStore,
    useRexStore,
    useTokensStore,
    useUserStore,
} from 'src/antelope';
import { AntelopeWallets } from 'src/antelope/wallets';

// provide typings for `this.$store`
declare module '@vue/runtime-core' {
    interface ComponentCustomProperties {
        $store: Store;
    }
}

const events = {
    onLoggedIn: new Subject<AccountModel>(),
    onLoggedOut: new Subject<void>(),
    onNetworkChanged: new Subject<{label:string, chain:ChainModel}>(),
    onAccountChanged: new Subject<{label:string, account:AccountModel|null}>(),
    onChainIndexer: new Subject<{label:string, isHealthy:boolean}>(),
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

        // call for the first time useXStore for all X stores in Antelope library
        const stores = this.stores;

        // call init to all stores
        Object.keys(stores).forEach((key) => {
            const store = (stores as unknown as {[k:string]:{init?:()=>void}})[key];
            if (store.init) {
                store.init();
            }
        });

        const chainStore = useChainStore();

        if (!chainStore.currentChain) {
            if (!process.env.CHAIN_NAME) {
                console.error('No chain name specified in environment config; the application will not run correctly');
            } else {
                const network: string = chainNetworkNames[process.env.CHAIN_NAME];

                chainStore.setCurrentChain(network);
            }
        }

        // Initializing store
        stores.user.loadUsers();
    }

    get stores() {
        return {
            user: useUserStore(),
            chain: useChainStore(),
            account: useAccountStore(),
            profile: useProfileStore(),
            resources: useResourcesStore(),
            rex: useRexStore(),
            tokens: useTokensStore(),
            contract: useContractStore(),
            balances: useBalancesStore(),
            history: useHistoryStore(),
            feedback: useFeedbackStore(),
            platform: usePlatformStore(),
            evm: useEVMStore(),
            nfts: useNftsStore(),
        };
    }

    // events for antelope
    get events() {
        return events;
    }
}

const antelope = new Antelope(new AntelopeConfig(), new AntelopeWallets());
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

export { useAccountStore } from 'src/antelope/stores/account';
export { useChainStore } from 'src/antelope/stores/chain';
export { useUserStore } from 'src/antelope/stores/user';
export { useProfileStore } from 'src/antelope/stores/profile';
export { useResourcesStore } from 'src/antelope/stores/resources';
export { useRexStore } from 'src/antelope/stores/rex';
export { useTokensStore } from 'src/antelope/stores/tokens';
export { useContractStore } from 'src/antelope/stores/contract';
export { useBalancesStore } from 'src/antelope/stores/balances';
export { useHistoryStore } from 'src/antelope/stores/history';
export { useFeedbackStore } from 'src/antelope/stores/feedback';
export { usePlatformStore } from 'src/antelope/stores/platform';
export { useEVMStore } from 'src/antelope/stores/evm';
export { useNftsStore } from 'src/antelope/stores/nfts';

