<script lang="ts">
import { defineComponent, PropType } from 'vue';

import InlineSvg from 'vue-inline-svg';

import EVMChainSettings from 'src/antelope/chains/EVMChainSettings';
import { getLongDate } from 'src/antelope/stores/utils';
import { useChainStore, useUserStore } from 'src/antelope';
import { ShapedTransactionRow } from 'src/antelope/types';

import ExternalLink from 'components/ExternalLink.vue';
import TimeStamp from 'components/TimeStamp.vue';
import ToolTip from 'components/ToolTip.vue';
import { getCurrencySymbol, prettyPrintCurrency } from 'src/antelope/stores/utils/currency-utils';
import { truncateAddress } from 'src/antelope/stores/utils/text-utils';

const userStore = useUserStore();

const arrowIcon = require('src/assets/icon--arrow-diagonal.svg');
const swapIcon = require('src/assets/icon--swap-diagonal.svg');
const contractIcon = require('src/assets/icon--contract.svg');
const failureIcon = require('src/assets/icon--x.svg');

export default defineComponent({
    name: 'WalletTransactionRow',
    components: {
        ToolTip,
        TimeStamp,
        ExternalLink,
        InlineSvg,
    },
    props: {
        transaction: {
            type: Object as PropType<ShapedTransactionRow>,
            required: true,
        },
    },
    computed: {
        test() {
            if (this.transaction.id.toLowerCase() === '0xf7a2cadfce5adcd33c592d3aa277bf87ea5c06961e6a7e4f12e6a2bae7b595e5') {
                debugger;
            }
            return '';
        },
        fiatLocale(): string {
            return useUserStore().fiatLocale;
        },
        fiatCurrency(): string {
            return useUserStore().fiatCurrency;
        },
        chainSettings(): EVMChainSettings {
            return useChainStore().currentChain.settings as EVMChainSettings;
        },
        actionName(): string {
            if (this.transaction.failed) {
                return this.$t('evm_wallet.failed_contract_interaction');
            }

            return this.transaction.actionName || this.$t('evm_wallet.contract_interaction');
        },
        interactionIcon(): string {
            if (this.transaction.failed) {
                return failureIcon;
            } else if (this.actionName === 'swap') {
                return swapIcon;
            } else if (['send', 'receive'].includes(this.actionName)) {
                return arrowIcon;
            } else {
                return contractIcon;
            }
        },
        rotateIcon() {
            return this.actionName === 'receive';
        },
        showInteractionSecondaryText(): boolean {
            if (this.$q.screen.lt.sm && this.transaction.failed) {
                return false;
            }

            return !['send', 'receive', 'swap', 'contractCreation'].includes(this.transaction.actionName);
        },
        actionHasDescriptiveText(): boolean {
            // only true for 'known actions' send, receive, and swap
            return ['send', 'receive', 'swap', 'contractCreation'].includes(this.transaction.actionName);
        },
        actionDescriptiveText(): string {
            switch (this.transaction.actionName) {
            case 'send':
                return this.$t('evm_wallet.sent');
            case 'receive':
                return this.$t('evm_wallet.received');
            case 'swap':
                return this.$t('evm_wallet.swapped');
            case 'contractCreation':
                return this.$t('evm_wallet.contract_creation');
            default:
                return '';
            }
        },
        actionPrepositionText(): string {
            switch (this.transaction.actionName) {
            case 'send':
                return this.$t('global.to');
            case 'receive':
                return this.$t('global.from');
            case 'swap':
                return this.$t('global.with');
            default:
                return '';
            }
        },
        // the text representing who the user interacted with, either an address or alias
        interactedWithText(): string {
            if (this.transaction.actionName === 'receive') {
                return this.transaction.fromPrettyName || this.transaction.from;
            } else {
                return this.transaction.toPrettyName || this.transaction.to;
            }
        },
        // link to the explorer page for the address the user interacted with
        interactedWithUrl(): string {
            const { actionName, from, to } = this.transaction;

            let address = actionName === 'receive' ? from : to;

            return `${this.chainSettings.getExplorerUrl()}/address/${address}`;
        },
        transactionUrl(): string {
            return `${this.chainSettings.getExplorerUrl()}/tx/${this.transaction.id}`;
        },
        longDate(): string {
            return getLongDate(this.transaction.epoch);
        },
        chainTokenSymbol(): string {
            return this.chainSettings.getSystemToken().symbol;
        },
        gasInFiatText(): string {
            const gasIsMinisculeFiat = this.transaction.gasUsed && [0, undefined].includes(this.transaction.gasFiatValue);
            if (gasIsMinisculeFiat) {
                const symbol = getCurrencySymbol(userStore.fiatLocale, userStore.fiatCurrency);
                return `< ${symbol}0.01 ${userStore.fiatCurrency}`;
            }

            return this.formatAmount(this.transaction.gasFiatValue ?? 0, undefined, true);
        },
    },
    methods: {
        formatAmount(amount: number, symbol: string = userStore.fiatCurrency, useSymbolCharacter: boolean = false) {
            const decimals = symbol === userStore.fiatCurrency ? 2 : 4;
            const formatted = prettyPrintCurrency(
                amount,
                decimals,
                userStore.fiatLocale,
                false,
                useSymbolCharacter ? userStore.fiatCurrency : undefined,
            );

            return `${formatted} ${symbol}`;
        },
        getShapedTokenName(name: string, id: string) {
            // if the token name includes the ID, remove the ID because we display ID separately
            // eztodo make this a util function
            let shapedName = name;
            if (name.includes(id)) {
                shapedName = name.replace(id, '');

                if (shapedName[shapedName.length - 1] === '#') {
                    shapedName = shapedName.slice(0, -1);
                }
            }
            return shapedName.trim();
        },
        getTruncatedAddress(address: string) {
            return truncateAddress(address);
        },
    },
});
</script>

