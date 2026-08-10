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
import { TELOS_ANALYTICS_EVENT_NAMES } from 'src/antelope/chains/chain-constants';
import { useChainStore } from 'src/antelope/stores/chain';
import {
    useContractStore,
    useFeedbackStore,
    usePlatformStore,
} from 'src/antelope';
import {
    AntelopeError,
    EvmABI,
    EvmFunctionParam,
    TokenClass,
    addressString,
} from 'src/antelope/types';
import { EVMAuthenticator } from 'src/antelope/wallets';
import { RpcEndpoint } from 'universal-authenticator-library';
import { toRaw } from 'vue';

const name = 'WalletConnect';

/** How long auto-login waits for wagmi autoConnect to restore a live connector. */
const WAGMI_RECONNECT_WAIT_MS = 2500;
const WAGMI_RECONNECT_POLL_MS = 100;

export class WalletConnectAuth extends EVMAuthenticator {
    private static web3ModalInstance: Web3Modal | null = null;

    // debounce methods do not allow for async functions to be awaited; they return a promise which resolves immediately
    // thus, we need to implement out own debounce so that we can await the async function (in this case, _prepareTokenForTransfer)
    private _debounceTimer: number | NodeJS.Timer | null;
    private _debouncedPrepareTokenConfigResolver: ((value: unknown) => void) | null;
    private web3Modal: Web3Modal;
    private unsubscribeWeb3Modal: null | (() => void) = null;
    private usingQR = false;

    options: Web3ModalConfig;
    wagmiClient: EthereumClient;
    // this is just a dummy label to identify the authenticator base class
    constructor(options: Web3ModalConfig, wagmiClient: EthereumClient, label = name) {
        super(label);
        this.options = options;
        this.wagmiClient = wagmiClient;
        this._debounceTimer = null;
        this._debouncedPrepareTokenConfigResolver = null;

        this.web3Modal = WalletConnectAuth.getWeb3Modal(this.options, this.wagmiClient);
    }

