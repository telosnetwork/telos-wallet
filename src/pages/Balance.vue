<template>
  <div class="full-height main-div">
    <div class="flex-center bg-orange fit-div">
      <div class="text-center full-width" style="display: grid;">
        <label 
          class="text-white"
          :style="`height: ${accountNameStyle.height}px; opacity: ${accountNameStyle.opacity}; margin-bottom: 5px;`"
        >
          {{accountName}}
        </label>
        <div class="full-width items-center balance-div">
          <div class="full-width" ></div>
          <div class="full-width" >
            <label class="text-weight-medium text-white" :style="`font-size: ${balanceTextSize}px;`">
              $0.00
            </label>
          </div>
          <div class="full-width text-right">
            <q-btn round flat icon="qr_code_scanner" size="10px" class="text-white q-mr-md" :style="`background-color: #0002; opacity: ${qrcodeOpacity};`"/>
          </div>
        </div>
        <div class="flex-center" :style="`display:flex; height: ${accountNameStyle.height * 2}px;`">
          <q-toolbar class="text-white main-toolbar" :style="`opacity: ${accountNameStyle.opacity};`">
            <q-btn stretch flat no-caps label="Send" />
            <q-separator dark vertical class="main-toolbar-sperator"/>
            <q-btn stretch flat no-caps label="Receive" />
            <q-separator dark vertical class="main-toolbar-sperator"/>
            <q-btn stretch flat icon="qr_code_scanner" style="width: 40px;"/>
          </q-toolbar>
        </div>
      </div>
    </div>
    <div :style="`height: ${coinViewHeight}px;`">
      <div class="bg-orange bar"/>
      <q-layout
        view="hHh Lpr fFf"
        container
        class="shadow-4 coinview"
        :style="`margin-left: ${coinViewMargin}px; margin-right: ${coinViewMargin}px; width: auto;`"
      >
        <q-header class="coin-header flex-center bg-white" style="display: flex;">
          <q-tabs
            v-model="tab"
            dense
            align="justify"
            narrow-indicator
            active-color="orange-10"
            class="bg-white text-grey shadow-2 full-height no-shadow"
            style="width: 300px;"
          >
            <q-tab
              no-caps
              v-for="tab in tabs"
              :name="tab.title"
              :label="tab.label"
              :key="tab.title"
            />
          </q-tabs>
        </q-header>
        <q-page-container>
          <q-page v-touch-pan.vertical.prevent.mouse="handlePan" class="q-pa-md">
            Balance here
          </q-page>
        </q-page-container>
      </q-layout>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from "vuex";
import moment from "moment";

const tabsData = [
  {
    title: "Coins",
    caption: "Coins",
    label: "Coins",
  },
  {
    title: "Collectibles",
    caption: "Collectibles",
    label: "Collectibles",
  },
];

export default {
  data() {
    return {
      avatar: null,
      bio: null,
      displayName: null,
      status: null,
      accountName: null,
      profileAccountName: null,
      accountHasProfile: false,
      accountHistory: [{}],
      panning: false,
      coinViewHeight: 0,
      tab: tabsData[0].title,
      tabs: tabsData,
    };
  },
  computed: {
    ...mapGetters('account', ['isAuthenticated']),
    ...mapGetters('global', ['footerHeight', 'minSpace', 'maxSpace']),
    userAvatar() {
      if (this.avatar) return this.avatar;

      return "https://images.squarespace-cdn.com/content/54b7b93ce4b0a3e130d5d232/1519987165674-QZAGZHQWHWV8OXFW6KRT/icon.png?content-type=image%2Fpng";
    },
    availableHeight() {
      return window.innerHeight - (this.isAuthenticated ? this.footerHeight : 0);
    },
    coinViewMargin() {
      return (this.availableHeight - this.coinViewHeight - this.minSpace) * 0.1;
    },
    balanceTextSize() {
      return (this.availableHeight - this.coinViewHeight) * 0.25;
    },
    accountNameStyle() {
      return {
        opacity: Math.max(0, (this.balanceTextSize - 15) * 0.05),
        height: Math.max(0, (this.balanceTextSize - 15) * 1),
      };
    },
    qrcodeOpacity() {
      return 1 - Math.max(0, (this.balanceTextSize - 15) * 0.1);
    },
  },
  methods: {
    ...mapActions("account", ["getUserProfile"]),
    handlePan({ evt, ...info }) {
      this.coinViewHeight -= info.delta.y;
      this.coinViewHeight = Math.min(this.availableHeight - this.minSpace, Math.max(this.availableHeight - this.maxSpace, this.coinViewHeight));
      if (info.isFirst) {
        this.panning = true;
      } else if (info.isFinal) {
        this.panning = false;
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
  beforeMount() {
    this.coinViewHeight = window.innerHeight - this.footerHeight - this.maxSpace;
  },
  created: async function() {
    const accountName = this.$route.params.accountName;
    if (!accountName) {
      return;
    }

    this.accountName = accountName;

    this.loadUserProfile();
  },
  watch: {
    "$route.params.accountName": function(accountName) {
      if (accountName != this.profileAccountName) {
        this.accountName = accountName;
        this.loadUserProfile();
      }
    }
  }
};
</script>

<style scoped>
.main-div {
  display: flex;
  flex-flow: column;
}
.fit-div {
  flex-grow: 1;
  display: flex;
}
.balance-div {
  display: inline-flex;
  justify-content: space-between;
}
.main-toolbar {
  background-color: #0002;
  border-radius: 15px;
  width: 250px;
  height: 35px;
  min-block-size: auto;
}
.main-toolbar-sperator {
  width: 2px;
  height: 20px;
  margin: auto;
}
.bar {  
  width: 100%;
  height: 50px;
  position: absolute;
}
.coinview {
  background-color: white;
  border-top-left-radius: 15px;
  border-top-right-radius: 15px;
  border-bottom-left-radius: unset;
  border-bottom-left-radius: unset;
}
.coin-header {
  height: 40px;
}
</style>