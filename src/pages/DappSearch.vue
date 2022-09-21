<template>
  <div class="row justify-center">
    <div style="width: 600px">
      <div
        class="q-pb-lg q-pt-xl text-subtitle1 text-weight-medium text-center"
      >
        dApps
      </div>
      <div class="q-px-md">
        <q-input
          v-model="searchDappName"
          borderless
          label-color="white"
          color="white"
          placeholder="Search dApp"
          dense
          input-style="color: white"
          input-class="text-white"
        >
          <template v-slot:append>
            <img src="~/assets/icons/search.svg" />
          </template>
        </q-input>
        <q-separator dark class="q-my-sm" />
      </div>
      <q-infinite-scroll @load="loadMoreDapps" :offset="100">
        <div
          v-for="(dapp, index) in searchDapps"
          :key="`${dapp.name}-${index}`"
        >
          <q-item
            clickable
            v-ripple
            class="list-item"
            @click="openInNewTab(dapp.link)"
          >
            <q-item-section avatar>
              <img :src="dapp.icon" style="width: 30px; height: 30px" />
            </q-item-section>
            <q-item-section class="text-subtitle2 text-weight-medium">
              {{ dapp.name }}
            </q-item-section>
            <q-item-section side>
              <div class="text-white text-right display-grid">
                <label
                  class="text-subtitle2 text-weight-medium text-white h-20"
                  >{{ dapp.category }}</label
                >
                <label class="text-caption text-white wraplabel">{{
                  dapp.tags.slice(0, 2).join(", ")
                }}</label>
              </div>
            </q-item-section>
          </q-item>
        </div>
        <template v-if="!loadedAll" v-slot:loading>
          <div class="row justify-center q-my-md">
            <q-spinner-dots color="primary" size="40px" />
          </div>
        </template>
      </q-infinite-scroll>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from "vuex";

// TODO remove this after updating api, using another solution
const dappsTemp =  [
      {
        "name": "Telos Swap",
        "description": "Swap Telos based assets simply",
        "link": "https://tswaps.com",
        "icon": "https://dl.airtable.com/.attachmentThumbnails/00628edf400e95828dd8d2eacda60b3c/f81e5968",
        "category": "finance",
        "tags": [
            "Live Apps",
            "defi",
            "Exchange"
        ]
      },{
          "name": "AreaX NFT",
          "description": "Popular NFT/Collectable Marketplace on Telos",
          "link": "https://areaxnft.com",
          "icon": "https://dl.airtable.com/.attachmentThumbnails/631bc8200b5d76e8687851452b2003dc/2a99e103",
          "category": "marketplaces",
          "tags": [
              "NFT",
              "Collectables"
          ]
      },{
          "name": "Bridge (PTokens)",
          "description": "Deposit and Withdraw TLOS between Telos, Ethereum and BSC",
          "link": "https://dapp.ptokens.io/pbtc-on-telos",
          "icon": "https://dl.airtable.com/.attachmentThumbnails/ba1646520eda710d6b5dccf05a435ec9/93a13700",
          "category": "finance",
          "tags": [
              "defi"
          ]
      },{
          "name": "Buy TLOS",
          "description": "Purchase your first Telos Tokens",
          "link": "https://buy.telos.net",
          "icon": "https://dl.airtable.com/.attachmentThumbnails/988c7e547419f91f24e0322bdfac02e6/e97caf0c",
          "category": "finance",
          "tags": [
              "defi"
          ]
      },{
          "name": "Explore Telos Dapps",
          "description": "Explore the entire Telos Ecosystem",
          "link": "https://telos.net/explore",
          "icon": "https://dl.airtable.com/.attachmentThumbnails/7aaf44093122d02d5f44191db5ceaf51/d1998654",
          "category": "marketplaces",
          "tags": [
              "Developers",
              "Hardware Wallet",
              "Coming Soon",
              "Network explorer",
              "Development tool",
              "Market system",
              "Service",
              "Utility",
              "Digital Goods",
              "Wallets",
              "Educational",
              "Account Tool",
              "Live Apps",
              "Information",
              "B2B",
              "Plugin",
              "Payments System",
              "Games",
              "defi",
              "Exchange",
              "Development Tool"
          ]
      },{
          "name": "Telos Staking Rewards",
          "description": "Earn a high APR just for Staking your TLOS to the network resource pool",
          "link": "https://telos.staker.one/rewards",
          "icon": "https://dl.airtable.com/.attachmentThumbnails/aa1a3b26fa92f34d97665bbbb3f8a276/09c47ff0",
          "category": "finance",
          "tags": [
              "defi"
          ]
      }];

export default {
  data() {
    return {
      dapps:[],
      searchDappName: "",
      page: 1,
      loadedAll: false
    };
  },
  computed: {
    ...mapGetters("account", ["isAuthenticated", "accountName"]),
    searchDapps() {
      return this.dapps.filter(dapp => {
        return (
          dapp.name.toLowerCase().includes(this.searchDappName.toLowerCase()) ||
          dapp.category
            .toLowerCase()
            .includes(this.searchDappName.toLowerCase())
        );
      });
    }
  },
  methods: {
    async loadMoreDapps(index, done) {
      if (this.loadedAll) return;
      const response = await fetch(
        `https://api.airtable.com/v0/appuqECuRiVlHcBUw/Apps?maxRecords=100&view=wallet apps`,
        {
          method: "get",
          headers: new Headers({
            Authorization: "Bearer keyNqmiYA23tKoaYg",
            "Content-Type": "application/x-www-form-urlencoded"
          })
        }
      );
      let json = await response.json();
      json = json.records.map(app => {
        return {
          name: app.fields.Title,
          description: app.fields.Description,
          link: app.fields.Link,
          icon: app.fields["App Image"][0].thumbnails.large.url,
          category: app.fields.Category,
          tags: app.fields.Tags
        };
      });
      json = dappsTemp; // TODO remove after updating api
      this.dapps.push(...json);
      this.page += 1;
      this.loadedAll = true;
      done();
    },
    openInNewTab(url) {
      var win = window.open(url, "_blank");
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
    }
  }
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

/* .list-item {
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
} */

.display-grid::-webkit-scrollbar {
  display: none;
}


@media only screen and (max-width: 1000px) {

}
</style>
