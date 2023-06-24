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
    useFeedbackStore,
} from 'src/antelope';

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
import { getAntelope } from 'src/antelope';
import NativeChainSettings from 'src/antelope/chains/NativeChainSettings';
import EVMChainSettings from 'src/antelope/chains/EVMChainSettings';
import {
    AntelopeError,
    ChainSettings,
    Label,
    TokenClass,
} from 'src/antelope/types';
import { ethers } from 'ethers';
import { createInitFunction, createTraceFunction } from 'src/antelope/stores/feedback';



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
    tokens: TokenClass[];
}

export interface EvmChainModel {
    apy: string;
    gasPrice: ethers.BigNumber;
    settings: EVMChainSettings;
    tokens: TokenClass[];
}

export interface NativeChainModel {
    apy: string;
    settings: NativeChainSettings;
    tokens: TokenClass[];
}

const newChainModel = (network: string, isNative: boolean): ChainModel => {
    const model = {
        apy: '',
        settings: settings[network],
        tokens: [],
    } as ChainModel;
    if (!isNative) {
        (model as EvmChainModel).gasPrice = ethers.BigNumber.from(0);
    }
    return model;
};

export interface ChainState {
    // chains mapped by label
    __chains: { [label: Label]: ChainModel };
}

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
        getEcosystemUrl: () => (network: string) => (settings[network] as EVMChainSettings).getEcosystemUrl(),
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
                    this.updateSettings(label),
                    this.updateApy(label),
                    this.updateGasPrice(label),
                ]);
            } catch (error) {
                console.error(error);
                throw new Error('antelope.chain.error_update_data');
            } finally {
                useFeedbackStore().unsetLoading('updateChainData');
            }
        },
        async updateSettings(label: string) {
            this.getChain(label).settings.init().then(() => {
                getAntelope().events.onChainIndexer.next({ label, isHealthy: true });
            }).catch((error) => {
                console.error(error);
                throw new Error('antelope.chain.error_settings');
            });
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
        async updateGasPrice(label: string) {
            useFeedbackStore().setLoading('updateGasPrice');
            this.trace('updateGasPrice');
            const chain = this.getChain(label);
            try {
                if (!chain.settings.isNative()) {
                    const wei = await (chain.settings as EVMChainSettings).getGasPrice();
                    (chain as EvmChainModel).gasPrice = wei;
                }
            } catch (error) {
                console.error(error);
            } finally {
                useFeedbackStore().unsetLoading('updateGasPrice');
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
            this.setChain('current', network);
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
                    this.__chains[label] = newChainModel(network, settings[network].isNative());
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
