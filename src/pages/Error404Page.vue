<script>
export default {
    name: 'Error404Page',
};
</script>

<template>
<div
    class="fullscreen bg-blue text-white text-center q-pa-md flex flex-center"
>
    <div>
        <div class="main-text">
            404
        </div>

        <div class="text-h2 oops">
            {{$t('error404.opps')}}
        </div>

        <q-btn
            class="q-mt-xl"
            color="white"
            text-color="blue"
            unelevated
            to="/"
            label="Go Home"
            no-caps
        />
    </div>
</div>
</template>

<style lang="scss" scoped>
.main-text {
    font-size: 30vh;
}

.oops {
    opacity: 0.4;
}
</style>
