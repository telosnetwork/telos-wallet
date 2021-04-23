<template>
  <div>
    <div v-if="!isAuthenticated" class="q-px-md">
      <!-- <div>
        <q-btn
          @click="signIn"
          text-color="white"
          no-caps
          label="Sign In"
          class="full-width login-btn"
          :style="`background: ${themeColor}`"
        />
      </div> -->
      <div class="q-mt-md q-mb-sm">
        <q-btn
          @click="showLogin = true"
          no-caps
          outline
          label="Connect Wallet"
          class="full-width login-btn"
          :style="`color: ${themeColor}`"
        />
      </div>
      <q-separator v-if="!isAuthenticated" class="q-mt-md q-mx-auto" style="max-width: 500px;"/>
      <div class="q-mt-md">
        <q-btn
          @click="signUp"
          text-color="white"
          no-caps
          label="Create New Account"
          class="login-btn"
          :style="`background: #2cb678`"
        />
      </div>
    </div>

    <div v-if="isAuthenticated" class="row absolute full-width">
      <q-btn
        @click="logout"
        icon="power_settings_new"
        size="md"
        padding="3px 3px 3px 15px"
        no-caps
        rounded
        flat
        class="q-pa-none logout-btn"
      />
    </div>

    <q-dialog v-model="showLogin">
      <q-list>
        <q-item
          v-for="(wallet, idx) in $ual.authenticators"
          :key="wallet.getStyle().text"
          v-ripple
          :style="{
            background: wallet.getStyle().background,
            color: wallet.getStyle().textColor
          }"
        >
          <q-item-section class="cursor-pointer" avatar @click="onLogin(idx)">
            <img :src="wallet.getStyle().icon" width="30" />
          </q-item-section>

          <q-item-section class="cursor-pointer" @click="onLogin(idx)">
            {{ wallet.getStyle().text }}
          </q-item-section>

          <q-item-section class="flex" avatar>
            <q-spinner
              v-if="loading === wallet.getStyle().text"
              :color="wallet.getStyle().textColor"
              size="2em"
            />
            <q-btn
              v-else
              :color="wallet.getStyle().textColor"
              icon="get_app"
              @click="openUrl(wallet.getOnboardingLink())"
              target="_blank"
              dense
              flat
              size="12px"
            >
              <q-tooltip>
                Get app
              </q-tooltip>
            </q-btn>
          </q-item-section>
        </q-item>

        <q-item
          v-if="error"
          :active="!!error"
          active-class="bg-red-1 text-grey-8"
        >
          <q-item-section>
            {{ error }}
          </q-item-section>
        </q-item>
      </q-list>
    </q-dialog>
    <q-dialog v-model="showAuth">
      <Authenticate :showAuth.sync="showAuth" :type.sync="authType"/>
    </q-dialog>
  </div>
</template>

<script>
import { mapGetters, mapActions, mapMutations } from 'vuex';
import { TelosEvmApi } from '@telosnetwork/telosevm-js';
import Authenticate from '../pages/components/auth/Authenticate';
var window_1 = require("../utils/telos-keycatjs/utils/window");
var Blockchain_1 = require("../utils/telos-keycatjs/Blockchain");

export default {
  data() {
    return {
      showLogin: false,
      showAuth: false,
      authType: 'signin',
      error: null,
    };
  },
  computed: {
    ...mapGetters('account', [
      'isAuthenticated',
      'accountName',
      'loading',
      'isAutoLoading',
    ])
  },
  components: {
    Authenticate
  },
  methods: {
    ...mapActions('account', ['login', 'logout', 'autoLogin', 'getUserProfile']),
    ...mapMutations('account', ['setAccountName', 'getAccountProfile', 'setLoadingWallet']),
    async signUp() {
      this.showAuth = true;
      this.authType = 'signup';
      // this.signPopup('/create');
    },
    async signIn() {
      this.signPopup('/signin');
    },
    async signPopup(type) {
      const keycat = this.$ual.authenticators[0].keycatMap[this.$ual.authenticators[0].selectedChainId];
      var url = window_1.makeWindowUrl(keycat.keycatOrigin, type, keycat.makeUrlData());
      const users = await this.$ual.authenticators[0].keycatMap[this.$ual.authenticators[0].selectedChainId].spawnWindow(url);
      if (users) {
        const accountName = users.accountName;
        const permission = users.permission;
        const publicKey = users.publicKey;
        const nowTimestamp = Math.floor(((new Date()).getTime()) / 1000);
        const expiration = 604800 + nowTimestamp;
        this.$ualUser = users;
        this.$type = "ual";
        this.setAccountName(accountName);
        window.localStorage.setItem('expiration', expiration);
        window.localStorage.setItem('accountName', accountName);
        window.localStorage.setItem('permission', permission);
        window.localStorage.setItem('publicKey', publicKey);
        window.localStorage.setItem("account", accountName);
        window.localStorage.setItem("returning", true);
        window.localStorage.setItem("autoLogin", this.$ual.authenticators[0].constructor.name);
        this.getUserProfile();
        this.setLoadingWallet();
        await this.createEvmApi();
      }
    },
    async onLogin(idx) {
      if (idx === 0) {
        this.showAuth = true;
        this.authType = 'signin';
      } else {
        const error = await this.login({ idx });
        if (!error) {
          this.showLogin = false;
        } else {
          this.error = error;
        }
      }
    },
    openUrl(url) {
      window.open(url);
    },
    goToAccountPage() {
      const accountPath = `/account/${this.accountName}`;
      if (this.$router.currentRoute.path !== accountPath) {
        this.$router.push({ path: accountPath });
      }
    },
    async createEvmApi() {
      this.$root.oldtEVMBalance = 0;
      try {
        this.$root.tEVMApi = new TelosEvmApi({
          endpoint: process.env.HYPERION_ENDPOINT,
          chainId: 41,
          ethPrivateKeys: [],
          telosContract: process.env.EVM_CONTRACT,
          telosPrivateKeys: [],
        })
        try {
          this.$root.tEVMAccount = await this.$root.tEVMApi.telos.getEthAccountByTelosAccount(this.accountName);
        } catch {
          this.$root.tEVMAccount = null;
        }
      } catch {
      }
    }
  },
  async mounted() {
    await this.autoLogin(this.$route.query.returnUrl);
    if (this.isAuthenticated) {
      await this.createEvmApi();
    }
  }
};
</script>

<style lang="sass" scoped>
.login-btn
  max-width: 500px
  height: 40px
  round: 5px
  border-radius: 10px
.account-name
  color: white
  font-size: 20px
.logout-btn
  // margin-left: auto;
  left: -15px
  color: rgba(255, 255, 255, 0.8)
  background: rgba(0, 0, 0, 0.3)
  border: 1px solid rgba(255, 255, 255, 0.3)
</style>
