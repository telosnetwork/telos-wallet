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
        <q-btn
            class="c-receive-page__back-button"
            flat
            dense
            label="Back"
            icon="arrow_back_ios"
            @click="goBack"
        />
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
.q-btn.wallet-btn {
    width: auto;
    padding: 13px 24px;
    font-size: 0.9rem;
    font-weight: 600;
    text-transform: uppercase;
    &+& {
        margin-left: 16px;
    }
}

.c-receive-page {
    &__back-button {
        position: absolute;
        top: 24px;
        left: 32px;
        z-index: 1;
        font-size: 12.8px;
        font-weight: 600;
        i {
            font-size: 1.15em;
        }
    }
    &__title-container {
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
