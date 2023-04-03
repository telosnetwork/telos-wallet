<script>

import { mapGetters, mapActions } from 'vuex';
import navBar from 'components/native/NavBar.vue';
import NativeLoginButton from 'pages/home/NativeLoginButton.vue';
import { getAntelope } from 'src/antelope';

const pagesData = [
    {
        title: 'Balance',
        caption: 'Balance',
        icon: 'fas fa-wallet',
        path: '/native/balance',
        available: true,
    },
    {
        title: 'DappSearch',
        caption: 'DappSearch',
        icon: 'fas fa-th-large',
        path: '/native/dappsearch',
        available: true,
    },
    {
        title: 'Settings',
        caption: 'Settings',
        icon: 'fas fa-cog',
        path: '/native/settings',
        available: true,
    },
];

export default {
    name: 'NativeLayout',
    components: { NavBar: navBar, NativeLoginButton },
    data() {
        return {
            avatar: null,
            bio: null,
            displayName: null,
            status: null,
            profileAccountName: null,
            accountHasProfile: false,
            accountHistory: [{}],
            balanceTab: 'coins',
            pages: pagesData,
            coins: [],
            nftTokens: [],
            warningShow: false,
            warningText: '',
            ant: getAntelope(),
        };
    },
    computed: {
        ...mapGetters('account', ['isAuthenticated', 'accountName']),
        isUserAuthenticated() {
            return this.isAuthenticated;
        },
        ...mapGetters('global', ['footerHeight']),
        containerHeight() {
            return window.innerHeight;
        },
        userAvatar() {
            if (this.avatar) {
                return this.avatar;
            }

            return '/profile/default_avatar.svg';
        },
    },
    methods: {
        ...mapActions('account', [
            'logout',
            'memoryAutoLogin',
            'getUserProfile',
        ]),
        checkPath() {
            if (!this.isUserAuthenticated) {
                if (!['/', '/native/dappsearch'].includes(this.$route.path)) {
                    window.location = '/';
                }
            } else if (this.$route.path === '/') {
                window.location = '/native/balance';
            }
        },
        async loadUserProfile() {
            this.loadAccountHistory();
            if (
                !this.$store.state.account.profiles.hasOwnProperty(this.accountName)
            ) {
                await this.getUserProfile(this.accountName);
            }
            const accountProfile =
                this.$store.state.account.profiles[this.accountName];
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
                `/v2/history/get_actions?limit=20&account=${this.accountName}`,
            );
            this.accountHistory = actionHistory.data.actions || [];
        },
        logOut() {
            this.resetTokens();
            this.logout();
        },
        resetTokens() {
            this.coins = [];
            this.nftTokens = [];
        },
    },
    async mounted() {
        await this.memoryAutoLogin();
        this.loadUserProfile();
        this.checkPath();
    },
};
</script>

<template>
<q-layout view="hHh Lpr fFf" class="">
    <NativeLoginButton v-if="isUserAuthenticated" class="login-button" />
    <div class="videoWrapper">
        <video
            id="bgvid"
            playsinline
            autoplay
            muted
            loop
            poster="~/assets/background/Video-top_compressed-poster-00001.jpg"
        >
            <source
                src="~/assets/background/Video-top_compressed-transcode.webm"
                type="video/webm"
            >
            <source
                src="~/assets/background/Video-top_compressed-transcode.mp4"
                type="video/mp4"
            >
        </video>
    </div>
    <div class="videoOverlay" ></div>
    <div class="videoOverlay shadedOverlay" ></div>

    <NavBar v-if="isUserAuthenticated" v-model:balanceTab="balanceTab" @logOut="logOut"/>
    <q-page-container
        :class="`pageContainer ${isUserAuthenticated ? 'authenticated' : ''}`"
    >
        <div v-if="warningShow">
            <q-banner inline-actions dark class="warningSign text-white">
                {{ warningText }}

                <template v-slot:action>
                    <q-icon
                        name="fas fa-times-circle"
                        class="warning-icon"
                        color="text-white"
                        @click="warningShow = false"
                    />
                </template>
            </q-banner>
        </div>
        <!-- Profile Image top right -->
        <q-avatar
            v-if="$route.path === '/native/balance'"
            class="profileImg"
            @click="$router.push('/native/profile')"
        >
            <img :src="userAvatar" >
        </q-avatar>
        <router-view
            v-model:loadedCoins="coins"
            v-model:loadedNftTokens="nftTokens"
            v-model:balanceTab="balanceTab"
        />
    </q-page-container>
</q-layout>
</template>

<style lang="scss" scoped>
.login-button {
    display: none;
}

.warning-icon {
    font-size: 1.3rem;
}

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
  background: linear-gradient(0.4turn, #0a1d5f52, #814cdc52);
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
  background: linear-gradient(0.4turn, #0a1d5f52, #814cdc52);
}

.profileImg {
  height: 4rem;
  width: 4rem;
  cursor: pointer;
  background: no-repeat;
  right: 1.5rem;
  top: 1.5rem;
  position: fixed;
  display: none;
  @media only screen and (min-width: 1000px) {
    display: block;
  }
}

.warningSign {
  background: #8946df;
}
</style>
