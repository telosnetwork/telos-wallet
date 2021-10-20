<template>
  <div>
    <nav class="leftNavBar">
      <img src="~assets/telosLogo.svg" class="telosLogo" />
      <ul>
        <li>
          <a @click="switchTab('wallet')" class=" wallet">
            <img :src="srcWallet" class="menuIcon" />Wallet
          </a>
        </li>
        <li>
          <a @click="switchTab('dapps')">
            <img :src="srcDapps" class="menuIcon" />dApps
          </a>
        </li>
        <li>
          <a @click="switchTab('coins')">
            <img :src="srcCoins" class="menuIcon" />Coin
          </a>
        </li>
        <li>
          <a @click="switchTab('nft')">
            <img :src="srcNft" class="menuIcon" />Nft
          </a>
        </li>
        <li>
          <a @click="logout()"> <img icon="logout" />Logout </a>
        </li>
        <!-- <li>
            <a @click="$router.replace('/resources')" class=" wallet">
              Resources
            </a>
            <q-icon class="menuIcon fas fa-cogs" />
          </li> -->
      </ul>
    </nav>
    <nav class="bottomNavBar">
      <ul>
        <li>
          <a @click="switchTab('wallet')" class="active wallet">
            <img :src="srcWallet" class="menuIcon" />
          </a>
        </li>
        <li>
          <a @click="switchTab('dapps')">
            <img :src="srcDapps" class="menuIcon" />
          </a>
        </li>
        <li>
          <a @click="switchTab('coins')">
            <img :src="srcCoins" class="menuIcon" />
          </a>
        </li>
        <li>
          <a @click="switchTab('nft')">
            <img :src="srcNft" class="menuIcon" />
          </a>
        </li>
      </ul>
    </nav>
  </div>
</template>

<script>
import { mapActions } from "vuex";
export default {
  props: ["balanceTab"],
  data() {
    return {
      srcDir: "/nav/",
      selectedTab: "wallet"
    };
  },
  computed: {
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
    }
  },
  methods: {
    ...mapActions("account", ["logout"]),
    switchTab(val) {
      this.selectedTab = val;
      switch (val) {
        case "wallet":
          this.$router.replace("/balance");
          break;
        case "dapps":
          this.$router.replace("/dappsearch");
          break;
        case "coins":
          this.$emit("update:balanceTab", "Coins");
          this.$router.replace("/balance");
          break;
        case "nft":
          this.$emit("update:balanceTab", "Collectables");
          this.$router.replace("/balance");
          break;
        default:
          break;
      }
    }
  },
  watch: {
    balanceTab() {
      if (this.balanceTab === "Coins") this.switchTab("coins");
      else this.switchTab("nft");
    }
  }
};
</script>

<style lang="scss" scoped>
nav ul li a:hover {
  background: #e6e6e611;
  opacity: 100%;
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
  background: #00000000;
  left: 0;
  bottom: 0;
  height: 65px;
  width: 100%;
  transition: transform 0.3s;
  ul {
    list-style: none;
    padding: 0;
    display: flex;
    width: 100%;
    margin-left: 12.5%;
    li {
      display: inline;
      width: 100%;
      a {
        text-decoration: none;
        color: white;
        display: inline;
        width: 100%;
        height: 10em;
        visibility: visible;
        transform: translateX(-100%);
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
    // position: fixed;
    // z-index: 1;
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
}
</style>
