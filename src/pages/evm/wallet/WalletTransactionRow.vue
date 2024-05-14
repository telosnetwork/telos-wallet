<script lang="ts">
import { defineComponent, PropType } from 'vue';
import InlineSvg from 'vue-inline-svg';

import EVMChainSettings from 'src/antelope/chains/EVMChainSettings';
import { CURRENT_CONTEXT, useChainStore, useNftsStore, useUserStore } from 'src/antelope';
import { Collectible, ShapedTransactionRow } from 'src/antelope/types';

import { DEFAULT_DATE_FORMAT, getFormattedDate } from 'src/antelope/stores/utils/date-utils';
import { getCurrencySymbol, prettyPrintCurrency } from 'src/antelope/stores/utils/currency-utils';
import { getShapedNftName, truncateAddress } from 'src/antelope/stores/utils/text-utils';

import ExternalLink from 'components/ExternalLink.vue';
import TimeStamp from 'components/TimeStamp.vue';
import ToolTip from 'components/ToolTip.vue';
import NftViewer from 'src/components/evm/nfts/NftViewer.vue';

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
        NftViewer,
    },
    props: {
        transaction: {
            type: Object as PropType<ShapedTransactionRow>,
            required: true,
        },
    },
    data: () => ({
        loading: true,
        nftData: {} as Record<string, Collectible>, // keyed like {contract address lowercase}-{tokenId}
    }),
    computed: {
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
            return getFormattedDate(this.transaction.epoch, DEFAULT_DATE_FORMAT, true);
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
    async created() {
        const nftTransfers = [...this.transaction.nftsIn, ...this.transaction.nftsOut];

        if (nftTransfers.length) {
            await Promise.all(nftTransfers.map(
                async (nftTransfer) => {
                    const nftDetails = await useNftsStore().fetchNftDetails(
                        CURRENT_CONTEXT,
                        nftTransfer.collectionAddress,
                        nftTransfer.tokenId,
                        nftTransfer.nftInterface,
                    );
                    if (nftDetails) {
                        this.nftData[`${nftTransfer.collectionAddress.toLowerCase()}-${nftTransfer.tokenId}`] = nftDetails;
                    }
                },
            ));
        }

        this.loading = false;
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
            return getShapedNftName(name, id);
        },
        getTruncatedAddress(address: string) {
            return truncateAddress(address);
        },
        getCachedNftData(collectionAddress: string, tokenId: string): Collectible {
            return this.nftData[`${collectionAddress.toLowerCase()}-${tokenId}`];
        },
        goToNftDetailPage(collectionAddress: string, tokenId: string) {
            this.$router.push({
                name: 'evm-nft-details',
                query: {
                    contract: collectionAddress,
                    id: tokenId,
                },
            });
        },
    },
});
</script>

<template>
<div class="c-transaction-row">
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
                    <ExternalLink
                        :text="$t('global.more_info')"
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
            <div
                v-if="getCachedNftData(nftTransfer.collectionAddress, nftTransfer.tokenId)"
                class="c-transaction-row__nft c-transaction-row__nft--out"
                role="link"
                tabindex="0"
                :aria-label="$t('nft.link_to_nft_details', { name: nftTransfer.tokenName })"
                @click="goToNftDetailPage(nftTransfer.collectionAddress, nftTransfer.tokenId)"
                @keypress.space.enter="goToNftDetailPage(nftTransfer.collectionAddress, nftTransfer.tokenId)"
            >
                <span>-{{ nftTransfer.quantity }}</span>
                <NftViewer
                    :nft="getCachedNftData(nftTransfer.collectionAddress, nftTransfer.tokenId)"
                    :previewMode="false"
                    :tileMode="false"
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
            <div
                v-if="getCachedNftData(nftTransfer.collectionAddress, nftTransfer.tokenId)"
                class="c-transaction-row__nft c-transaction-row__nft--in"
                role="link"
                tabindex="0"
                :aria-label="$t('nft.link_to_nft_details', { name: nftTransfer.tokenName })"
                @click="goToNftDetailPage(nftTransfer.collectionAddress, nftTransfer.tokenId)"
                @keypress.space.enter="goToNftDetailPage(nftTransfer.collectionAddress, nftTransfer.tokenId)"
            >
                <span>+{{ nftTransfer.quantity }}</span>

                <NftViewer
                    :nft="getCachedNftData(nftTransfer.collectionAddress, nftTransfer.tokenId)"
                    :previewMode="false"
                    :tileMode="false"
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
.c-transaction-row {
    max-width: 1000px;
    padding: 16px 8px;
    border-bottom: 1px solid var(--accent-color-3);
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
            fill: var(--q-accent);
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
        cursor: pointer;

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
