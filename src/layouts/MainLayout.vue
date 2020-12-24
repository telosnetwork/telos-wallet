<template>
  <q-layout view="hHh Lpr fFf">
    <q-page-container style="min-height: inherit;">
      <router-view />
    </q-page-container>
    <q-footer v-if="isAuthenticated">
      <q-tabs
        v-model="tab"
        dense
        class="bg-grey-1 text-orange-10"
        align="justify"
        narrow-indicator
        style="height: 50px;"
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
    caption: "Account profile and Hyperion history query example",
    icon: "fas fa-wallet",
    path: "/balance/exampleuser1"
  },
  {
    title: "Account",
    caption: "Account profile and Hyperion history query example",
    icon: "fas fa-th-large",
    path: "/account/exampleuser1"
  },
  {
    title: "Transfer",
    caption: "Transfer example, sending/signing actions",
    icon: "fas fa-cog",
    path: "/transfer"
  }
];

export default {
  name: "MainLayout",
  data() {
    return {
      tab: "Balance",
      pages: pagesData
    };
  },
  computed: {
    ...mapGetters("account", ["isAuthenticated"])
  },
  methods: {
    ...mapActions("account", ["login", "logout", "autoLogin"])
  },
  async mounted() {
    await this.autoLogin(this.$route.query.returnUrl);
    if (!this.isAuthenticated) {
      if (this.$route.path !== "/") window.location = "/";
    } else if (this.$route.path === "/") {
      window.location = "/balance/exampleuser1";
    }
  }
};
</script>
