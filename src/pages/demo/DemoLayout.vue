<script setup lang="ts">
</script>

<template>
<div class="c-demo-layout">
    <h5>Component Directory</h5>
    <ul class="q-mb-xl">
        <li>
            <router-link :to="{ name: 'demos.inputs' }">Inputs</router-link>
        </li>
    </ul>

    <router-view />
</div>
</template>

<style lang="scss">
.c-demo-layout {
    color: var(--text-color);
    margin: 24px;
}
</style>
