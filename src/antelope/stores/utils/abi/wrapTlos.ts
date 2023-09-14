import { EvmABI } from '.';

export const wtlosAbiDeposit: EvmABI = [
    {
        constant: false,
        inputs: [],
        name: 'deposit',
        outputs: [],
        payable: true,
        stateMutability: 'payable',
        type: 'function',
    },
];

export const wtlosAbiWithdraw: EvmABI = [
    {
        constant: false,
        inputs: [
            {
                indexed: false,
                internalType: 'uint256',
                name: 'wad',
                type: 'uint256',
            },
        ],
        name: 'withdraw',
        outputs: [],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
    },
];

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
