/**
 * REX: This store is responsible for accessing and interacting with the EOSIO REX contract.
 *
 * When any of the accounts in the Account store change, the handles are called to retrieve
 * the state of that account in the REX system.
 */

import { ethers } from 'ethers';
import { defineStore } from 'pinia';
import { filter } from 'rxjs';
import { AntelopeError, EvmRexDeposit, Label, TransactionResponse } from 'src/antelope/types';
import { toRaw } from 'vue';
import { AccountModel, useAccountStore } from 'src/antelope/stores/account';
import EVMChainSettings from 'src/antelope/chains/EVMChainSettings';
import { WEI_PRECISION } from 'src/antelope/stores/utils';
import { subscribeForTransactionReceipt } from 'src/antelope/stores/utils/trx-utils';
import { createTraceFunction } from 'src/antelope/config';
import { prettyTimePeriod } from 'src/antelope/stores/utils/date-utils';

// dependencies --
import {
    CURRENT_CONTEXT,
    getAntelope,
    useFeedbackStore,
    useBalancesStore,
    useChainStore,
    useContractStore,
} from 'src/antelope';

export interface RexModel {
    withdrawable: ethers.BigNumber;
    balance: ethers.BigNumber;
    totalStaking: ethers.BigNumber;
    period: number; // unstake period in seconds
}

export interface NativeRexModel extends RexModel {
    _: boolean; // dummy property to avoid lint issues
}

export interface EvmRexModel extends RexModel {
    withdrawable: ethers.BigNumber;
    deposits: EvmRexDeposit[];
    balance: ethers.BigNumber;
    totalStaking: ethers.BigNumber;
}


export interface RexState {
    __rexData: { [label: Label]: RexModel };
}

const store_name = 'rex';

