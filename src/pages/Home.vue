<template>
  <q-page class="main-div text-center items-center full-height">
    <q-carousel
      v-model="slide"
      transition-prev="slide-right"
      transition-next="slide-left"
      swipeable
      animated
      control-color="primary"
      navigation
      class="full-width fit-div"
    >
      <q-carousel-slide name="slide1" class="column flex-center">
        <div class="full-width justify-center q-pa-md">
          <q-img
            class="full-width home-image"
            alt="Telos Wallet logo"
            src="~assets/telos-wallet-logo-full.png"
          />
        </div>
        <label class="description font-size-3-5vw">
          The easiest and most secure<br />
          crypto wallet
        </label>
      </q-carousel-slide>

      <q-carousel-slide name="slide2" class="column flex-center">
        <div class="full-width justify-center q-pa-md">
          <q-img
            class="full-width home-image"
            alt="Digital assets"
            src="~assets/home_slide2.png"
          />
        </div>
        <label class="description text-weight-bold font-size-3-5vw">
          All your digital assets in<br />
          one place
        </label>
        <label class="description font-size-3-0vw">
          Take control of your tokens and collectibles by storing them on your
          own device
        </label>
      </q-carousel-slide>

      <q-carousel-slide name="slide3" class="column flex-center">
        <div class="full-width justify-center q-pa-md">
          <q-img
            class="full-width home-image"
            alt="Chart"
            src="~assets/home_slide3.png"
          />
        </div>
        <label class="description text-weight-bold font-size-3-5vw">
          Explore the universe of Decentralized Apps
        </label>
        <label class="description font-size-3-0vw">
          Decentralized exchanges, jobs, digital<br />
          collectibles and more!
        </label>
      </q-carousel-slide>

      <q-carousel-slide name="slide4" class="column flex-center">
        <div class="full-width justify-center q-pa-md">
          <q-img
            class="full-width home-image"
            alt="Send and Receive"
            src="~assets/home_slide4.png"
          />
        </div>
        <label class="description text-weight-bold font-size-3-5vw">
          Easily send and receive cryptocurrency
        </label>
        <label class="description font-size-3-0vw">
          Pay anyone in the world with just their Telos Wallet username
        </label>
      </q-carousel-slide>
    </q-carousel>
    
    <div v-if="!isAuthenticated" class="full-width" style="height: 120px;">
      <login-button />
    </div>
  </q-page>
</template>

<script>
import { mapGetters } from 'vuex';
import LoginButton from 'components/LoginButton.vue';

export default {
  name: 'Home',
  data() {
    return {
      slide: 'slide1'
    };
  },
  components: { LoginButton },
  computed: {
    ...mapGetters('account', ['isAuthenticated'])
  },
};
</script>

<style scoped>
.main-div {
  display: flex;
  flex-flow: column;
}
.fit-div {
  flex-grow: 1;
}
.logo {
  max-width: 400px;
}
.font-size-3-5vw {
  font-size: min(3.5vw, 40px);
}
.font-size-3-0vw {
  font-size: min(3.0vw, 30px);
}
.home-image {
  max-width: 700px;
}
.description {
  max-width: 900px;
  user-select: none;
}
</style>
