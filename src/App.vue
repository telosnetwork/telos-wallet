<template>
  <div id="q-app" :style="'background: linear-gradient(to bottom, #130C3F, #8946DF 200%)'">
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
