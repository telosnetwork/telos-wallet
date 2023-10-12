import { BigNumber } from 'ethers';

// 1 Quadrillion. Any allowance above this amount is considered 'unlimited'
export const UNLIMITED_ALLOWANCE_THRESHOLD = BigNumber.from('1000000000000000');

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
    allowance?: BigNumber;

    // balance amount expressed in the token's smallest unit, e.g. 6 decimals for USDT or wei for TLOS/ETH
    balance: BigNumber;

    tokenDecimals: number; // decimals for the token (e.g. 6 for USDT, 18 for TLOS/ETH)
    tokenSymbol: string; // e.g. TLOS, USDT, etc.
    tokenLogo?: string; // path or URI for the token logo (optional)
}

export interface ShapedAllowanceRowERC1155 extends AllowanceRow {
    collectionAddress: string; // address of the collection/contract
    collectionName?: string; // name of the collection
    allowed: boolean; // whether the user has approved the spender for the entire collection

    // represents the total number of tokens the user owns in the entire collection
    // (the sum of each owned tokenId's amount)
    balance: BigNumber;
}

export interface ShapedAllowanceRowSingleERC721 extends AllowanceRow {
    tokenId: string; // tokenId for owned NFT
    tokenName: string; // name of the NFT
    allowed: boolean; // whether the user has approved the spender for the given NFT
    collectionAddress: string; // address of the collection/contract
    collectionName?: string; // name of the collection
}

export interface ShapedAllowanceRowERC721Collection extends AllowanceRow {
    // represents the total number of tokens the user owns in the entire collection
    // (the sum of each owned tokenId in the collection)
    balance: BigNumber;
    allowed: boolean; // whether the user has approved the spender for the entire collection
    collectionAddress: string; // address of the collection/contract
    collectionName?: string; // name of the collection
}

export type ShapedAllowanceRow = ShapedAllowanceRowERC20 | ShapedAllowanceRowERC1155 | ShapedAllowanceRowSingleERC721 | ShapedAllowanceRowERC721Collection;
