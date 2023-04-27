import { setActivePinia, createPinia } from 'pinia';

import { useAppNavStore } from 'src/stores';

jest.mock('src/antelope/stores/feedback', () => ({
    createInitFunction: jest.fn(),
    createTraceFunction: jest.fn(),
}));


describe('Global Pinia Store', () => {
    let store: any;

    beforeEach(() => {
        setActivePinia(createPinia());
        store = useAppNavStore();
    });

    test('initial state of __showBackBtn should be false', () => {
        expect(store.__showBackBtn).toBe(false);
    });

    test('setShowBackBtn should change __showBackBtn value', () => {
        store.setShowBackBtn(true);
        expect(store.__showBackBtn).toBe(true);
    });

    test('headerBackBtn getter should return __showBackBtn value', () => {
        store.setShowBackBtn(false);
        expect(store.showBackBtn).toBe(false);
        store.setShowBackBtn(true);
        expect(store.showBackBtn).toBe(true);
    });
});
