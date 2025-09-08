<script setup lang="ts">
import { ref } from 'vue';

// data
const smartAccountAddress = ref('');

// methods
function connectSmartAccount() {
    // TODO: Implement smart account connection logic
    console.log('Connecting smart account:', smartAccountAddress.value);
}
</script>

<template>
<div class="c-view-account-tab">
    <div class="c-view-account-tab__content">
        <div class="c-view-account-tab__connect-section">
            <q-input
                v-model="smartAccountAddress"
                class="c-view-account-tab__address-input"
                placeholder="Enter Smart Account address"
                outlined
                dense
            />
            <q-btn
                class="c-view-account-tab__connect-btn"
                color="secondary"
                icon="🔍"
                @click="connectSmartAccount"
            />
        </div>
    </div>
</div>
</template>

<style lang="scss" scoped>
.c-view-account-tab {
    display: flex;
    justify-content: center;
    align-items: flex-start;
    min-height: 40vh;
    padding: 16px 24px;

    &__content {
        text-align: center;
        max-width: 500px;
        width: 100%;
    }

    &__connect-section {
        display: flex;
        flex-direction: row;
        gap: 12px;
        margin-bottom: 24px;
        align-items: center;
    }

    &__address-input {
        flex: 1;
        max-width: 400px;
    }

    &__connect-btn {
        padding: 8px 16px;
        border-radius: 6px;
        font-weight: 500;
        text-transform: none;
        white-space: nowrap;
    }
}
</style>
