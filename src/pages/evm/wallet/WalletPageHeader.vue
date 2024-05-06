<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import InlineSvg from 'vue-inline-svg';
import BigFiatText from 'components/evm/BigFiatText.vue';
import { useChainStore } from 'src/antelope';
import EVMChainSettings from 'src/antelope/chains/EVMChainSettings';

const router = useRouter();

const props = defineProps<{
    totalBalance: number
}>();

const buyMoreLink = computed(() => {
    const chainStore = useChainStore();
    return (chainStore.currentChain.settings as EVMChainSettings).getBuyMoreOfTokenLink();
});

const goToRoute = (name: string) => {
    router.push({ name });
};

const goToBuy = () => {
    window.open(buyMoreLink.value, '_blank')?.focus();
};

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
            @keypress.space.enter="goToRoute('evm-send')"
            @click="goToRoute('evm-send')"
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
            @keypress.space.enter="goToRoute('evm-receive' )"
            @click="goToRoute('evm-receive')"
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
            fill: var(--header-icon-color);
        }

        rect {
            stroke: var(--header-icon-color);
        }

        &--rotated {
            transform: rotate(180deg);
            &:hover {
                transform: scale(1.05) rotate(180deg);
            }
        }
    }

    &__link-text {
        @include text--header-4;
        color: var(--header-link-color);
        text-align: center;
        width: max-content;
    }
}
</style>
