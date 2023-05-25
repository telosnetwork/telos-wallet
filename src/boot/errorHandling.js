import { boot } from 'quasar/wrappers';
import { Dialog, Notify } from 'quasar';

// to persist the notification and require user to dismiss pass `true` as second param
const errorNotification = function(error, dismiss = false) {
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
        timeout: dismiss ? 0 : 5000,
        message: `${errorStr}`,
        actions: dismiss ? [
            { label: this.$t('notification.dismiss_label'), color: 'white' },
        ] : [],
    });
};

const unexpectedErrorNotification = function(error) {
    Notify.create({
        color: 'dark',
        icon: 'warning',
        message: `${error}`,
    });
};

const warningNotification = function(warning) {
    Notify.create({
        color: 'warning',
        icon: 'warning',
        message: warning,
    });
};

const successNotification = function(message) {
    Notify.create({
        color: 'primary',
        icon: 'done',
        message: `${message}`,
    });
};


const crossIcon = require('src/assets/icon--cross.svg');
const checkIcon = require('src/assets/icon--check.svg');

const html = `
    <div class="c-notify__container c-notify__container--{type}">
        <div class="c-notify__header"></div>
        <div class="c-notify__title">
            <img src='{svg}' class="c-notify__icon" />
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
            .replace('{svg}', checkIcon)
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

const failedTransactionNotification = function(message, payload) {
    Notify.create({
        timeout: 0,
        message: html
            .replace('{svg}', crossIcon)
            .replace('{type}', 'error')
            .replace('{title}', this.$t('notification.error_title'))
            .replace('{message}', message),
        html: true,
        classes: 'c-notify',
        actions: [{
            label: this.$t('notification.error_see_details_label'),
            class: 'c-notify__action-btn ' + (payload ? ' ' : 'c-notify__action-btn--hide'),
            handler: () => {
                let content = '';
                try {
                    content = JSON.stringify(payload, null, 2);
                } catch (e) {
                    try {
                        content = payload.toString();
                    } catch (e) {
                        content = payload + ' ';
                    }
                }

                Dialog.create({
                    class: 'c-notify__dialog',
                    title: this.$t('notification.error_details_title'),
                    message: '<q-card-section>' + content + '</q-card-section>',
                    html: true,
                });
            },
        }, {
            label: this.$t('notification.dismiss_label'),
            class: 'c-notify__action-btn',
        }],
    });
};


export default boot(({ app, store }) => {
    app.config.globalProperties.$errorNotification = errorNotification.bind(store);
    store['$errorNotification'] = app.config.globalProperties.$errorNotification;
    app.config.globalProperties.$unexpectedErrorNotification = unexpectedErrorNotification.bind(store);
    store['$unexpectedErrorNotification'] = app.config.globalProperties.$unexpectedErrorNotification;
    app.config.globalProperties.$warningNotification = warningNotification.bind(store);
    store['$warningNotification'] = app.config.globalProperties.$warningNotification;
    app.config.globalProperties.$successNotification = successNotification.bind(store);
    store['$successNotification'] = app.config.globalProperties.$successNotification;

    // transaction notifications handlers
    app.config.globalProperties.$successfulTransactionNotification = successfulTransactionNotification.bind(store);
    app.config.globalProperties.$failedTransactionNotification = failedTransactionNotification.bind(store);
    store['$t'] = app.config.globalProperties.$t;
});



