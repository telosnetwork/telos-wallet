<template>
  <div class="column bg-white full-width" :style="`max-width: 500px; margin: auto; overflow: auto;`">
    <q-list v-if="type === 'signin'" class="q-py-md">
      <q-item class="items-center justify-center text-center column">
        <q-img
          width="120px"
          alt="Telos Sign"
          src="~assets/telos-sign.png"
        />
        <label style="font-size: 20px;">Sign-in</label>
      </q-item>
      <q-item>
        <q-input v-model="account" dense borderless filled
          class="round-sm full-width" maxlength="12" counter label="Account"
          :rules="[val => !!val || 'This field is required']" /> 
      </q-item>
      <q-item>
        <q-input v-model="privateKey" type="password" dense borderless filled
          class="round-sm full-width" label="Private Key" />
      </q-item>
      <q-item class="q-mt-lg">
        <div style="margin-left: auto;" id="google-signin-button"></div>
        <q-btn no-caps text-color="white" :style="`height: 35px; background: ${themeColor}; margin-left: 1rem;`"
          label="Login" @click="login" :disable="account.length < 12 || privateKey.length === 0" />
        <q-btn no-caps :style="`height: 35px; color: ${themeColor}; margin-left: 1rem;`"
          label="Close" @click="() => this.$emit('update:showAuth', false)" />
      </q-item>
    </q-list>
    <q-list v-else-if="type === 'signup' && signUpStep === 0" class="q-py-md">
      <q-item class="items-center justify-center text-center column">
        <q-img
          width="120px"
          alt="Telos Sign"
          src="~assets/telos-sign.png"
        />
        <label style="font-size: 20px;">Create Telos Account</label>
      </q-item>
      <q-item>
        <q-input v-model="account" dense borderless filled
          class="round-sm full-width" maxlength="12" counter label="Account"
          :rules="[val => !!val || 'This field is required']" /> 
      </q-item>
      <q-item class="justify-center">
        <vue-recaptcha
          sitekey="6Ld-_eIZAAAAAF6JsrFudo_uQjRL4eqPAZE40I3o"
          :size="width >= 400 ? 'normal' : 'compact'"
          @verify="(value) => onChangeRecaptcha(value)" />
      </q-item>
      <q-item class="q-mt-lg">
        <div style="margin-left: auto;" id="google-signin-button"></div>
        <q-btn no-caps text-color="white" :style="`height: 35px; background: ${themeColor}; margin-left: 1rem;`"
          label="Create" @click="create" :disable="account.length < 12" />
        <q-btn no-caps :style="`height: 35px; color: ${themeColor}; margin-left: 1rem;`"
          label="Close" @click="() => this.$emit('update:showAuth', false)" />
      </q-item>
      <div v-if="creating"
        class="justify-center absolute flex full-width full-height"
        style="top: 0; left: 0; background: rgba(0, 0, 0, 0.4);"
      >
        <q-spinner-dots class="q-my-auto" color="primary" size="40px" />
      </div>
    </q-list>
    <q-list v-else-if="type === 'signup' && signUpStep === 1" class="q-py-md">
      <q-item class="justify-center text-center">
        The following is your critical Telos info, please copy and paste these values into the fields below, and store them in a safe place:
      </q-item>
      <q-item class="text-center items-end q-pb-none item-min-height">
        <b>Account (all lowercase):</b>
      </q-item>
      <q-item class="text-center items-center q-py-none item-min-height q-pl-lg">
        {{ account }} <q-btn flat round dense size="sm" :style="`color: ${themeColor};`" icon="far fa-copy" @click="copyToClipboard(account)"/>
      </q-item>
      <q-item class="text-center items-end q-pb-none item-min-height">
        <b>Private Key:</b>
      </q-item>
      <q-item class="text-center items-center q-py-none item-min-height q-pl-lg" style="word-break: break-all;">
        {{ privateKey }} <q-btn flat round dense size="sm" :style="`color: ${themeColor};`" icon="far fa-copy" @click="copyToClipboard(privateKey)"/>
      </q-item>
      <q-item class="q-mt-md">
        <q-input v-model="confirmAccount" dense borderless filled
          class="round-sm full-width" maxlength="12" counter label="Account (lowercase)"
          :rules="[val => !!val || 'This field is required']" /> 
      </q-item>
      <q-item>
        <q-input v-model="confirmPrivateKey" type="password" dense borderless filled
          class="round-sm full-width" label="Private Key"
          :rules="[val => !!val || 'This field is required']" />
      </q-item>
      <q-item class="justify-center text-center q-py-none item-min-height text-red">
        <label v-if="confirmAccount !== account">Inputs do not match account info. Be sure to use all-lowercase account name</label>
        <label v-else-if="confirmPrivateKey !== privateKey">Inputs do not match private key info.</label>
      </q-item>
      <q-item class="q-py-none">
        <q-checkbox v-model="confirm" label="I have copied and stored my account and key" color="grey"/>
      </q-item>
      <q-item>
        <q-btn no-caps class="full-width" text-color="white" :style="`height: 35px; background: ${themeColor};`"
          label="Save" @click="save" :disable="confirmAccount !== account || confirmPrivateKey !== privateKey || !confirm" />
      </q-item>
    </q-list>
  </div>
