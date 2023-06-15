<script setup lang="ts">
import { ShapedNFT } from 'src/antelope/types/NFTs';
import NftTile from 'pages/evm/nfts/NftTile.vue';
import NftViewer from 'pages/evm/nfts/NftViewer.vue';
import { ref } from 'vue';

const nfts: ShapedNFT[] = [{ 'name':'Cool Picture', 'id':'123456', 'contractAddress':'0x0000000000000000000000000000000000000000', 'contractPrettyName':'NFT Creator 1', 'description':'A cool picture of something', 'ownerAddress':'0x160505F3dfD1cb58B91e322c828Ae0F74c043c3C', 'attributes':[{ 'label':'Level of Detail', 'text':'Highly detailed!' }, { 'label':'Vibe', 'text':'Somewhat cheesy with hints of spring water' }, { 'label':'Time It Took to Make', 'text':'Like 15 minutes' }], 'imageSrcFull':'http://nfts.telos.net/40/0x2d7d3B1f9569037635eDfbE04C640BB4556A4EA6/5655/1440.webp', 'imageSrcIcon':'http://nfts.telos.net/40/0x2d7d3B1f9569037635eDfbE04C640BB4556A4EA6/5655/280.webp' }, { 'name':'Small Picture', 'id':'613432', 'contractAddress':'0x0000000000000000000000000000000000000000', 'contractPrettyName':'NFT Creator 1', 'description':'A little tiny picture of something', 'ownerAddress':'0x160505F3dfD1cb58B91e322c828Ae0F74c043c3C', 'attributes':[{ 'label':'Level of Detail', 'text':'Low :(' }, { 'label':'Vibe', 'text':'Woody top notes, grassy finish' }, { 'label':'Time It Took to Make', 'text':'You don\'t wanna know...' }], 'imageSrcFull':'https://www.gardenersnet.com/flower/gallery/vinca.jpg', 'imageSrcIcon':'https://www.gardenersnet.com/flower/gallery/vinca.jpg' }, { 'name':'Cool Video', 'id':'0987', 'contractAddress':'0x1111111111111111111111111111111111111111', 'contractPrettyName':'NFT Creator 2', 'description':'A real, moving video', 'ownerAddress':'0x160505F3dfD1cb58B91e322c828Ae0F74c043c3C', 'attributes':[{ 'label':'Level of Detail', 'text':'Not really applicable' }, { 'label':'Vibe', 'text':'Very digital, reminiscent of ozone' }, { 'label':'Time It Took to Make', 'text':'A year and a half of nonstop work' }], 'videoSrc':'https://joy1.videvo.net/videvo_files/video/free/2014-07/large_watermarked/Waterfall_h264_preview.mp4', 'imageSrcFull':'https://joy1.videvo.net/videvo_files/video/free/2014-07/thumbnails/Waterfall_h264_small.jpg' }, { 'name':'Cool Image with URI', 'id':'51234', 'contractAddress':'0x2222222222222222222222222222222222222222', 'contractPrettyName':'NFT Creator 3', 'description':'An image whose src is not a URL, but rather, a data URI. Nifty.', 'ownerAddress':'0x160505F3dfD1cb58B91e322c828Ae0F74c043c3C', 'attributes':[{ 'label':'Level of Detail', 'text':'Who makes these attributes...?' }, { 'label':'Vibe', 'text':'Just... off. Not quite right ya know?' }, { 'label':'Time It Took to Make', 'text':'It made itself actually' }], 'imageSrcFull':'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHByZXNlcnZlQXNwZWN0UmF0aW89InhNaW5ZTWluIG1lZXQiIHZpZXdCb3g9IjAgMCAzNTAgMzUwIj48c3R5bGU+LmJhc2UgeyBmaWxsOiB3aGl0ZTsgZm9udC1mYW1pbHk6IHNlcmlmOyBmb250LXNpemU6IDE0cHg7IH08L3N0eWxlPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InJlZCIgLz48dGV4dCB4PSIxMCIgeT0iMjAiIGNsYXNzPSJiYXNlIj5XYXJoYW1tZXI8L3RleHQ+PHRleHQgeD0iMTAiIHk9IjQwIiBjbGFzcz0iYmFzZSI+Um9iZTwvdGV4dD48dGV4dCB4PSIxMCIgeT0iNjAiIGNsYXNzPSJiYXNlIj5HcmVhdCBIZWxtIG9mIFBlcmZlY3Rpb248L3RleHQ+PHRleHQgeD0iMTAiIHk9IjgwIiBjbGFzcz0iYmFzZSI+U3R1ZGRlZCBMZWF0aGVyIEJlbHQ8L3RleHQ+PHRleHQgeD0iMTAiIHk9IjEwMCIgY2xhc3M9ImJhc2UiPkdyZWF2ZXM8L3RleHQ+PHRleHQgeD0iMTAiIHk9IjEyMCIgY2xhc3M9ImJhc2UiPk9ybmF0ZSBHYXVudGxldHM8L3RleHQ+PHRleHQgeD0iMTAiIHk9IjE0MCIgY2xhc3M9ImJhc2UiPk5lY2tsYWNlIG9mIFByb3RlY3Rpb248L3RleHQ+PHRleHQgeD0iMTAiIHk9IjE2MCIgY2xhc3M9ImJhc2UiPlBsYXRpbnVtIFJpbmcgb2YgUG93ZXI8L3RleHQ+PC9zdmc+', 'imageSrcIcon':'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHByZXNlcnZlQXNwZWN0UmF0aW89InhNaW5ZTWluIG1lZXQiIHZpZXdCb3g9IjAgMCAzNTAgMzUwIj48c3R5bGU+LmJhc2UgeyBmaWxsOiB3aGl0ZTsgZm9udC1mYW1pbHk6IHNlcmlmOyBmb250LXNpemU6IDE0cHg7IH08L3N0eWxlPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InJlZCIgLz48dGV4dCB4PSIxMCIgeT0iMjAiIGNsYXNzPSJiYXNlIj5XYXJoYW1tZXI8L3RleHQ+PHRleHQgeD0iMTAiIHk9IjQwIiBjbGFzcz0iYmFzZSI+Um9iZTwvdGV4dD48dGV4dCB4PSIxMCIgeT0iNjAiIGNsYXNzPSJiYXNlIj5HcmVhdCBIZWxtIG9mIFBlcmZlY3Rpb248L3RleHQ+PHRleHQgeD0iMTAiIHk9IjgwIiBjbGFzcz0iYmFzZSI+U3R1ZGRlZCBMZWF0aGVyIEJlbHQ8L3RleHQ+PHRleHQgeD0iMTAiIHk9IjEwMCIgY2xhc3M9ImJhc2UiPkdyZWF2ZXM8L3RleHQ+PHRleHQgeD0iMTAiIHk9IjEyMCIgY2xhc3M9ImJhc2UiPk9ybmF0ZSBHYXVudGxldHM8L3RleHQ+PHRleHQgeD0iMTAiIHk9IjE0MCIgY2xhc3M9ImJhc2UiPk5lY2tsYWNlIG9mIFByb3RlY3Rpb248L3RleHQ+PHRleHQgeD0iMTAiIHk9IjE2MCIgY2xhc3M9ImJhc2UiPlBsYXRpbnVtIFJpbmcgb2YgUG93ZXI8L3RleHQ+PC9zdmc+' }, { 'name':'Cool MP3 w/o Image', 'id':'245512', 'contractAddress':'0x3333333333333333333333333333333333333333', 'contractPrettyName':'NFT Creator 4', 'description':'A music file which has absolutely no image associated with it. Close your eyes and use your imagination.', 'ownerAddress':'0x160505F3dfD1cb58B91e322c828Ae0F74c043c3C', 'attributes':[{ 'label':'Level of Detail', 'text':'7' }, { 'label':'Vibe', 'text':'Floral yet somehow also like acrylic paint.' }, { 'label':'Time It Took to Make', 'text':'It took several time units' }], 'audioSrc':'https://assets.mixkit.co/music/preview/mixkit-tech-house-vibes-130.mp3' }, { 'name':'Cool MP3 w/ Image', 'id':'83546', 'contractAddress':'0x4444444444444444444444444444444444444444', 'contractPrettyName':'NFT Creator 5', 'description':'A true multimodal experience... an image and audio... wowee', 'ownerAddress':'0x160505F3dfD1cb58B91e322c828Ae0F74c043c3C', 'attributes':[{ 'label':'Level of Detail', 'text':'Medium-ish' }, { 'label':'Vibe', 'text':'Rather chill with a dash of angst' }, { 'label':'Time It Took to Make', 'text':'I don\'t know, I didn\'t make it' }], 'imageSrcFull':'https://4.bp.blogspot.com/-Mf_LhHkjckk/Ux1fSdz8DZI/AAAAAAAAGTY/lpYisOBjgZ0/s1600/dahlia-flower-2-top-10-best-beautiful-spectacular-world-wallpaper-free.jpg', 'imageSrcIcon':'https://4.bp.blogspot.com/-Mf_LhHkjckk/Ux1fSdz8DZI/AAAAAAAAGTY/lpYisOBjgZ0/s1600/dahlia-flower-2-top-10-best-beautiful-spectacular-world-wallpaper-free.jpg', 'audioSrc':'https://assets.mixkit.co/music/preview/mixkit-tech-house-vibes-130.mp3' }, { 'name':'Cool GIF', 'id':'8756', 'contractAddress':'0x5555555555555555555555555555555555555555', 'contractPrettyName':'', 'description':'A gif is like a bunch of pictures all in a row. Like a video but not. That is what this is.', 'ownerAddress':'0x160505F3dfD1cb58B91e322c828Ae0F74c043c3C', 'attributes':[{ 'label':'Level of Detail', 'text':'Grainier than a field of wheat' }, { 'label':'Vibe', 'text':'Like a field of wheat' }, { 'label':'Time It Took to Make', 'text':'As long as it takes a crop of wheat to grow' }], 'imageSrcFull':'https://res.cloudinary.com/demo/image/upload/cell_animation.gif', 'imageSrcIcon':'https://res.cloudinary.com/demo/image/upload/cell_animation.gif' }, { 'name':'Cool Animated WebP', 'id':'93532', 'contractAddress':'0x6666666666666666666666666666666666666666', 'contractPrettyName':'NFT Creator 7', 'description':'This is a special one. It has a long attribute.', 'ownerAddress':'0x160505F3dfD1cb58B91e322c828Ae0F74c043c3C', 'attributes':[{ 'label':'Level of Detail', 'text':'Yowza!' }, { 'label':'Vibe', 'text':'Here\'s the thing. This is a piece of digital art. What I can do is tell you about how it makes me feel. It makes me feel like I am writing this description to make sure we handle long strings correctly. How about that? I think the vibe is just fine for this particular piece. Regardless, I have to keep typing until this gets nice and lengthy. NFTs are a very cool invention, and this piece is a testament to that fact. Telos is an exceedingly fast and advanced blockchain, and the tEVM is extremely powerful with extraordinarily low gas fees. That is why it is a great platform for NFTs.' }, { 'label':'Time It Took to Make', 'text':'Who knows, I usually track time by how many songs I listened to while making it, but I was listening to the same song over and over. Sorry' }], 'imageSrcFull':'https://res.cloudinary.com/demo/image/upload/fl_awebp/bored_animation.webp', 'imageSrcIcon':'https://res.cloudinary.com/demo/image/upload/fl_awebp/bored_animation.webp' }, { 'name':'Boring NFT with no media', 'id':'7134', 'contractAddress':'0x7777777777777777777777777777777777777777', 'contractPrettyName':'NFT Creator 8', 'ownerAddress':'0x160505F3dfD1cb58B91e322c828Ae0F74c043c3C', 'attributes':[] }];

