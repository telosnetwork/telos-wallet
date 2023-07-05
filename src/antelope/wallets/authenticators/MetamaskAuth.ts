import { BigNumber, ethers } from 'ethers';
import { useChainStore, useEVMStore, useFeedbackStore } from 'src/antelope';
import { AntelopeError, EvmTransactionResponse, ExceptionError, TokenClass, addressString } from 'src/antelope/types';
import { EVMAuthenticator } from 'src/antelope/wallets';
import { toRaw } from 'vue';

const name = 'Metamask';
export class MetamaskAuth extends EVMAuthenticator {

    // this is just a dummy label to identify the authenticator base class
    constructor(label = name) {
        super(label);
    }

    // EVMAuthenticator API ----------------------------------------------------------

    getName(): string {
        return name;
    }

    // this is the important instance creation where we define a label to asign to this instance of the authenticator
    newInstance(label: string): EVMAuthenticator {
        this.trace('newInstance', label);
        return new MetamaskAuth(label);
    }

    async login(network: string): Promise<addressString | null> {
        this.trace('login', network);
        const chain = useChainStore();
        const feedback = useFeedbackStore();
        try {
            feedback.setLoading('Authenticator.login');
            chain.setLoggedChain(network);
            chain.setCurrentChain(network);

            const checkProvider = await this.ensureCorrectChain() as ethers.providers.Web3Provider;

            const accounts = await checkProvider.listAccounts();
            if (accounts.length > 0) {
                return accounts[0] as addressString;
            } else {
                if (!checkProvider.provider.request) {
                    // TODO: fixme. change variable name
                    throw new AntelopeError('antelope.evm.error_support_provider_request');
                }
                const accessGranted = await checkProvider.provider.request({ method: 'eth_requestAccounts' });
                if (accessGranted.length < 1) {
                    return null;
                }
                return accessGranted[0] as addressString;
            }
        } catch (error) {
            if ((error as unknown as ExceptionError).code === 4001) {
                // TODO: fixme. change variable name
                throw new AntelopeError('antelope.evm.error_connect_rejected');
            } else {
                console.error('Error:', error);
                // TODO: fixme. change variable name
                throw new AntelopeError('antelope.evm.error_login');
            }
        } finally {
            feedback.unsetLoading('Authenticator.login');
            const provider = await useEVMStore().ensureProvider();
            const checkProvider = new ethers.providers.Web3Provider(provider);
            const signer = await checkProvider.getSigner();
            this.setExternalSigner(signer);
        }
    }

    async logout(): Promise<void> {
        this.trace('logout');
        // TODO: is there anythig to do here?
    }

    async getSystemTokenBalance(label:string, address: addressString | string): Promise<BigNumber> {
        this.trace('getSystemTokenBalance', address);
        const evm = useEVMStore();
        const provider = toRaw(evm.rpcProvider);
        if (provider) {
            return provider.getBalance(address);
        } else {
            throw new AntelopeError('antelope.evm.error_no_provider');
        }
    }

    getERC20TokenBalance(label:string, address: addressString | string, tokenAddress: addressString | string): Promise<BigNumber> {
        this.trace('getERC20TokenBalance', label, [address, tokenAddress]);
        return useEVMStore().getERC20TokenBalance(address, tokenAddress);
    }

    async transferTokens(label:string, token: TokenClass, amount: BigNumber, to: addressString): Promise<EvmTransactionResponse> {
        this.trace('transferTokens', label, token, amount, to);
        const evm = useEVMStore();
        if (token.isSystem) {
            return evm.sendSystemToken(to, amount);
        } else {
            const contract = await evm.getContract(token.address, token.type);
            if (contract) {
                const contractInstance = contract.getContractInstance();
                const amountInWei = amount.toString();
                return contractInstance.transfer(to, amountInWei);
            } else {
                throw new AntelopeError('antelope.balances.error_token_contract_not_found', { address: token.address });
            }
        }
    }

    prepareTokenForTransfer(label: string, token: TokenClass | null, amount: BigNumber, to: string): Promise<void> {
        console.log('prepareTokenForTransfer', label, [token], amount, to);
        this.trace('prepareTokenForTransfer', label, [token], amount, to);
        return new Promise((resolve) => {
            resolve();
        });
    }

    async isConnectedTo(chainId: string): Promise<boolean> {
        this.trace('isConnectedTo', chainId);
        return useEVMStore().isProviderOnTheCorrectChain(await this.web3Provider(), chainId);
    }

    async web3Provider(): Promise<ethers.providers.Web3Provider> {
        const externalProvider = await useEVMStore().ensureProvider();
        const web3Provider = new ethers.providers.Web3Provider(externalProvider);
        return web3Provider;
    }
    // ----------------------------------------------------------

    // functions that can be migrated from evm store
    async ensureCorrectChain(): Promise<ethers.providers.Web3Provider> {
        this.trace('ensureCorrectChain');
        const externalProvider = await useEVMStore().ensureProvider();
        let web3Provider = new ethers.providers.Web3Provider(externalProvider);
        web3Provider = await useEVMStore().ensureCorrectChain(web3Provider);
        return web3Provider;
    }

    setExternalSigner(signer: ethers.Signer): void {
        this.trace('setExternalSigner', signer);
        useEVMStore().setExternalSigner(signer);
    }

}
