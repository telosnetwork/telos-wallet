const routes = [
    {
        path: '/',
        name: 'home',
        component: () => import('pages/home/HomePage.vue'),
    },
    {
        path: '/zero',
        component: () => import('layouts/NativeLayout.vue'),
        children: [
            {
                path: 'balance',
                component: () => import('pages/native/BalanceInfo.vue'),
            },
            {
                path: 'dappsearch',
                component: () => import('pages/native/DappSearch.vue'),
            },
            {
                path: 'profile',
                component: () => import('pages/native/SettingsPage.vue'),
            },
        ],
    },
    {
        path: '/evm',
        component: () => import('layouts/EVMLayout.vue'),
        meta: {
            requiresAuth: true,
        },
        children: [
            {
                path: 'wallet',
                name: 'evm-wallet',
                meta: {
                    requiresAuth: true,
                },
                component: () => import('pages/evm/wallet/WalletPage.vue'),
            },
            {
                path: 'send',
                name: 'evm-send',
                meta: {
                    requiresAuth: true,
                    parent: 'evm-wallet',
                },
                component: () => import('pages/evm/wallet/SendPage.vue'),
            },
            {
                path: 'receive',
                name: 'evm-receive',
                meta: {
                    requiresAuth: true,
                    parent: 'evm-wallet',
                },
                component: () => import('pages/evm/wallet/ReceivePage.vue'),
            },
            {
                path: 'collectible-inventory',
                name: 'evm-nft-inventory',
                meta: {
                    requiresAuth: true,
                },
                component: () => import('pages/evm/nfts/NftInventoryPage.vue'),
            },
            {
                path: 'collectible-details',
                name: 'evm-nft-details',
                meta: {
                    requiresAuth: false,
                    parent: 'evm-nft-inventory',
                },
                component: () => import('pages/evm/nfts/NftDetailsPage.vue'),
            },
            {
                path: 'staking',
                name: 'evm-staking',
                component: () => import('pages/evm/staking/StakingPage.vue'),
            },
            {
                path: 'wrap',
                name: 'evm-wrap',
                meta: {
                    requiresAuth: true,
                },
                component: () => import('pages/evm/wrap/WrapPage.vue'),
            },
            {
                path: 'allowances',
                name: 'evm-allowances',
                meta: {
                    requiresAuth: true,
                },
                component: () => import('pages/evm/allowances/AllowancesPage.vue'),
            },
        ],
    },

    {
        path: '/demos',
        name: 'demos',
        meta: {
            requiresAuth: false,
            notInProduction: true,
        },
        component: () => import('pages/demo/DemoLayout.vue'),
        children: [
            {
                path: 'inputs',
                name: 'demos.inputs',
                component: () => import('pages/demo/InputDemos.vue'),
            },
            {
                path: 'send-errors',
                name: 'demos.send-errors',
                component: () => import('pages/demo/SendPageErrors.vue'),
            },
            {
                path: 'notif',
                name: 'demos.notifications',
                component: () => import('pages/demo/NotificationDemos.vue'),
            },
            {
                path: 'nfts',
                name: 'demos.nfts',
                component: () => import('pages/demo/NftDemos.vue'),
            },
            {
                path: 'scrollable-cards',
                name: 'demos.scrollable-cards',
                component: () => import('pages/demo/ScrollableInfoCardDemos.vue'),
            },
            {
                path: 'indexer',
                name: 'demos.indexer',
                component: () => import('pages/demo/IndexerDemos.vue'),
            },
        ],
    },

    {
        path: '/:catchAll(.*)',
        component: () => import('pages/Error404Page.vue'),
    },
];

export default routes;
