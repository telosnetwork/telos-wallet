<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
    name: 'EVMLayout',
});
</script>

<template>
<q-layout view="hHh lpr fff">
    <q-page-container>
        <q-page>
            <router-view />
        </q-page>
    </q-page-container>
</q-layout>
</template>

<style lang="scss">

</style>
