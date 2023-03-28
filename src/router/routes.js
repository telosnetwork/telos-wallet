const routes = [
    {
        path: '/',
        component: () => import('pages/components/home/HomePage.vue'),
    },
    {
        path: '/native',
        component: () => import('layouts/NativeLayout.vue'),
        children: [
            {
                path: 'balance',
                component: () => import('pages/BalanceInfo.vue'),
            },
            {
                path: 'dappsearch',
                component: () => import('pages/DappSearch.vue'),
            },
            {
                path: 'profile',
                component: () => import('pages/SettingsPage.vue'),
            },
        ],
    },


    {
        path: '/(.*)*',
        component: () => import('pages/Error404Page.vue'),
    },
];

export default routes;
