import { BigNumber } from 'ethers';

// this is the largest possible uint256 value, which is used to represent 'infinite' allowances
export const MAX_UINT_256 = BigNumber.from(2).pow(256).sub(1);

// Any allowance below this amount is considered 'tiny'
export const TINY_ALLOWANCE_THRESHOLD = 0.01;

// some notes about allowances:
// 1. ERC721 tokens can be approved for a single token (e.g. approve) or for all tokens in a collection (e.g. setApprovalForAll)
// 2. ERC1155 tokens can only be approved for all tokens in a collection (e.g. setApprovalForAll)
// 3. ERC721 and ERC1155 token allowances have no 'amount' - they are either approved or not approved
interface AllowanceRow {
    lastUpdated: number; // timestamp of the last time the allowance was updated - ms since epoch
    spenderAddress: string; // address for the spender contract
    spenderName?: string; // name of the spender contract
}

export interface ShapedAllowanceRowERC20 extends AllowanceRow {
    tokenName: string; // e.g. Telos, Tether, etc.
    tokenAddress: string; // address for the token contract

    // allowance amount, expressed in the token's smallest unit, e.g. 6 decimals for USDT or wei for TLOS/ETH
    allowance: BigNumber;

    // balance amount expressed in the token's smallest unit, e.g. 6 decimals for USDT or wei for TLOS/ETH
    balance: BigNumber;

    tokenDecimals: number; // decimals for the token (e.g. 6 for USDT, 18 for TLOS/ETH)
    tokenSymbol: string; // e.g. TLOS, USDT, etc.
    tokenMaxSupply: BigNumber; // max supply for the token
    tokenPrice: number; // price of the token in USD (0 if not available)
    tokenLogo?: string; // path or URI for the token logo (optional)
}

export interface ShapedAllowanceRowNftCollection extends AllowanceRow {
    collectionAddress: string; // address of the collection/contract
    collectionName?: string; // name of the collection
    allowed: boolean; // whether the user has approved the spender for the entire collection

    // represents the total number of tokens the user owns in the entire collection
    // for ERC1155: the sum of each owned tokenId's amount
    // for ERC721: the number of owned tokens
    balance: BigNumber;
}

export interface ShapedAllowanceRowSingleERC721 extends AllowanceRow {
    tokenId: string; // tokenId for owned NFT
    tokenName: string; // name of the NFT
    allowed: boolean; // whether the user has approved the spender for the given NFT
    collectionAddress: string; // address of the collection/contract
    collectionName?: string; // name of the collection
}

export type ShapedAllowanceRow = ShapedAllowanceRowERC20 | ShapedAllowanceRowNftCollection | ShapedAllowanceRowSingleERC721;
export type ShapedCollectionAllowanceRow = ShapedAllowanceRowNftCollection | ShapedAllowanceRowSingleERC721;

// type guards for shaped allowance rows
export function isErc20AllowanceRow(row: ShapedAllowanceRow): row is ShapedAllowanceRowERC20 {
    return (row as ShapedAllowanceRowERC20).tokenDecimals !== undefined;
}

export function isErc721SingleAllowanceRow(row: ShapedAllowanceRow): row is ShapedAllowanceRowSingleERC721 {
    const { tokenId, tokenName } = row as ShapedAllowanceRowSingleERC721;

    return Boolean(tokenId && tokenName);
}

export function isNftCollectionAllowanceRow(row: ShapedAllowanceRow): row is ShapedAllowanceRowNftCollection {
    return !(isErc20AllowanceRow(row) || isErc721SingleAllowanceRow(row));
}

export enum AllowanceTableColumns {
    revoke = 'revoke',
    asset = 'asset',
    value = 'value',
    allowance = 'allowance',
    spender = 'spender',
    type = 'type',
    updated = 'updated',
}
