const routes = [
    {
        path: '/',
        name: 'home',
        component: () => import('pages/home/HomePage.vue'),
    },
    {
        path: '/native',
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
        children: [
            {
                path: 'wallet',
                name: 'evm-wallet',
                component: () => import('pages/evm/wallet/WalletPage.vue'),
            },
            {
                path: 'send',
                name: 'evm-send',
                component: () => import('pages/evm/wallet/SendPage.vue'),
            },
            {
                path: 'receive',
                name: 'evm-receive',
                component: () => import('pages/evm/wallet/ReceivePage.vue'),
            },
            {
                path: 'staking',
                name: 'evm-staking',
                component: () => import('pages/evm/staking/StakingPage.vue'),
            },
            {
                path: 'wrap',
                name: 'evm-wrap',
                component: () => import('pages/evm/wrap/WrapPage.vue'),
            },
        ],
    },
    {
        path: '/:catchAll(.*)',
        component: () => import('pages/Error404Page.vue'),
    },
];

export default routes;
