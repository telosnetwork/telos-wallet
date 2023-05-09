import { ethers } from 'ethers';

// A type to represent the possible EVM token types
export type EvmTokenType = 'ERC20' | 'ERC721' | 'ERC1155' | 'ERC777' | 'ERC827' | 'ERC1400' | 'ERC223';

// A type to represent the source information for a token
interface TokenSourceInfo {
    symbol: string;                // Token symbol
    contract?: string;             // Token contract account name (for native)
    address?: string;              // Token contract address (for EVM)
    chainId: string;               // Chain ID (40 & 41 for Telos EVM) or hash (for native)
    name: string;                  // Token name (as a title)
    decimals?: number;             // Token amount of digits after the decimal point (as used in EVM)
    precision?: number;            // Token amount of digits after the decimal point (as used in native)
    type?: EvmTokenType;           // Token type (ERC20, ERC721, etc.)
    logo?: string;                 // Token logo uri (as used in native)
    logoURI?: string;              // Token logo uri (as used in EVM)
    metadata?: string;             // Token contract metadata (as used in EVM)
    isSystem: boolean;             // True if the token is the main system token
    isNative: boolean;             // True if the token is a Antelope native blockchain token (false for EVM)
}

// A class to represent a blockchain token
export class Token {
    readonly id: string;           // Unique ID for the token <symbol>-<contract>-<chainId>
    readonly symbol: string;       // Token symbol
    readonly name: string;         // Token name (as a title)
    readonly logo?: string;        // Token logo uri
    readonly contract: string;     // Token contract address (for EVM) or account name (for native)
    readonly chainId: string;      // Chain ID (40 & 41 for Telos EVM) or hash (for native)
    readonly decimals: number;     // Token amount of digits after the decimal point (same as precision for native)
    readonly isSystem: boolean;    // True if the token is the system token
    readonly isNative: boolean;    // True if the token is a native blockchain token
    private _price: number;        // Token price in USD

    constructor(sourceInfo: TokenSourceInfo) {
        this.id = `${sourceInfo.symbol}-${sourceInfo.contract}-${sourceInfo.chainId}`;
        this.symbol = sourceInfo.symbol;
        this.contract = sourceInfo.contract ?? sourceInfo.address ?? '';
        this.chainId = sourceInfo.chainId;
        this.name = sourceInfo.name;
        this.decimals = sourceInfo.decimals ?? sourceInfo.precision ?? 0;
        this.isSystem = sourceInfo.isSystem;
        this.isNative = sourceInfo.isNative;
        this.logo = sourceInfo.logo ?? sourceInfo.logoURI;
        this._price = 0;
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
    private _metadata?: string;    // Token contract metadata
    readonly type?: EvmTokenType;  // Token type (ERC20, ERC721, etc.)

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
