/**
 * REX: This store is responsible for accessing and interacting with the EOSIO REX contract.
 *
 * When any of the accounts in the Account store change, the handles are called to retrieve
 * the state of that account in the REX system.
 */

import { ethers } from 'ethers';
import { defineStore } from 'pinia';
import { filter } from 'rxjs';
import {
    isTracingAll,
    createTraceFunction,
    useFeedbackStore,
} from 'src/antelope/stores/feedback';
import { AntelopeError, Label, TransactionResponse } from 'src/antelope/types';
import { toRaw } from 'vue';
import { AccountModel, useAccountStore } from 'src/antelope/stores/account';
import { getAntelope, useChainStore, useEVMStore } from 'src/antelope';
import EVMChainSettings from 'src/antelope/chains/EVMChainSettings';
import { WEI_PRECISION } from 'src/antelope/stores/utils';



export interface EvmRexDeposit {
    amount: ethers.BigNumber;
    until: ethers.BigNumber;
}

export interface RexModel {
    withdrawable: ethers.BigNumber;
    balance: ethers.BigNumber;
    totalStaking: ethers.BigNumber;
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
    },
    actions: {
        trace: createTraceFunction(store_name),
        init: () => {
            useFeedbackStore().setDebug(store_name, isTracingAll());
            getAntelope().events.onAccountChanged.pipe(
                filter(({ label, account }) => !!label && !!account),
            ).subscribe({
                next: async ({ label, account }) => {
                    if (label === 'current') {
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
            const authenticator = useAccountStore().getEVMAuthenticator(label);
            if (!authenticator) {
                this.trace('getStakedSystemContractInstance', label, '-> no authenticator');
                throw new AntelopeError('antelope.chain.error_no_default_authenticator');
            }
            const contract = await useEVMStore().getContract(authenticator, address);
            if (!contract) {
                this.trace('getStakedSystemContractInstance', label, '-> no contract');
                throw new AntelopeError('antelope.chain.error_no_default_authenticator');
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
            const address = (useChainStore().getChain(label).settings as EVMChainSettings).getStakedSystemToken().address;
            return this.getContractInstance(label, address);
        },
        /**
         * auxiliar method to get the escrow contract instance
         * @param label identifies the context (network on this case) for the data
         * @returns the contract instance
         */
        async getEscrowContractInstance(label: string) {
            const address = (useChainStore().getChain(label).settings as EVMChainSettings).getEscrowContractAddress();
            return this.getContractInstance(label, address);
        },
        /**
         * This method queries the total amount of staked tokens in the system and maintains it in the store.
         * @param label identifies the context (network on this case) for the data
         */
        async updateTotalStaking(label: string) {
            this.trace('updateTotalStaking', label);
            const contract = await this.getStakedSystemContractInstance(label);
            const totalStaking = await contract.totalAssets();
            this.setTotalStaking(label, totalStaking);
        },
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
                    this.updateWithdrawable(label),  // account's data
                    this.updateDeposits(label),      // account's data
                    this.updateBalance(label),       // account's data
                    this.updateTotalStaking(label),  // system's data
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
            const contract = await this.getEscrowContractInstance(label);
            const address = useAccountStore().getAccount(label).account;
            const withdrawable = await contract.maxWithdraw(address);
            this.setWithdrawable(label, withdrawable);
        },
        /**
         * This method queries the deposits for a given account and maintains it in the store.
         * The deposits contains a list of individual whitdrawls attempts, each with an amount and a date.
         * If the date is in the future, the amount is not available for withdrawal yet.
         * @param label identifies the context (account-network) for the data
         */
        async updateDeposits(label: string) {
            this.trace('updateDeposits', label);
            const contract = await this.getEscrowContractInstance(label);
            const address = useAccountStore().getAccount(label).account;
            const deposits = await contract.depositsOf(address);
            this.setDeposits(label, deposits);
        },
        /**
         * This method queries the balance for a given account and maintains it in the store.
         * The account's balance is the sum of all the deposits (withdrawable or not)
         * @param label identifies the context (account-network) for the data
         */
        async updateBalance(label: string) {
            this.trace('updateBalance', label);
            const contract = await this.getEscrowContractInstance(label);
            const address = useAccountStore().getAccount(label).account;
            const balance = await contract.balanceOf(address);
            this.setBalance(label, balance);
        },
        /**
         * utility method to get the number of decimals for the staked system token
         * @returns the number of decimals for the staked system token
         */
        getStakingDecimals() {
            return useChainStore().currentEvmChain?.settings.getStakedSystemToken().decimals || WEI_PRECISION;
        },
        // transactions ----------
        async stakeSystemTokens(label: string, amount: ethers.BigNumber): Promise<TransactionResponse> {
            // TODO: implement
            console.error('stakeSystemTokens not implemented yet');
            this.trace('stakeSystemTokens', label, amount);
            return {} as TransactionResponse;
        },
        // commits ---------------
        setWithdrawable(label: string, withdrawable: ethers.BigNumber) {
            const num = parseFloat(ethers.utils.formatUnits(withdrawable, this.getStakingDecimals()));
            this.trace('setWithdrawable', label, num);
            this.__rexData[label] = this.__rexData[label] || {};
            (this.__rexData[label] as EvmRexModel).withdrawable = withdrawable;
        },
        setDeposits(label: string, deposits: EvmRexDeposit[]) {
            this.trace('setDeposits', label, ... deposits.map(d => parseFloat(ethers.utils.formatUnits(d.amount, this.getStakingDecimals()))));
            this.__rexData[label] = this.__rexData[label] || {};
            (this.__rexData[label] as EvmRexModel).deposits = deposits;
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
    },
});

const rexInitialState: RexState = {
    __rexData: {},
};
