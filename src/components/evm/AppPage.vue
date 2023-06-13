<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
    name: 'AppPage',
    props: {
        tabs: {
            type: Array as () => string[],
            default: null,
            validator: (tabs: string[] | null) => tabs === null || tabs.every(tab => typeof tab === 'string'),
        },
    },
    computed: {
        showTabs() {
            return Array.isArray(this.tabs);
        },
        selectedTab() {
            return (this.$route.query.tab ?? '') as string;
        },
    },
    watch: {
        $route: {
            immediate: true,
            deep: true,
            handler(newValue, oldValue = null) {
                const isSameRoute = oldValue === null || newValue?.path === oldValue?.path;

                if (isSameRoute) {
                    if (this.tabs === null) {
                        return;
                    }

                    if (!this.tabs.includes(newValue.query.tab)) {
                        this.$router.replace({ query: { tab: this.tabs[0] } });
                    }
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
            :model-value="selectedTab"
            inline-label
            no-caps
            indicator-color="primary"
            class="c-app-page__tabs"
        >
            <q-route-tab
                v-for="tab in (tabs ?? [])"
                :key="tab"
                :name="tab"
                :label="tab.charAt(0).toUpperCase() + tab.slice(1)"
                :to="{ query: { tab: tab.toLowerCase() } }"
                replace
            />
        </q-tabs>
    </div>

    <!-- if a page has tabs, create a slot for each tab whose name is the same as the tab, e.g.
        <template v-slot:balance>
            <WalletBalanceTab />
        </template>
     -->
    <q-tab-panels
        v-if="showTabs"
        v-model="selectedTab"
        animated
        class="c-app-page__tab-panels"
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
    <div v-else class="c-app-page__body">
        <slot></slot>
    </div>
</q-page>
</template>

<style lang="scss">
.c-app-page {
    display: flex;
    flex-direction: column;

    &__tab-panels {
        margin-top: 24px;
        flex-grow: 1;
    }

    &__header {
        color: var(--header-text-color);
        background: var(--header-bg-color);

        padding-top: 24px;
        position: relative;
    }

    &__header-content {
        display: flex;
        justify-content: center;
        padding: 0 24px 24px;

        @include md-and-up {
            padding: 0 32px 32px;
        }
    }

    &__tabs {
        margin-top: 48px;
        flex-grow: 1;
        color: var(--header-text-color);

        // quasar override
        .q-tab__indicator {
            width: 48px;
            margin: auto;
        }
    }

    &__body {
        padding: 24px;

        @include tiny-only {
            padding: 16px;
        }

        @include md-and-up {
            padding: 32px;
        }
    }
}
</style>
