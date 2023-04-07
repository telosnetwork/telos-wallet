<script lang="ts">
import { defineComponent } from 'vue';

import InlineSvg from 'vue-inline-svg';

import BigFiatText from 'components/evm/BigFiatText.vue';
import { useChainStore } from 'src/antelope';
import EVMChainSettings from 'src/antelope/chains/EVMChainSettings';

export default defineComponent({
    name: 'WalletPageHeader',
    components: {
        BigFiatText,
        InlineSvg,
    },
    computed: {
        // TODO return real balance
        // https://github.com/telosnetwork/telos-wallet/issues/176
        totalBalance() {
            return 123456.78;
        },
        buyMoreLink() {
            const chainStore = useChainStore();
            return (chainStore.currentChain.settings as EVMChainSettings).getBuyMoreOfTokenLink();
        },
    },
    methods: {
        goToBuy() {
            window.open(this.buyMoreLink, '_blank')?.focus();
        },
    },
});
</script>

<template>
<div>
    <BigFiatText :amount="totalBalance" class="q-mb-xl"/>

    <div class="c-wallet-page-header__links">
        <div
            class="c-wallet-page-header__link"
            tabindex="0"
            role="link"
            :aria-label="$t('evm_wallet.link_to_send_aria')"
            @keydown.space.enter="$router.push({ name: 'evm-send' })"
            @click="$router.push({ name: 'evm-send' })"
        >
            <InlineSvg
                :src="require('src/assets/icon--send.svg')"
                aria-hidden="true"
                :alt="$t('evm_wallet.send_icon_alt')"
                class="c-wallet-page-header__icon"
            />
            <span class="c-wallet-page-header__link-text">
                {{ $t('evm_wallet.send') }}
            </span>
        </div>

        <div
            class="c-wallet-page-header__link"
            tabindex="0"
            role="link"
            :aria-label="$t('evm_wallet.link_to_receive_aria')"
            @keydown.space.enter="$router.push({ name: 'evm-receive' })"
            @click="$router.push({ name: 'evm-receive' })"
        >
            <InlineSvg
                :src="require('src/assets/icon--send.svg')"
                aria-hidden="true"
                :alt="$t('evm_wallet.receive_icon_alt')"
                class="c-wallet-page-header__icon c-wallet-page-header__icon--rotated"
            />
            <span class="c-wallet-page-header__link-text">
                {{ $t('evm_wallet.receive') }}
            </span>
        </div>

        <div
            class="c-wallet-page-header__link"
            tabindex="0"
            role="link"
            :aria-label="$t('evm_wallet.link_to_buy_aria')"
            @keydown.space.enter="goToBuy"
            @click="goToBuy"
        >
            <InlineSvg
                :src="require('src/assets/icon--buy.svg')"
                aria-hidden="true"
                :alt="$t('evm_wallet.buy_icon_alt')"
                class="c-wallet-page-header__icon"
            />
            <span class="c-wallet-page-header__link-text">
                {{ $t('evm_wallet.buy') }}
            </span>
        </div>
    </div>
</div>
</template>

<style lang="scss">
.c-wallet-page-header {
    $this: &;

    &__links {
        display: flex;
        gap: 48px;
        justify-content: center;
    }

    &__link {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        gap: 8px;
        width: max-content;
        cursor: pointer;
    }

    &__icon {
        transition: transform 0.2s ease;

        &:not(#{$this}__icon--rotated):hover {
            transform: scale(1.05);
        }

        // svg overrides
        path {
            fill: $primary;
        }

        rect {
            stroke: $primary;
        }

        &--rotated {
            transform: rotate(180deg);
            &:hover {
                transform: scale(1.05) rotate(180deg);
            }
        }
    }

    &__link-text {
        text-align: center;
        width: max-content;
        font-weight: 500;
        line-height: 24px;
        font-size: 20px;
    }
}
</style>