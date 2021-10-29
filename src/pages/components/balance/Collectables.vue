<template>
  <div
    :style="
      `max-width: 800px; margin: auto auto; height: ${coinViewHeight -
        footerHeight -
        30}px;`
    "
  >
    <q-infinite-scroll
      @load="loadMoreNftTokens"
      :offset="20"
      style="display: grid; grid-template-columns: 1fr 1fr;"
    >
      <q-item
        v-for="(token, index) in availableTokenTags"
        :key="`${token.name}_${index}`"
        clickable
        v-ripple
        class="imgContainer "
        @click="selectNftToken(token)"
      >
        <img :src="token.image" />
        <div
          class="absolute-bottom text-subtitle2 text-center text-white"
          style="background-color: #0005; pointer-events: none;"
        >
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
  <!-- <div class="bg-white" :style="`max-width: 800px; margin: auto; height: ${coinViewHeight - footerHeight - 30}px;`">
    <q-infinite-scroll @load="loadMoreNftTokens" :offset="20" style="display: grid; grid-template-columns: auto auto;">
      <q-item v-for="(token, index) in availableTokenTags"
        :key="`${token.name}_${index}`"
        clickable
        v-ripple
        class="list-item justify-center"
        @click="selectNftToken(token)"
      >
        <q-item-section avatar class="q-px-none">
          <q-avatar rounded :size="`${itemSize}px`" class="q-my-none q-mx-auto">
            <img :src="token.image"/>
            <div class="absolute-bottom text-subtitle2 text-center text-white" style="background-color: #0005; pointer-events: none;">
              {{ token.title }}
            </div>
          </q-avatar>
        </q-item-section>
      </q-item>
      <template v-slot:loading>
        <div class="row justify-center q-my-md">
          <q-spinner-dots color="primary" size="40px" />
        </div>
      </template>
    </q-infinite-scroll>
  </div> -->
</template>

<script>
import { mapGetters, mapActions } from "vuex";

export default {
  props: [
    "nftTokenTags",
    "nftTokenLoadedAll",
    "coinViewHeight",
    "loadNftTokenTags"
  ],
  data() {
    return {
      showCount: 20
    };
  },
  computed: {
    ...mapGetters("global", ["footerHeight"]),
    itemSize() {
      return Math.min(350, (window.innerWidth - 120) / 2);
    },
    availableTokenTags() {
      return this.nftTokenTags;
      // return this.nftTokenTags.filter(token => token.amount > 0);
    }
  },
  methods: {
    selectNftToken(token) {},
    async loadMoreNftTokens(index, done) {
      await this.loadNftTokenTags();
      done();
    }
  },
  async mounted() {}
};
</script>

<style lang="scss" scoped>
.display-grid {
  display: grid;
}
.h-20 {
  height: 20px;
}
.wraplabel {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.imgContainer {
  border: none;
  background-color: #ffffff09;
  img {
    max-width: 100%;
  }
}
</style>
