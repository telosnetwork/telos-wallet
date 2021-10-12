<template>
  <div class="full-height main-div">
    <div class="flex-center full-height" style="position: relative">

      <!-- Left Naviggation Bar -->
      <div class=" leftNavBar">
        <nav>
          <img src="~assets/telosLogo.svg" class="telosLogo">
          <ul>
              <li>
                <a @click="$router.replace('/balance')" class="active wallet"> 
                <img src="~assets/wallet.svg" class="menuIcon">Wallet</a>
              </li>
              <li><a @click="$router.replace('/dappsearch')">
                <img src="~assets/dApps1.svg" class="menuIcon">dApps</a></li>
              <li><a href="#">
                <img src="~assets/coin.svg" class="menuIcon">Coin</a></li>
              <li><a href="#">
                <img src="~assets/nft.svg" class="menuIcon">Nft</a></li>
          </ul>
        </nav>
      </div>

<!-- Toolbar -->
          <q-header class="dapp-header text-white">
            <q-toolbar>
              <q-toolbar-title class="text-white full-width text-center">
                <div class="display-grid">
                  <label class="text-white text-subtitle1 text-weight-medium;" style="color: white; margin-top: 15px">dApps</label>
                  <q-input v-model="searchDappName" 
                    standout="bg-transparent text-white" 
                    label-color="white"  
                    color="white" 
                    label="Search dApp" 
                    dense
                    input-style="color: white"
                    input-class="text-white"  
                    class="searchBar text-white"
                    style="padding-left: 10px;"/>
                </div>
              
              <!-- <q-icon class="col" name="search"/> -->
              </q-toolbar-title>
              
            </q-toolbar>
            
          </q-header>
          
      <q-card class="bg-transparent dappsHead " style="max-width: 800px; min-width: 300px; margin: auto; height: 80vh; position: relative">
        <q-layout
          view="hhh Lpr fFf"
          container
          class="coinview"
        >

<!-- Dapp Container -->
          <q-page-container style="height: 80vh;">
            <q-infinite-scroll class="" @load="loadMoreDapps" :offset="100">
              <div v-for="(dapp, index) in searchDapps" :key="`${dapp.name}-${index}`">
                <q-item clickable v-ripple class="list-item" @click="openInNewTab(dapp.link)">
                  <q-item-section avatar>
                    <q-avatar size="45px" class="q-my-sm justify-center">
                      <img :src="dapp.icon">
                    </q-avatar>
                  </q-item-section>

                  <q-item-section style="justify-content: start; display: grid;">
                    <div class="text-white text-left display-grid">
                      <label class="text-subtitle2 text-weight-medium text-white h-20 self-end wraplabel">{{dapp.name}}</label>
                      <label class="text-caption text-white">{{ }}</label>
                    </div>
                  </q-item-section>

                  <q-item-section side>
                    <div class="text-white text-right display-grid">
                      <label class="text-subtitle2 text-weight-medium text-white h-20">{{dapp.category}}</label>
                      <label class="text-caption text-white wraplabel">{{dapp.tags.slice(0, 2).join(', ')}}</label>
                    </div>
                  </q-item-section>
                </q-item>
                <!-- <q-separator style="height: 1px;" color="white"/> -->
              </div>
              <template v-if="!loadedAll" v-slot:loading>
                <div class="row justify-center q-my-md">
                  <q-spinner-dots color="primary" size="40px" />
                </div>
              </template>
            </q-infinite-scroll>
          </q-page-container>
        </q-layout>
      </q-card>
    <!-- Bottom Naviggation Bar -->
      <div class="left-col bottomNavBar" style="position: absolute;">
          <nav>
            <ul>
                <li>
                  <a @click="$router.replace('/balance')" class="active wallet"> 
                    <img src="~assets/wallet.svg" class="menuIcon"></a>
                </li>
                <li><a @click="$router.replace('/dappsearch')">
                  <img src="~assets/dApps1.svg" class="menuIcon"></a></li>
                <li><a href="#">
                  <img src="~assets/coin.svg" class="menuIcon"></a></li>
                <li><a href="#">
                  <img src="~assets/nft.svg" class="menuIcon"></a></li>
            </ul>
          </nav>
       </div>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
// import moment from 'moment';

export default {
  data() {
    return {
      dapps: [],
      searchDappName: '',
      page: 1,
      loadedAll: false,
    }
  },
  computed: {
    ...mapGetters('account', ['isAuthenticated', 'accountName']),
    searchDapps() {
      return this.dapps.filter((dapp) => {
        return dapp.name.toLowerCase().includes(this.searchDappName.toLowerCase())
            || dapp.category.toLowerCase().includes(this.searchDappName.toLowerCase());
      });
    },
  },
  methods: {
    async loadMoreDapps(index, done) {
      if (this.loadedAll) return;
      const response = await fetch(`https://api.airtable.com/v0/appuqECuRiVlHcBUw/Apps?maxRecords=100&view=wallet apps`, { 
        method: 'get', 
        headers: new Headers({
          'Authorization': 'Bearer keyNqmiYA23tKoaYg', 
          'Content-Type': 'application/x-www-form-urlencoded'
        })
      });
      let json = await response.json();
      json = json.records.map((app) => {
        return {
          name: app.fields.Title,
          description: app.fields.Description,
          link: app.fields.Link,
          icon: app.fields["App Image"][0].thumbnails.large.url,
          category: app.fields.Category,
          tags: app.fields.Tags,
        };
      });
      this.dapps.push(...json);
      this.page += 1;
      // if (json.length === 0) {
        this.loadedAll = true;
      // }
      done();
    },
    openInNewTab(url) {
      var win = window.open(url, '_blank');
      win.focus();
    },
    getFullStarCount(score) {
      return Math.floor(score / 2);
    },
    getEmptyStarCount(score) {
      return Math.floor(5 - score / 2);
    },
    hasHalfStar(score) {
      return score % 2 !== 0;
    },
  },
};
</script>

