<template>
  <q-layout view="hHh Lpr fFf" class="">
    <login-button v-if="isAuthenticated" style="display: none" />
    <div class="videoWrapper">
      <video
        playsinline
        autoplay
        muted
        loop
        poster="~/assets/Video-top_compressed-poster-00001.jpg"
        id="bgvid"
      >
        <source
          src="~/assets/Video-top_compressed-transcode.webm"
          type="video/webm"
        />
        <source
          src="~/assets/Video-top_compressed-transcode.mp4"
          type="video/mp4"
        />
      </video>
    </div>
    <div class="videoOverlay" />
    <div class="videoOverlay shadedOverlay" />

    <nav-bar :balanceTab.sync="balanceTab" v-if="isAuthenticated" />
    <q-page-container
      :class="`pageContainer ${isAuthenticated ? 'authenticated' : ''}`"
    >
      <div v-if="warningShow">
        <q-banner inline-actions dark class="warningSign text-white">
          {{ warningText }}

          <template v-slot:action>
            <q-icon
              name="fas fa-times-circle"
              style="font-size: 1.3rem;"
              color="text-white"
              @click="warningShow = false"
            />
          </template>
        </q-banner>
      </div>
      <!-- Profile Image top right -->
      <q-avatar v-if="$route.path === '/balance'"  class="profileImg" @click="$router.push('/settings')">
        <img :src="userAvatar" />
      </q-avatar>
      <router-view
        :loadedCoins.sync="coins"
        :loadedNftTokens.sync="nftTokens"
        :balanceTab.sync="balanceTab"
      />
    </q-page-container>
    
  </q-layout>
</template>

<script>
import { mapGetters, mapActions } from "vuex";
import navBar from "components/Navbar.vue";
import LoginButton from "components/LoginButton.vue";

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
  components: { navBar, LoginButton },
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
      nftTokens: [],
      warningShow: false,
      warningText:
        ""
    };
  },
  computed: {
    ...mapGetters("account", ["isAuthenticated", "accountName"]),
    ...mapGetters("global", ["footerHeight"]),
    containerHeight() {
      return window.innerHeight;
    },
    userAvatar() {
      if (this.avatar) return this.avatar;

      return "/profile/default_avatar.svg";
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
    &.authenticated {
      margin-left: 250px;
    }
    padding-bottom: 0;
  }
}

.videoWrapper {
  background: black;
  width: 100vw;
  height: 100vh;
  position: fixed;
  z-index: -1;
  video {
    object-fit: cover;
    width: 100vw;
    height: 100vh;
    position: fixed;
    transform: rotate(180deg);
    top: 35vh;
    left: 0;
  }
}

.videoOverlay {
  // background: url("~assets/MainBG.png");  
  background: linear-gradient(0.40turn, #0a1d5f52, #814cdc52 );
  background-repeat: no-repeat;
  background-size: cover;
  object-fit: cover;
  width: 100vw;
  height: 100vh;
  position: fixed;
  left: 0;
  z-index: -1;
}

.shadedOverlay {
  background: linear-gradient(0.40turn, #0a1d5f52, #814cdc52 );
}

.profileImg {
  height: 4rem;
  width: 4rem;
  // margin: 1rem;
  cursor: pointer;
  background: no-repeat;
  left: 92%;
  top: 1.5rem;
  // position: absolute;
  display: none;
  @media only screen and (min-width: 1000px) {
    display: block;
  }
}

.warningSign {
  background: #8946df;
}

</style>
