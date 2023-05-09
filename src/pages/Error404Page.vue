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
    <div class="c-404-page__video-overlay 404-page__video-overlay--shaded" ></div>

    <!--
      layout: una sola columna principal con un ancho máximo de 550px o 90vw. Las filas:
      - 1: fila con dos columnas col-6.
        - La primera columna contiene el logo ("~assets/logo--telos-wallet.svg")
        - La segunda columna contiene el texto grande "404" (font-size:73.61px)
      - 2: fila con una columna col-12 mostrando un texto como título (H2)
      - 3: fila con una columna col-12 mostrando un texto de explicación (p)
      - 4: fila con una columna col-12 mostrando un botón de acción (q-btn) para ir al homepage (to="/")
    -->
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
                    Sorry, the page you're looking for can't be found.
                </h2>
            </div>
        </div>

        <div class="c-404-page__layout-r3">
            <div class="c-404-page__layout-r3-c1">
                <p class="c-404-page__text">
                    However, you can easily return to our home page simply clicking the button below.
                </p>
            </div>
        </div>

        <div class="c-404-page__layout-r4">
            <div class="c-404-page__layout-r4-c1">
                <q-btn color="primary" to="/" class="q-mt-none">
                    take me to the home page
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
        position: fixed;
        width: 100vw;
        height: 100vh;
        overflow: hidden;
        z-index: -1;
    }

    &__video {
        object-fit: cover;
        width: 100vw;
        height: 100vh;
        position: fixed;
        transform: rotate(180deg);
        top: 35vh;
        left: 0;
    }

    &__video-overlay {
        background: linear-gradient(0.4turn, #0a1d5f52, #814cdc52);
        background-repeat: no-repeat;
        background-size: cover;
        object-fit: cover;
        width: 100vw;
        height: 100vh;
        position: fixed;
        left: 0;
        z-index: -1;
    }

    // layout

    &__layout {
        max-width: 550px;
        width: 90vw;
        height: 100vh;
        display: flex;
        flex-direction: column;
        justify-content: center;
    }

    &__layout-r1 {
        display: flex;
        justify-content: center;
    }

    &__layout-title {
        font-size: 73.61px;
    }

    &__layout-logo {
        display: flex;
    }

    &__layout-title {
        text-align: left;
        margin-left: 10px;
    }

    &__logo {
        width: 100%;
        max-width: 130px;
    }

    &__title {
        font-size: 73.61px;
        font-weight: 400;
        color: white;
    }

    &__subtitle {
        font-size: 24px;
        font-weight: 600;
        color: white;
        line-height: 1.95rem;
    }

    &__text {
        font-size: 16px;
        font-weight: 400;
        color: white;
        line-height: 1.95rem;
    }

}
</style>
