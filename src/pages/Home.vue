<template>
  <q-page
    class="text-center items-center full-height"
    style="display: flex; flex-flow: column;"
  >
    <q-carousel
      v-model="slide"
      transition-prev="slide-right"
      transition-next="slide-left"
      swipeable
      animated
      control-color="orange-6"
      navigation
      class="full-width"
      style="flex-grow: 1;"
    >
      <q-carousel-slide
        name="slide1"
        class="column flex-center"
      >
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
      <q-carousel-slide
        name="slide2"
        class="column flex-center"
      >
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
      <q-carousel-slide
        name="slide3"
        class="column flex-center"
      >
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
      <q-carousel-slide
        name="slide4"
        class="column flex-center"
      >
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
    <div class="full-width" style="height: 80px;">
      <login-button />
    </div>
  </q-page>
</template>

<script>
import LoginButton from "components/LoginButton.vue";

export default {
  name: "Home",
  data() {
    return {
      slide: "slide1"
    };
  },
  components: { LoginButton }
};
</script>

<style scoped>
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
