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
                        this.$router.replace({ path: this.$route.path, query: { ...this.$route.query, tab: this.tabs[0] } });
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

        <div class="c-app-page__header-background-top">
            <div class="c-app-page__header-background-circle c-app-page__header-background-circle--1"></div>
            <div class="c-app-page__header-background-circle c-app-page__header-background-circle--2"></div>
        </div>

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
                :to="{ query: { ...$route.query, tab: tab.toLowerCase() } }"
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
        background: var(--bg-color);
        color: var(--text-high-contrast);
        margin-top: 24px;
        flex-grow: 1;
    }

    &__header {
        color: var(--text-color);
        background: var(--header-background-color);

        padding-top: 24px;
        position: relative;

        &-background-top {
            display: var(--display-telos-branding-bg);
            z-index: 0;
            content: '';
            position: absolute;
            top: 0;
            right: 0;
            bottom: 0;
            left: 0;
            background-position: center center;
            background-size: 100% auto;
            background-repeat: no-repeat;
        }

        &-background-top {
            overflow: hidden;
            background-image:
            radial-gradient(circle at 0% 170%, var(--q-secondary), transparent 45%),
                radial-gradient(circle at 100% 130%, var(--q-secondary), transparent 30%),
                radial-gradient(circle at 100% 0%, var(--q-primary), transparent 30%),
                radial-gradient(circle at 50% 20%, var(--q-accent), transparent 70%);

            @media screen and (min-width: $breakpoint-sm-min) {
                background-image:
                radial-gradient(circle at 0% 170%, var(--q-secondary), transparent 45%),
                radial-gradient(circle at 100% 130%, var(--q-secondary), transparent 30%),
                radial-gradient(circle at 100% 0%, var(--q-primary), transparent 30%),
                radial-gradient(circle at 50% 20%, var(--q-accent), transparent 70%)
            }

            @media screen and (min-width: $breakpoint-md-min) {
                background-image:
                radial-gradient(circle at 0% 170%, var(--q-secondary), transparent 45%),
                radial-gradient(circle at 100% 130%, var(--q-secondary), transparent 30%),
                radial-gradient(circle at 100% 0%, var(--q-primary), transparent 30%),
                radial-gradient(circle at 50% 20%, var(--q-accent), transparent 70%)
            }

            @media screen and (min-width: $breakpoint-lg-min) {
                background-image:
                    radial-gradient(circle at 0% 170%, var(--q-secondary), transparent 40%),
                    radial-gradient(circle at 100% 140%, var(--q-secondary), transparent 20%),
                    radial-gradient(circle at 100% 0%, var(--q-primary), transparent 20%),
                    radial-gradient(circle at 50% 20%, var(--q-accent), transparent 90%)
            }
        }

        &-background-circle {
            position: absolute;
            content: "";
            border-radius: 100%;
            border: 32px solid var(--faint-circle-color);

            &--1 {
                top: -11vh;
                right: -26vh;
                width: 45vh;
                height: 45vh;

                @media screen and (min-width: $breakpoint-lg-min) {
                    top: -12vh;
                    right: -16vh;
                    width: 45vh;
                    height: 45vh;
                }

            }

            &--2 {
                display: none;

                @media screen and (min-width: $breakpoint-lg-min) {
                    display: block;
                    top: -75%;
                    right: 0;
                    left: 0;
                    width: 45vh;
                    height: 45vh;
                    margin: 0 auto;
                }
            }
        }

    }

    &__header-content {
        z-index: 1;
        position: relative;
        display: flex;
        justify-content: center;
        padding: 0 24px 24px;

        @include md-and-up {
            padding: 0 32px 32px;
        }
    }

    &__tabs {
        z-index: 1;
        position: relative;
        flex-grow: 1;
        color: var(--header-text-color);

        @include sm-and-up {
            margin-top: 36px;
        }

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
