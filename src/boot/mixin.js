import { boot } from 'quasar/wrappers';
import BigNumber from 'bignumber.js';

export default boot(async ({ app, store }) => {
    app.mixin({
        methods: {
            getFixed(value, decimal) {
                const decimalVal = Math.pow(10, decimal);
                return BigNumber((Math.floor(value * decimalVal) / decimalVal).toString()).toFormat();
            },
        },
    });
});

