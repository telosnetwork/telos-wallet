
const subscribeForTransactionReceipt = jest.fn().mockImplementation(() => ({
    then: jest.fn().mockImplementation((cb: () => void) => cb()),
}));

jest.mock('src/antelope/stores/utils/trx-utils', () => ({
    subscribeForTransactionReceipt,
}));

export {
    subscribeForTransactionReceipt,
};
