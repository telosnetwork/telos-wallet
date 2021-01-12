<template>
  <div>
    <div v-if="!isAuthenticated" class="q-px-md">
      <q-btn
        @click="showLogin = true"
        text-color="white"
        rounded
        no-caps
        label="Login"
        class="full-width"
        :style="`max-width: 500px; background: ${themeColor}`"
      />
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
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';

export default {
  data() {
    return { showLogin: false, error: null };
  },
  computed: {
    ...mapGetters('account', [
      'isAuthenticated',
      'accountName',
      'loading',
      'isAutoLoading',
    ])
  },
  methods: {
    ...mapActions('account', ['login', 'logout', 'autoLogin']),
    async onLogin(idx) {
      this.error = null;
      const error = await this.login({ idx });
      if (!error) {
        this.showLogin = false;
      } else {
        this.error = error;
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
    }
  },
  async mounted() {
    await this.autoLogin(this.$route.query.returnUrl);
  }
};
</script>

<style lang="sass" scoped>
.account-name
  color: white
  font-size: 20px
.logout-btn
  // margin-left: auto;
  left: -15px;
  color: rgba(255, 255, 255, 0.8);
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.3);
</style>
