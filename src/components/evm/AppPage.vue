<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
    name: 'AppPage',
    props: {
        tabs: {
            type: Array,
            default: null,
            validator: (tabs: string[] | null) => tabs === null || tabs.every(tab => typeof tab === 'string'),
        },
    },
    computed: {
        showTabs() {
            return Array.isArray(this.tabs);
        },
        selectedTab() {
            return this.$route.query.tab;
        },
    },
    watch: {
        '$route.query.tab': {
            immediate: true,
            handler(newValue) {
                if (this.tabs === null) {
                    return;
                }

                if (!this.tabs.includes(newValue)) {
                    this.$router.replace({ query: { tab: this.tabs[0] as string } });
                }
            },
        },
    },
});
</script>

<template>
<q-page class="c-app-page">
    <div class="c-app-page__header">
        <div class="c-app-page__header-content">
            <slot name="header"></slot>
        </div>

        <q-tabs
            v-if="showTabs"
            v-model="selectedTab"
            inline-label
            no-caps
            indicator-color="purple"
            class="c-app-page__tabs"
        >
            <q-route-tab
                v-for="tab in tabs"
                :key="tab"
                :name="tab"
                :label="tab.charAt(0).toUpperCase() + tab.slice(1)"
                :to="{ query: { tab: tab.toLowerCase() } }"
                exact
                replace
            />
        </q-tabs>
    </div>

    <div class="c-app-page__body">
        <!-- if a page has tabs, create a slot for each tab whose name is the same as the tab -->
        <q-tab-panels
            v-if="showTabs"
            v-model="selectedTab"
            animated
        >
            <q-tab-panel
                v-for="tab in tabs"
                :key="tab"
                :name="tab"
            >
                <slot :name="tab"></slot>
            </q-tab-panel>
        </q-tab-panels>

        <!-- if a page has no tabs, render a generic slot for page content -->
        <slot v-else></slot>
    </div>
</q-page>
</template>

<style lang="scss">
.c-app-page {
    &__header {
        background: $page-header;
    }

    &__header-content {
        display: flex;
        justify-content: center;
        padding: 0 24px 24px;

        @media only screen and (min-width: $breakpoint-lg-min) {
            padding: 0 32px 32px;
        }
    }

    &__tabs {
        color: black;

        // quasar override
        .q-tab__indicator {
            width: 48px;
            margin: auto;
        }
    }

    &__body {

    }
}
</style>
