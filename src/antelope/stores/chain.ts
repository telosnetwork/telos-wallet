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
import { ChainSettings } from 'src/types';

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
import TelosTestnetEVM from 'src/antelope/chains/evm/telos-testnet-evm';
import { getAntelope } from '..';
import NativeChainSettings from 'src/antelope/chains/NativeChainSettings';



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
    'telos-testnet-evm': new TelosTestnetEVM('telos-testnet-evm'),
};

export interface ChainModel {
    apy: string;
    settings: ChainSettings;
}

export interface ChainState {
    // reference to the chain in where the logged account is
    __logged_Chain: ChainModel;
    // reference to the chain in where the current explored account is
    __current_Chain: ChainModel;
}

const newChainModel = (network: string): ChainModel => ({
    apy: '',
    settings: settings[network],
});


const store_name = 'chain';

export const useChainStore = defineStore(store_name, {
    state: (): ChainState => (chainInitialState),
    getters: {
        loggedChain: state => state.__logged_Chain,
        currentChain: state => state.__current_Chain,
        // get chain by label
        getChain: state => (label: string) => label === 'logged' ? state.__logged_Chain : state.__current_Chain,
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
        // Commits ----
        setLoggedChain(network: string) {
            this.trace('setLoggedChain', network, settings[network]);
            if (network in settings) {
                this.__logged_Chain = newChainModel(network);
                void this.updateChainData('logged');
                getAntelope().events.onChainChanged.next(
                    { label: 'logged', chain: this.__current_Chain },
                );
            } else {
                throw new Error(`Invalid network: ${network}`);
            }
        },
        setCurrentChain(network: string) {
            this.trace('setCurrentChain', network);
            if (network in settings) {
                this.__current_Chain = newChainModel(network);
                void this.updateChainData('current');
                getAntelope().events.onChainChanged.next(
                    { label: 'current', chain: this.__current_Chain },
                );
            } else {
                throw new Error(`Invalid network: ${network}`);
            }
        },
    },
});

const initial_chain = newChainModel(process.env.NETWORK ?? 'telos');
const chainInitialState: ChainState = {
    __logged_Chain: initial_chain,
    __current_Chain: initial_chain,
};
