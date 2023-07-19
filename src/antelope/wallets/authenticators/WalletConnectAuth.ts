import {
    PrepareSendTransactionResult,
    PrepareWriteContractResult,
    SendTransactionResult,
    sendTransaction,
    disconnect,
    InjectedConnector,
    fetchBalance,
    getAccount,
    prepareSendTransaction,
    prepareWriteContract,
    writeContract,
    WriteContractResult,
} from '@wagmi/core';
import {
    EthereumClient,
} from '@web3modal/ethereum';
import { Web3Modal, Web3ModalConfig } from '@web3modal/html';
import { BigNumber, ethers } from 'ethers';
import EVMChainSettings from 'src/antelope/chains/EVMChainSettings';
import { useChainStore } from 'src/antelope/stores/chain';
import { useEVMStore } from 'src/antelope/stores/evm';
import { useFeedbackStore } from 'src/antelope/stores/feedback';
import { usePlatformStore } from 'src/antelope/stores/platform';
import { AntelopeError, EvmABI, TokenClass, addressString } from 'src/antelope/types';
import { EVMAuthenticator } from 'src/antelope/wallets';
import { RpcEndpoint } from 'universal-authenticator-library';
import { toRaw } from 'vue';

const name = 'WalletConnect';

export class WalletConnectAuth extends EVMAuthenticator {
    // debounce methods do not allow for async functions to be awaited; they return a promise which resolves immediately
    // thus, we need to implement out own debounce so that we can await the async function (in this case, _prepareTokenForTransfer)
    private _debounceTimer: number | NodeJS.Timer | null;
    private _debouncedPrepareTokenConfigResolver: ((value: unknown) => void) | null;

    options: Web3ModalConfig;
    wagmiClient: EthereumClient;
    // this is just a dummy label to identify the authenticator base class
    constructor(options: Web3ModalConfig, wagmiClient: EthereumClient, label = name) {
        super(label);
        this.options = options;
        this.wagmiClient = wagmiClient;
        this._debounceTimer = null;
        this._debouncedPrepareTokenConfigResolver = null;
    }

    // EVMAuthenticator API ----------------------------------------------------------

    getName(): string {
        return name;
    }

    // this is the important instance creation where we define a label to assign to this instance of the authenticator
    newInstance(label: string): EVMAuthenticator {
        this.trace('newInstance', label);
        return new WalletConnectAuth(this.options, this.wagmiClient, label);
    }

    async walletConnectLogin(network: string): Promise<addressString | null> {
        this.trace('walletConnectLogin');
        try {
            this.clearAuthenticator();
            const address = getAccount().address as addressString;

            // We are already logged in. Now let's try to force the wallet to connect to the correct network
            try {
                if (!usePlatformStore().isMobile) {
                    await super.login(network);
                }
            } catch (e) {
                // we are already logged in. So we just ignore the error
                console.error(e);
            }

            return address;
        } catch (e) {
            // This is a non-expected error
            console.error(e);
            throw new AntelopeError('antelope.evm.error_login');
        } finally {
            useFeedbackStore().unsetLoading(`${this.getName()}.login`);
        }
    }

    async login(network: string): Promise<addressString | null> {
        this.trace('login', network);
        useFeedbackStore().setLoading(`${this.getName()}.login`);
        if (localStorage.getItem('wagmi.connected')) {
            return this.walletConnectLogin(network);
        } else {
            return new Promise(async (resolve) => {
                this.trace('login', 'web3Modal.openModal()');
                const web3Modal = new Web3Modal(this.options, this.wagmiClient);
                web3Modal.subscribeModal(async (newState) => {
                    this.trace('login', 'web3Modal.subscribeModal ', newState, localStorage.getItem('wagmi.connected'));
                    if (newState.open === false) {
                        useFeedbackStore().unsetLoading(`${this.getName()}.login`);
                    }
                    if (localStorage.getItem('wagmi.connected')) {
                        resolve(this.walletConnectLogin(network));
                    }
                });
                web3Modal.openModal();
            });
        }
    }

    // having this two properties attached to the authenticator instance may bring some problems
    // so after we use them we nned to clear them to avoid that problems
    clearAuthenticator(): void {
        this.options = null as unknown as Web3ModalConfig;
        this.wagmiClient = null as unknown as EthereumClient;
    }

    async logout(): Promise<void> {
        this.trace('logout');
        if (localStorage.getItem('wagmi.connected')){
            await disconnect();
        }
    }

