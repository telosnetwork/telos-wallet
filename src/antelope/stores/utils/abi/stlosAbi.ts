import { EvmABI } from '.';

export const stlosAbiDeposit: EvmABI = [
    {
        constant: false,
        inputs: [],
        name: 'depositTLOS',
        outputs: [],
        payable: true,
        stateMutability: 'payable',
        type: 'function',
    },
];

export const stlosAbiWithdraw: EvmABI = [
    {
        inputs: [
            {
                indexed: false,
                internalType: 'uint256',
                name: 'assets',
                type: 'uint256',
            },
            {
                indexed: false,
                internalType: 'address',
                name: 'receiver',
                type: 'address',
            },
            {
                indexed: false,
                internalType: 'address',
                name: 'owner',
                type: 'address',
            },
        ],
        name: 'withdraw',
        outputs: [
            {
                internalType: 'uint256',
                name: '',
                type: 'uint256',
            },
        ],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
    },
];



export const stlosAbiPreviewRedeem: EvmABI = [
    {
        inputs: [
            {
                indexed: false,
                internalType: 'uint256',
                name: 'shares',
                type: 'uint256',
            },
        ],
        name: 'previewRedeem',
        outputs: [
            {
                internalType: 'uint256',
                name: '',
                type: 'uint256',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
];

// Full read ABI for STLOS contract (unverified on Blockscout)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const stlosAbiRead: any[] = [
    'function totalAssets() view returns (uint256)',
    'function previewDeposit(uint256 assets) view returns (uint256)',
    'function previewRedeem(uint256 shares) view returns (uint256)',
    'function balanceOf(address account) view returns (uint256)',
];

export const stlosAbiPreviewDeposit: EvmABI = [
    {
        inputs: [
            {
                indexed: false,
                internalType: 'uint256',
                name: 'assets',
                type: 'uint256',
            },
        ],
        name: 'previewDeposit',
        outputs: [
            {
                internalType: 'uint256',
                name: '',
                type: 'uint256',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
];

