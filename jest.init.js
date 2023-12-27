/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { config } from '@vue/test-utils';
import { QBtn } from 'quasar';

config.global.mocks = {
    $t: str => str,
    $warningNotification: jest.fn(),
};


config.global.components = {
    'q-btn': QBtn,
};

config.global.provide = {
    '$wagmi': null,
};
