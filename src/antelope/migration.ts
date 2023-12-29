import {
    CURRENT_CONTEXT,
    useAccountStore,
    useBalancesStore,
    useChainStore,
    useNftsStore,
} from 'src/antelope';
import { metakeepCache } from 'src/antelope/wallets/ual/utils/metakeep-cache';

const nftsStore = useNftsStore();
const balanceStore = useBalancesStore();

export const isTodayBeforeTelosCloudDown = new Date().getTime() < new Date('2023-12-31').getTime();

// ----- EVM ------
const ethPubKey = () => {
    const emails = metakeepCache.getMails();
    if (emails.length > 0) {
        const ethPubKey = metakeepCache.getEthAddress(emails[0]);
        if (ethPubKey) {
            return ethPubKey;
        }
    }
    return '';
};

const hasAnyTokenBalance = () => balanceStore.currentBalances.some(balance => !balance.amount.isNegative() && !balance.amount.isZero());
const authenticator      = () => useAccountStore().getAccount(CURRENT_CONTEXT).authenticator;
const currentAuthName    = () => authenticator()?.getName() || '';
const hasNfts            = () => nftsStore.loggedInventory?.length > 0;
const hasAssets          = () => hasAnyTokenBalance() || hasNfts();
const isMigrationNeeded  = () => currentAuthName() === 'OreId' && ethPubKey() !== '' && hasAssets() && isTodayBeforeTelosCloudDown;

const evm = {
    hasNfts,
    hasAssets,
    ethPubKey,
    isMigrationNeeded,
};


// ----- ZERO ------
const accountNameZero = () => {
    const emails = metakeepCache.getMails();
    if (emails.length > 0) {
        const chainId = useChainStore().currentChain.settings.getChainId();
        const names = metakeepCache.getAccountNames(emails[0], chainId);
        if (names.length > 0) {
            return names[0];
        }
    }
    return '';
};

const currentAuthNameZero = () => localStorage.getItem('autoLogin');
const isMigrationNeededZero = () => currentAuthNameZero() === 'ual-oreid' && accountNameZero() !== '' && isTodayBeforeTelosCloudDown;

const zero = {
    accountName: accountNameZero,
    isMigrationNeeded: isMigrationNeededZero,
};


const update = () => {
    metakeepCache.loadCache();
};

const print = () => {
    console.log('-- EVM --');
    console.log('ethPubKey', ethPubKey());
    console.log('hasNfts', hasNfts());
    console.log('hasAssets', hasAssets());
    console.log('currentAuthName', currentAuthName());
    console.log('hasAnyTokenBalance', hasAnyTokenBalance());
    console.log('isMigrationNeeded ->', isMigrationNeeded());
    console.log('-- ZERO --');
    console.log('accountName ->', accountNameZero());
    console.log('isMigrationNeeded ->', isMigrationNeededZero);
    console.log('currentAuthNameZero ->', currentAuthNameZero());
};

export const migration = {
    update,
    print,
    evm,
    zero,
};
