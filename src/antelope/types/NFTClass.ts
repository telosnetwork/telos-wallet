// NFT interfaces ---------------

import {
    GenericIndexerNft,
    IndexerNftContract,
    IndexerNftItemAttribute,
    IndexerNftMetadata,
} from 'src/antelope/types/IndexerTypes';

export interface NftAttribute {
    label: string;
    text: string;
}

export interface NftPrecursorData {
    name: string;
    id: string;
    metadata: IndexerNftMetadata;
    tokenId: string;
    contractAddress: string; // address
    updated: number; // epoch

    owner?: string; // undefined for ERC1155, as ERC1155 tokens can be owned by multiple addresses; use owners for ERC1155
    owners?: { [address: string]: number }; // only used for ERC1155; maps owner address to quantity owned
    tokenUri?: string;
    imageCache?: string; // url
    minter?: string; // address
    blockMinted?: number;
}

export type NftMediaType = 'image' | 'video' | 'audio' | 'none';
export const NFTSourceTypes: Record<string, NftMediaType> = {
    IMAGE: 'image',
    VIDEO: 'video',
    AUDIO: 'audio',
    NONE: 'none',
};

export type NftTokenInterface = 'ERC721' | 'ERC1155';

// used as an intermediate type for constructing NFTs from indexer data
export type NftRawData = { data: GenericIndexerNft, contract: NFTContractClass };


/**
 * Construct an NFT from indexer data
 * @param contract The contract this NFT belongs to
 * @param indexerData The indexer data for this NFT; if the token is an ERC1155, this should be an array, as ERC1155 tokens can be owned by multiple addresses, represented by multiple IndexerNftItemResult objects
 * @returns The constructed NFT
 */
