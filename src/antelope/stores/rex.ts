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
import { AntelopeError, Label } from 'src/antelope/types';
import { toRaw } from 'vue';
import { AccountModel, useAccountStore } from 'src/antelope/stores/account';
import { getAntelope, useChainStore, useEVMStore } from 'src/antelope';
import EVMChainSettings from 'src/antelope/chains/EVMChainSettings';



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
        async getStakedSystemContractInstance(label: string) {
            const address = (useChainStore().getChain(label).settings as EVMChainSettings).getStakedSystemToken().address;
            return this.getContractInstance(label, address);
        },
        async getEscrowContractInstance(label: string) {
            const address = (useChainStore().getChain(label).settings as EVMChainSettings).getEscrowContractAddress();
            return this.getContractInstance(label, address);
        },
        async updateTotalStaking(label: string) {
            this.trace('updateTotalStaking', label);
            const contract = await this.getStakedSystemContractInstance(label);
            const totalStaking = await contract.totalAssets();
            this.setTotalStaking(label, totalStaking);
        },
        async updateRexDataForAccount(label: string, account: AccountModel | null) {
            this.trace('updateRexDataForAccount', label, account);
            useFeedbackStore().setLoading('updateRexDataForAccount');
            try {
                await Promise.all([
                    this.updateWithdrawable(label),
                    this.updateDeposits(label),
                    this.updateBalance(label),
                    this.updateTotalStaking(label),
                ]);
            } catch (error) {
                console.error(error);
                useFeedbackStore().unsetLoading('updateRexDataForAccount');
            }
        },
        async updateWithdrawable(label: string) {
            this.trace('updateWithdrawable', label);
            const contract = await this.getEscrowContractInstance(label);
            const address = useAccountStore().getAccount(label).account;
            const withdrawable = await contract.maxWithdraw(address);
            this.setWithdrawable(label, withdrawable);
        },
        async updateDeposits(label: string) {
            this.trace('updateDeposits', label);
            const contract = await this.getEscrowContractInstance(label);
            const address = useAccountStore().getAccount(label).account;
            const deposits = await contract.depositsOf(address);
            this.setDeposits(label, deposits);
        },
        async updateBalance(label: string) {
            this.trace('updateBalance', label);
            const contract = await this.getEscrowContractInstance(label);
            const address = useAccountStore().getAccount(label).account;
            const balance = await contract.balanceOf(address);
            this.setBalance(label, balance);
        },
        // commits ---------------
        setWithdrawable(label: string, withdrawable: ethers.BigNumber) {
            const num = parseFloat(ethers.utils.formatUnits(withdrawable, 18));
            this.trace('setWithdrawable', label, num);
            this.__rexData[label] = this.__rexData[label] || {};
            (this.__rexData[label] as EvmRexModel).withdrawable = withdrawable;
        },
        setDeposits(label: string, deposits: EvmRexDeposit[]) {
            this.trace('setDeposits', label, ... deposits.map(d => parseFloat(ethers.utils.formatUnits(d.amount, 18))));
            this.__rexData[label] = this.__rexData[label] || {};
            (this.__rexData[label] as EvmRexModel).deposits = deposits;
        },
        setBalance(label: string, balance: ethers.BigNumber) {
            const num = parseFloat(ethers.utils.formatUnits(balance, 18));
            this.trace('setBalance', label, num);
            this.__rexData[label] = this.__rexData[label] || {};
            (this.__rexData[label] as EvmRexModel).balance = balance;
        },
        setTotalStaking(label: string, totalStaking: ethers.BigNumber) {
            const num = parseFloat(ethers.utils.formatUnits(totalStaking, 18));
            this.trace('setTotalStaking', label, num);
            this.__rexData[label] = this.__rexData[label] || {};
            (this.__rexData[label] as EvmRexModel).totalStaking = totalStaking;
        },
    },
});

const rexInitialState: RexState = {
    __rexData: {},
};
