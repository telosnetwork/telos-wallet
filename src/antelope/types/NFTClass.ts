// NFT interfaces ---------------

import {
    GenericIndexerNft,
    INVALID_METADATA,
    IndexerNftContract,
    IndexerNftItemAttribute,
    IndexerNftMetadata,
    IndexerTokenHoldersResponse,
} from 'src/antelope/types/IndexerTypes';
import { extractNftMetadata } from 'src/antelope/stores/utils/nft-utils';
import { useContractStore } from '../stores/contract';
import { useChainStore } from '../stores/chain';
import EVMChainSettings from '../chains/EVMChainSettings';

export interface NftAttribute {
    label: string;
    text: string;
}

interface NftPrecursorData {
    name: string;
    id: string;
    metadata: IndexerNftMetadata;
    updated: number; // epoch

    tokenUri?: string;
    imageCache?: string; // url
    minter?: string; // address
    blockMinted?: number;

    mediaType: NftSourceType;
    imgSrc?: string;
    videoSrc?: string;
    audioSrc?: string;
}

export interface Erc721NftPrecursorData extends NftPrecursorData {
    owner: string;
}

export interface Erc1155NftPrecursorData extends NftPrecursorData {
    owners: { [address: string]: number };
}

export type NftSourceType = 'image' | 'video' | 'audio' | 'unknown';
export const NFTSourceTypes: Record<string, NftSourceType> = {
    IMAGE: 'image',
    VIDEO: 'video',
    AUDIO: 'audio',
    UNKNOWN: 'unknown',
};

export type NftTokenInterface = 'ERC721' | 'ERC1155';

// used as an intermediate type for constructing NFTs from indexer data
export type NftRawData = { data: GenericIndexerNft, contract: NFTContractClass };


/**
 * Construct an NFT from indexer data
 * @param contract The contract this NFT belongs to
 * @param indexerData The indexer data for this NFT
 * @returns The constructed NFT
 */
export async function constructNft(
    contract: NFTContractClass,
    indexerData: GenericIndexerNft,
): Promise<Erc721Nft | Erc1155Nft> {
    const isErc721 = contract.supportedInterfaces.includes('erc721');
    const isErc1155 = contract.supportedInterfaces.includes('erc1155');

    if (!isErc721 && !isErc1155) {
        throw new Error('Invalid NFT contract type');
    }

    try {
        if (indexerData.metadata !== INVALID_METADATA) {
            indexerData.metadata = typeof indexerData.metadata === 'string' ? JSON.parse(indexerData.metadata) : indexerData.metadata;
        } else {
            indexerData.metadata = {};
        }
    } catch (e) {
        console.error('Error parsing metadata', `"${indexerData.metadata}"`, e);
    }
    if (!indexerData.metadata || typeof indexerData.metadata !== 'object') {
        // we create a new metadata object with the actual string atributes of the item
        const list = indexerData as unknown as { [key: string]: unknown };
        indexerData.metadata =
            Object.keys(indexerData)
                .filter(k => typeof list[k] === 'string')
                .reduce((obj, key) => {
                    obj[key] = list[key] as string;
                    return obj;
                }, {} as { [key: string]: string });
    }

    const { image, mediaType, mediaSource } = await extractNftMetadata(indexerData.imageCache ?? '', indexerData.tokenUri ?? '', indexerData.metadata ?? {});
    const commonData: NftPrecursorData = {
        name: (indexerData.metadata?.name ?? '') as string,
        id: indexerData.tokenId,
        metadata: indexerData.metadata,
        minter: indexerData.minter,
        tokenUri: indexerData.tokenUri,
        imageCache: indexerData.imageCache,
        blockMinted: indexerData.blockMinted,
        updated: indexerData.updated,
        mediaType,
        imgSrc: image,
        videoSrc: mediaType === NFTSourceTypes.VIDEO ? mediaSource : undefined,
        audioSrc: mediaType === NFTSourceTypes.AUDIO ? mediaSource : undefined,
    };


    if (isErc721) {
        const contractStore = useContractStore();
        const contractInstance = await (await contractStore.getContract(contract.address))?.getContractInstance();
        const owner = contractInstance?.owner();

        return new Erc721Nft({
            ...commonData,
            owner,
        }, contract);
    }

    const chainSettings = useChainStore().currentChain.settings as EVMChainSettings;
    const indexer = chainSettings.getIndexer();
    const holdersResponse = (await indexer.get(`/v1/token/${contract}/holders?limit=10000&token_id=${indexerData.tokenId}`)).data as IndexerTokenHoldersResponse;
    const holders = holdersResponse.results;
    const owners = holders.reduce((acc, current) => {
        acc[current.address] = current.balance;
        return acc;
    }, {} as { [address: string]: number });

    return new Erc1155Nft({
        ...commonData,
        owners,
    }, contract);
}

// NFT classes ------------------

export class NFTContractClass {
    indexer: IndexerNftContract;
    constructor(source: IndexerNftContract) {
        this.indexer = source;
    }

    get address(): string {
        return this.indexer.address;
    }

    get name(): string | undefined {
        return this.indexer.calldata?.name;
    }

    get supportedInterfaces() {
        return this.indexer.supportedInterfaces?.map(iface => iface.toLowerCase()) ?? [];
    }
}

// use constructNft method to build an NFT from indexer data
class NFT {
    private contract: NFTContractClass;

    readonly name: string;
    readonly id: string;
    readonly metadata: IndexerNftMetadata;
    readonly contractAddress: string; // address
    readonly updated: number; // epoch
    readonly attributes: NftAttribute[];
    readonly mediaType: NftSourceType;

    readonly contractPrettyName?: string;
    readonly description?: string;
    readonly tokenUri?: string;
    readonly minter?: string; // address
    readonly blockMinted?: number; // the block number when this NFT was minted
    readonly imgSrc?: string;
    readonly audioSrc?: string;
    readonly videoSrc?: string;

    constructor(
        precursorData: NftPrecursorData,
        contract: NFTContractClass,
    ) {
        this.contract = contract;
        this.contractAddress = contract.address;
        this.contractPrettyName = contract.name;

        this.name = precursorData.name;
        this.id = precursorData.id;
        this.metadata = precursorData.metadata;
        this.minter = precursorData.minter;
        this.tokenUri = precursorData.tokenUri;
        this.blockMinted = precursorData.blockMinted;
        this.updated = precursorData.updated;
        this.description = precursorData.metadata?.description;
        this.mediaType = precursorData.mediaType;

        this.attributes = ((precursorData.metadata?.attributes || []) as IndexerNftItemAttribute[]).map(attr => ({
            label: attr.trait_type,
            text: attr.value,
        }));
    }

    // this key property is useful when used as a key for the v-for directive
    get key(): string {
        return `nft-${this.contractAddress}-${this.id}`;
    }
}

export class Erc721Nft extends NFT {
    readonly owner: string;
    readonly ownerUpdated: number; // ms since epoch since the owner was last updated

    constructor(
        precursorData: Erc721NftPrecursorData,
        contract: NFTContractClass,
    ) {
        super(precursorData, contract);
        this.owner = precursorData.owner;
        this.ownerUpdated = Date.now();
    }
}

export class Erc1155Nft extends NFT {
    readonly owners: { [address: string]: number };
    readonly ownersUpdated: number; // ms since epoch since the owner was last updated

    constructor(
        precursorData: Erc1155NftPrecursorData,
        contract: NFTContractClass,
    ) {
        super(precursorData, contract);
        this.owners = precursorData.owners;
        this.ownersUpdated = Date.now();
    }
}
