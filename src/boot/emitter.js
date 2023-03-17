import { boot } from 'quasar/wrappers';
import mitt from 'mitt';

const emitter = mitt();

export default boot(({ app, store }) => {
    app.config.globalProperties.$emitter = emitter;
});
