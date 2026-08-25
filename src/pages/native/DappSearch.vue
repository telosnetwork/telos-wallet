<script>
import { mapGetters } from 'vuex';
import dappsData from 'src/data/dapps.json';

export default {
    data() {
        return {
            dapps: [],
            searchDappName: '',
            page: 1,
            loadedAll: false,
        };
    },
    computed: {
        ...mapGetters('account', ['isAuthenticated', 'accountName']),
        searchDapps() {
            return this.dapps.filter(dapp => (
                (dapp.name.toLowerCase().includes(this.searchDappName.toLowerCase()) ||
                dapp.category.toLowerCase().includes(this.searchDappName.toLowerCase()))
            ));
        },
    },
    methods: {
        async loadMoreDapps(index, done) {
            if (this.loadedAll) {
                done();
                return;
            }
            // Load from local JSON instead of Airtable
            this.dapps = dappsData;
            this.loadedAll = true;
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

<template>
<div class="row justify-center">
    <div class="page-container">
        <div
            class="q-pb-lg q-pt-xl text-subtitle1 text-weight-medium text-center"
        >
            {{$t('dapps.title')}}
        </div>
        <div class="q-px-md">
            <q-input
                v-model="searchDappName"
                borderless
                label-color="white"
                color="white"
                :placeholder="$t('dapps.placeholder')"
                dense
                input-style="color: white"
                input-class="text-white"
            >
                <template v-slot:append>
                    <img src="~/assets/icons/search.svg" >
                </template>
            </q-input>
            <q-separator dark class="q-my-sm" />
        </div>
        <q-infinite-scroll :offset="100" @load="loadMoreDapps">
            <div
                v-for="(dapp, index) in searchDapps"
                :key="`${dapp.name}-${index}`"
            >
                <q-item
                    v-ripple
                    clickable
                    class="list-item"
                    @click="openInNewTab(dapp.link)"
                >
                    <q-item-section avatar>
                        <img :src="dapp.icon" class="avatar" >
                    </q-item-section>
                    <q-item-section class="text-subtitle2 text-weight-medium">
                        {{ dapp.name }}
                    </q-item-section>
                    <q-item-section side>
                        <div class="text-white text-right display-grid">
                            <label
                                class="text-subtitle2 text-weight-medium text-white h-20"
                            >{{ dapp.category }}</label>
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

<style scoped>
.page-container {
    width: 600px;
}

.avatar {
    width: 30px;
    height: 30px;
}

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
