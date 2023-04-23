<script lang="ts">
import { defineComponent } from 'vue';
import AppPage from 'components/evm/AppPage.vue';
import AddressQR from 'components/evm/AddressQR.vue';
import UserInfo from 'components/evm/UserInfo.vue';
import { getAntelope, useAccountStore } from 'src/antelope';
import { useGlobalStore } from 'src/stores';

const accountStore = useAccountStore();
const ant = getAntelope();
const global = useGlobalStore();

export default defineComponent({
    name: 'ReceivePage',
    components: {
        AppPage,
        AddressQR,
        UserInfo,
    },
    mounted() {
        global.setHeaderBackBtn(true);
    },
    methods: {
        goBack() {
            this.$router.back();
        },
        copyToClipboard() {
            navigator.clipboard.writeText(this.address);
            ant.config.notifySuccessHandler(this.$t('settings.copied_ok'));
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
            return this.$q.screen.lt.md;
        },
    },
});
</script>

<template>
<AppPage>
    <template v-slot:header>
        <div class="c-receive-page__title-container">
            <p class="c-receive-page__title"> {{ $t('evm_wallet.receive') }}</p>
            <p class="c-receive-page__subtitle"> {{ $t('evm_wallet.scan_qr') }}</p>
            <AddressQR :address="address" class="c-receive-page__qr-code" />
        </div>
    </template>

    <div
        :class="{
            'c-receive-page__user-info-container': true,
            'c-receive-page__user-info-container--mobile': isMobile,
        }"
    >
        <UserInfo
            class="c-receive-page__user-info"
            :displayFullAddress="true"
            :showCopyBtn="!isMobile"
            :showUserMenu="false"
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

    &__title {
        font-size: 2.4rem;
        font-weight: 600;
        margin-bottom: -7px;
    }

    &__subtitle {
        font-size: 16px;
        font-weight: 400;
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
        padding-left: 32px;
        text-align: center;
        &--mobile {
            padding-left: 0;
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
