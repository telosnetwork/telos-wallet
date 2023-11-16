<script setup lang="ts">
import { getAntelope, useChainStore } from 'src/antelope';
import EVMChainSettings from 'src/antelope/chains/EVMChainSettings';
import { computed } from 'vue';

const chainStore = useChainStore();
const chainSettings = (chainStore.currentChain.settings as EVMChainSettings);

const simulateIndexerDown = () => {
    chainSettings.simulateIndexerDown(true);
    const  ant = getAntelope();
    ant.config.notifyNeutralMessageHandler('Indexer is (simulated) down');
};

const currentHealth = computed(() => chainSettings.isIndexerHealthy());

</script>

<template>
<div class="row q-mb-xl">
    <div class="col-12">
        <h3>Simulating indexer down</h3>
        <p>
            The indexer is currently <b>{{ currentHealth ? 'healthy' : 'down' }}</b>.
        </p>
    </div>
</div>
<div class="row q-mb-xl">
    <q-btn label="Simulate indexer down" @click="simulateIndexerDown" />
</div>
</template>

<style lang="scss">
</style>
