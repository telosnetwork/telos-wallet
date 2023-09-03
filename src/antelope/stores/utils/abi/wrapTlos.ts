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
        constant: false,
        inputs: [
            {
                indexed: false,
                internalType: 'uint256',
                name: 'wad',
                type: 'uint256',
            },
        ],
        name: 'withdrawTLOS',
        outputs: [],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
    },
];
