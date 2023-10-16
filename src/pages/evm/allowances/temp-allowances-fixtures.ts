import { BigNumber } from 'ethers';

import { WEI_PRECISION } from 'src/antelope/stores/utils';
import { NativeCurrencyAddress } from 'src/antelope/types';
import {
    ShapedAllowanceRow,
    ShapedAllowanceRowERC20,
    ShapedAllowanceRowSingleERC721,
    ShapedAllowanceRowNftCollection,
} from 'src/antelope/types/Allowances';

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
};

const erc20AllowanceRowHuge: ShapedAllowanceRowERC20 = {
    tokenName: 'Tether (Multichain)',
    tokenAddress: '0xeFAeeE334F0Fd1712f9a8cc375f427D9Cdd40d73',
    tokenDecimals: 6,
    balance: BigNumber.from('654'.concat('0'.repeat(6))), // 654 USDT
    allowance: BigNumber.from('1000000000000000'.concat('0'.repeat(6))), // huge (1Q USDT)
    spenderAddress: '0x'.concat('2'.repeat(40)),
    lastUpdated: (new Date('November 7, 2018 10:24')).getTime(),
    tokenSymbol: 'USDT',
};

const erc721AllowanceRowSingle: ShapedAllowanceRowSingleERC721 = {
    tokenName: 'Mino #4',
    collectionAddress: '0x8e1DDd46F663CB53254337D2134BAfe0170a29BA',
    collectionName: 'Mino',
    lastUpdated: (new Date('May 23, 2022 18:03')).getTime(),
    spenderAddress: '0x'.concat('3'.repeat(40)),
    spenderName: 'Big Spenderz',
    tokenId: '4',
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

const erc1155AllowanceRow: ShapedAllowanceRowNftCollection = {
    lastUpdated: (new Date('February 13, 2021 09:33')).getTime(),
    spenderAddress: '0x'.concat('4'.repeat(40)),
    spenderName: 'Mega Spenderz',
    collectionAddress: '0x24E72C50E4a4f9745A04568922e936365Bf32675',
    allowed: true,
    balance: BigNumber.from('27'),
};

export const shapedAllowanceRows: ShapedAllowanceRow[] = [
    erc20AllowanceRow,
    erc20AllowanceRowNoAllowance,
    erc20AllowanceRowHuge,
    erc721AllowanceRowSingle,
    erc721AllowanceRowCollection,
    erc1155AllowanceRow,
];
