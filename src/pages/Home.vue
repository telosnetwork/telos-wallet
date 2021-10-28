<template>
  <q-page class="column justify-center items-center content-center">
    <!--
    <q-carousel
      v-model="slide"
      transition-prev="slide-right"
      transition-next="slide-left"
      swipeable
      animated
      control-color="primary"
      :navigation="false"
      class="full-width fit-div row justify-center"
    >
      <q-carousel-slide name="slide1" class="column flex-center">
        <div class="text-center q-pb-lg text-h1">
          Telos Wallet
        </div>
        <div class="text-h5">
          Send, Buy, Collect.<br />
          It's Crypto Made Easy
        </div>
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
    </q-carousel>-->

    <div class="text-center q-pb-md text-h1">
      Telos Wallet
    </div>
    <div class="text-h5 text-center q-pb-lg">
      It's Crypto Made Easy
    </div>
    <div v-if="!isAuthenticated" class="text-center">
      <login-button />
    </div>
  </q-page>
</template>

<script>
import { mapGetters } from "vuex";
import LoginButton from "components/LoginButton.vue";

export default {
  name: "Home",
  data() {
    return {
      slide: "slide1"
    };
  },
  components: { LoginButton },
  computed: {
    ...mapGetters("account", ["isAuthenticated"])
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
}
.logo {
  max-width: 400px;
}
.font-size-3-5vw {
  font-size: min(3.5vw, 40px);
}
.font-size-3-0vw {
  font-size: min(3vw, 30px);
}
.home-image {
  max-width: 700px;
}
.description {
  max-width: 900px;
  user-select: none;
}
</style>