    private static getWeb3Modal(options: Web3ModalConfig, wagmiClient: EthereumClient): Web3Modal {
        if (!WalletConnectAuth.web3ModalInstance) {
            WalletConnectAuth.web3ModalInstance = new Web3Modal(options, wagmiClient);
        }

        return WalletConnectAuth.web3ModalInstance;
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

    /**
     * True when wagmi has both an address and a live connector instance.
     * App-level localStorage can still show a logged-in UI when this is false
     * (the ConnectorNotFoundError withdraw bug).
     */
    hasLiveConnector(expectedAddress?: string): boolean {
        const account = getAccount();
        if (!account.connector || !account.address) {
            return false;
        }
        if (!expectedAddress) {
            return true;
        }
        return account.address.toLowerCase() === expectedAddress.toLowerCase();
    }

    private async waitForLiveConnector(expectedAddress: string, timeoutMs = WAGMI_RECONNECT_WAIT_MS): Promise<boolean> {
        const started = Date.now();
        while (Date.now() - started < timeoutMs) {
            if (this.hasLiveConnector(expectedAddress)) {
                return true;
            }
            await new Promise(resolve => setTimeout(resolve, WAGMI_RECONNECT_POLL_MS));
        }
        return this.hasLiveConnector(expectedAddress);
    }

    /**
     * Guard every write path. Throws a human-readable AntelopeError instead of
     * letting wagmi surface ConnectorNotFoundError as raw JSON in the toast.
     */
    async ensureLiveConnector(expectedAddress?: string): Promise<void> {
        this.trace('ensureLiveConnector', expectedAddress);
        let address = expectedAddress ?? getAccount().address;
        if (!address) {
            try {
                address = this.getAccountAddress();
            } catch {
                address = undefined as unknown as string;
            }
        }
        if (this.hasLiveConnector(address || undefined)) {
            return;
        }
        // Give autoConnect a short chance if the flag says we were connected.
        if (localStorage.getItem('wagmi.connected') && address) {
            const recovered = await this.waitForLiveConnector(address, 1000);
            if (recovered) {
                return;
            }
        }
        // Best-effort: surface the connect UI so the user can restore the session.
        try {
            if (this.web3Modal) {
                this.web3Modal.openModal();
            }
        } catch (e) {
            this.trace('ensureLiveConnector', 'openModal failed', e);
        }
        throw new AntelopeError('antelope.evm.error_connector_not_found');
    }

    /**
     * WalletConnect auto-login must not restore a "ghost" session from app
     * localStorage alone. Require a live wagmi connector matching the account.
     */
    async autoLogin(network: string, account: string): Promise<addressString> {
        this.trace('autoLogin', network, account);

        const ready = await this.waitForLiveConnector(account);
        if (!ready) {
            this.trace('autoLogin', 'no live wagmi connector — refusing ghost session');
            // Drop stale app session keys so the user lands on the login screen
            // instead of a connected UI that cannot sign.
            localStorage.removeItem('wagmi.connected');
            localStorage.removeItem('account');
            localStorage.removeItem('rawAddress');
            localStorage.removeItem('autoLogin');
            localStorage.removeItem('network');
            localStorage.removeItem('isNative');
            throw new AntelopeError('antelope.evm.error_connector_not_found');
        }

        return super.autoLogin(network, account);
    }

    async walletConnectLogin(network: string): Promise<addressString | null> {
        this.trace('walletConnectLogin');
        const chainSettings = this.getChainSettings();

        try {
            this.clearAuthenticator();
            const address = getAccount().address as addressString;

            // We are successfully logged in. Let's find out if we are using QR
            this.usingQR = false;
            const injected = new InjectedConnector();
            const provider = toRaw(await injected.getProvider());
            if (typeof provider === 'undefined') {
                this.usingQR = true;
            } else {
                const providerAddress = (provider._state?.accounts) ? provider._state?.accounts[0]??'' : '';
                this.trace('walletConnectLogin', 'providerAddress:', providerAddress, 'address:', address);
                const sameAddress = providerAddress.toLocaleLowerCase() === address.toLocaleLowerCase();
                this.usingQR = !sameAddress;
                this.trace('walletConnectLogin', 'sameAddress:', sameAddress);
            }
            this.trace('walletConnectLogin', 'using QR:', this.usingQR);

            // We are already logged in. Now let's try to force the wallet to connect to the correct network
            try {
                if (!usePlatformStore().isMobile) {
                    await super.login(network);
                }
            } catch (e) {
                // we are already logged in. So we just ignore the error
                console.error(e);
            }

            this.trace(
                'login',
                'trackAnalyticsEvent -> login successful',
                'WalletConnect',
                TELOS_ANALYTICS_EVENT_NAMES.loginSuccessfulWalletConnect,
            );
            chainSettings.trackAnalyticsEvent(TELOS_ANALYTICS_EVENT_NAMES.loginSuccessfulWalletConnect);
            this.trace(
                'login',
                'trackAnalyticsEvent -> generic login successful',
                TELOS_ANALYTICS_EVENT_NAMES.loginSuccessful,
            );
            chainSettings.trackAnalyticsEvent(TELOS_ANALYTICS_EVENT_NAMES.loginSuccessful);

            return address;
        } catch (e) {
            // This is a non-expected error
            console.error(e);
            this.trace(
                'walletConnectLogin',
                'trackAnalyticsEvent -> login failed',
                'WalletConnect',
                TELOS_ANALYTICS_EVENT_NAMES.loginFailedWalletConnect,
            );
            const chainSettings = this.getChainSettings();
            chainSettings.trackAnalyticsEvent(TELOS_ANALYTICS_EVENT_NAMES.loginFailedWalletConnect);
            throw new AntelopeError('antelope.evm.error_login');
        } finally {
            useFeedbackStore().unsetLoading(`${this.getName()}.login`);
        }
    }

    async login(network: string): Promise<addressString | null> {
        this.trace('login', network);
        const wagmiConnected = () => localStorage.getItem('wagmi.connected');
        const chainSettings = this.getChainSettings();

        useFeedbackStore().setLoading(`${this.getName()}.login`);
        this.setDefaultChainForNetwork(network);

        if (wagmiConnected()) {
            // We are in auto-login process. So log loginStarted before calling the walletConnectLogin method
            this.trace(
                'login',
                'trackAnalyticsEvent -> login started',
                'WalletConnect',
                TELOS_ANALYTICS_EVENT_NAMES.loginStarted,
            );
            chainSettings.trackAnalyticsEvent(TELOS_ANALYTICS_EVENT_NAMES.loginStarted);
            return this.walletConnectLogin(network);
        } else {
            return new Promise((resolve, reject) => {
                let settled = false;
                const settle = (loginResult: addressString | null | Promise<addressString | null>) => {
                    if (settled) {
                        return;
                    }

                    settled = true;
                    this.cleanupWeb3ModalSubscription();
                    Promise.resolve(loginResult).then(resolve).catch(reject);
                };
                const fail = (error: unknown) => {
                    if (settled) {
                        return;
                    }

                    settled = true;
                    useFeedbackStore().unsetLoading(`${this.getName()}.login`);
                    this.cleanupWeb3ModalSubscription();
                    reject(error);
                };

                this.trace('login', 'web3Modal.openModal()');

                this.unsubscribeWeb3Modal = this.web3Modal.subscribeModal(async (newState) => {
                    this.trace('login', 'web3Modal.subscribeModal ', toRaw(newState), wagmiConnected);

                    if (newState.open === true) {
                        this.trace(
                            'login',
                            'trackAnalyticsEvent -> login started',
                            'WalletConnect',
                            TELOS_ANALYTICS_EVENT_NAMES.loginStarted,
                        );
                        chainSettings.trackAnalyticsEvent(TELOS_ANALYTICS_EVENT_NAMES.loginStarted);
                    }

                    if (newState.open === false) {
                        if (wagmiConnected()) {
                            settle(this.walletConnectLogin(network));
                            return;
                        } else {
                            useFeedbackStore().unsetLoading(`${this.getName()}.login`);
                            this.trace(
                                'login',
                                'trackAnalyticsEvent -> login failed',
                                'WalletConnect',
                                TELOS_ANALYTICS_EVENT_NAMES.loginFailedWalletConnect,
                            );
                            chainSettings.trackAnalyticsEvent(TELOS_ANALYTICS_EVENT_NAMES.loginFailedWalletConnect);
                            settle(null);
                            return;
                        }
                    }

                    if (wagmiConnected()) {
                        settle(this.walletConnectLogin(network));
                    }
                });
                this.web3Modal.openModal().catch((error) => {
                    this.trace('login', 'web3Modal.openModal() failed', error);
                    fail(new AntelopeError('antelope.evm.error_login'));
                });
            });
        }
    }

    private setDefaultChainForNetwork(network: string): void {
        const chainId = +useChainStore().getNetworkSettings(network).getChainId();
        const defaultChain = this.wagmiClient?.chains.find(chain => +chain.id === chainId);

        if (defaultChain) {
            this.web3Modal.setDefaultChain(defaultChain);
        }
    }

    private cleanupWeb3ModalSubscription(): void {
        if (this.unsubscribeWeb3Modal) {
            this.unsubscribeWeb3Modal();
            this.unsubscribeWeb3Modal = null;
        }
    }

    // Reset QR flag only. Do NOT null options/wagmiClient — later reconnect and
    // writes still need the Web3Modal instance / client references.
    clearAuthenticator(): void {
        this.trace('clearAuthenticator');
        this.usingQR = false;
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

    async isConnectedTo(chainId: string): Promise<boolean> {
        this.trace('isConnectedTo', chainId);

        if (usePlatformStore().isMobile) {
            this.trace('isConnectedTo', 'mobile -> true');
            return true;
        }

        return new Promise(async (resolve) => {
            const web3Provider = await this.web3Provider();
            const correct = +web3Provider.network.chainId === +chainId;
            this.trace('isConnectedTo', chainId, correct ? 'OK!' : 'not connected');
            resolve(correct);
        });
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

    async web3Provider(): Promise<ethers.providers.Web3Provider> {
        let web3Provider = null;
        if (usePlatformStore().isMobile || this.usingQR) {
            const p:RpcEndpoint = this.getChainSettings().getRPCEndpoint();
            const url = `${p.protocol}://${p.host}:${p.port}${p.path ?? ''}`;
            web3Provider = new ethers.providers.JsonRpcProvider(url);
            this.trace('web3Provider', 'JsonRpcProvider ->', web3Provider);

            // This is a hack to make the QR code work.
            // this code is going to be used in EVMAuthenticator.ts login method
            const listAccounts: () => Promise<`0x${string}`[]> = async () => [getAccount().address as addressString];
            web3Provider.listAccounts = listAccounts;

        } else {
            web3Provider = new ethers.providers.Web3Provider(await this.externalProvider());
            this.trace('web3Provider', 'Web3Provider ->', web3Provider);
        }
        await web3Provider.ready;
        return web3Provider as ethers.providers.Web3Provider;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    handleCatchError(error: any): AntelopeError {
        this.trace('handleCatchError', error);
        if (error instanceof AntelopeError) {
            return error;
        }
        const message = String(error?.message ?? '');
        const errName = String(error?.name ?? '');
        if (errName === 'ConnectorNotFoundError' || message.includes('Connector not found')) {
            return new AntelopeError('antelope.evm.error_connector_not_found');
        }
        if (message.includes('User rejected the')) {
            return new AntelopeError('antelope.evm.error_transaction_canceled');
        }
        return new AntelopeError('antelope.evm.error_send_transaction', { error });
    }

    async sendSystemToken(to: string, amount: ethers.BigNumber): Promise<SendTransactionResult> {
        this.trace('sendSystemToken', to, amount.toString());
        await this.ensureLiveConnector();
        return sendTransaction(this.sendConfig as PrepareSendTransactionResult).then(
            (transaction: SendTransactionResult) => transaction,
        ).catch((error) => {
            throw this.handleCatchError(error);
        });
    }

    async signCustomTransaction(contract: string, abi: EvmABI, parameters: EvmFunctionParam[], value?: BigNumber): Promise<WriteContractResult> {
        this.trace('signCustomTransaction', contract, [abi], parameters, value?.toString());

        await this.ensureLiveConnector();

        const method = abi[0].name;
        if (abi.length > 1) {
            console.warn(
                `signCustomTransaction: abi contains more than one function,
                we assume the first one (${method}) is the one to be called`,
            );
        }

        const chainSettings = this.getChainSettings();

        const config = {
            chainId: +chainSettings.getChainId(),
            address: contract,
            abi: abi,
            functionName: method,
            args: parameters,
        } as {
            chainId: number;
            address: addressString;
            abi: EvmABI;
            functionName: string;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            args: any[];
            value?: bigint;
        };

        if (value) {
            config.value = BigInt(value.toString());
        }

        try {
            this.trace('signCustomTransaction', 'prepareWriteContract ->', config);
            const sendConfig = await prepareWriteContract(config);

            this.trace('signCustomTransaction', 'writeContract ->', sendConfig);
            return await writeContract(sendConfig);
        } catch (error) {
            throw this.handleCatchError(error);
        }
    }

    readyForTransfer(): boolean {
        return !!this.sendConfig;
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
            await this.ensureLiveConnector();
            if (token.isSystem) {
                this.sendConfig = await prepareSendTransaction({
                    to,
                    value: BigInt(amount.toString()),
                    chainId: +useChainStore().getChain(this.label).settings.getChainId(),
                });
            } else {
                const abi = useContractStore().getTokenABI(token.type);
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
        this.sendConfig = null;
        await this._debouncedPrepareTokenConfig(token, amount, to);
    }

    async ensureCorrectChain(): Promise<ethers.providers.Web3Provider> {
        this.trace('ensureCorrectChain', 'QR:', this.usingQR);
        if (this.usingQR) {
            // we don't have tools to check the chain when using QR
            return this.web3Provider();
        } else {
            return super.ensureCorrectChain();
        }
    }

}
