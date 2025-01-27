<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';


const { t: $t } = useI18n();

defineProps<{
    enableRevokeButton: boolean;
    loading: boolean;
}>();

const emit = defineEmits([
    'refresh',
    'revoke-selected',
    'search-updated',
    'include-cancelled-updated',
]);

// data
const searchText = ref('');
const includeCancelled = ref(false);

// computed
const includeCancelledLabel = computed(
    () => $t(`evm_allowances.${includeCancelled.value ? 'includes' : 'excludes'}_cancelled_allowances`),
);

// methods
function handleRevokeSelected() {
    emit('revoke-selected');
}

function handleRefresh() {
    emit('refresh');
}

</script>

<template>

<div class="c-allowances-page-controls__row-1 q-mb-lg">
    <q-input
        v-model="searchText"
        outlined
        :label="$t('evm_allowances.search_label')"
        class="c-allowances-page-controls__search-input"
        @update:model-value="emit('search-updated', $event)"
    >
        <template v-slot:append>
            <q-icon name="search" />
        </template>
    </q-input>

    <div
        class="c-allowances-page-controls__buttons"
    >
        <!-- revoke button -->
        <q-btn
            :disable="!enableRevokeButton"
            color="primary"
            class="c-allowances-page-controls__buttons-btn"
            @click="handleRevokeSelected"
        >
            {{ $t('evm_allowances.revoke_selected') }}
        </q-btn>

        <!-- refresh button -->
        <q-btn
            color="primary"
            class="c-allowances-page-controls__buttons-btn"
            icon="refresh"
            :disable="loading"
            :loading="loading"
            @click="handleRefresh"
        >
            {{ $t('evm_allowances.refresh') }}
        </q-btn>

    </div>

</div>

<!-- https://github.com/telosnetwork/telos-wallet/issues/719 -->
<q-toggle
    v-if="false"
    v-model="includeCancelled"
    :label="includeCancelledLabel"
    color="primary"
    @update:model-value="emit('include-cancelled-updated', $event)"
/>

</template>

<style lang="scss">
.c-allowances-page-controls {
    $this: &;

    &__row-1 {
        display: flex;
        gap: 24px;
        flex-direction: column;

        @include sm-and-up {
            justify-content: space-between;
            align-items: center;
            flex-direction: row;

            #{$this}__search-input {
                order: 2;
            }

            #{$this}__buttons {
                order: 1;
            }
        }
    }


    &__search-input {
        flex-basis: 100%;
        max-width: 580px;
    }

    &__buttons {
        flex-shrink: 0;
        display: flex;
        gap: 16px;
    }
}
</style>