export function constructNft(
    contract: NFTContractClass,
    indexerData: GenericIndexerNft | GenericIndexerNft[],
) {
    const dataIsArray = Array.isArray(indexerData);

    if (dataIsArray && indexerData.length === 0) {
        throw new Error('Error constructing NFT: indexerData must not be empty');
    }

    const data = Array.isArray(indexerData) ? indexerData[0] : indexerData;
    let owner: string | undefined;
    let owners: { [address: string]: number } | undefined;

    if (dataIsArray) {
        const allNftsAreTheSame = indexerData.every((item, index, array) => {
            if (index === 0) {
                return true;
            }
            return item.contract === array[index - 1].contract && item.tokenId === array[index - 1].tokenId;
        });
        if (!allNftsAreTheSame) {
            throw new Error('Error constructing NFT: all input NFTs must have the same contract and tokenId');
        }

        owners = indexerData.reduce((acc, item) => {
            if (!acc[item.owner]) {
                acc[item.owner] = 0;
            }
            acc[item.owner] += item.quantity ?? 0;
            return acc;
        }, {} as { [address: string]: number });
    } else {
        owner = indexerData.owner;
    }

    return new NFT(
        {
            name: data.metadata?.name ?? '',
            id: '',
            metadata: data.metadata,
            owner,
            owners,
            minter: data.minter,
            tokenId: data.tokenId,
            tokenUri: data.tokenUri,
            contractAddress: data.contract,
            imageCache: data.imageCache,
            blockMinted: data.blockMinted,
            updated: data.updated,
        },
        contract,
    );
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
export class NFT {
    private preview: string;
    private source: string | undefined;
    private ready = true; // whether the NFT is ready to be displayed in the UI (i.e. it does not have data loading or being processed)
    private contract: NFTContractClass;
    private imageCache?: string; // url

    readonly name: string;
    readonly id: string;
    readonly metadata: IndexerNftMetadata;
    readonly contractAddress: string; // address
    readonly updated: number; // epoch
    readonly attributes: NftAttribute[];
    readonly mediaType: NftMediaType;

    readonly contractPrettyName?: string;
    readonly owner?: string; // ERC721 only
    readonly owners?: { [address: string]: number }; // ERC1155 only
    readonly description?: string;
    readonly tokenUri?: string;
    readonly minter?: string; // address
    readonly blockMinted?: number; // the block number when this NFT was minted
    readonly audioSrc?: string;
    readonly videoSrc?: string;

    constructor(
        precursorData: NftPrecursorData,
        contract: NFTContractClass,
    ) {
        this.contract = contract;

        this.name = precursorData.name;
        this.id = precursorData.id;
        this.metadata = precursorData.metadata;
        this.owner = precursorData.owner;
        this.owners = precursorData.owners;
        this.minter = precursorData.minter;
        this.id = precursorData.tokenId;
        this.tokenUri = precursorData.tokenUri;
        this.contractAddress = precursorData.contractAddress;
        this.contractPrettyName = contract.name;
        this.imageCache = precursorData.imageCache;
        this.blockMinted = precursorData.blockMinted;
        this.updated = precursorData.updated;
        this.description = precursorData.metadata?.description;

        this.attributes = ((precursorData.metadata?.attributes || []) as IndexerNftItemAttribute[]).map(attr => ({
            label: attr.trait_type,
            text: attr.value,
        }));

        const { preview, type, source } = this.extractMetadata();
        this.preview = preview;
        this.mediaType = type;
        this.source = source;
    }

    // getters
    get imageSrc(): string {
        return this.preview;
    }

    get isErc1155(): boolean {
        return this.contract.supportedInterfaces.includes('erc1155');
    }

    get isErc721(): boolean {
        return this.contract.supportedInterfaces.includes('erc721');
    }

    // this key property is useful when used as a key for the v-for directive
    get key(): string {
        return `nft-${this.contractAddress}-${this.id}`;
    }

    get isReady(): boolean {
        return this.ready;
    }


    // methods
    extractMetadata(): { preview: string, type: NftMediaType, source: string | undefined } {
        let type: NftMediaType = NFTSourceTypes.IMAGE;
        let preview = '';
        let source: string | undefined = undefined;

        // We are going to test the imageCache URL to see if it is a valid URL
        if (this.imageCache) {
            // first we create a regExp for the valid URL. e.g: "https://nfts.telos.net/40/0x552fd5743432eC2dAe222531e8b88bf7d2410FBc/344"
            const regExp = new RegExp('^(https?:\\/\\/)?' + // protocol
                '(nfts.telos.net\\/)' + // domain name
                '(\\d+\\/)' + // chain id
                '(0x[0-9a-fA-F]+\\/)' + // contract address
                '(\\d+)$'); // token id

            // then we test the imageCache URL against the regExp
            const match = regExp.test(this.imageCache);
            if (match) {
                // we return the 1440.webp version of it
                preview = this.imageCache.concat('/1440.webp');
            }
        }
        // if there's an image in the metadata, we return that
        if (!preview && this.metadata?.image) {
            preview = this.metadata.image as string;
        }

        if (!preview && this.metadata) {
            // this NFT is not a simple image and could be anything (including an image).
            // We need to look at the metadata
            const metadata = this.metadata as { [key: string]: string };
            // we iterate over the metadata properties
            for (const property in metadata) {
                const value = metadata[property];
                if (!value) {
                    continue;
                }
                // if the value is a string and contains a valid url of a known media format, use it.
                // image formats: .gif, .avif, .apng, .jpeg, .jpg, .jfif, .pjpeg, .pjp, .png, .svg, .webp
                if (
                    !preview &&  // if we already have a preview, we don't need to keep looking
                    typeof value === 'string' &&
                    value.match(/\.(gif|avif|apng|jpe?g|jfif|p?jpe?g|png|svg|webp)$/)
                ) {
                    preview = value;
                }
                // audio formats: .mp3, .wav, .aac, .webm
                if (
                    !source &&  // if we already have a source, we don't need to keep looking
                    typeof value === 'string' &&
                    value.match(/\.(mp3|wav|aac|webm)$/)
                ) {
                    type = NFTSourceTypes.AUDIO;
                    source = value;
                }
                // video formats: .mp4, .webm, .ogg
                if (
                    !source &&  // if we already have a source, we don't need to keep looking
                    typeof value === 'string' &&
                    value.match(/\.(mp4|webm|ogg)$/)
                ) {
                    type = NFTSourceTypes.VIDEO;
                    source = value;
                }

                const regex = /^data:(image|audio|video)\/\w+;base64,[\w+/=]+$/;

                const match = value.match(regex);

                if (match) {
                    const contentType = match[1];

                    if (contentType === 'image' && !preview) {
                        preview = value;
                    } else if (contentType === 'audio' && !source) {
                        type = NFTSourceTypes.AUDIO;
                        source = value;
                    } else if (contentType === 'video' && !source) {
                        type = NFTSourceTypes.VIDEO;
                        source = value;
                    }
                }

            }

            // particular case of media format webm. We need to determine if it is a video or audio
            if (source && source.match(/\.webm$/)) {
                this.ready = false;

                this.determineWebmType(source).then((_type) => {
                    if (_type === NFTSourceTypes.VIDEO) {
                        this.extractFirstFrameFromVideo(source as string).then((_preview) => {
                            this.preview = _preview;
                            this.ready = true;
                            this.notifyWatchers();
                        });
                    } else {
                        this.notifyWatchers();
                    }
                });
            } else {
                if (type === NFTSourceTypes.VIDEO) {
                    this.ready = false;
                    this.extractFirstFrameFromVideo(source as string).then((_preview) => {
                        this.preview = _preview;
                        this.ready = true;
                        this.notifyWatchers();
                    });
                }
            }
        }

        return { preview, type, source };
    }

    async determineWebmType(source: string): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            const video = document.createElement('video');

            video.onloadedmetadata = function () {
                if (video.videoWidth > 0 && video.videoHeight > 0) {
                    resolve(NFTSourceTypes.VIDEO);
                } else {
                    resolve(NFTSourceTypes.AUDIO);
                }
            };

            video.onerror = function (e) {
                reject({ error: e, source });
            };

            video.src = source;
        });
    }

    async extractFirstFrameFromVideo(source: string): Promise<string> {
        return this.extractFrameFromVideo(source, 0);
    }

    async extractFrameFromVideo(source: string, time: number): Promise<string> {
        // this function seams not to wer in most of the cases. It returns a transparent image
        return new Promise<string>((resolve, reject) => {
            const video = document.createElement('video');

            video.onloadedmetadata = function () {
                video.currentTime = time;

                const canvas = document.createElement('canvas');

                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;

                const ctx = canvas.getContext('2d');
                if (ctx) {
                    // let's draw the video in the canvas
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

                    // now we test the color of the pixel in the middle of the canvas
                    const pixelData = ctx.getImageData((canvas.width / 2), (canvas.height / 2), 1, 1).data;
                    if (pixelData[3] === 0) {
                        // if it is transparent, it means that we don't have a preview for this video
                        resolve('');
                    } else {
                        // if the pixel is not transparent, we return the canvas as a dataURL
                        resolve(canvas.toDataURL());
                    }
                } else {
                    reject({ error: 'no context', source });
                }
            };

            video.onerror = function (e) {
                reject({ error: e, source });
            };

            video.src = source;
            video.setAttribute('crossOrigin', 'anonymous');
            video.preload = 'metadata';
            video.load();
        });
    }

    getQuantity(address?: string): number {
        if (this.isErc721) {
            return 1;
        }

        return this.owners?.[address as string] || 0;
    }

    watchers: (() => void)[] = [];
    watch(cb: () => void): void {
        this.watchers.push(cb);
    }

    notifyWatchers(): void {
        this.watchers.forEach(w => w());
    }
}
