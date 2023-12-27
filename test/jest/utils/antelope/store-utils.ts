
const subscribeForTransactionReceipt = jest.fn().mockImplementation(() => ({
    then: jest.fn().mockImplementation((cb: () => void) => cb()),
}));

export {
    subscribeForTransactionReceipt,
};
