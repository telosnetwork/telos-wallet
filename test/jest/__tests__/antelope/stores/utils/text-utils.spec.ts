
import { abbreviateNumber, getShapedNftName, truncateAddress, truncateText } from 'src/antelope/stores/utils/text-utils';

describe('truncateText', () => {
    it('should truncate text correctly', () => {
        expect(truncateText('Some text', 4)).toEqual('Some...');
        expect(truncateText('Some text', 9)).toEqual('Some text');
    });
});

describe('truncateAddress', () => {
    it('should truncate an address correctly', () => {
        const address = '0x'.concat('0'.repeat(40));
        expect(truncateAddress(address)).toEqual('0x0000...0000');
    });
});

describe('getShapedNftName', () => {
    it('should return the name without the ID', () => {
        expect(getShapedNftName('SomeNft #1234', '1234')).toEqual('SomeNft');
        expect(getShapedNftName('SomeNft 1234', '1234')).toEqual('SomeNft');

        // it should only remove the ID if it's at the end of the name, after a space
        expect(getShapedNftName('Some1234Nft', '1234')).toEqual('Some1234Nft');
        expect(getShapedNftName('Fake ERC721', '1')).toEqual('Fake ERC721');
    });
});

describe('abbreviateNumber', () => {
    it('should abbreviate a number correctly', () => {
        expect(abbreviateNumber('en-us', 1000)).toEqual('1K');
        expect(abbreviateNumber('en-us', 1200)).toEqual('1.2K');
        expect(abbreviateNumber('en-us', 120000)).toEqual('120K');
        expect(abbreviateNumber('en-us', 1000000)).toEqual('1M');
    });
});
