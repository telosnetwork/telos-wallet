<script lang="ts">
import { defineComponent } from 'vue';
import AppPage from 'components/evm/AppPage.vue';
import AddressQR from 'components/evm/AddressQR.vue';
import UserInfo from 'components/evm/UserInfo.vue';
import { getAntelope, useAccountStore } from 'src/antelope';

const accountStore = useAccountStore();
const ant = getAntelope();

export default defineComponent({
    name: 'ReceivePage',
    components: {
        AppPage,
        AddressQR,
        UserInfo,
    },
    methods: {
        goBack() {
            this.$router.back();
        },
        copyToClipboard() {
            navigator.clipboard.writeText(accountStore.loggedEvmAccount?.address);
            ant.config.notifySuccessCopyHandler();
        },
    },
    computed: {
        loggedAccount() {
            return accountStore.loggedEvmAccount;
        },
        address() {
            return accountStore.loggedEvmAccount?.address;
        },
        isMobile() {
            return this.$q.screen.lt.sm;
        },
        canvasSize() {
            const maxSize = Math.min(window.innerWidth, window.innerHeight) - 32;
            return Math.min(maxSize, 400);
        },
    },
});
</script>

<template>
<AppPage>
    <template v-slot:header>
        <div class="c-receive-page__title-container">
            <h1 class="u-text--high-contrast q-my-lg"> {{ $t('evm_wallet.receive') }}</h1>
            <p class="o-text--paragraph u-text--default-contrast q-mb-md"> {{ $t('evm_wallet.scan_qr') }}</p>
            <AddressQR
                v-if="address"
                :size="canvasSize"
                :address="address"
                class="c-receive-page__qr-code"
            />
        </div>
    </template>

    <div class="c-receive-page__user-info-container">
        <UserInfo
            class="c-receive-page__user-info"
            :displayFullAddress="true"
            :showCopyBtn="!isMobile"
            :account="loggedAccount"
        />

        <q-btn
            v-if="isMobile"
            color="primary"
            :label="$t('evm_wallet.copy')"
            class="wallet-btn c-receive-page__copy-btn"
            @click="copyToClipboard"
        />
    </div>

</AppPage>
</template>

<style lang="scss">
.c-receive-page {
    &__title-container {
        animation: #{$anim-slide-in-left};
        width: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
    }

    &__qr-code {
        margin-top: 24px;
    }

    &__user-info-container {
        animation: #{$anim-slide-in-left};
        display: flex;
        align-items: center;
        flex-direction: column;
        margin-top: 24px;
        padding-left: 0;
        text-align: center;
        @include sm-and-up {
            padding-left: 32px;
        }
        word-break: break-all;
    }

    &__copy-btn {
        margin-top: 24px;
        width: 100%;
        max-width: 200px;
    }
}
</style>
