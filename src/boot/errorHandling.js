import { boot } from 'quasar/wrappers';
import { Notify } from 'quasar';
import { getAntelope } from 'src/antelope';

const errorNotification = function(error) {
    let errorStr;
    if (error !== undefined) {
        if (typeof error.startsWith !== 'function') {
            errorStr = error;
        } else if (error.startsWith('assertion failure with message:')) {
            errorStr = error.split('assertion failure with message:')[1];
        } else {
            errorStr = error;
        }
    } else {
        errorStr = 'Cancelled transaction';
    }

    Notify.create({
        color: 'negative',
        icon: 'error',
        message: `${errorStr}`,
    });
};

const unexpectedErrorNotification = function(error) {
    Notify.create({
        color: 'dark',
        icon: 'warning',
        message: `${error}`,
    });
};

const successNotification = function(message) {
    Notify.create({
        color: 'primary',
        icon: 'done',
        message: `${message}`,
    });
};

// TODO: refactoring needed --------------------
const ant = getAntelope();

const check_icon = `<svg width="33" height="28" viewBox="0 0 33 28" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M26.8338 0.933594L32.4605 6.56026L11.7138 27.3336L0.460449 16.0669L6.08712 10.4403L11.7138 16.0669L26.8338 0.933594ZM26.8338 4.66693L11.7138 19.8136L6.08712 14.2536L4.20712 16.0669L11.7138 23.5603L28.7138 6.56026L26.8338 4.66693Z" fill="#255B00"/></svg>`;

const cross_icon = `<svg width="25" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M0.960449 18.32L7.30712 12L0.960449 5.68L6.64045 0L12.9604 6.34667L19.2804 0L24.9604 5.68L18.6138 12L24.9604 18.32L19.2804 24L12.9604 17.6533L6.64045 24L0.960449 18.32ZM12.9604 13.88L19.2804 20.2133L21.1738 18.32L14.8404 12L21.1738 5.68L19.2804 3.78667L12.9604 10.12L6.64045 3.78667L4.74712 5.68L11.0805 12L4.74712 18.32L6.64045 20.2133L12.9604 13.88Z" fill="#880000"/>
</svg>`;

const html = `
    <div class="c-notify__container c-notify__container--{type}">
        <div class="c-notify__header"></div>
        <div class="c-notify__title">
            {svg}
            <span>{title}</span>
        </div>
        <div class="c-notify__message">
            <span>{message}</span>
        </div>
    </div>
`;
const successfulTransactionNotification = function(link) {
    Notify.create({
        timeout: 5000,
        message: html
            .replace('{svg}', check_icon)
            .replace('{type}', 'success')
            .replace('{title}', this.$t('notification.success_title'))
            .replace('{message}', this.$t('notification.success_message')),
        html: true,
        classes: 'c-notify',
        actions: [{
            label: this.$t('notification.success_see_trx_label'),
            color: 'positive',
            iconRight: 'launch',
            class: 'c-notify__action-btn',
            handler: () => {
                window.open(link, '_blank');
            },
        }, {
            label: this.$t('notification.dismiss_label'),
            class: 'c-notify__action-btn',
        }],
    });
};

const failedTransactionNotification = function(message) {
    Notify.create({
        timeout: 5000,
        message: html
            .replace('{svg}', cross_icon)
            .replace('{type}', 'error')
            .replace('{title}', this.$t('notification.error_title'))
            .replace('{message}', message),
        html: true,
        classes: 'c-notify',
        actions: [{
            label: this.$t('notification.success_see_trx_label'),
            iconRight: 'launch',
            class: 'c-notify__action-btn c-notify__action-btn--hide',
        }, {
            label: this.$t('notification.dismiss_label'),
            class: 'c-notify__action-btn',
        }],
    });
};

// --------------------------------------------


export default boot(({ app, store }) => {
    app.config.globalProperties.$errorNotification = errorNotification.bind(store);
    store['$errorNotification'] = app.config.globalProperties.$errorNotification;
    app.config.globalProperties.$unexpectedErrorNotification = unexpectedErrorNotification.bind(store);
    store['$unexpectedErrorNotification'] = app.config.globalProperties.$unexpectedErrorNotification;
    app.config.globalProperties.$successNotification = successNotification.bind(store);
    store['$successNotification'] = app.config.globalProperties.$successNotification;

    // transaction notifications handlers
    app.config.globalProperties.$successfulTransactionNotification = successfulTransactionNotification.bind(store);
    app.config.globalProperties.$failedTransactionNotification = failedTransactionNotification.bind(store);
    store['$t'] = app.config.globalProperties.$t;
});