<template>
<div
    class="c-transaction-row"
    :class="{ test: transaction.id.toLowerCase() === '0xf7a2cadfce5adcd33c592d3aa277bf87ea5c06961e6a7e4f12e6a2bae7b595e5' }"
>
    <div class="c-transaction-row__info-container c-transaction-row__info-container--first">
        <div class="c-transaction-row__interaction-icon-container">
            <InlineSvg
                :src="interactionIcon"
                :class="{
                    'c-transaction-row__interaction-icon': true,
                    'c-transaction-row__interaction-icon--rotated': rotateIcon,
                    'c-transaction-row__interaction-icon--red': transaction.failed,
                }"
                height="12"
                aria-hidden="true"
            />
        </div>

        <div class="c-transaction-row__interaction-text-container">
            <div class="c-transaction-row__primary-interaction-text">
                <template v-if="actionHasDescriptiveText">
                    <span class="c-transaction-row__action-description">
                        {{ actionDescriptiveText }}&thinsp;
                    </span>
                    <span class="c-transaction-row__interaction-nowrap">
                        {{ actionPrepositionText }}
                        <ExternalLink
                            v-if="transaction.actionName !== 'contractCreation'"
                            :text="interactedWithText"
                            :url="interactedWithUrl"
                            :purpose="$t('evm_wallet.aria_link_to_address')"
                        />
                    </span>
                </template>

                <span v-else class="c-transaction-row__action-name">
                    {{ actionName }}
                </span>
            </div>

            <div v-if="showInteractionSecondaryText" class="c-transaction-row__secondary-interaction-text">
                <ExternalLink
                    :text="interactedWithText"
                    :url="interactedWithUrl"
                    :purpose="$t('evm_wallet.aria_link_to_address')"
                />
            </div>
        </div>

        <div class="c-transaction-row__timestamp">
            <ToolTip :text="longDate" :hide-icon="true">
                <TimeStamp :timestamp="transaction.epoch" />
            </ToolTip>

            <template v-if="$q.screen.gt.xs">
                <div>
                    trx:
                    <ExternalLink
                        :text="transaction.id"
                        :url="transactionUrl"
                        :purpose="$t('evm_wallet.aria_link_to_transaction')"
                    />
                </div>
            </template>
        </div>
    </div>

    <div class="c-transaction-row__info-container c-transaction-row__info-container--second">
        <div
            v-for="(values, index) in transaction.valuesOut"
            :key="`values-out-${index}`"
            class="c-transaction-row__value-container"
        >
            <div class="c-transaction-row__value c-transaction-row__value--out">
                {{ formatAmount(-values.amount, values.symbol) }}

                <ToolTip
                    v-if="!values.fiatValue"
                    :warnings="[$t('evm_wallet.no_fiat_value')]"
                />
            </div>
            <span
                v-if="values.fiatValue"
                class="c-transaction-row__value c-transaction-row__value--out c-transaction-row__value--small"
            >
                {{ formatAmount(-values.fiatValue) }}
            </span>
        </div>

        <div
            v-for="(nftTransfer, index) in transaction.nftsOut"
            :key="`nfts-out-${index}`"
            class="c-transaction-row__value-container"
        >
            <div class="c-transaction-row__nft c-transaction-row__nft--out">
                <span>-{{ nftTransfer.quantity }}</span>
                <!-- eztodo add test case for no image src -->
                <img
                    v-if="nftTransfer.imgSrc"
                    :src="nftTransfer.imgSrc"
                    :alt="nftTransfer.tokenName"
                    height="40"
                    width="40"
                    class="c-transaction-row__nft-thumbnail"
                >
                <q-icon
                    v-else
                    name="o_image_not_supported"
                    color="grey"
                    size="40px"
                />
                <div class="c-transaction-row__nft-info-container">
                    <div class="c-transaction-row__nft-name-container">
                        <div class="c-transaction-row__nft-name">
                            {{ getShapedTokenName(nftTransfer.tokenName, nftTransfer.tokenId) }}
                        </div>
                        <div class="c-transaction-row__nft-id">
                            #{{ nftTransfer.tokenId }}
                        </div>
                    </div>
                    <div class="c-transaction-row__nft-collection">
                        {{ nftTransfer?.collectionName ?? getTruncatedAddress(nftTransfer.collectionAddress) }}
                    </div>
                </div>
            </div>
        </div>

        <!-- eztodo scroll up when changing rowsperpage or page number -->
        <div
            v-for="(values, index) in transaction.valuesIn"
            :key="`values-in-${index}`"
            class="c-transaction-row__value-container"
        >
            <div class="c-transaction-row__value c-transaction-row__value--in">
                +{{ formatAmount(values.amount, values.symbol) }}

                <ToolTip
                    v-if="!values.fiatValue"
                    :warnings="[$t('evm_wallet.no_fiat_value')]"
                />
            </div>
            <span
                v-if="values.fiatValue"
                class="c-transaction-row__value c-transaction-row__value--in c-transaction-row__value--small"
            >
                +{{ formatAmount(values.fiatValue) }}
            </span>
        </div>

        <div
            v-for="(nftTransfer, index) in transaction.nftsIn"
            :key="`nfts-in-${index}`"
            class="c-transaction-row__value-container"
        >
            <div class="c-transaction-row__nft c-transaction-row__nft--in">
                <span>+{{ nftTransfer.quantity }}</span>
                <!-- eztodo add test case for no image src -->
                <img
                    v-if="nftTransfer.imgSrc"
                    :src="nftTransfer.imgSrc"
                    :alt="nftTransfer.tokenName"
                    height="40"
                    width="40"
                    class="c-transaction-row__nft-thumbnail"
                >
                <q-icon
                    v-else
                    name="o_image_not_supported"
                    color="grey"
                    size="40px"
                />
                <div class="c-transaction-row__nft-info-container">
                    <div class="c-transaction-row__nft-name-container">
                        <div class="c-transaction-row__nft-name">
                            {{ getShapedTokenName(nftTransfer.tokenName, nftTransfer.tokenId) }}
                        </div>
                        <div class="c-transaction-row__nft-id">
                            #{{ nftTransfer.tokenId }}
                        </div>
                    </div>
                    <div class="c-transaction-row__nft-collection">
                        {{ nftTransfer?.collectionName ?? getTruncatedAddress(nftTransfer.collectionAddress) }}
                    </div>
                </div>
            </div>
        </div>

    </div>

    <div class="c-transaction-row__info-container c-transaction-row__info-container--third">
        <div class="c-transaction-row__gas-icon-container">
            <q-icon name="o_local_gas_station" size="xs" class="c-transaction-row__gas-icon" />
        </div>
        <div class="c-transaction-row__gas-text">
            <span>{{ formatAmount(transaction.gasUsed ?? 0, chainTokenSymbol) }}</span>

            <span>{{ gasInFiatText }}</span>
        </div>

        <div
            v-if="$q.screen.lt.sm"
            class="c-transaction-row__mobile-tx-link"
        >
            <ExternalLink
                :text="$t('global.more_info')"
                :url="transactionUrl"
                :purpose="$t('evm_wallet.aria_link_to_transaction')"
            />
        </div>
    </div>
