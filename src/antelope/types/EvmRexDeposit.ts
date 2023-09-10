import { ethers } from 'ethers';

export interface EvmRexDeposit {
    amount: ethers.BigNumber;
    until: ethers.BigNumber;
}
