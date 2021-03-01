<template>
  <div id="q-app">
    <router-view />
  </div>
</template>
<script>

import { Component, Vue } from "vue-property-decorator";
import { vxm } from "./store/index.js";
import wait from "waait";

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
      } catch (e) {
        await wait(1000);
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
