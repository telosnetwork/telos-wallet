<script>
import { defineComponent } from 'vue';

export default defineComponent({
    name: 'Error404Page',
});
</script>

<template>
<div class="c-404-page">
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
    <div class="c-404-page__video-overlay" ></div>

    <div class="c-404-page__layout q-pa-lg q-gutter-y-md q-mx-auto">
        <div class="c-404-page__layout-r1">
            <div class="c-404-page__layout-logo">
                <img
                    class="c-404-page__logo"
                    src="branding/telos-wallet-light.svg"
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
                <q-btn to="/" class="c-404-page__button purpleGradient">
                    {{ $t('error404.take_me_to_home') }}
                </q-btn>
            </div>
        </div>
    </div>

</div>
</template>

<style lang="scss" scoped>

.c-404-page {
    // capture & in $this variable
    $this: &;
    height: 100vh;
    overflow: hidden;

    &__video-wrapper {
        background-color: black;
        position: absolute;
        overflow: hidden;
        z-index: $z-index--video-wrapper;
        top: 0;
        bottom: 0;
        left: 0;
        right: 0;
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
        z-index: $z-index--video-overlay;
        top: 0;
        bottom: 0;
        left: 0;
        right: 0;
    }

    // layout

    &__layout {
        max-width: 550px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        margin-top: 0;

        @include sm-and-up {
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
        @include mobile-landscape {
            max-width: 80px;
        }
    }

    &__title {
        @include text--header-1;
        color: white;
    }

    &__subtitle {
        @include text--header-2;
        color: white;
        @include mobile-landscape {
            margin: 5px 0 0 0;
        }
    }

    &__text {
        @include text--paragraph;
        color: white;
    }

}
</style>
