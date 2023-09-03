import { usePlatformStore } from 'src/antelope';
import { ethers } from 'ethers';
import { AccountModel } from 'src/antelope/stores/account';
import { AntelopeError, TransactionResponse } from 'src/antelope/types';
import { EVMAuthenticator } from 'src/antelope/wallets';


export async function subscribeForTransactionReceipt(account: AccountModel, response: TransactionResponse): Promise<ethers.providers.TransactionReceipt> {
    if (account.isNative) {
        throw new AntelopeError('Not implemented yet for native');
    } else {
        const authenticator = account.authenticator as EVMAuthenticator;
        const provider = await authenticator.web3Provider();
        if (provider) {
            const whenConfirmed = provider.waitForTransaction(response.hash);
            // TODO: remove this console error
            console.error('subscribeForTransactionReceipt CONFIRMED!!', response.hash);
            // we add the wait method to the response,
            // so that the caller can subscribe to the confirmation event
            response.wait = async () => whenConfirmed;
            return whenConfirmed;
        } else {
            if (usePlatformStore().isMobile) {
                response.wait = async () => Promise.resolve({} as ethers.providers.TransactionReceipt);
                return Promise.resolve({} as ethers.providers.TransactionReceipt);
            } else {
                throw new AntelopeError('antelope.evm.error_no_provider');
            }
        }
    }
}
