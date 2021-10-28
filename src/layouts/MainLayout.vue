<template>
  <q-layout view="hHh Lpr fFf" class="">
    <nav-bar :balanceTab.sync="balanceTab" />
    <q-page-container class="pageContainer">
      <router-view
        :loadedCoins.sync="coins"
        :loadedNftTokens.sync="nftTokens"
        :balanceTab.sync="balanceTab"
      />
    </q-page-container>
    <!-- <nav-bar /> -->

    <!-- <img src="~assets/bottomBg.svg" class=""> -->

    <!-- <q-footer class="footerStyle" v-if="isAuthenticated" style="max-width: auto; margin: 0rem 0rem; opacity: 100; place-content: center;">
      <q-tabs 
        v-model="tab"
        dense
        align="justify"
        narrow-indicator
        active-color="deep-purple-10"
        class="text-grey shadow-2"
        :style="`height: ${footerHeight}px; background: linear-gradient(to bottom, #130C3F00, #8946DF00 200%)`"
      >
        <q-route-tab style=""
          v-for="page in pages"
          :name="page.title"
          :icon="page.icon"
          :key="page.title"
          :to="page.path"
          :disable="!page.available"
          :style="`opacity: ${page.available ? 1 : 0.3} !important; background: linear-gradient(to bottom, #130C3F00, #8946DF00 200%)`"
        />
      </q-tabs>
    </q-footer> -->
  </q-layout>
</template>

<script>
import { mapGetters, mapActions } from "vuex";
import navBar from "components/Navbar.vue";

const pagesData = [
  {
    title: "Balance",
    caption: "Balance",
    icon: "fas fa-wallet",
    path: "/balance",
    available: true
  },
  {
    title: "DappSearch",
    caption: "DappSearch",
    icon: "fas fa-th-large",
    path: "/dappsearch",
    available: true
  },
  {
    title: "Settings",
    caption: "Settings",
    icon: "fas fa-cog",
    path: "/settings",
    available: true
  }
];

export default {
  name: "MainLayout",
  components: { navBar },
  data() {
    return {
      avatar: null,
      bio: null,
      displayName: null,
      status: null,
      profileAccountName: null,
      accountHasProfile: false,
      accountHistory: [{}],
      balanceTab: "Coins",
      pages: pagesData,
      coins: [],
      nftTokens: []
    };
  },
  computed: {
    ...mapGetters("account", ["isAuthenticated", "accountName"]),
    ...mapGetters("global", ["footerHeight"]),
    containerHeight() {
      return window.innerHeight;
    }
  },
  methods: {
    ...mapActions("account", [
      "login",
      "logout",
      "autoLogin",
      "getUserProfile"
    ]),
    checkPath() {
      if (!this.isAuthenticated) {
        if (!["/", "/dappsearch"].includes(this.$route.path))
          window.location = "/";
      } else if (this.$route.path === "/") {
        window.location = "/balance";
      }
    },
    async loadUserProfile() {
      this.loadAccountHistory();
      if (
        !this.$store.state.account.profiles.hasOwnProperty(this.accountName)
      ) {
        await this.getUserProfile(this.accountName);
      }
      const accountProfile = this.$store.state.account.profiles[
        this.accountName
      ];
      if (!accountProfile) {
        return;
      }

      this.accountHasProfile = true;
      this.profileAccountName = this.accountName;
      this.avatar = accountProfile.avatar;
      this.bio = accountProfile.bio;
      this.status = accountProfile.status;
      this.displayName = accountProfile.display_name;
    },
    search() {
      this.loadUserProfile();
    },
    async loadAccountHistory() {
      const actionHistory = await this.$hyperion.get(
        `/v2/history/get_actions?limit=20&account=${this.accountName}`
      );
      this.accountHistory = actionHistory.data.actions || [];
    }
  },
  async mounted() {
    console.log("As iron sharpens iron, so one person sharpens another.");
    await this.autoLogin(this.$route.query.returnUrl);
    this.loadUserProfile();
    this.checkPath();
  },
  beforeUpdate() {
    this.checkPath();
  }
};
</script>

<style lang="scss" scoped>
.pageContainer {
  padding-bottom: 65px; // for mobile nav-bar
  @media only screen and (min-width: 1000px) {
    margin-left: 250px;
    padding-bottom: 0;
  }
}

.footerStyle {
  background: linear-gradient(to bottom, #130c3f00, #8946df00 200%);
}
</style>
