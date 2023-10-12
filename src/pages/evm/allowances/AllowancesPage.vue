<script setup lang="ts">
import { useI18n } from 'vue-i18n';

import AppPage from 'components/evm/AppPage.vue';
import AllowancesPageControls from 'pages/evm/allowances/AllowancesPageControls.vue';
import AllowancesTable from 'pages/evm/allowances/AllowancesTable.vue';
import CollapsibleAside from 'components/evm/CollapsibleAside.vue';

import { shapedAllowanceRows } from 'src/pages/evm/allowances/temp-allowances-fixtures';

const { t: $t } = useI18n();

const asideHeader = $t('evm_allowances.aside_header');

const asideContent = [{
    text: $t('evm_allowances.aside_content_fragment_1'),
}, {
    text: $t('evm_allowances.aside_content_fragment_2_bold'),
    bold: true,
}, {
    text: $t('evm_allowances.aside_content_fragment_3'),
}, {
    text: $t('evm_allowances.aside_content_fragment_4_bold'),
    bold: true,
}, {
    text: $t('evm_allowances.aside_content_fragment_5'),
    bold: false,
}];


// methods
function handleSearchUpdated(searchText: string) {
    console.log('Search updated', searchText);
}

function handleIncludeCancelledUpdated(includeCancelled: boolean) {
    console.log('Include cancelled updated', includeCancelled);
}
</script>

<template>
<AppPage>
    <template v-slot:header>
        <h1 class="u-text--high-contrast">
            {{ $t('global.revoke') }}
        </h1>
    </template>

    <div class="c-allowances-page__body">
        <CollapsibleAside
            :header="asideHeader"
            :content="asideContent"
            class="q-mb-lg"
        />

        <AllowancesPageControls
            :enable-revoke-button="false"
            class="q-mb-xl"
            @search-updated="handleSearchUpdated"
            @include-cancelled-updated="handleIncludeCancelledUpdated"
        />

        <AllowancesTable :rows="shapedAllowanceRows" />
    </div>
</AppPage>
</template>

<style lang="scss">
.c-allowances-page {
    &__body {
        max-width: 1000px;
        margin: auto;
    }
}
</style>
