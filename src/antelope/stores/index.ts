import { App } from 'vue';
import { StoreCallback } from '@quasar/app-webpack';
import { store } from 'quasar/wrappers';
import { createPinia } from 'pinia';

export default store(((app: App) => {
    const pinia = createPinia();
    app.use(pinia);
    return pinia;
}) as StoreCallback);
