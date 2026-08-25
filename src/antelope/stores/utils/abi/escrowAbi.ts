import { EvmABI } from '.';

export const escrowAbiWithdraw: EvmABI = [
    {
        inputs: [],
        name: 'withdraw',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
];

// Full escrow ABI for reading staking data (lockDuration, maxWithdraw, balanceOf, depositsOf)
// Needed because the escrow contract is unverified on Blockscout
// Using ethers-compatible JSON ABI format (cast to any to bypass strict EvmABI types)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const escrowAbiRead: any[] = [
    'function lockDuration() view returns (uint256)',
    'function maxWithdraw(address owner) view returns (uint256)',
    'function balanceOf(address account) view returns (uint256)',
    'function depositsOf(address account) view returns (tuple(uint256 amount, uint256 until)[])',
    'function withdraw()',
];
