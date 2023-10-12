import { BigNumber } from 'ethers';

import { WEI_PRECISION } from 'src/antelope/stores/utils';
import { NativeCurrencyAddress } from 'src/antelope/types';
import {
    ShapedAllowanceRow,
    ShapedAllowanceRowERC1155,
    ShapedAllowanceRowERC20,
    ShapedAllowanceRowSingleERC721,
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
    tokenLogo: 'https://raw.githubusercontent.com/telosnetwork/images/master/logos_2021/Symbol%202.svg',
    spenderName: 'Super Spenderz',
};

const erc20AllowanceRowUnlimited: ShapedAllowanceRowERC20 = {
    tokenName: 'Tether (Multichain)',
    tokenAddress: '0xeFAeeE334F0Fd1712f9a8cc375f427D9Cdd40d73',
    tokenDecimals: 6,
    balance: BigNumber.from('654'.concat('0'.repeat(6))), // 654 USDT
    allowance: BigNumber.from('1000000000000000'.concat('0'.repeat(6))), // unlimited (1Q USDT)
    spenderAddress: '0x'.concat('2'.repeat(40)),
    lastUpdated: (new Date('November 7, 2018 10:24')).getTime(),
    tokenSymbol: 'USDT',
    tokenLogo: 'https://raw.githubusercontent.com/elkfinance/tokens/main/logos/avax/0xc7198437980c041c805A1EDcbA50c1Ce5db95118/logo.png',
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

const erc721AllowanceRowCollection: ShapedAllowanceRowSingleERC721 = {
    tokenName: 'Quantum Lotus #2',
    collectionAddress: '0x9718F90603bCA6d6C28C9f9319b25518Bc45EB73',
    collectionName: 'Quantum Lotus',
    lastUpdated: (new Date('July 7, 2023 21:46')).getTime(),
    spenderAddress: '0x'.concat('3'.repeat(40)),
    spenderName: 'Big Spenderz',
    tokenId: '2',
    allowed: true,
};

const erc1155AllowanceRow: ShapedAllowanceRowERC1155 = {
    lastUpdated: (new Date('February 13, 2021 09:33')).getTime(),
    spenderAddress: '0x'.concat('4'.repeat(40)),
    spenderName: 'Mega Spenderz',
    collectionAddress: '0xa46205F220dF8eE5Bfe11b2b672e729893f59f68',
    allowed: true,
    balance: BigNumber.from('27'),
};

export const shapedAllowanceRows: ShapedAllowanceRow[] = [
    erc20AllowanceRow,
    erc20AllowanceRowUnlimited,
    erc721AllowanceRowSingle,
    erc721AllowanceRowCollection,
    erc1155AllowanceRow,
];