export const useRexStore = defineStore(store_name, {
    state: (): RexState => (rexInitialState),
    getters: {
        getRexData: state => (label: string) => state.__rexData[label] ?? null,
        getEvmRexData: state => (label: string) => state.__rexData[label] as EvmRexModel,
        getNativeRexData: state => (label: string) => state.__rexData[label] as NativeRexModel,
        getUnstakingPeriodString: state => (label: string) =>
            prettyTimePeriod(
                // period for the label network
                state.__rexData[label]?.period ?? null,
                // translation function only takes the key name, without the path and adds the prefix
                (key:string) => getAntelope().config.localizationHandler(`antelope.words.${key}`),
                // force to show days instead of being dynamic,
                'days',
                // force to round the number
                true,
            ),

    },
    actions: {
        trace: createTraceFunction(store_name),
        init: () => {
            getAntelope().events.onAccountChanged.pipe(
                filter(({ label, account }) => !!label && !!account),
            ).subscribe({
                next: async ({ label, account }) => {
                    if (label === CURRENT_CONTEXT) {
                        await useRexStore().updateRexDataForAccount(label, toRaw(account));
                    }
                },
            });
        },
        /**
         * auxiliar method to get a contract instance. Only used internally.
         * @param label identifies the context (network on this case) for the data
         * @param address the contract address
         * @returns the contract instance
         */
        async getContractInstance(label: string, address: string) {
            this.trace('getContractInstance', label);
            const contract = await useContractStore().getContract(label, address);
            if (!contract) {
                this.trace('getContractInstance', label, '-> no contract');
                throw new AntelopeError('antelope.rex.error_contract_not_found', { address });
            }
            const contractInstance = await contract.getContractInstance();
            return contractInstance;
        },
        /**
         * auxiliar method to get the staked system contract instance
         * @param label identifies the context (network on this case) for the data
         * @returns the contract instance
         */
        async getStakedSystemContractInstance(label: string) {
            this.trace('getStakedSystemContractInstance', label);
            const address = (useChainStore().getChain(label).settings as EVMChainSettings).getStakedSystemToken().address;
            this.trace('getStakedSystemContractInstance', label, address);
            return this.getContractInstance(label, address);
        },
        /**
         * auxiliar method to get the escrow contract instance
         * @param label identifies the context (network on this case) for the data
         * @returns the contract instance
         */
        async getEscrowContractInstance(label: string) {
            this.trace('getEscrowContractInstance', label);
            const address = (useChainStore().getChain(label).settings as EVMChainSettings).getEscrowContractAddress();
            this.trace('getEscrowContractInstance', label, address);
            return this.getContractInstance(label, address);
        },
        /**
         * This method should be called to check if the REX system is available for a given context.
         * @param label identifies the context (network on this case) for the data
         * @returns true if the REX system is available for the given context
         */
        isNetworkEVM(label: string) {
            return !useChainStore().getChain(label).settings.isNative();
        },
        /**
         * This method queries the total amount of staked tokens in the system and maintains it in the store.
         * @param label identifies the context (network on this case) for the data
         */
        async updateTotalStaking(label: string) {
            this.trace('updateTotalStaking', label);
            if (this.isNetworkEVM(label)) {
                const contract = await this.getStakedSystemContractInstance(label);
                const totalStaking = await contract.totalAssets();
                this.setTotalStaking(label, totalStaking);
            } else {
                this.trace('updateTotalStaking', label, 'not supported for native chains yet');
            }
        },

        /**
         * This method queries the unstaking period for a given chain and maintains it in the store.
         * @param label identifies the context (network on this case) for the data
         */
        async updateUnstakingPeriod(label: string) {
            this.trace('updateUnstakingPeriod', label);
            if (this.isNetworkEVM(label)) {
                const contract = await this.getEscrowContractInstance(label);
                const period = await contract.lockDuration();
                this.setUnstakingPeriod(label, period.toNumber());
            } else {
                this.trace('updateUnstakingPeriod', label, 'not supported for native chains yet');
            }
        },

        /**
         * This method should be called to update the REX data for a given context.
         * @param label identifies the context (account and network) for the data
         */
        async updateRexData(label: string) {
            this.trace('updateRexData', label);
            const account = useAccountStore().getAccount(label);
            if (account) {
                await this.updateRexDataForAccount(label, account);
            }
        },
        /**
         * This method shopuld be called to quiery the REX data for a given account,
         * along with the current stato of the total staked tokens on the system.
         * @param label identifies the context (network on this case) for the data
         * @param account the account to update the data for
         */
        async updateRexDataForAccount(label: string, account: AccountModel | null) {
            this.trace('updateRexDataForAccount', label, account);
            useFeedbackStore().setLoading('updateRexDataForAccount');
            try {
                await Promise.all([
                    this.updateWithdrawable(label),    // account's data
                    this.updateDeposits(label),        // account's data
                    this.updateBalance(label),         // account's data
                    this.updateTotalStaking(label),    // system's data
                    this.updateUnstakingPeriod(label), // system's data
                ]);
            } catch (error) {
                console.error(error);
                useFeedbackStore().unsetLoading('updateRexDataForAccount');
            }
        },
        /**
         * This method queries the withdrawable amount for a given account and maintains it in the store.
         * The withdrawable amount is the amount of tokens that can be withdrawn from the REX system right now.
         * @param label identifies the context (account-network) for the data
         */
        async updateWithdrawable(label: string) {
            this.trace('updateWithdrawable', label);
            if (this.isNetworkEVM(label)) {
                const contract = await this.getEscrowContractInstance(label);
                const address = useAccountStore().getAccount(label).account;
                const withdrawable = await contract.maxWithdraw(address);
                this.setWithdrawable(label, withdrawable);
            } else {
                this.trace('updateWithdrawable', label, 'not supported for native chains yet');
            }
        },
        /**
         * This method queries the deposits for a given account and maintains it in the store.
         * The deposits contains a list of individual whitdrawls attempts, each with an amount and a date.
         * If the date is in the future, the amount is not available for withdrawal yet.
         * @param label identifies the context (account-network) for the data
         */
        async updateDeposits(label: string) {
            this.trace('updateDeposits', label);
            if (this.isNetworkEVM(label)) {
                const contract = await this.getEscrowContractInstance(label);
                const address = useAccountStore().getAccount(label).account;
                const deposits = await contract.depositsOf(address);
                this.setDeposits(label, deposits);
            } else {
                this.trace('updateDeposits', label, 'not supported for native chains yet');
            }
        },
        /**
         * This method queries the balance for a given account and maintains it in the store.
         * The account's balance is the sum of all the deposits (withdrawable or not)
         * @param label identifies the context (account-network) for the data
         */
        async updateBalance(label: string) {
            this.trace('updateBalance', label);
            if (this.isNetworkEVM(label)) {
                const contract = await this.getEscrowContractInstance(label);
                const address = useAccountStore().getAccount(label).account;
                const balance = await contract.balanceOf(address);
                this.setBalance(label, balance);
            } else {
                this.trace('updateBalance', label, 'not supported for native chains yet');
            }
        },
        /**
         * utility function to get the number of decimals for the staked system token
         * @returns the number of decimals for the staked system token
         */
        getStakingDecimals() {
            return useChainStore().currentEvmChain?.settings.getStakedSystemToken().decimals || WEI_PRECISION;
        },
        // transactions ----------
        /**
         * This method should be called by any transaction performed by this store. It subscribes to the transaction
         * receipt and updates the balance and rex status for the account if the transaction is successful.
         * @param account account performing the transaction
         * @param response the transaction response holding the hash
         * @returns the same transaction response but modified by the utility function subscribeForTransactionReceipt
         */
        async subscribeForTransactionReceipt(account: AccountModel, response: TransactionResponse): Promise<TransactionResponse> {
            this.trace('subscribeForTransactionReceipt', account.account, response.hash);
            return subscribeForTransactionReceipt(account, response).then(({ newResponse, receipt }) => {
                newResponse.wait().then(() => {
                    this.trace('subscribeForTransactionReceipt', newResponse.hash, 'receipt:', receipt.status, receipt);
                    this.updateRexDataForAccount(CURRENT_CONTEXT, account);
                    useBalancesStore().updateBalancesForAccount(CURRENT_CONTEXT, account);
                });
                return newResponse;
            });
        },
        /**
         * Performs the staking of System Tokens for a given account on the REX system of a given network.
         * @param label identifies the context (account-network) for the data
         * @param amount the amount of tokens to stake
         * @returns the transaction response holding the hash and a wait method to subscribe to the transaction receipt
         */
        async stakeEVMSystemTokens(label: string, amount: ethers.BigNumber): Promise<TransactionResponse> {
            const funcname = 'stakeEVMSystemTokens';
            this.trace(funcname, label, amount.toString());

            try {
                useFeedbackStore().setLoading(funcname);
                const account = useAccountStore().getAccount(label);
                const authenticator = useAccountStore().getEVMAuthenticator(label);
                return await authenticator.stakeSystemTokens(amount)
                    .then(r => this.subscribeForTransactionReceipt(account, r as TransactionResponse));
            } catch (error) {
                const trxError = getAntelope().config.transactionError('antelope.evm.error_stakes_failed', error);
                getAntelope().config.transactionErrorHandler(trxError, funcname);
                throw trxError;
            } finally {
                useFeedbackStore().unsetLoading(funcname);
            }
        },
        /**
         * Performs the unstaking of Staked System tokens for a given account on the REX system of a given network.
         * @param label identifies the context (account-network) for the data
         * @param amount the amount of tokens to unstake
         * @returns the transaction response holding the hash and a wait method to subscribe to the transaction receipt
         */
        async unstakeEVMSystemTokens(label: string, amount: ethers.BigNumber): Promise<TransactionResponse> {
            const funcname = 'unstakeEVMSystemTokens';
            this.trace(funcname, label, amount.toString());

            try {
                useFeedbackStore().setLoading(funcname);
                const account = useAccountStore().getAccount(label);
                const authenticator = useAccountStore().getEVMAuthenticator(label);
                return await authenticator.unstakeSystemTokens(amount)
                    .then(r => this.subscribeForTransactionReceipt(account, r as TransactionResponse));
            } catch (error) {
                const trxError = getAntelope().config.transactionError('antelope.evm.error_unstakes_failed', error);
                getAntelope().config.transactionErrorHandler(trxError, funcname);
                throw trxError;
            } finally {
                useFeedbackStore().unsetLoading(funcname);
            }
        },
        /**
         * Performs the withdrawal of staked tokens for a given account on the REX system of a given network.
         * @param label identifies the context (account-network) for the data
         * @param amount the amount of tokens to withdraw
         * @returns the transaction response holding the hash and a wait method to subscribe to the transaction receipt
         */
        async withdrawEVMSystemTokens(label: string, amount: ethers.BigNumber): Promise<TransactionResponse> {
            const funcname = 'withdrawEVMSystemTokens';
            this.trace(funcname, label, amount.toString());

            try {
                useFeedbackStore().setLoading(funcname);
                const account = useAccountStore().getAccount(label);
                const authenticator = useAccountStore().getEVMAuthenticator(label);
                return await authenticator.withdrawUnstakedTokens()
                    .then(r => this.subscribeForTransactionReceipt(account, r as TransactionResponse));
            } catch (error) {
                const trxError = getAntelope().config.transactionError('antelope.evm.error_withdraw_failed', error);
                getAntelope().config.transactionErrorHandler(trxError, funcname);
                throw trxError;
            } finally {
                useFeedbackStore().unsetLoading(funcname);
            }
        },
        // commits ---------------
        setWithdrawable(label: string, withdrawable: ethers.BigNumber) {
            const num = parseFloat(ethers.utils.formatUnits(withdrawable, this.getStakingDecimals()));
            this.trace('setWithdrawable', label, num);
            this.__rexData[label] = this.__rexData[label] || {};
            (this.__rexData[label] as EvmRexModel).withdrawable = withdrawable;
        },
        setDeposits(label: string, deposits: EvmRexDeposit[]) {
            // we need to clone the deposits parameter because it is read-only and we can't directly sort it.
            const editable_clone = (deposits || []).slice();
            editable_clone.sort((a, b) => a.until.toNumber() - b.until.toNumber());
            this.trace('setDeposits', label, ... editable_clone.map(d => parseFloat(ethers.utils.formatUnits(d.amount, this.getStakingDecimals()))));
            this.__rexData[label] = this.__rexData[label] || {};
            (this.__rexData[label] as EvmRexModel).deposits = editable_clone;
        },
        setBalance(label: string, balance: ethers.BigNumber) {
            const num = parseFloat(ethers.utils.formatUnits(balance, this.getStakingDecimals()));
            this.trace('setBalance', label, num);
            this.__rexData[label] = this.__rexData[label] || {};
            (this.__rexData[label] as EvmRexModel).balance = balance;
        },
        setTotalStaking(label: string, totalStaking: ethers.BigNumber) {
            const num = parseFloat(ethers.utils.formatUnits(totalStaking, this.getStakingDecimals()));
            this.trace('setTotalStaking', label, num);
            this.__rexData[label] = this.__rexData[label] || {};
            (this.__rexData[label] as EvmRexModel).totalStaking = totalStaking;
        },
        setUnstakingPeriod(label: string, period: number) {
            this.trace('setUnstakingPeriod', label, period);
            this.__rexData[label] = this.__rexData[label] || {};
            (this.__rexData[label] as EvmRexModel).period = period;
        },
    },
});

const rexInitialState: RexState = {
    __rexData: {},
};
