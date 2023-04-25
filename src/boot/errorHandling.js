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


// Fetching the icons' internal svg
function makeRequest(url) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.onload = function() {
            if (xhr.status === 200) {
                resolve(xhr.responseText);
            } else {
                reject(new Error(`Request failed with status ${xhr.status}`));
            }
        };
        xhr.onerror = function() {
            reject(new Error('Request failed due to network error'));
        };
        xhr.open('GET', url);
        xhr.send();
    });
}

let crossIcon = '';
let checkIcon = '';

try {
    crossIcon = await makeRequest('src/assets/icon--cross.svg');
} catch (error) {
    console.error(error);
}

try {
    checkIcon = await makeRequest('src/assets/icon--check.svg');
} catch (error) {
    console.error(error);
}

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

const failedTransactionNotification = function(message) {
    Notify.create({
        timeout: 5000,
        message: html
            .replace('{svg}', crossIcon)
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



