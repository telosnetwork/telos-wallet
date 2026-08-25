<script>

import { mapGetters, mapActions } from 'vuex';
import navBar from 'components/native/NavBar.vue';
import LoginButtons from 'pages/home/LoginButtons.vue';
import { getAntelope } from 'src/antelope';
import { getHyperion } from 'src/boot/api';

const pagesData = [
    {
        title: 'Balance',
        caption: 'Balance',
        icon: 'fas fa-wallet',
        path: '/zero/balance',
        available: true,
    },
    {
        title: 'DappSearch',
        caption: 'DappSearch',
        icon: 'fas fa-th-large',
        path: '/zero/dappsearch',
        available: true,
    },
    {
        title: 'Settings',
        caption: 'Settings',
        icon: 'fas fa-cog',
        path: '/zero/settings',
        available: true,
    },
];

export default {
    name: 'NativeLayout',
    components: { NavBar: navBar, LoginButtons },
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
                if (!['/', '/zero/dappsearch'].includes(this.$route.path)) {
                    window.location = '/';
                }
            } else if (this.$route.path === '/') {
                window.location = '/zero/balance';
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
            const actionHistory = await getHyperion().get(
                `/v2/history/get_actions?limit=20&account=${this.accountName}`,
            );
            this.accountHistory = actionHistory.data.actions || [];
        },
        performLogOut() {
            this.resetTokens();
            this.logout(true);
        },
        resetTokens() {
            this.coins = [];
            this.nftTokens = [];
        },
    },
    async mounted() {
        if (!this.isUserAuthenticated) {
            await this.memoryAutoLogin();
        }
        this.loadUserProfile();
    },
};
</script>

<template>
<q-layout view="hHh Lpr fFf" class="c-native-layout">
    <LoginButtons v-if="!isUserAuthenticated" class="login-button" chain="zero"/>
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

    <NavBar v-if="isUserAuthenticated" v-model:balanceTab="balanceTab" @logOut="performLogOut"/>
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
            v-if="$route.path === '/zero/balance'"
            class="profileImg"
            @click="$router.push('/zero/profile')"
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
  background: #1B1B1D;  // Telos Off-Black
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
    opacity: 0.4;  // Dim the wave visual
    filter: grayscale(30%) hue-rotate(-20deg);  // Shift colors toward brand
  }
}

.videoOverlay {
  // Dark overlay with subtle brand gradient hint
  background: linear-gradient(135deg, rgba(27, 27, 29, 0.85) 0%, rgba(27, 27, 29, 0.7) 100%);
  width: 100vw;
  height: 100vh;
  position: fixed;
  left: 0;
  z-index: -1;
}

.shadedOverlay {
  // Subtle brand gradient accent at bottom
  background: linear-gradient(to top, rgba(0, 242, 254, 0.05), transparent 40%);
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
  background: linear-gradient(135deg, #00F2FE 0%, #4FACFE 50%, #C471F5 100%);  // Telos gradient
}
</style>

<style lang="scss">
body .c-native-layout {
    color: white;
}
</style>
