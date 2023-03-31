const routes = [
    {
        path: '/',
        component: () => import('pages/components/home/HomePage.vue'),
    },
    {
        path: '/balance',
        component: () => import('layouts/MainLayout.vue'),
        children: [{ path: '', component: () => import('pages/BalanceInfo.vue') }],
    },
    {
        path: '/dappsearch',
        component: () => import('layouts/MainLayout.vue'),
        children: [{ path: '', component: () => import('pages/DappSearch.vue') }],
    },
    {
        path: '/profile',
        component: () => import('layouts/MainLayout.vue'),
        children: [{ path: '', component: () => import('pages/SettingsPage.vue') }],
    },

    // Always leave this as last one,
    // but you can also remove it
    {
        path: '/(.*)*',
        component: () => import('pages/Error404Page.vue'),
    },
];

export default routes;
