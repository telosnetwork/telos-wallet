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
                name: 'wallet',
                component: () => import('pages/evm/WalletPage.vue'),
            },
        ],
    },


    {
        path: '/(.*)*',
        component: () => import('pages/Error404Page.vue'),
    },
];

export default routes;