const nftViewerIsPreviewMode = ref(true);

</script>

<template>
<div class="row q-mb-xl">
    <div class="col-12">
        <h3>NFTs / Collectibles</h3>
    </div>
</div>
<hr>
<div class="row q-mb-xl">
    <div class="col-12">
        <h5>NFT Tile</h5>
        <p class="q-mb-md">Note: tiles link to detail page; the mock data will not be present</p>
    </div>
    <div v-for="nft in nfts" :key="`tile-demo-${nft.id}`" class="col-xs-12 col-md-6 col-lg-3 q-mb-md">
        <NftTile :nft="nft" />
    </div>
</div>
<hr>
<div class="row q-mb-xl">
    <div class="col-12">
        <h5 class="q-mb-md">NFT Viewer</h5>
        <q-checkbox v-model="nftViewerIsPreviewMode">
            Viewers in preview mode?
        </q-checkbox>
    </div>
    <div class="col-12">
        <q-expansion-item
            expand-separator
            label="NFT Viewers"
            caption="Expand / collapse NFT Viewer demos"
        >
            <div class="c-nft-demo__viewer-container">
                <NftViewer
                    v-for="nft in nfts"
                    :key="`viewer-demo-${nft.id}`"
                    :nft="nft"
                    :preview-mode="nftViewerIsPreviewMode"
                />
            </div>
        </q-expansion-item>
    </div>
</div>
<hr>
</template>

<style lang="scss">
.c-nft-demo {
    &__viewer-container {
        display: grid;
        grid-template-columns: 1fr;
        gap: 24px;
        max-width: 472px;
        margin: auto;
    }
}
</style>
