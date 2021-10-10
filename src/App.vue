<template>
  <!-- <div id="q-app" :style="'background: linear-gradient(to bottom, #1c0c3e, #2a3f7e 200%)'"> -->
  <div id="q-app" class="main-background">
    <router-view />
  </div>
</template>
<script>

import { vxm } from "./store/index.js";

export default {
  name: 'App',
  methods: {
    async loadBancor() {
      const trade = this.$route.meta.feature == "Trade";

      const service = this.$route.params && this.$route.params.service;
      const pool = this.$route.params && this.$route.params.account;
      const feature = this.$route.meta && this.$route.meta.feature;
      const query = this.$route.query;
      const paramsSatisfied = service && feature && query;

      const initParams = {
        initialChain: this.$route.params.service,
        ...(paramsSatisfied && {
          initialModuleParam: {
            [trade ? "tradeQuery" : "poolQuery"]: trade ? this.$route.query : pool
          }
        })
      };

      try {
        await vxm.bancor.init(initParams);
        this.loading = false;
      } catch {
        await new Promise(res => setTimeout(res, 1000));
        try {
          await vxm.bancor.init(initParams);
        } catch (e) {
          this.loading = false;
          this.error = e.message;
          throw new Error(e);
        }
      }
    }
  },
  async created() {
    this.loadBancor();
  }
}
</script>

<style scoped>

.main-background {
  /* background:  linear-gradient(to bottom, #1c0c3e, #2a3f7e 200%); */
  background:  linear-gradient(to bottom, #020039, #2a3f7e 200%);
  
  /* background: radial-gradient( at top left, #ff0c3e, #2a3f7e 100%) top left,
              radial-gradient( at top right, #00fc3e, #2a3f7e 20%) top right,
              radial-gradient( at top right, #0ddc3e, #2aaa7e 20%) bottom right,
              radial-gradient( at top right, #00fc3e, #ff3f7e 20%) bottom left; */

}

</style>
