import { BigNumber, ethers } from 'ethers';
import { useEVMStore, useFeedbackStore } from 'src/antelope';
import { AntelopeError, EvmTransactionResponse, TokenClass, addressString } from 'src/antelope/types';
import { EVMAuthenticator } from 'src/antelope/wallets';
import { toRaw } from 'vue';

const name = 'Metamask';
export class MetamaskAuth extends EVMAuthenticator {

    // this is just a dummy label to identify the authenticator base class
    constructor(label = name) {
        super(label);
    }

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
        useFeedbackStore().setLoading(`${this.getName()}.login`);
        const response = await super.login(network);
        // store the signer for later use
        const provider = await useEVMStore().ensureProvider();
        const checkProvider = new ethers.providers.Web3Provider(provider);
        const signer = await checkProvider.getSigner();
        this.setExternalSigner(signer);
        useFeedbackStore().unsetLoading(`${this.getName()}.login`);
        return response;
    }

    async logout(): Promise<void> {
        this.trace('logout');
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
        this.trace('prepareTokenForTransfer', label, [token], amount, to);
        return new Promise((resolve) => {
            resolve();
        });
    }

    async isConnectedTo(chainId: string): Promise<boolean> {
        this.trace('isConnectedTo', chainId);
        return useEVMStore().isProviderOnTheCorrectChain(await this.web3Provider(), chainId);
    }

    async externalProvider(): Promise<ethers.providers.ExternalProvider> {
        return useEVMStore().ensureProvider();
    }

    async web3Provider(): Promise<ethers.providers.Web3Provider> {
        this.trace('web3Provider');
        const web3Provider = new ethers.providers.Web3Provider(await this.externalProvider());
        await web3Provider.ready;
        return web3Provider;
    }

    // ----------------------------------------------------------

    setExternalSigner(signer: ethers.Signer): void {
        this.trace('setExternalSigner', signer);
        useEVMStore().setExternalSigner(signer);
    }

}
