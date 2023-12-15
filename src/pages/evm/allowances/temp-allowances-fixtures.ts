import { BigNumber } from 'ethers';

import { WEI_PRECISION } from 'src/antelope/stores/utils';
import { NativeCurrencyAddress } from 'src/antelope/types';
import {
    ShapedAllowanceRow,
    ShapedAllowanceRowERC20,
    ShapedAllowanceRowSingleERC721,
    ShapedAllowanceRowNftCollection,
} from 'src/antelope/types/Allowances';

const maxSupply = BigNumber.from('123456789012345678901234567890');

const erc20AllowanceRow: ShapedAllowanceRowERC20 = {
    tokenName: 'Telos',
    tokenAddress: NativeCurrencyAddress,
    tokenDecimals: WEI_PRECISION,
    balance: BigNumber.from('123456'.concat('0'.repeat(WEI_PRECISION))), // 123,456 TLOS
    allowance: BigNumber.from('15'.concat('0'.repeat(WEI_PRECISION))), // 15 TLOS
    spenderAddress: '0x'.concat('1'.repeat(40)),
    lastUpdated: (new Date('June 1, 2021 13:05')).getTime(),
    tokenSymbol: 'TLOS',
    tokenPrice: 0.06,
    tokenLogo: 'https://raw.githubusercontent.com/telosnetwork/images/master/logos_2021/Symbol%202.svg',
    spenderName: 'Super Spenderz',
    tokenMaxSupply: maxSupply,
};

const erc20AllowanceRow2: ShapedAllowanceRowERC20 = {
    tokenName: 'USD Coin (Multichain)',
    tokenAddress: '0x818ec0A7Fe18Ff94269904fCED6AE3DaE6d6dC0b',
    tokenDecimals: 6,
    tokenPrice: 0.99,
    balance: BigNumber.from('7396'.concat('0'.repeat(6))), // 7,396 USDC
    allowance: BigNumber.from('10928365'.concat('0'.repeat(6))), // 10,928,365 USDC
    spenderAddress: '0x'.concat('1'.repeat(40)),
    lastUpdated: (new Date('June 7, 2022 13:05')).getTime(),
    tokenSymbol: 'USDC',
    tokenLogo: 'https://ipfs.io/ipfs/QmXfzKRvjZz3u5JRgC4v5mGVbm9ahrUiB4DgzHBsnWbTMM',
    spenderName: 'Super Spenderz',
    tokenMaxSupply: maxSupply,
};

const erc20AllowanceRow3: ShapedAllowanceRowERC20 = {
    tokenName: 'Yowza Coin',
    tokenAddress: '0x'.concat('1'.repeat(40)),
    tokenDecimals: 12,
    tokenPrice: 0,
    balance: BigNumber.from('832576762'.concat('0'.repeat(12))), // 832,576,762 YOWZA
    allowance: BigNumber.from('8096346703467341346'.concat('0'.repeat(12))), // 8,096,346,703,467,341,346 YOWZA
    spenderAddress: '0x'.concat('1'.repeat(40)),
    lastUpdated: (new Date('June 7, 2022 13:05')).getTime(),
    tokenSymbol: 'YOWZA',
    spenderName: 'Super Spenderz',
    tokenMaxSupply: maxSupply,
};

const erc20AllowanceRowNoAllowance: ShapedAllowanceRowERC20 = {
    tokenName: 'Staked Telos',
    tokenAddress: '0xB4B01216a5Bc8F1C8A33CD990A1239030E60C905',
    tokenDecimals: WEI_PRECISION,
    balance: BigNumber.from('12'.concat('0'.repeat(WEI_PRECISION))), // 12 STLOS
    allowance: BigNumber.from(0), // 0 STLOS
    spenderAddress: '0x'.concat('1'.repeat(40)),
    lastUpdated: (new Date('August 19, 2021 17:01')).getTime(),
    tokenSymbol: 'STLOS',
    tokenLogo: 'https://raw.githubusercontent.com/telosnetwork/teloscan/master/public/stlos-logo.png',
    spenderName: 'Ultra Spenderz',
    tokenPrice: 1,
    tokenMaxSupply: maxSupply,
};

