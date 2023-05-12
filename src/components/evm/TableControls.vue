<script setup lang="ts">
import {
    computed,
    PropType,
    ref,
} from 'vue';
import { QPopupProxy } from 'quasar';

const props = defineProps({
    pagination: {
        type: Object as PropType<{
            page: number;
            rowsPerPage: number;
            rowsNumber: number;
        }>,
        required: true,
    },
});
const emit = defineEmits(['pagination-updated']);

const rowsPerPageOptions = [5, 10, 20, 50, 100];
const showRowsPerPageDropdown = ref(false);
const rowsPerPagePopup = ref<QPopupProxy>();


// computed
const pageText = computed(() => {
    const start = (props.pagination.page - 1) * props.pagination.rowsPerPage + 1;
    const end = Math.min(props.pagination.page * props.pagination.rowsPerPage, props.pagination.rowsNumber);
    return `${start}-${end} of ${props.pagination.rowsNumber}`;
});
const totalPages = computed(() => Math.ceil(props.pagination.rowsNumber / props.pagination.rowsPerPage));

// methods
function changeRowsPerPage(rowsPerPage: number) {
    emit('pagination-updated', {
        ...props.pagination,
        page: 1,
        rowsPerPage,
    });
    rowsPerPagePopup.value?.hide();
}

function changePageNumber(direction: 'next' | 'prev' | 'first' | 'last') {
    let page: number;

    if (direction === 'next') {
        page = Math.min(props.pagination.page + 1, totalPages.value);
    } else if (direction === 'prev') {
        page = Math.max(props.pagination.page - 1, 1);
    } else if (direction === 'first') {
        page = 1;
    } else {
        page = totalPages.value;
    }

    emit('pagination-updated', {
        ...props.pagination,
        page,
    });
}
</script>

<template>
<div class="c-table-controls">
    <div class="c-table-controls__left-container">
        <!--// eztodo i18n-->
        Rows per page:&nbsp;{{ pagination.rowsPerPage }}

        <q-icon
            :name="showRowsPerPageDropdown ? 'expand_more' : 'expand_less'"
            class="cursor-pointer"
            size="sm"
            @click="showRowsPerPageDropdown = !showRowsPerPageDropdown"
        >
            <q-popup-proxy ref="rowsPerPagePopup" transition-show="scale" transition-hide="scale">
                <q-list>
                    <q-item v-for="size in rowsPerPageOptions" :key="size" class="cursor-pointer">
                        <q-item-section @click="changeRowsPerPage(size)">
                            {{ size }}
                        </q-item-section>
                    </q-item>
                </q-list>
            </q-popup-proxy>
        </q-icon>
    </div>

    <div class="c-table-controls__right-container">
        <q-btn
            outline
            size="sm"
            color="primary"
            icon="first_page"
            class="q-mr-xs"
            :disable="pagination.page === 1"
            @click="changePageNumber('first')"
        />
        <q-btn
            outline
            size="sm"
            color="primary"
            icon="chevron_left"
            class="q-mr-sm"
            :disable="pagination.page === 1"
            @click="changePageNumber('prev')"
        />

        {{ pageText }}

        <q-btn
            outline
            size="sm"
            color="primary"
            icon="chevron_right"
            class="q-ml-sm"
            :disable="pagination.page === totalPages"
            @click="changePageNumber('next')"
        />
        <q-btn
            outline
            size="sm"
            color="primary"
            icon="last_page"
            class="q-ml-xs"
            :disable="pagination.page === totalPages"
            @click="changePageNumber('last')"
        />
    </div>
</div>
</template>

<style lang="scss">
.c-table-controls {
    width: 100%;
    max-width: 1000px;
    display: flex;
    flex-direction: column;
    gap: 24px;

    @media only screen and (min-width: $breakpoint-md-min) {
        justify-content: space-between;
        flex-direction: row;
    }

    &__left-container,
    &__right-container {
        display: flex;
        align-items: center;
    }

    &__right-container {
        margin: auto;

        @media only screen and (min-width: $breakpoint-md-min) {
            margin: unset;
        }
    }
}
</style>
