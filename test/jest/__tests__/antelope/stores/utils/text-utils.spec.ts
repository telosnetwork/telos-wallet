
import { getShapedNftName, truncateAddress, truncateText } from 'src/antelope/stores/utils/text-utils';

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
    });
});