const erc20AllowanceRowHuge: ShapedAllowanceRowERC20 = {
    tokenName: 'Tether (Multichain)',
    tokenAddress: '0xeFAeeE334F0Fd1712f9a8cc375f427D9Cdd40d73',
    tokenDecimals: 6,
    tokenPrice: 1.01,
    balance: BigNumber.from('654'.concat('0'.repeat(6))), // 654 USDT
    allowance: BigNumber.from('1000000000000000'.concat('0'.repeat(6))), // huge (1Q USDT)
    spenderAddress: '0x'.concat('2'.repeat(40)),
    lastUpdated: (new Date('November 7, 2018 10:24')).getTime(),
    tokenLogo: 'https://raw.githubusercontent.com/elkfinance/tokens/main/logos/avax/0xc7198437980c041c805A1EDcbA50c1Ce5db95118/logo.png',
    tokenSymbol: 'USDT',
    tokenMaxSupply: maxSupply,
};

const erc721AllowanceRowSingleVideo: ShapedAllowanceRowSingleERC721 = {
    tokenName: 'Mino #4',
    collectionAddress: '0x8e1DDd46F663CB53254337D2134BAfe0170a29BA',
    collectionName: 'Mino',
    lastUpdated: (new Date('May 23, 2022 18:03')).getTime(),
    spenderAddress: '0x'.concat('3'.repeat(40)),
    spenderName: 'Big Spenderz',
    tokenId: '4',
    allowed: true,
};

const erc721AllowanceRowSingle: ShapedAllowanceRowSingleERC721 = {
    tokenName: 'TBGF #3',
    collectionAddress: '0xeF07FBcc4Fc0eE99EdeA24fe75b9c440efd7FCA8',
    collectionName: 'TBGFarmsSeason2ChipperChicks',
    lastUpdated: (new Date('October 15, 2023 07:15')).getTime(),
    spenderAddress: '0x'.concat('5'.repeat(40)),
    spenderName: 'Ultra Spenderz',
    tokenId: '3',
    allowed: true,
};

const erc721AllowanceRowCollection: ShapedAllowanceRowNftCollection = {
    collectionAddress: '0x27f4e87Fc4e5Ec6f1102a48B13B62877Ff306bDE',
    collectionName: 'Down Bad Kongz',
    lastUpdated: (new Date('July 7, 2023 21:46')).getTime(),
    spenderAddress: '0x'.concat('3'.repeat(40)),
    spenderName: 'Big Spenderz',
    balance: BigNumber.from('5'),
    allowed: true,
};

const erc721AllowanceRowCollection2: ShapedAllowanceRowNftCollection = {
    collectionAddress: '0x290a675668C0374A6D89Fd12f8bAA0e68529A096',
    collectionName: 'sixandup',
    lastUpdated: (new Date('December 4, 2022 12:48')).getTime(),
    spenderAddress: '0x'.concat('6'.repeat(40)),
    spenderName: 'Tiny Spenderz',
    balance: BigNumber.from('127'),
    allowed: true,
};

const erc1155AllowanceRow: ShapedAllowanceRowNftCollection = {
    lastUpdated: (new Date('February 13, 2021 09:33')).getTime(),
    spenderAddress: '0x'.concat('4'.repeat(40)),
    spenderName: 'Mega Spenderz',
    collectionAddress: '0x24E72C50E4a4f9745A04568922e936365Bf32675',
    allowed: true,
    balance: BigNumber.from('27'),
};

const erc1155AllowanceRow2: ShapedAllowanceRowNftCollection = {
    lastUpdated: (new Date('February 22, 2022 09:33')).getTime(),
    spenderAddress: '0x'.concat('9'.repeat(40)),
    collectionAddress: '0x17745f342fd736300F33Dcc811FaE3a3c97416EF',
    allowed: false,
    balance: BigNumber.from('1500'),
};

export const shapedAllowanceRows: ShapedAllowanceRow[] = [
    erc20AllowanceRow,
    erc20AllowanceRowNoAllowance,
    erc20AllowanceRow2,
    erc20AllowanceRow3,
    erc20AllowanceRowHuge,
    erc721AllowanceRowSingle,
    erc721AllowanceRowSingleVideo,
    erc721AllowanceRowCollection,
    erc721AllowanceRowCollection2,
    erc1155AllowanceRow,
    erc1155AllowanceRow2,
];
