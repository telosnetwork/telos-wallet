// -------- Ethers --------

// require actual BigNumber as ethersBigNumber
// const ethersBigNumber = require('ethers').BigNumber;


const { BigNumber } = jest.requireActual('ethers');

export const ethers = {
    utils: {
        parseUnits: jest.fn().mockImplementation(() => BigNumber.from(1)),
        formatUnits: jest.fn().mockImplementation(() => 1),
        parseEther: jest.fn().mockImplementation(() => BigNumber.from(1)),
        formatEther: jest.fn().mockImplementation(() => BigNumber.from(1)),
    },
    BigNumber: jest.fn(),
    providers: {
        TransactionReceipt: jest.fn(),
    },
    constants: {
        Zero: BigNumber.from(0),
        AddressZero: '0x',
    },
};


jest.mock('ethers', () => ({
    ethers,
    BigNumber: jest.fn(),
}));
