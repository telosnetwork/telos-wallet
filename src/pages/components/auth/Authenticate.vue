<template>
  <div class="column bg-white full-width" :style="`max-width: 500px; margin: auto; overflow: auto;`">
    <q-list class="q-py-md">
      <q-item>
        <q-input v-model="account" dense borderless filled
          class="round-sm full-width" maxlength="12" counter label="Account"
          :rules="[val => !!val || 'This field is required']"
        /> 
      </q-item>
      <q-item>
        <q-input v-model="privateKey" type="password" dense borderless filled
          class="round-sm full-width" label="Private Key"
        />
      </q-item>
      <q-item class="q-mt-lg">
        <q-btn text-color="white" :style="`height: 35px; background: ${themeColor}; margin-left: auto;`"
          label="Login" @click="Login" :disable="account.length < 12 || privateKey.length === 0"
        />
        <q-btn :style="`height: 35px; color: ${themeColor}; margin-left: 1rem;`"
          label="Close" @click="() => this.$emit('update:showAuth', false)"
        />
      </q-item>
    </q-list>
  </div>
</template>

<script>
import { mapGetters, mapActions, mapMutations } from 'vuex';

export default {
  props: ['showAuth'],
  data() {
    return {
      account: '',
      privateKey: '',
    };
  },
  computed: {
    ...mapGetters('account', ['isAuthenticated', 'accountName']),
    ...mapGetters('global', ['footerHeight']),
  },
  methods: {
    ...mapActions('account', ['accountExists', 'getUserProfile']),
    ...mapMutations('account', ['setAccountName', 'getAccountProfile', 'setLoadingWallet']),
    async Login() {
      let users = null;
      try {
        users = await this.$blockchain.signin({
          account: this.account,
          password: this.privateKey,
        });
      } catch (e) {
        this.$q.notify({
          type: 'negative',
          message: `Invalid account or private key`,
        });
      }

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
      } else {
        this.$q.notify({
          type: 'negative',
          message: `Invalid account or private key`,
        });
      }
    },
  },
};
</script>
