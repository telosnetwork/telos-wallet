const routes = [
    {
        path: '/',
        name: 'home',
        component: () => import('pages/home/HomePage.vue'),
    },
    {
<<<<<<< HEAD
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
=======
        path: '/evm-balance',
        component: () => import('layouts/EVMLayout.vue'),
        children: [{ path: '', component: () => import('pages/BalanceInfo.vue') }],
    },
    {
        path: '/balance',
        component: () => import('layouts/MainLayout.vue'),
        children: [{ path: '', component: () => import('pages/BalanceInfo.vue') }],
>>>>>>> 9aa6f34 (adding logged page - placeholder)
    },
    {
        path: '/evm',
        component: () => import('layouts/EVMLayout.vue'),
        children: [
            {
                path: 'wallet',
                name: 'evm-wallet',
                component: () => import('pages/evm/WalletPage.vue'),
            },
            {
                path: 'staking',
                name: 'evm-staking',
                component: () => import('pages/evm/StakingPage.vue'),
            },
            {
                path: 'wrap',
                name: 'evm-wrap',
                component: () => import('pages/evm/WrapPage.vue'),
            },
        ],
    },


    {
        path: '/(.*)*',
        component: () => import('pages/Error404Page.vue'),
    },
];

export default routes;
