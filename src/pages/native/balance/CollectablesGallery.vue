<script>
import { mapGetters, mapActions } from 'vuex';

export default {
    props: [
        'nftTokenTags',
        'nftTokenLoadedAll',
        'coinViewHeight',
        'loadNftTokenTags',
    ],
    data() {
        return {
            showCount: 20,
        };
    },
    computed: {
        ...mapGetters('global', ['footerHeight']),
        itemSize() {
            return Math.min(350, (window.innerWidth - 120) / 2);
        },
        availableTokenTags() {
            return this.nftTokenTags;
        },
    },
    methods: {
        selectNftToken(token) {},
        async loadMoreNftTokens(index, done) {
            await this.loadNftTokenTags();
            done();
        },
    },
    async mounted() {},
};
</script>

<template>
<div
    :style="
        `max-width: 800px; margin: auto auto; height: ${coinViewHeight -
            footerHeight -
            30}px;`
    "
>
    <q-infinite-scroll
        :offset="20"
        class="nft-grid"
        @load="loadMoreNftTokens"
    >
        <q-item
            v-for="(token, index) in availableTokenTags"
            :key="`${token.name}_${index}`"
            v-ripple
            clickable
            class="imgContainer"
            @click="selectNftToken(token)"
        >
            <img :src="token.image" >
            <div class="collectablesName absolute-bottom text-subtitle2 text-center text-white">
                {{ token.title }}
            </div>
        </q-item>
        <template v-slot:loading>
            <div class="row justify-center q-my-md">
                <q-spinner-dots color="primary" size="40px" />
            </div>
        </template>
    </q-infinite-scroll>
</div>
</template>

<style lang="scss" scoped>

.imgContainer {
  border: none;
  background-color: #ffffff09;
  justify-content: center;

  img {
    max-width: 100%;
    max-height: 100%;

  }
.collectablesName{

  background-color: #0005;
  pointer-events: none;
}
}

.nft-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
}
</style>
