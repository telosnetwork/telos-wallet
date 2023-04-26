import { setActivePinia, createPinia } from 'pinia';

import { useGlobalStore } from 'src/stores';

jest.mock('src/antelope/stores/feedback', () => ({
    createInitFunction: jest.fn(),
    createTraceFunction: jest.fn(),
}));


describe('Global Pinia Store', () => {
    let store: { __headerBackBtn: boolean; setHeaderBackBtn: (_: boolean) => void; headerBackBtn: boolean; };

    beforeEach(() => {
        setActivePinia(createPinia());
        store = useGlobalStore();
    });

    test('initial state of __headerBackBtn should be false', () => {
        expect(store.__headerBackBtn).toBe(false);
    });

    test('setHeaderBackBtn should change __headerBackBtn value', () => {
        store.setHeaderBackBtn(true);
        expect(store.__headerBackBtn).toBe(true);
    });

    test('headerBackBtn getter should return __headerBackBtn value', () => {
        store.setHeaderBackBtn(false);
        expect(store.headerBackBtn).toBe(false);
        store.setHeaderBackBtn(true);
        expect(store.headerBackBtn).toBe(true);
    });
});
