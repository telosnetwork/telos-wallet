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
import { createTraceFunction } from 'src/antelope/config';
import {
    AntelopeError,
    ChainSettings,
    Label,
    TokenClass,
    stlosAbiPreviewDeposit,
    stlosAbiPreviewRedeem,
} from 'src/antelope/types';
import { ethers } from 'ethers';

// dependencies --
import {
    CURRENT_CONTEXT,
    useFeedbackStore,
} from 'src/antelope';


export const settings: { [network: string]: ChainSettings } = {
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

export const chains: { [network: string]: ChainModel } = {};

export interface ChainModel {
    lastUpdate: number;
    apy: string;
    settings: ChainSettings;
    tokens: TokenClass[];
}

export interface EvmChainModel {
    lastUpdate: number;
    apy: string;
    stakeRatio: ethers.BigNumber;
    unstakeRatio: ethers.BigNumber;
    gasPrice: ethers.BigNumber;
    settings: EVMChainSettings;
    tokens: TokenClass[];
}

export interface NativeChainModel {
    lastUpdate: number;
    apy: string;
    settings: NativeChainSettings;
    tokens: TokenClass[];
}

const newChainModel = (network: string, isNative: boolean): ChainModel => {
    const model = {
        lastUpdate: 0,
        apy: '',
        stakeRatio: ethers.constants.Zero,
        unstakeRatio: ethers.constants.Zero,
        settings: settings[network],
        tokens: [],
    } as ChainModel;
    if (!isNative) {
        (model as EvmChainModel).gasPrice = ethers.constants.Zero;
    }
    return model;
};

export interface ChainState {
    // chains mapped by label
    __chains: { [label: Label]: ChainModel };
    // network settings
    __networks: { [network: string]: ChainSettings };
}

const store_name = 'chain';

export const useChainStore = defineStore(store_name, {
    state: (): ChainState => (chainInitialState),
    getters: {
        loggedChain: state => state.__chains[CURRENT_CONTEXT],
        currentChain: state => state.__chains[CURRENT_CONTEXT],
        loggedEvmChain: state => state.__chains[CURRENT_CONTEXT].settings.isNative() ? undefined : state.__chains[CURRENT_CONTEXT] as EvmChainModel,
        currentEvmChain: state => state.__chains[CURRENT_CONTEXT]?.settings.isNative() ? undefined : state.__chains[CURRENT_CONTEXT] as EvmChainModel,
        loggedNativeChain: state => state.__chains[CURRENT_CONTEXT].settings.isNative() ? state.__chains[CURRENT_CONTEXT] as NativeChainModel : undefined,
        currentNativeChain: state => state.__chains[CURRENT_CONTEXT].settings.isNative() ? state.__chains[CURRENT_CONTEXT] as NativeChainModel : undefined,
        getChain: state => (label: string) => state.__chains[label],
        getTokens: state => (label: string) => state.__chains[label].tokens,
        // TODO: remove the 'as EVMChainSettings' when the native chains are implemented
        // https://github.com/telosnetwork/telos-wallet/issues/246
        getExplorerUrl: () => (network: string) => (settings[network] as EVMChainSettings).getExplorerUrl(),
        getEcosystemUrl: () => (network: string) => (settings[network] as EVMChainSettings).getEcosystemUrl(),
        getBridgeUrl: () => (network: string) => (settings[network] as EVMChainSettings).getBridgeUrl(),
        getNetworkSettings: () => (network: string) => settings[network],
        getStakedRatio: state => (label: string) => (state.__chains[label] as EvmChainModel).stakeRatio ?? ethers.constants.Zero,
        getUnstakedRatio: state => (label: string) => (state.__chains[label] as EvmChainModel).unstakeRatio ?? ethers.constants.Zero,
    },
    actions: {
        trace: createTraceFunction(store_name),
        // Updates ----
        async updateChainData(label: string): Promise<void> {
            this.trace('updateChainData');
            useFeedbackStore().setLoading('updateChainData');
            try {
                const chain = this.getChain(label);
                const now = Date.now();
                const tolerance = 1000 * 10; // 10 seconds
                const isUpToDate = now - chain.lastUpdate < tolerance;
                if (isUpToDate) {
                    // This avoid to update the chain data if the user switches from one chain to another and back
                    this.trace('updateChainData', label, '-> already up to date');
                } else {
                    this.setChainLastUpdate(label, Date.now());
                    await Promise.all([
                        this.updateSettings(label),
                        this.updateApy(label),
                        this.updateGasPrice(label),
                        this.updateStakedRatio(label),
                    ]);
                }
            } catch (error) {
                console.error(error);
                throw new Error('antelope.chain.error_update_data');
            } finally {
                useFeedbackStore().unsetLoading('updateChainData');
            }
        },
        async updateSettings(label: string): Promise<void> {
            this.trace('updateSettings', label);
            try {
                const settings = useChainStore().getChain(label).settings as EVMChainSettings;
                settings.init().then(() => {
                    this.trace('updateSettings', label, '-> onChainIndexerReady.next()');
                    getAntelope().events.onChainIndexerReady.next({ label, ready: true });
                }).catch((error) => {
                    console.error(error);
                    throw new Error('antelope.chain.error_settings_not_found');
                });
            } catch (error) {
                console.error(error);
                throw new Error('antelope.chain.error_settings_not_found');
            }
        },
        async updateApy(label: string): Promise<void> {
            useFeedbackStore().setLoading('updateApy');
            this.trace('updateApy', label);
            const chain = useChainStore().getChain(label);
            try {
                chain.apy = await chain.settings.getApy();
            } catch (error) {
                console.error(error);
                throw new Error('antelope.chain.error_apy');
            } finally {
                useFeedbackStore().unsetLoading('updateApy');
            }
        },
        async updateStakedRatio(label: string): Promise<void> {
            // first we need the contract instance to be able to execute queries
            this.trace('updateStakedRatio', label);
            const chain = this.getChain(label);
            try {
                useFeedbackStore().setLoading('updateStakedRatio');
                if (!chain.settings.isNative()) {
                    const chain_settings = chain.settings as EVMChainSettings;
                    const sysToken = chain_settings.getSystemToken();
                    const stkToken = chain_settings.getStakedSystemToken();

                    const abi = [stlosAbiPreviewDeposit[0], stlosAbiPreviewRedeem[0]];
                    const provider = await getAntelope().wallets.getWeb3Provider(label);
                    const contractInstance = new ethers.Contract(stkToken.address, abi, provider);
                    // Now we preview a deposit of 1 SYS to get the ratio
                    const oneSys = ethers.utils.parseUnits('1.0', sysToken.decimals);
                    const stakedRatio = await contractInstance.previewDeposit(oneSys.toString());
                    const unstakedRatio:ethers.BigNumber = await contractInstance.previewRedeem(oneSys);
                    // Finally we update the store
                    this.setStakedRatio(label, stakedRatio);
                    this.setUnstakedRatio(label, unstakedRatio);
                }
            } catch (error) {
                console.error(error);
            } finally {
                useFeedbackStore().unsetLoading('updateStakedRatio');
            }
        },
        async updateGasPrice(label: string): Promise<void> {
            useFeedbackStore().setLoading('updateGasPrice');
            this.trace('updateGasPrice');
            const chain = useChainStore().getChain(label);
            try {
                if (!chain.settings.isNative()) {
                    const wei = await (chain.settings as EVMChainSettings).getGasPrice();
                    (chain as EvmChainModel).gasPrice = wei;
                } else {
                    this.trace('updateGasPrice', label, 'Native chain has no gas costs');
                }
            } catch (error) {
                console.error(error);
            } finally {
                useFeedbackStore().unsetLoading('updateGasPrice');
            }
        },
        async updateTokenList(label: string): Promise<void> {
            useFeedbackStore().setLoading('updateTokenList');
            this.trace('updateTokenList');
            const chain = useChainStore().getChain(label);
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
        setChain(label: string, network: string) {
            this.trace('setChain', label, network);
            if (network in settings) {

                // create the chain model if it doesn't exist
                if (!chains[network]) {
                    chains[network] = newChainModel(network, settings[network].isNative());
                }

                // make the change only if they are different
                if (network !== this.__chains[label]?.settings.getNetwork()) {
                    this.__chains[label] = chains[network];
                    this.trace('setChain', label, network, '--> void this.updateChainData(label);');
                    getAntelope().wallets.resetWeb3Provider();
                    void this.updateChainData(label);
                    getAntelope().events.onNetworkChanged.next(
                        { label, chain: this.__chains[label] },
                    );
                }
            } else {
                throw new AntelopeError('antelope.chain.error_invalid_network', { network });
            }
        },
        setStakedRatio(label: string, ratio: ethers.BigNumber) {
            this.trace('setStakedRatio', label, ratio.toString());
            const chain = this.getChain(label);
            try {
                if (!chain.settings.isNative()) {
                    const decimals = (this.getChain(label).settings as EVMChainSettings).getStakedSystemToken().decimals;
                    const ratioNumber = parseFloat(ethers.utils.formatUnits(ratio, decimals));
                    this.trace('setStakedRatio', label, ratio.toString(), ratioNumber);
                    (this.__chains[label] as EvmChainModel).stakeRatio = ratio;
                } else {
                    this.trace('setStakedRatio', label, 'Native chain has no staked ratio');
                }
            } catch (error) {
                console.error(error);
                throw new Error('antelope.chain.error_token_list');
            } finally {
                useFeedbackStore().unsetLoading('updateTokenList');
            }

        },
        setUnstakedRatio(label: string, ratio: ethers.BigNumber) {
            this.trace('setUnstakedRatio', label, ratio.toString());
            const chain = this.getChain(label);
            try {
                if (!chain.settings.isNative()) {
                    const decimals = (this.getChain(label).settings as EVMChainSettings).getStakedSystemToken().decimals;
                    const ratioNumber = parseFloat(ethers.utils.formatUnits(ratio, decimals));
                    this.trace('setUnstakedRatio', label, ratio.toString(), ratioNumber);
                    (this.__chains[label] as EvmChainModel).unstakeRatio = ratio;
                } else {
                    this.trace('setUnstakedRatio', label, 'Native chain has no unstaked ratio');
                }
            } catch (error) {
                console.error(error);
                throw new Error('antelope.chain.error_token_list');
            } finally {
                useFeedbackStore().unsetLoading('updateTokenList');
            }
        },
        setChainLastUpdate(label: string, timestamp: number) {
            this.trace('setChainLastUpdate', label, timestamp);
            this.__chains[label].lastUpdate = timestamp;
        },
    },
});

const chainInitialState: ChainState = {
    __chains: {},
    __networks: settings,
};
