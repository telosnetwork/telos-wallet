/* eslint-disable @typescript-eslint/no-explicit-any */

// -------- Contract Store --------

const fetchContractCreationInfo = jest.fn().mockImplementation(() => ({
    then: jest.fn().mockImplementation((cb: any) => cb()),
}));

const getContract = jest.fn().mockImplementation(() => ({
    then: jest.fn().mockImplementation((cb1: any) => {
        cb1({
            getContractInstance: jest.fn().mockImplementation(() => ({
                previewDeposit: jest.fn(),
            })),
        });
    }),
}));

const fetchContractMetadata = jest.fn().mockImplementation(() => ({
    then: jest.fn().mockImplementation((cb: any) => cb()),
}));


const createAndStoreVerifiedContract = jest.fn().mockImplementation(() => ({
    then: jest.fn().mockImplementation((cb: any) => cb()),
}));

const createAndStoreEmptyContract = jest.fn().mockImplementation(() => ({
    then: jest.fn().mockImplementation((cb: any) => cb()),
}));

const getTokenABI = jest.fn().mockImplementation(() => ({
    then: jest.fn().mockImplementation((cb: any) => cb()),
}));

const getToken = jest.fn().mockImplementation(() => ({
    then: jest.fn().mockImplementation((cb: any) => cb()),
}));

const createAndStoreContractFromTokenList = jest.fn().mockImplementation(() => ({
    then: jest.fn().mockImplementation((cb: any) => cb()),
}));

const ContractGetters = {
};

const ContractActions = {
    fetchContractCreationInfo,
    getContract,
    fetchContractMetadata,
    createAndStoreVerifiedContract,
    createAndStoreEmptyContract,
    getTokenABI,
    getToken,
    createAndStoreContractFromTokenList,
};

const ContractStore = { ...ContractActions, ...ContractGetters };

const useContractStore = jest.fn().mockImplementation(() => ContractStore);

export {
    ContractStore,
    useContractStore,
};