<style scoped>

div {
  overflow: auto;
}

div::-webkit-scrollbar-track {
  -webkit-box-shadow: inset 0 0 0px rgba(0, 0, 0, 0);
  border-radius: 10px;
  background-color: #00000000;
}

div::-webkit-scrollbar {
  width: 1px;
  background-color: #7802ff00;
}

div::-webkit-scrollbar-thumb {
  border-radius: 10px;
  -webkit-box-shadow: inset 0 0 0px rgba(0, 0, 0, 0);
  background-color: #555;
}

/* .toolbar-title {
  position: absolute;
  text-align: center;
  
} */
.list-item {
  /* border: 1px solid #020036; */
  border-left: none;
  border-right: none;
}
.display-grid {
  display: grid;
}
.wraplabel {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bg-transparent {
  background: #00000000;
}

.display-grid::-webkit-scrollbar {
  display: none;
}

.dapp-header {
  background: #00000000;
}

.bottomNavBar nav{
position: fixed;
z-index: 2;
background: #00000000;
left: 0;
bottom:0;
height: auto;
width: 100%;
transition: transform .3s;
}

.bottomNavBar nav ul{
  list-style: none;
  padding: 0;
  display: flex;
  width: 100%;
  margin-left: 12.5%;
}

.bottomNavBar nav ul li{
  display: inline;
  width: 100%;
}

.bottomNavBar nav ul li a{
  text-decoration: none;
  color: white;
  display: inline;
  width: 100%;
  height: 10em;
  visibility: visible;
  transform: translateX(-100%);
  transition: transform .3s;
  cursor: pointer;
}

nav ul li a:hover{
  background: #00000011;
  opacity: 100%;
  /* cursor: pointer; */
}

.leftNavBar nav {
  visibility: collapse;
  transform: translateX(-100%);
  transition: transform .3s;
  height: 0px;
}

/* .active{
  background: lightgrey;
} */

.active:hover{
  background: 4497FF ;
}

.searchBar{
  width: 50%;
  margin-left: 25%;
}

.dappsHead{
  border-top-left-radius: 0px;
  border-top-right-radius: 0px;
  border-bottom-left-radius: unset;
  border-bottom-left-radius: unset;
  background: #00000000;
}

.card{
  box-shadow:  0 0px 0px rgb(0 0 0 / 0);
}

.q-card{
  box-shadow:  0 0px 0px rgb(0 0 0 / 0);
}

@media only screen and (max-width: 1000px) {
.dappsHead{
  border-top-left-radius: 0px;
  border-top-right-radius: 0px;
  border-bottom-left-radius: unset;
  border-bottom-left-radius: unset;
  background: #00000000;
  padding-bottom: 65px
}
}

@media only screen and (min-width: 1000px) {
.leftNavBar nav {
    position: unset;
    transform: translateX(0) !important;
    border-radius: 0px;
    height: 100vh;
}

.bottomNavBar nav {
    visibility: hidden;
    transform: translateX(-100%);
    transition: transform .3s;
}

.coinHeader{
  margin-left: 50%;
  transform: translate(-250px) !important;
  /* transform: translate(-250px) !important; */
}


.leftNavBar nav{
  position: fixed;
  z-index: 1;
  background: linear-gradient(to bottom, #291A4C, #00000000 80%);
  left: 0;
  top:0;
  height: 100vh;
  width: 250px;
  transform: translateX(-100%);
  transition: transform .3s;
  visibility: visible;
}

.telosLogo{
  padding: 2.5em 5em .875em 4em
}
.menuIcon{
  width: 1.5rem;
  margin-left: 0.003rem;
  margin-right: 1rem;
}

.leftNavBar nav ul{
  list-style: none;
  padding: 0;
  width: 100%;
  margin-bottom: 0%;
}

.leftNavBar nav ul li{
  width: 100%;
}

.leftNavBar nav ul li a{
  text-decoration: none;
  color: white;
  display: block;
  padding: .875em 6em 3em 6em;
  cursor: pointer;
}

div {
  overflow: auto;
}

div::-webkit-scrollbar-track {
  -webkit-box-shadow: inset 0 0 0px rgba(0, 0, 0, 0);
  border-radius: 10px;
  background-color: #0f0f0f3a;
}

div::-webkit-scrollbar {
  width: 1px;
  background-color: #0f0f0f3a;
}

div::-webkit-scrollbar-thumb {
  border-radius: 10px;
  -webkit-box-shadow: inset 0 0 0px rgba(0, 0, 0, 0);
  background-color: #0f0f0f3a;
}

q-layout {
  overflow: auto;
}

q-layout::-webkit-scrollbar-track {
  -webkit-box-shadow: inset 0 0 0px rgba(0, 0, 0, 0);
  border-radius: 1px;
  background-color: #00000000;
}

q-layout:-webkit-scrollbar {
  width: 1px;
  background-color: #0f0f0f3a;
}

q-layout::-webkit-scrollbar-thumb {
  border-radius: 1px;
  -webkit-box-shadow: inset 0 0 6px rgba(6, 103, 160, 0);
  background-color: rgba(0, 0, 0, 0);
}

.card{
  box-shadow:  0 0px 0px rgb(0 0 0 / 0);
}

.q-card{
  box-shadow:  0 0px 0px rgb(0 0 0 / 0);
}

}


</style>