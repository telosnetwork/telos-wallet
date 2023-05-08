import { ethers } from 'ethers';

// A type to represent the possible EVM token types
export type EvmTokenType = 'ERC20' | 'ERC721' | 'ERC1155' | 'ERC777' | 'ERC827' | 'ERC1400' | 'ERC223';

// A type to represent the source information for a token
interface TokenSourceInfo {
    symbol: string;
    contract?: string;
    address?: string;
    chainId: string;
    name: string;
    decimals?: number;
    type?: EvmTokenType;
    logo?: string;
    logoURI?: string;
    metadata?: string;
    precision?: number;
}

// A class to represent a blockchain token
export class Token {
    readonly id: string;
    readonly symbol: string;
    readonly name: string;
    readonly logo?: string;
    readonly contract: string;
    readonly chainId: string;
    readonly decimals: number;
    readonly type?: EvmTokenType;
    private _price: number;

    constructor(sourceInfo: TokenSourceInfo) {
        this.id = `${sourceInfo.symbol}-${sourceInfo.contract}-${sourceInfo.chainId}`;
        this.symbol = sourceInfo.symbol;
        this.contract = sourceInfo.contract ?? sourceInfo.address ?? '';
        this.chainId = sourceInfo.chainId;
        this.name = sourceInfo.name;
        this.decimals = sourceInfo.decimals ?? sourceInfo.precision ?? 0;
        this.type = sourceInfo.type;
        this.logo = sourceInfo.logo ?? sourceInfo.logoURI;
        this._price = 0;
    }

    // Returns true if the token is a native blockchain token
    get isNative(): boolean {
        return !this.type;
    }

    // Returns true if the token is an EVM token
    get isEvm(): boolean {
        return !!this.type;
    }

    // Returns the URI for the token logo
    get logoURI(): string | undefined {
        return this.logo;
    }

    // Returns the token price
    get price(): number {
        return this._price;
    }

    // Updates the token price
    updatePrice(price: number) {
        this._price = price;
    }
}

// A class to represent an EVM blockchain token
export class EvmToken extends Token {
    private _metadata?: string;

    constructor(sourceInfo: TokenSourceInfo) {
        super(sourceInfo);
        this._metadata = sourceInfo.metadata;
    }

    // Returns the token address (same as contract address)
    get address(): string {
        return this.contract;
    }

    // Returns the token metadata
    get metadata(): string | undefined {
        return this._metadata;
    }

    // Returns if the token has metadata
    get hasMetadata(): boolean {
        return !!this._metadata;
    }

    // Sets the token metadata
    setMetadata(metadata: string) {
        this._metadata = metadata;
    }
}

// A class to represent a native blockchain token
export class NativeToken extends Token {
    readonly precision: number;

    constructor(sourceInfo: TokenSourceInfo) {
        super(sourceInfo);
        this.precision = sourceInfo.precision || 0;
    }
}

// A class to represent the balance of a token
export class TokenBalance {
    readonly token: Token;
    readonly balance: string;
    readonly balanceBn: ethers.BigNumber;

    constructor(token: Token, balanceBn: ethers.BigNumber) {
        this.token = token;
        this.balanceBn = balanceBn;
        this.balance = balanceBn.toString(); // Convert balanceBn to a string representation
    }

    // Returns the fiat balance based on the current token price and balance
    get fiatBalance(): ethers.BigNumber {
        const price = ethers.utils.parseUnits(this.token.price.toString(), 18);
        const fiatDouble = this.balanceBn.mul(price);
        const fiat = fiatDouble.div(ethers.utils.parseUnits('1', 18));
        return fiat;
    }
}
