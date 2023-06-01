export interface IndexerNftResponse {
    metadata: string; // stringified JSON
    minter: string; // address
    tokenId: string;
    tokenUri: string;
    contract: string; // address
    imageCache?: string; // url
    blockMinted: number;
    updated: number; // epoch
    transaction: string; // tx hash
}

// NFT which has been processed for display in the UI
export interface ShapedNFT {
    name: string;
    id: string;
    collectionOwnerAddress: string;
    collectionOwnerName?: string;
    imageSrcFull?: string; // if this is empty, the UI will display a generic image icon
    imageSrcIcon?: string; // as a result of shaping, this will always have a value if imageSrcFull is defined

    // only one of audioSrc or videoSrc should be present, not both
    audioSrc?: string;

    // during the shaping process, if there is a video but no image given in the metadata,
    // the first frame of the video should be extracted and set as the imageSrcFull & imageSrcIcon
    videoSrc?: string;
}
