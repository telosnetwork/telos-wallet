import {
    PrepareSendTransactionResult,
    PrepareWriteContractResult,
    SendTransactionResult,
    disconnect,
    InjectedConnector,
    fetchBalance,
    getAccount,
    prepareSendTransaction,
    prepareWriteContract,
    sendTransaction,
    writeContract,
    // getProvider,
} from '@wagmi/core';
import {
    EthereumClient,
} from '@web3modal/ethereum';
import { Web3Modal, Web3ModalConfig } from '@web3modal/html';
import { BigNumber, ethers } from 'ethers';
import { useChainStore } from 'src/antelope/stores/chain';
import { useEVMStore } from 'src/antelope/stores/evm';
import { useFeedbackStore } from 'src/antelope/stores/feedback';
import { AntelopeError, EvmABI, TokenClass, addressString } from 'src/antelope/types';
import { EVMAuthenticator } from 'src/antelope/wallets';
import { toRaw } from 'vue';

const name = 'WalletConnect';

export class WalletConnectAuth extends EVMAuthenticator {

    options: Web3ModalConfig;
    // web3Modal: Web3Modal | null = null;
    wagmiClient: EthereumClient;
    // this is just a dummy label to identify the authenticator base class
    constructor(options: Web3ModalConfig, wagmiClient: EthereumClient, label = name) {
        super(label);
        this.options = options;
        this.wagmiClient = wagmiClient;
    }

    // EVMAuthenticator API ----------------------------------------------------------

    getName(): string {
        return name;
    }

    // this is the important instance creation where we define a label to asign to this instance of the authenticator
    newInstance(label: string): EVMAuthenticator {
        this.trace('newInstance', label);
        return new WalletConnectAuth(this.options, this.wagmiClient, label);
    }

    async login(network: string): Promise<addressString | null> {
        this.trace('login', network);
        useFeedbackStore().setLoading(`${this.getName()}.login`);
        if (localStorage.getItem('wagmi.connected')) {
            const address = getAccount().address as addressString;
            try {
                await super.login(network);
            } catch (e) {
                // we are already logged in. So we just ignore the error
            }
            useFeedbackStore().unsetLoading(`${this.getName()}.login`);
            return address;
        } else {
            return new Promise(async (resolve) => {
                const web3Modal = new Web3Modal(this.options, this.wagmiClient);
                web3Modal.subscribeModal(async (newState) => {
                    if (newState.open === false && localStorage.getItem('wagmi.connected')) {
                        const address = getAccount().address as addressString;
                        try {
                            await super.login(network);
                        } catch (e) {
                            // we are already logged in. So we just ignore the error
                        }
                        resolve(address);
                    }
                    if (newState.open === false) {
                        useFeedbackStore().unsetLoading(`${this.getName()}.login`);
                    }
                });
                web3Modal.openModal();
            });
        }
    }

    async logout(): Promise<void> {
        this.trace('logout');
        if (localStorage.getItem('wagmi.connected')){
            disconnect();
        }
    }

    async getSystemTokenBalance(label:string, address: addressString): Promise<BigNumber> {
        this.trace('getSystemTokenBalance', address);
        const chainId = +useChainStore().getChain(label).settings.getChainId();
        const balanceBn = await fetchBalance({ address, chainId });
        return balanceBn.value;
    }

    getERC20TokenBalance(label:string, address: addressString, token: addressString): Promise<BigNumber> {
        this.trace('getERC20TokenBalance', label, [address, token]);
        const chainId = +useChainStore().getChain(label).settings.getChainId();
        return fetchBalance({ address, chainId, token }).then(balanceBn => balanceBn.value);
    }

    async transferTokens(label:string, token: TokenClass, amount: BigNumber, to: addressString): Promise<SendTransactionResult> {
        this.trace('transferTokens', label, token, amount, to);
        if (!this.sendConfig) {
            throw new AntelopeError(token.isSystem ?
                'antelope.wallets.error_system_token_transfer_config' :
                'antelope.wallets.error_token_transfer_config',
            );
        } else {
            if (token.isSystem) {
                return await sendTransaction(this.sendConfig);
            } else {
                return await writeContract(this.sendConfig as PrepareWriteContractResult<EvmABI, 'transfer', number>);
            }
        }
    }

    sendConfig: PrepareSendTransactionResult | null = null;
    async prepareTokenForTransfer(label: string, token: TokenClass | null, amount: BigNumber, to: string): Promise<void> {
        this.trace('prepareTokenForTransfer', label, [token], amount, to);
        if (token) {
            if (token.isSystem) {
                this.sendConfig = await prepareSendTransaction({
                    request: {
                        to,
                        value: amount,
                    },
                });
            } else {
                const abi = useEVMStore().getTokenABI(token.type);
                const functionName = 'transfer';
                this.sendConfig = (await prepareWriteContract({
                    address: token.address as addressString,
                    abi,
                    functionName,
                    args: [to, amount],
                })) as PrepareWriteContractResult<EvmABI, 'transfer', number>;
            }
        } else {
            this.sendConfig = null;
        }
    }

    async isConnectedTo(chainId: string): Promise<boolean> {
        this.trace('isConnectedTo', chainId);
        return new Promise(async (resolve) => {
            const web3Provider = await this.web3Provider();
            const correct = +web3Provider.network.chainId === +chainId;
            this.trace('isConnectedTo', chainId, correct ? 'OK!' : 'not connected');
            resolve(correct);
        });
    }

    async web3Provider(): Promise<ethers.providers.Web3Provider> {
        this.trace('web3Provider');
        const web3Provider = new ethers.providers.Web3Provider(await this.externalProvider());
        await web3Provider.ready;
        return web3Provider;
    }

    async externalProvider(): Promise<ethers.providers.ExternalProvider> {
        this.trace('externalProvider');
        return new Promise(async (resolve) => {
            const injected = new InjectedConnector();
            const provider = toRaw(await injected.getProvider());
            if (!provider) {
                throw new AntelopeError('antelope.evm.error_no_provider');
            }
            resolve(provider as unknown as ethers.providers.ExternalProvider);
        });
    }

    // ----------------------------------------------------------

}