<script>
import { mapGetters } from 'vuex';
import RexStaking from 'pages/native/balance/RexStaking.vue';
import ManageResources from 'components/native/ManageResources.vue';
export default {
    props: ['balanceTab'],
    components: { RexStaking, ManageResources },
    data() {
        return {
            srcDir: '/nav/',
            selectedTab: 'coins',
            showRexStakeDlg: false,
            showManageResourcesDlg: false,
        };
    },
    computed: {
        ...mapGetters('account', ['isAuthenticated']),
        srcWallet() {
            if (this.selectedTab === 'coins') {
                return this.srcDir + 'wallet_selected.svg';
            } else {
                return this.srcDir + 'wallet.svg';
            }
        },
        srcDapps() {
            if (this.selectedTab === 'dapps') {
                return this.srcDir + 'dapps_selected.svg';
            } else {
                return this.srcDir + 'dapps.svg';
            }
        },
        srcCoins() {
            if (this.selectedTab === 'coins') {
                return this.srcDir + 'coins_selected.svg';
            } else {
                return this.srcDir + 'coins.svg';
            }
        },
        srcNft() {
            if (this.selectedTab === 'nft') {
                return this.srcDir + 'nft_selected.svg';
            } else {
                return this.srcDir + 'nft.svg';
            }
        },
        srcSettings() {
            if (this.selectedTab === 'settings') {
                return this.srcDir + 'settings_selected.svg';
            } else {
                return this.srcDir + 'settings.svg';
            }
        },
        srcEarn() {
            if (this.selectedTab === 'earn' && this.showRexStakeDlg === false) {
                this.switchTab('coins');
                return this.srcDir + 'earn.svg';
            }
            if (this.selectedTab === 'earn') {
                return this.srcDir + 'earn_selected.svg';
            } else {
                return this.srcDir + 'earn.svg';
            }
        },
        srcResources() {
            if (this.selectedTab === 'resources' && this.showManageResourcesDlg === false) {
                this.switchTab('coins');
                return this.srcDir + 'settings.svg';
            }
            if (this.selectedTab === 'resources') {
                return this.srcDir + 'settings_selected.svg';
            } else {
                return this.srcDir + 'settings.svg';
            }
        },
        srcProfile() {
            if (this.selectedTab === 'profile'){
                this.switchTab('profile');
                return this.srcDir + 'profile_selected.svg';
            }else{
                return this.srcDir + 'profile.svg';
            }
        },
        srcLogout() {
            return this.srcDir + 'resources.svg';
        },
    },
    methods: {
        switchTab(val) {
            this.selectedTab = val;
            switch (val) {
            case 'coins':
                this.$router.push('/zero/balance', () => {});
                this.$emit('update:balanceTab', 'coins');
                break;
            case 'dapps':
                this.$router.push('/zero/dappsearch', () => {});
                break;
            case 'nft':
                this.$router.push('/zero/balance', () => {});
                this.$emit('update:balanceTab', 'collectables');
                break;
            case 'profile':
                this.$router.push('/zero/profile', () => {});
                break;
            case 'earn':
                this.showRexStakeDlg = true;
                break;
            case 'resources':
                this.showManageResourcesDlg = true;
                break;
            default:
                break;
            }
        },
    },
    watch: {
        balanceTab(val) {
            if (val === 'coins') {
                this.switchTab(val);
            } else {
                this.switchTab('nft');
            }
        },
    },
};
</script>

<template>
<div>
    <nav class="leftNavBar">
        <img src="/branding/telos-wallet-light.png" class="telosLogo" >
        <ul>
            <li>
                <a @click="switchTab('coins')"> <img :src="srcWallet" >{{$t('navbar.wallet')}} </a>
            </li>
            <li>
                <a @click="switchTab('earn')"> <img :src="srcEarn" >{{$t('navbar.staking')}}</a>
            </li>
            <li>
                <a @click="switchTab('resources')"> <img :src="srcResources" >{{$t('navbar.resources')}}</a>
            </li>
            <li>
                <a @click="switchTab('nft')"> <img :src="srcNft" >{{$t('navbar.nfts')}} </a>
            </li>
            <li>
                <a @click="switchTab('dapps')"> <img :src="srcDapps" >{{$t('navbar.dapps')}} </a>
            </li>
            <li>
                <a @click="switchTab('profile')"> <img :src="srcProfile" >{{$t('navbar.profile')}} </a>
            </li>
            <li>
                <a @click="$emit('log-out')"> <img :src="srcLogout" >{{$t('navbar.logout')}} </a>
            </li>
        </ul>
    </nav>
    <nav class="bottomNavBar">
        <ul>
            <li>
                <a @click="switchTab('coins')">
                    <img :src="srcWallet" >
                </a>
            </li>
            <li>
                <a @click="switchTab('earn')">
                    <img class="tab-icon" :src="srcEarn" >
                </a>
            </li>
            <li>
                <a @click="switchTab('resources')">
                    <img class="tab-icon" :src="srcResources" >
                </a>
            </li>
            <li>
                <a @click="switchTab('nft')">
                    <img class="tab-icon" :src="srcNft" >
                </a>
            </li>
            <li>
                <a @click="switchTab('dapps')">
                    <img :src="srcDapps" >
                </a>
            </li>
            <li>
                <a @click="switchTab('profile')">
                    <img :src="srcProfile" >
                </a>
            </li>
            <li>
                <a @click="$emit('log-out')">
                    <img :src="srcLogout" >
                </a>
            </li>
        </ul>
    </nav>
    <RexStaking v-model:showRexStakeDlg="showRexStakeDlg" />
    <ManageResources v-model:showManageResourcesDlg="showManageResourcesDlg" />
</div>
</template>

<style lang="scss" scoped>
.tab-icon {
    width: 35px;
}

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