</div>
</template>

<style lang="scss">
.test {
    border: 1px solid red;
}
.c-transaction-row {
    max-width: 1000px;
    padding: 16px 8px;
    border-bottom: 2px solid $page-header;
    display: grid;
    gap: 16px;
    grid-template:
        'a'
        'b'
        'c';

    @include sm-and-up {
        gap: 32px;
        grid-template: 'a b c' / max-content auto max-content;
    }

    &__info-container {
        max-width: 100%;
        min-width: 0;

        &--first {
            display: grid;
            grid-area: a;
            grid-template: 'a b c' auto / min-content auto max-content;
            gap: 8px;

            @include sm-and-up {
                grid-template:
                    'a b' auto
                    'c c' min-content
                    / 16px max-content;
            }
        }

        &--second,
        &--third {
            margin-left: 24px;

            @include sm-and-up {
                margin-left: unset;
            }
        }

        &--second {
            display: flex;
            grid-area: b;
            flex-direction: column;
            gap: 8px;

            @include sm-and-up {
                justify-content: center;
            }
        }

        &--third {
            display: flex;
            grid-area: c;
            align-items: center;
            gap: 4px;

            @include sm-and-up {
                justify-content: flex-end;
            }
        }
    }

    &__interaction-info {
        display: grid;
        grid-template-columns: min-content minmax(0, 1fr) max-content;
        gap: 8px;
        max-width: 100%;
    }

    &__interaction-icon-container {
        grid-area: a;
        height: 16px;
        width: 16px;
        display: inline-flex;
        justify-content: center;
        align-items: center;
    }

    &__interaction-text-container {
        grid-area: b;
        max-width: 100%;
        min-width: 0;
    }

    &__interaction-icon {
        height: 16px;
        margin-top: 4px;

        path {
            fill: var(--accent-color);
        }

        &--rotated {
            transform: rotate(180deg);
        }

        &--red {
            path {
                fill: var(--negative-color);
            }
        }

        @include sm-and-up {
            margin-top: 8px;
        }
    }

    &__interaction-nowrap {
        white-space: nowrap;
    }

    &__primary-interaction-text {
        @include text--small;
        color: var(--text-default-contrast);

        @include sm-and-up {
            @include text--paragraph;
        }
    }

    &__action-description,
    &__action-name {
        @include text--small-bold;
        color: var(--text-hight-contrast);

        @include sm-and-up {
            @include text--paragraph-bold;
        }
    }

    &__secondary-interaction-text {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    &__timestamp {
        grid-area: c;
        display: flex;
        align-items: flex-start;
        justify-content: flex-end;
        width: max-content;
        color: var(--text-low-contrast);

        @include sm-and-up {
            margin-left: 24px;
            align-items: center;
            gap: 12px;
        }
    }

    &__value-container {
        display: flex;
        flex-direction: column;

        @include sm-and-up {
            align-items: flex-end;
        }

        @include sm-and-up {
            gap: 8px;
            flex-direction: row;
            align-items: center;
            justify-content: flex-end;
        }
    }

    &__value {
        $value: &;

        @include text--paragraph;

        width: max-content;
        display: inline-flex;
        align-items: center;
        gap: 8px;

        &--out {
            color: var(--negative-color);
        }

        &--out#{$value}--small {
            color: var(--negative-muted);
        }

        &--in {
            color: var(--positive-color);
        }

        &--in#{$value}--small {
            color: var(--positive-muted);
        }

        &--small {
            @include text--small;
        }
    }

    &__nft {
        display: flex;
        gap: 8px;
        align-items: center;
        overflow: hidden;

        &--out {
            color: var(--negative-color);
        }

        &--in {
            color: var(--positive-color);
        }
    }

    &__nft-thumbnail {
        height: 40px;
        width: 40px;
        border-radius: 4px;
    }

    &__nft-info-container {
        min-width: 0;
        max-width: 150px;

        @include sm-and-up {
            max-width: 200px;
        }
    }

    &__nft-name-container {
        display: flex;
        flex-wrap: nowrap;
        gap: 4px;
        align-items: center;
    }

    &__nft-name,
    &__nft-id,
    &__nft-collection {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    &__nft-name {
        @include text--paragraph;
    }

    &__nft-id {
        @include text--paragraph-bold;
        flex-shrink: 0;
        max-width: 70%;
    }

    &__gas-icon-container {
        display: flex;
        align-items: center;
        color: var(--text-default-contrast);
    }

    &__gas-icon {
        color: var(--text-low-contrast);
    }

    &__gas-text {
        display: flex;
        gap: 0;
        flex-shrink: 0;
        flex-direction: column;
        align-items: flex-start;
        color: var(--text-default-contrast);
    }

    &__mobile-tx-link {
        flex: 1 1 100%;
        text-align: right;
    }
}
</style>
