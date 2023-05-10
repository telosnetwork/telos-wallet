<script>
import { defineComponent } from 'vue';

export default defineComponent({
    name: 'Error404Page',
    computed: {
        isMobile() {
            return this.$q.screen.lt.md;
        },
        isLandscape() {
            return this.$q.screen.width > this.$q.screen.height;
        },
    },
    watch: {
        $route: {
            immediate: true,
            handler() {
                console.log(this.$q.screen);
                console.log(this.$q.screen.lt);
                console.log(this.$q.screen.lt.md);
            },
        },
    },
});
</script>

<template>
<div
    :class="{
        'c-404-page': true,
        'landscape' : isMobile && isLandscape
    }"
>
    <div class="c-404-page__video-wrapper">
        <video
            id="bgvid"
            playsinline
            autoplay
            muted
            loop
            poster="~/assets/background/Video-top_compressed-poster-00001.jpg"
            class="c-404-page__video"
        >
            <source
                src="~/assets/background/Video-top_compressed-transcode.webm"
                type="video/webm"
            >
            <source
                src="~/assets/background/Video-top_compressed-transcode.mp4"
                type="video/mp4"
            >
        </video>
    </div>
    <div class="c-404-page__video-overlay" ></div>
    <div class="c-404-page__video-overlay 404-page__video-overlay--shaded" ></div>

    <div class="c-404-page__layout q-pa-lg q-gutter-y-md q-mx-auto">
        <div class="c-404-page__layout-r1">
            <div class="c-404-page__layout-logo">
                <img
                    class="c-404-page__logo"
                    src="~assets/logo--telos-wallet.svg"
                    :alt="$t('home.wallet_logo_alt')"
                    :aria-label="$t('nav.go_home')"
                >
            </div>
            <div class="c-404-page__layout-title">
                <div class="c-404-page__title">
                    404
                </div>
            </div>
        </div>

        <div class="c-404-page__layout-r2">
            <div class="c-404-page__layout-r2-c1">
                <h2 class="c-404-page__subtitle">
                    {{ $t('error404.subtitle') }}
                </h2>
            </div>
        </div>

        <div class="c-404-page__layout-r3">
            <div class="c-404-page__layout-r3-c1">
                <p class="c-404-page__text">
                    {{ $t('error404.text') }}
                </p>
            </div>
        </div>

        <div class="c-404-page__layout-r4">
            <div class="c-404-page__layout-r4-c1">
                <q-btn color="primary" to="/" class="c-404-page__button">
                    {{ $t('error404.take_me_to_home') }}
                </q-btn>
            </div>
        </div>
    </div>

</div>
</template>

<style lang="scss" scoped>

.c-404-page {

    &__video-wrapper {
        background-color: black;
        position: absolute;
        overflow: hidden;
        z-index: -1;
        top: 0px;
        bottom: 0px;
        left: 0px;
        right: 0px;
    }

    &__video {
        object-fit: cover;
        width: 100vw;
        height: 100vh;
        position: absolute;
        transform: rotate(180deg);
        top: 35vh;
        left: 0;
    }

    &__video-overlay {
        background: linear-gradient(0.4turn, #0a1d5f52, #814cdc52);
        object-fit: cover;
        position: absolute;
        overflow: hidden;
        z-index: -1;
        top: 0px;
        bottom: 0px;
        left: 0px;
        right: 0px;
    }

    // layout

    &__layout {
        max-width: 550px;
        width: 100vw;
        height: 100vh;
        display: flex;
        flex-direction: column;
        justify-content: initial;
        margin-top: 0vh;

        @media only screen and (min-width: $breakpoint-md-min) {
            margin-top: 15vh;
        }
    }

    &__layout-r1 {
        display: flex;
        justify-content: center;
    }

    &__layout-logo {
        display: flex;
    }

    &__layout-title {
        text-align: left;
        margin-left: 25px;
    }

    &__logo {
        width: 100%;
        max-width: 115px;
        .landscape & {
            max-width: 80px;
        }
    }

    &__title {
        font-size: 73.61px;
        font-weight: 400;
        color: white;
        .landscape & {
            font-size: 48px;
        }
    }

    &__subtitle {
        font-size: 24px;
        font-weight: 600;
        color: white;
        line-height: 1.95rem;
        .landscape & {
            font-size: 20px;
            margin: 5px 0 0 0;
        }
    }

    &__text {
        font-size: 16px;
        font-weight: 400;
        color: white;
    }

    &__button {
        --q-primary: linear-gradient(106.63deg, #1AD6FF 0%, #8946DF 83.87%);
    }

}
</style>
