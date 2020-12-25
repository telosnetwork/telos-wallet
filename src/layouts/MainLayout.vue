<template>
  <q-layout view="hHh Lpr fFf">
    <q-page-container :style="`height: ${containerHeight}px;`">
      <router-view />
    </q-page-container>
    <q-footer v-if="isAuthenticated">
      <q-tabs
        v-model="tab"
        dense
        align="justify"
        narrow-indicator
        active-color="orange-10"
        class="bg-grey-1 text-grey shadow-2"
        :style="`height: ${footerHeight}px;`"
      >
        <q-route-tab
          v-for="page in pages"
          :name="page.title"
          :icon="page.icon"
          :key="page.title"
          :to="page.path"
        />
      </q-tabs>
    </q-footer>
  </q-layout>
</template>

<script>
import { mapGetters, mapActions } from "vuex";

const pagesData = [
  {
    title: "Balance",
    caption: "Balance",
    icon: "fas fa-wallet",
    path: "/balance/exampleuser1"
  },
  {
    title: "Account",
    caption: "Account",
    icon: "fas fa-th-large",
    path: "/account/exampleuser1"
  },
  {
    title: "Transfer",
    caption: "Transfer",
    icon: "fas fa-cog",
    path: "/transfer"
  }
];

export default {
  name: "MainLayout",
  data() {
    return {
      tab: pagesData[0].title,
      pages: pagesData,
    };
  },
  computed: {
    ...mapGetters("account", ["isAuthenticated"]),
    ...mapGetters("global", ["footerHeight"]),
    containerHeight() {
      return window.innerHeight;
    },
  },
  methods: {
    ...mapActions("account", ["login", "logout", "autoLogin"]),
    checkPath() {
      if (!this.isAuthenticated) {
        if (this.$route.path !== "/") window.location = "/";
      } else if (this.$route.path === "/") {
        window.location = "/balance/exampleuser1";
      }
    }
  },
  async mounted() {
    await this.autoLogin(this.$route.query.returnUrl);
    this.checkPath();
  },
  beforeUpdate() {
    this.checkPath();
  },
};
</script>
