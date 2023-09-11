import { MockData } from 'test/jest/utils/antelope/mockData';

// -------- wagmi & web3modal --------
const wagmiMock = {
    getAccount: jest.fn().mockImplementation(() => MockData.Account.account),
    getNetwork: jest.fn().mockImplementation(() => ({ chain: { id: 99 } })),
    prepareSendTransaction: jest.fn(),
    prepareWriteContract: jest.fn(),
};

jest.mock('@wagmi/core', () => wagmiMock);

const web3ModalMock = {
    Web3Modal: class {
        openModal() {
            return 'open';
        }
        subscribeModal() {
            return null;
        }
    },
};

jest.mock('@web3modal/html', () => web3ModalMock);

export {
    // Mock Data --
    MockData,
    // wagmi --
    wagmiMock,
    // web3modal --
    web3ModalMock,
};
