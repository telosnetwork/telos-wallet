
// -------- globalProps for vue --------

const globalProps = {
    $t: jest.fn(() => 'Mocked translation'),
    $warningNotification: jest.fn(),
};

jest.mock('vue', () => {
    const originalVue = jest.requireActual('vue');

    return {
        ...originalVue,
        getCurrentInstance: jest.fn(() => ({
            appContext: {
                config: {
                    globalProperties: globalProps,
                },
            },
        })),
        ComponentInternalInstance: originalVue.ComponentInternalInstance,
        computed: originalVue.computed,
        defineComponent: originalVue.defineComponent,
        watch: originalVue.watch,
    };
});

export {
    globalProps,
};