    async getSystemTokenBalance(address: addressString): Promise<BigNumber> {
        this.trace('getSystemTokenBalance', address);
        const chainId = +useChainStore().getChain(this.label).settings.getChainId();
        const balanceBn = await fetchBalance({ address, chainId });
        return BigNumber.from(balanceBn.value);
    }

    async getERC20TokenBalance(address: addressString, token: addressString): Promise<BigNumber> {
        this.trace('getERC20TokenBalance', [address, token]);
        const chainId = +useChainStore().getChain(this.label).settings.getChainId();
        const balance = await fetchBalance({ address, chainId, token }).then(balanceBn => balanceBn.value);
        return BigNumber.from(balance);
    }

    async transferTokens(token: TokenClass, amount: BigNumber, to: addressString): Promise<SendTransactionResult | WriteContractResult> {
        this.trace('transferTokens', token, amount, to);
        if (!this.sendConfig) {
            throw new AntelopeError(token.isSystem ?
                'antelope.wallets.error_system_token_transfer_config' :
                'antelope.wallets.error_token_transfer_config',
            );
        } else {
            if (token.isSystem) {
                return await sendTransaction(this.sendConfig as PrepareSendTransactionResult);
            } else {
                return await writeContract(this.sendConfig as PrepareWriteContractResult<EvmABI, 'transfer', number>);
            }
        }
    }

    sendConfig: PrepareSendTransactionResult | PrepareWriteContractResult<EvmABI, string, number> | null = null;
    private _debouncedPrepareTokenConfig(token: TokenClass | null, amount: BigNumber, to: string) {
        // If there is already a pending call, clear it
        if (this._debounceTimer !== null && this._debouncedPrepareTokenConfigResolver) {
            clearTimeout(this._debounceTimer);
            this._debouncedPrepareTokenConfigResolver(null); // Resolve with null when debounced
        }

        // Create a new promise for this call
        const promise = new Promise((resolve) => {
            this._debouncedPrepareTokenConfigResolver = resolve;
        });

        // Set a timer to call the function after the delay
        this._debounceTimer = setTimeout(async () => {
            this._debounceTimer = null; // Clear the timer
            const result = await this._prepareTokenForTransfer(token, amount, to); // Call the function

            if (this._debouncedPrepareTokenConfigResolver) {
                this._debouncedPrepareTokenConfigResolver(result); // Resolve the promise with the result
            }
        }, 500);

        // Return the promise
        return promise;
    }
    async _prepareTokenForTransfer(token: TokenClass | null, amount: BigNumber, to: string) {
        this.trace('prepareTokenForTransfer', [token], amount, to);
        if (token) {
            if (token.isSystem) {
                try {
                    const test = await prepareSendTransaction({
                        to: to,
                        value: BigInt(amount.toString()),
                        chainId: +useChainStore().getChain(this.label).settings.getChainId(),
                    });
                    debugger;
                    this.sendConfig = test;
                } catch (e) {
                    debugger;
                } finally {
                    debugger;
                }

            } else {
                const abi = useEVMStore().getTokenABI(token.type);
                const functionName = 'transfer';
                this.sendConfig = await prepareWriteContract({
                    chainId: +useChainStore().getChain(this.label).settings.getChainId(),
                    address: token.address as addressString,
                    abi,
                    functionName,
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    args: [to, amount] as any[],
                });
            }
        } else {
            this.sendConfig = null;
        }
    }
    async prepareTokenForTransfer(token: TokenClass | null, amount: BigNumber, to: string): Promise<void> {
        await this._debouncedPrepareTokenConfig(token, amount, to);
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
        let web3Provider = null;
        if (usePlatformStore().isMobile) {
            const p:RpcEndpoint = (useChainStore().getChain(this.label).settings as EVMChainSettings).getRPCEndpoint();
            const url = `${p.protocol}://${p.host}:${p.port}${p.path ?? ''}`;
            web3Provider = new ethers.providers.JsonRpcProvider(url);
            this.trace('web3Provider', 'JsonRpcProvider ->', web3Provider);
        } else {
            web3Provider = new ethers.providers.Web3Provider(await this.externalProvider());
            this.trace('web3Provider', 'Web3Provider ->', web3Provider);
        }
        await web3Provider.ready;
        return web3Provider as ethers.providers.Web3Provider;
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

}