</template>

<script>
import { mapGetters, mapActions, mapMutations } from 'vuex';
import VueRecaptcha from 'vue-recaptcha';

export default {
  props: ['showAuth', 'type'],
  components: { VueRecaptcha },
  data() {
    return {
      googleProfile: null,
      account: '',
      privateKey: '',
      confirmAccount: '',
      confirmPrivateKey: '',
      confirm: false,
      recaptchaValue: '',
      signUpStep: 0,
      creating: false,
    };
  },
  computed: {
    ...mapGetters('account', ['isAuthenticated', 'accountName']),
    ...mapGetters('global', ['footerHeight']),
    width() {
      return window.innerWidth;
    },
  },
  methods: {
    ...mapActions('account', ['accountExists', 'getUserProfile', 'accountExists']),
    ...mapMutations('account', ['setAccountName', 'getAccountProfile', 'setLoadingWallet']),
    async onGoogleSignIn (user) {
      this.googleProfile = user.getBasicProfile();
      const driveData = await this.loadFromGoogleDrive();
      if (this.type === 'signin') {
        if (driveData) {
          this.account = driveData.account;
          this.privateKey = driveData.privateKey;
          await this.login();
        } else {
          this.$q.notify({
            type: 'negative',
            message: `This Google Account isn't used for any account`,
          });
        }
      } else if (this.type === 'signup') {
        const givenName = this.googleProfile.getGivenName().toLowerCase().substring(0, 8);
        const pow = Math.pow(10, 11 - givenName.length);
        while (true) {
          if (this.account.length < 12) {
            this.account = `${givenName}${pow + Math.floor(Math.random() * 9 * pow)}`;
          }
          const accountExists = await this.accountExists(this.account);
          if (!accountExists) {
            break;
          }
          this.account = '';
        }
        if (!driveData) {
          this.create();
        } else {
          this.$q.notify({
            type: 'negative',
            message: `This Google Account is already used for ${driveData.account}`,
          });
        }
      }
    },
    async login() {
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
    onChangeRecaptcha (value){
      this.recaptchaValue = value;
    },
    async create() {
      const accountExists = await this.accountExists(this.account);
      if (accountExists) {
        this.$q.notify({
          type: 'negative',
          message: `Account ${this.account} already exists`,
        });
        this.creating = false;
        return;
      }
      const name = this.$blockchain.config.name;
      let url;
      if (name === 'telos') {
        url = 'api.telos.net'
      } else if (name === 'telos-testnet') {
        url = 'api-dev.telos.net'
      }
      this.creating = true;
      const newKeys = await this.$blockchain.getNewKeyPair()
      try {
        const createAccountResponse = await fetch(`https://${url}/v1/recaptchaCreate`, {
          method: 'POST',
          body: JSON.stringify({
            recaptchaResponse: this.recaptchaValue,
            accountName: this.account,
            ownerKey: newKeys.publicKey,
            activeKey: newKeys.publicKey,
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        })
        const createAccountData = await createAccountResponse.json()
        if (!createAccountResponse.ok) {
          this.$q.notify({
            type: 'negative',
            message: createAccountData.message,
          });
          this.creating = false;
          return;
        }
        this.privateKey = newKeys.privateKey;
        if (this.googleProfile) {
          await this.saveToGoogleDrive(this.account, newKeys);
        }
        this.signUpStep = 1;
      } catch (error) {
        console.log(error)
        this.$q.notify({
          type: 'negative',
          message: "Sorry, we can't create an account now",
        });
      }
      this.creating = false;
    },
    copyToClipboard(str) {
      var el = document.createElement('textarea');
      el.value = str;
      el.setAttribute('readonly', '');
      el.style = {display: 'none'};
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);

      this.$q.notify({
        type: 'primary',
        message: 'Copied it to the clipboard successfully',
      });
    },
    async loadFromGoogleDrive() {
      let result = null;
      let callbacked = false;
      await gapi.client.load('drive', 'v2');
      var request = gapi.client.drive.files.list({
        q: "title = 'Telos Web Wallet' and explicitlyTrashed = false",
        space: 'drive',
      });
      await request.execute(async function(resp) {
        if (resp && resp.items.length > 0) {
          var file = gapi.client.drive.files.get({
            fileId: resp.items[0].id,
            alt: 'media'
          })
          file.then(function(response) {
            result = JSON.parse(response.body);
            callbacked = true;
          }, function (error){
            callbacked = true;
          })
        } else {
          callbacked = true;
        }
      }, function (error) {
        callbacked = true;
      });
      let timeoutCnt = 100;
      while (!callbacked) {
        await new Promise(res => setTimeout(res, 100));
        timeoutCnt--;
        if (timeoutCnt === 0) {
          break;
        }
      }
      return result;
    },
    async saveToGoogleDrive(account = null, keys = null) {
      var fileContent = JSON.stringify({
        account: account ? account : this.account,
        privateKey: keys ? keys.privateKey : this.privateKey,
        publicKey: keys ? keys.publicKey : null,
      }); // As a sample, upload a text file.
      var file = new Blob([fileContent], {type: 'text/plain'});
      var metadata = {
          'name': 'Telos Web Wallet', // Filename at Google Drive
          'mimeType': 'text/plain', // mimeType at Google Drive
      };

      var accessToken = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse(true).access_token; // Here gapi is used for retrieving the access token.
      var form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', file);

      const showError = function (p , val) {
        if (val.message) {
          p.$q.notify({
            type: 'negative',
            message: val.message,
          });
        }
      }
      await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id', {
          method: 'POST',
          headers: new Headers({ 'Authorization': 'Bearer ' + accessToken }),
          body: form,
      }).then((res) => {
          return res.json();
      }).then(val => showError(this, val));
    },
    save() {
      this.$emit('update:type', 'signin');
    },
  },
  async mounted() {
    gapi.signin2.render('google-signin-button', {
      'height': 35,
      scope: 'profile email https://www.googleapis.com/auth/drive',
      onsuccess: this.onGoogleSignIn
    });
  },
  watch: {
    type: function (val, oldVal) {
      this.googleProfile = null;
      this.account = '';
      this.privateKey = '';
      this.confirmAccount = '';
      this.confirmPrivateKey = '';
      this.confirm = false;
      this.signUpStep = 0;
      this.creating = false;
    },
    account: function (val, oldVal) {
      this.account = this.account.toLowerCase();
    },
  }
};
</script>

<style>
.item-min-height {
  min-height: 24px;
}
</style>