<script setup lang="ts">
</script>

<template>
<div class="c-demo-layout">
    <h5>Available demos</h5>
    <ul class="q-mb-xl">
        <li class="c-demo-layout__back">
            <router-link to="/">Back</router-link>
        </li>
        <br >
        <li>
            <router-link :to="{ name: 'demos.inputs' }">Inputs</router-link>
        </li>
        <li>
            <router-link :to="{ name: 'demos.send-errors' }">Send errors</router-link>
        </li>
    </ul>

    <router-view />
</div>
</template>

<style lang="scss">
.c-demo-layout {
    color: var(--text-default-contrast);
    margin: 24px;
    &__back {
        list-style: none;
        margin-left: -19px;
        &::before {
            content: '←';
            margin-right: 8px;
        }
    }
}
</style>
