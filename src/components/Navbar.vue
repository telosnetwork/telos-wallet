<template>
  <div>
    <nav class="leftNavBar">
      <img src="~assets/telosLogo.svg" class="telosLogo" />
      <ul>
        <li>
          <a @click="switchTab('wallet')"> <img :src="srcWallet" />Wallet </a>
        </li>
        <li>
          <a @click="switchTab('dapps')"> <img :src="srcDapps" />dApps </a>
        </li>
        <li>
          <a @click="switchTab('coins')"> <img :src="srcCoins" />Coin </a>
        </li>
        <li>
          <a @click="switchTab('nft')"> <img :src="srcNft" />NFTs </a>
        </li>
        <li>
          <a @click="switchTab('earn')"> <img :src="srcEarn" />Earn </a>
        </li>
      </ul>
    </nav>
    <nav class="bottomNavBar">
      <ul>
        <li>
          <a @click="switchTab('wallet')">
            <img :src="srcWallet" />
          </a>
        </li>
        <li>
          <a @click="switchTab('earn')">
            <img style="width: 35px" :src="srcEarn" />
          </a>
        </li>
        <li>
          <a @click="switchTab('dapps')">
            <img :src="srcDapps" />
          </a>
        </li>
        <li>
          <a @click="switchTab('settings')">
            <img :src="srcSettings" />
          </a>
        </li>
      </ul>
    </nav>
    <RexStaking v-model:showRexStakeDlg="showRexStakeDlg" />
  </div>
</template>

<script>
import { mapGetters, mapActions } from "vuex";
import RexStaking from "../pages/components/balance/RexStaking.vue";
export default {
  props: ["balanceTab"],
  components: { RexStaking },
  data() {
    return {
      srcDir: "/nav/",
      selectedTab: "wallet",
      showRexStakeDlg: false,
    };
  },
  computed: {
    ...mapGetters("account", ["isAuthenticated"]),
    srcWallet() {
      if (this.selectedTab === "wallet")
        return this.srcDir + "wallet_selected.svg";
      else return this.srcDir + "wallet.svg";
    },
    srcDapps() {
      if (this.selectedTab === "dapps")
        return this.srcDir + "dapps_selected.svg";
      else return this.srcDir + "dapps.svg";
    },
    srcCoins() {
      if (this.selectedTab === "coins")
        return this.srcDir + "coins_selected.svg";
      else return this.srcDir + "coins.svg";
    },
    srcNft() {
      if (this.selectedTab === "nft") return this.srcDir + "nft_selected.svg";
      else return this.srcDir + "nft.svg";
    },
    srcSettings() {
      if (this.selectedTab === "settings")
        return this.srcDir + "settings_selected.svg";
      else return this.srcDir + "settings.svg";
    },
    srcEarn() {
      if (this.selectedTab === "earn" && this.showRexStakeDlg == false) {
        this.switchTab("wallet");
        return this.srcDir + "earn.svg";
      }
      if (this.selectedTab === "earn") return this.srcDir + "earn_selected.svg";
      else return this.srcDir + "earn.svg";
    },
  },
  methods: {
    switchTab(val) {
      this.selectedTab = val;
      switch (val) {
        case "wallet":
          this.$router.push("/balance", () => {});
          break;
        case "dapps":
          this.$router.push("/dappsearch", () => {});
          break;
        case "coins":
          this.$router.push("/balance", () => {});
          this.$emit("update:balanceTab", "Coins");
          break;
        case "nft":
          this.$router.push("/balance", () => {});
          this.$emit("update:balanceTab", "Collectables");
          break;
        case "settings":
          this.$router.push("/settings", () => {});
          break;
        case "earn":
          this.showRexStakeDlg = true;
          //   this.$router.push("/earn");
          break;
        default:
          break;
      }
    },
  },
  watch: {
    balanceTab() {
      if (this.balanceTab === "Coins") this.switchTab("coins");
      else this.switchTab("nft");
    },
  },
};
</script>

<style lang="scss" scoped>
nav ul li a:hover {
  background: #e6e6e611;
  opacity: 100%;
}

a img {
  width: 1.5rem;
}

.leftNavBar {
  visibility: collapse;
  transform: translate(-100%, -100%);
  height: 0px;
  width: 0px;
  position: fixed;
}

.bottomNavBar {
  position: fixed;
  z-index: 1;
  background: linear-gradient(to top, #3a246b, #00000042 100%);
  left: 0;
  bottom: 0;
  height: 65px;
  width: 100%;
  transition: transform 0.3s;
  ul {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    justify-content: space-evenly;
    height: 100%;
    li {
      width: 100%;
      height: 100%;
      a {
        text-decoration: none;
        display: flex;
        justify-content: center;
        height: 100%;
        visibility: visible;
        transition: transform 0.3s;
        cursor: pointer;
      }
    }
  }
}

@media only screen and (min-width: 1000px) {
  .leftNavBar {
    transform: translateX(0);
    border-radius: unset;
    background: linear-gradient(to bottom, #291a4c, #00000000 80%);
    top: 0;
    height: 100vh;
    width: 250px;
    transition: transform 0.3s;
    visibility: visible;
    cursor: pointer;

    ul {
      list-style: none;
      padding: 0;
      width: 100%;
      margin-bottom: 0%;
      cursor: pointer;
      li {
        width: 100%;
        cursor: pointer;
        a {
          text-decoration: none;
          color: white;
          display: flex;
          align-items: center;
          padding: 1.5em 3em;
          cursor: pointer;
        }
      }
    }
  }

  .bottomNavBar {
    visibility: hidden;
    transform: translateX(-100%);
    transition: transform 0.3s;
    cursor: pointer;
  }
  img {
    margin-left: 0.003rem;
    margin-right: 1rem;
  }
}
</style>
