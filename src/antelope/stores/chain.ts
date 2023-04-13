/**
 * Chain: This store is responsible for managing specific data for each registered
 * chain to facilitate access and reading of its data.
 *
 * It handles both native Antelope chains and EVM chains. For each chain, a Chain object
 * is defined containing the specific data for the chain, such as name, endpoint,
 * token, etc.
 *
 * Internally, two chains are maintained, identified as the chain where the logged-in user
 * is located (loggedChain) and the chain being explored by the user (currentChain), which
 * may or may not coincide. The application can change the current chain at any time,
 * providing access to the data and accounts for that chain. On the other hand, the logged
 * chain is where the logged-in user is located and is where transactions are executed.
 * This last chain is automatically changed when the user logs in or logs out.
 */


import { defineStore } from 'pinia';
import {
    createInitFunction,
    createTraceFunction,
    useFeedbackStore,
} from 'src/antelope/stores/feedback';

// main native chains
import EOS from 'src/antelope/chains/native/eos';
import Telos from 'src/antelope/chains/native/telos';
import UX from 'src/antelope/chains/native/ux';
import Wax from 'src/antelope/chains/native/wax';

// test native chains
import TelosTestnet from 'src/antelope/chains/native/telos-testnet';
import Jungle from 'src/antelope/chains/native/jungle';

// main evm chains
import TelosEVM from 'src/antelope/chains/evm/telos-evm';

// test evm chains
import TelosEVMTestnet from 'src/antelope/chains/evm/telos-evm-testnet';
import { getAntelope } from '..';
import NativeChainSettings from 'src/antelope/chains/NativeChainSettings';
import EVMChainSettings from 'src/antelope/chains/EVMChainSettings';
import {
    AntelopeError,
    ChainSettings,
    EvmToken,
    Label,
    NativeToken,
    Token,
} from 'src/antelope/types';



export const settings: { [key: string]: ChainSettings } = {
    // Native chains
    'eos': new EOS('eos'),
    'telos': new Telos('telos'),
    'ux': new UX('ux'),
    'wax': new Wax('wax'),
    'telos-testnet': new TelosTestnet('telos-testnet'),
    'jungle': new Jungle('jungle'),
    // EVM chains
    'telos-evm': new TelosEVM('telos-evm'),
    'telos-evm-testnet': new TelosEVMTestnet('telos-evm-testnet'),
};

export interface ChainModel {
    apy: string;
    settings: ChainSettings;
    tokens: Token[];
}

export interface EvmChainModel {
    apy: string;
    settings: EVMChainSettings;
    tokens: EvmToken[];
}

export interface NativeChainModel {
    apy: string;
    settings: NativeChainSettings;
    tokens: NativeToken[];
}


export interface ChainState {
    // chains mapped by label
    __chains: { [label: Label]: ChainModel };
}

const newChainModel = (network: string): ChainModel => ({
    apy: '',
    settings: settings[network],
    tokens: [],
});


const store_name = 'chain';

export const useChainStore = defineStore(store_name, {
    state: (): ChainState => (chainInitialState),
    getters: {
        loggedChain: state => state.__chains['logged'],
        currentChain: state => state.__chains['current'],
        loggedEvmChain: state => state.__chains['logged'].settings.isNative() ? undefined : state.__chains['logged'] as EvmChainModel,
        currentEvmChain: state => state.__chains['current'].settings.isNative() ? undefined : state.__chains['current'] as EvmChainModel,
        loggedNativeChain: state => state.__chains['logged'].settings.isNative() ? state.__chains['logged'] as NativeChainModel : undefined,
        currentNativeChain: state => state.__chains['current'].settings.isNative() ? state.__chains['current'] as NativeChainModel : undefined,
        getChain: state => (label: string) => state.__chains[label],
        getTokens: state => (label: string) => state.__chains[label].tokens,
        // TODO: remove the 'as EVMChainSettings' when the native chains are implemented
        // https://github.com/telosnetwork/telos-wallet/issues/246
        getExplorerUrl: () => (network: string) => (settings[network] as EVMChainSettings).getExplorerUrl(),
    },
    actions: {
        trace: createTraceFunction(store_name),
        init: createInitFunction(store_name),
        // Updates ----
        async updateChainData(label: string) {
            this.trace('updateChainData');
            useFeedbackStore().setLoading('updateChainData');
            try {
                await Promise.all([
                    this.updateApy(label),
                ]);
            } catch (error) {
                console.error(error);
                throw new Error('antelope.chain.error_update_data');
            } finally {
                useFeedbackStore().unsetLoading('updateChainData');
            }
        },
        async updateApy(label: string) {
            useFeedbackStore().setLoading('updateApy');
            this.trace('updateApy');
            const chain = this.getChain(label);
            try {
                if (chain.settings.isNative()) {
                    chain.apy = await (chain.settings as NativeChainSettings).getApy();
                } else {
                    chain.apy = '';
                }
            } catch (error) {
                console.error(error);
                throw new Error('antelope.chain.error_apy');
            } finally {
                useFeedbackStore().unsetLoading('updateApy');
            }
        },
        async updateTokenList(label: string) {
            useFeedbackStore().setLoading('updateTokenList');
            this.trace('updateTokenList');
            const chain = this.getChain(label);
            try {
                if (chain.settings.isNative()) {
                    chain.tokens = await (chain.settings as NativeChainSettings).getTokenList();
                } else {
                    chain.tokens = await (chain.settings as EVMChainSettings).getTokenList();
                }
            } catch (error) {
                console.error(error);
                throw new Error('antelope.chain.error_token_list');
            } finally {
                useFeedbackStore().unsetLoading('updateTokenList');
            }
        },
        // Commits ----
        setLoggedChain(network: string) {
            this.setChain('logged', network);
        },
        setCurrentChain(network: string) {
            this.setChain('current', network);
        },
        setChain(label: string, network: string) {
            this.trace('setChain', label, network);
            if (network in settings) {
                // make the change only if they are different
                if (network !== this.__chains[label]?.settings.getNetwork()) {
                    this.__chains[label] = newChainModel(network);
                    void this.updateChainData(label);
                    getAntelope().events.onNetworkChanged.next(
                        { label, chain: this.__chains[label] },
                    );
                }
            } else {
                throw new AntelopeError('antelope.chain.error_invalid_network', { network });
            }
        },
    },
});

const chainInitialState: ChainState = {
    __chains: {},
};
