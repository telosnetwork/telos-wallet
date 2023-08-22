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
    CURRENT_CONTEXT,
    useAccountStore,
    useEVMStore,
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
    stakeRatio: ethers.BigNumber;
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
        stakeRatio: ethers.constants.Zero,
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
}

const store_name = 'chain';

export const useChainStore = defineStore(store_name, {
    state: (): ChainState => (chainInitialState),
    getters: {
        loggedChain: state => state.__chains[CURRENT_CONTEXT],
        currentChain: state => state.__chains[CURRENT_CONTEXT],
        loggedEvmChain: state => state.__chains[CURRENT_CONTEXT].settings.isNative() ? undefined : state.__chains[CURRENT_CONTEXT] as EvmChainModel,
        currentEvmChain: state => state.__chains[CURRENT_CONTEXT].settings.isNative() ? undefined : state.__chains[CURRENT_CONTEXT] as EvmChainModel,
        loggedNativeChain: state => state.__chains[CURRENT_CONTEXT].settings.isNative() ? state.__chains[CURRENT_CONTEXT] as NativeChainModel : undefined,
        currentNativeChain: state => state.__chains[CURRENT_CONTEXT].settings.isNative() ? state.__chains[CURRENT_CONTEXT] as NativeChainModel : undefined,
        getChain: state => (label: string) => state.__chains[label],
        getTokens: state => (label: string) => state.__chains[label].tokens,
        // TODO: remove the 'as EVMChainSettings' when the native chains are implemented
        // https://github.com/telosnetwork/telos-wallet/issues/246
        getExplorerUrl: () => (network: string) => (settings[network] as EVMChainSettings).getExplorerUrl(),
        getEcosystemUrl: () => (network: string) => (settings[network] as EVMChainSettings).getEcosystemUrl(),
        getNetworkSettings: () => (network: string) => settings[network],
        getStakedRatio: state => (label: string) => (state.__chains[label] as EvmChainModel).stakeRatio ?? ethers.constants.Zero,
    },
    actions: {
        trace: createTraceFunction(store_name),
        init: createInitFunction(store_name),
        // Updates ----
        async updateChainData(label: string): Promise<void> {
            this.trace('updateChainData');
            useFeedbackStore().setLoading('updateChainData');
            try {
                await Promise.all([
                    this.updateSettings(label),
                    this.updateApy(label),
                    this.updateGasPrice(label),
                    this.updateStakedRatio(label),
                ]);
            } catch (error) {
                console.error(error);
                throw new Error('antelope.chain.error_update_data');
            } finally {
                useFeedbackStore().unsetLoading('updateChainData');
            }
        },
        async updateSettings(label: string): Promise<void> {
            this.trace('updateSettings', label);
            const settings = this.getChain(label).settings as EVMChainSettings;
            settings.init().then(() => {
                this.trace('updateSettings', label, '-> onChainIndexerReady.next()');
                getAntelope().events.onChainIndexerReady.next({ label, ready: true });
            }).catch((error) => {
                console.error(error);
                throw new Error('antelope.chain.error_settings');
            });
        },
        async updateApy(label: string): Promise<void> {
            useFeedbackStore().setLoading('updateApy');
            this.trace('updateApy', label);
            const chain = this.getChain(label);
            try {
                chain.apy = await chain.settings.getApy();
            } catch (error) {
                console.error(error);
                throw new Error('antelope.chain.error_apy');
            } finally {
                useFeedbackStore().unsetLoading('updateApy');
            }
        },
        async actualUpdateStakedRatio(label: string): Promise<ethers.BigNumber> {
            // first we need the contract instance to be able to execute queries
            this.trace('actualUpdateStakedRatio', label);
            useFeedbackStore().setLoading('actualUpdateStakedRatio');
            const evm = useEVMStore();
            const chain_settings = useChainStore().getChain(label).settings as EVMChainSettings;
            const sysToken = chain_settings.getSystemToken();
            const stkToken = chain_settings.getStakedSystemToken();
            const authenticator = useAccountStore().getEVMAuthenticator(label);
            if (!authenticator) {
                useFeedbackStore().unsetLoading('actualUpdateStakedRatio');
                this.trace('actualUpdateStakedRatio', label, '-> no authenticator');
                throw new AntelopeError('antelope.chain.error_no_default_authenticator');
            }
            const contract = await evm.getContract(authenticator, stkToken.address, stkToken.type);
            if (!contract) {
                useFeedbackStore().unsetLoading('actualUpdateStakedRatio');
                this.trace('actualUpdateStakedRatio', label, '-> no contract');
                return ethers.constants.Zero;
            }
            const contractInstance = await contract.getContractInstance();
            // Now we preview a deposit of 1 SYS to get the ratio
            const oneSys = ethers.utils.parseUnits('1.0', sysToken.decimals);
            const ratio:ethers.BigNumber = await contractInstance.previewDeposit(oneSys);

            // Finally we update the store
            this.setStakedRatio(label, ratio);
            useFeedbackStore().unsetLoading('actualUpdateStakedRatio');
            return ratio;
        },
        async updateStakedRatio(label: string): Promise<ethers.BigNumber> {
            const accountModel = useAccountStore().getAccount(label);
            if (accountModel && accountModel.account) {
                // if the account is already logged, we can update the staked ratio
                return this.actualUpdateStakedRatio(label);
            } else {
                // if the account is not logged, we need to wait for the login and then update the staked ratio
                return new Promise((resolve) => {
                    const sub = getAntelope().events.onAccountChanged.subscribe((result) => {
                        if (result.label === label) {
                            sub.unsubscribe();
                            if (result.account) {
                                // we need the user to be logged because the way of getting the staked ratio is by
                                // executing an action from contract and that internally attempts retrieve the account from the provided signer
                                resolve(this.actualUpdateStakedRatio(label));
                            }
                        }
                    });
                });
            }
        },
        async updateGasPrice(label: string): Promise<void> {
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
        async updateTokenList(label: string): Promise<void> {
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
        setChain(label: string, network: string) {
            this.trace('setChain', label, network);
            if (network in settings) {
                // make the change only if they are different
                if (network !== this.__chains[label]?.settings.getNetwork()) {
                    this.__chains[label] = newChainModel(network, settings[network].isNative());
                    this.trace('setChain', label, network, '--> void this.updateChainData(label);');
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
            const ratioNumber = parseFloat(ethers.utils.formatUnits(ratio, 18));
            this.trace('setStakedRatio', label, ratio.toString(), ratioNumber);
            (this.__chains[label] as EvmChainModel).stakeRatio = ratio;
        },
    },
});

const chainInitialState: ChainState = {
    __chains: {},
};
