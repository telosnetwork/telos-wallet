import { boot } from 'quasar/wrappers';
import { Notify } from 'quasar';

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

export default boot(({ app, store }) => {
    app.config.globalProperties.$errorNotification = errorNotification.bind(store);
    store['$errorNotification'] = app.config.globalProperties.$errorNotification;
    app.config.globalProperties.$unexpectedErrorNotification = unexpectedErrorNotification.bind(store);
    store['$unexpectedErrorNotification'] = app.config.globalProperties.$unexpectedErrorNotification;
    app.config.globalProperties.$successNotification = successNotification.bind(store);
    store['$successNotification'] = app.config.globalProperties.$successNotification;
});



