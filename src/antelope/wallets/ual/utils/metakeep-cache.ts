// utils/metakeep-cache.ts

export interface MetakeepCacheData {
    [email: string]: {
        wallet: MetakeepWallets;
        chains: {
            [chainId: string]: {
                accounts: string[];
            }
        };
    }
}

export interface MetakeepWallets {
    eosAddress: string;
    solAddress: string;
    ethAddress: string;
}

const LOCAL_STORAGE_KEY_DATA = 'metakeep.data';
const LOCAL_STORAGE_KEY_LOGGED = 'metakeep.logged';

class MetakeepCache {
    private cache: MetakeepCacheData = {};
    private logged: string | null = null;
    public mails: string[] = [];

    constructor() {
        this.loadCache();
    }

    public loadCache() {
        try {
            const cachedData = window.localStorage.getItem(LOCAL_STORAGE_KEY_DATA);
            if (cachedData) {
                this.cache = JSON.parse(cachedData);
            }
            this.logged = window.localStorage.getItem(LOCAL_STORAGE_KEY_LOGGED);
            this.mails = Object.keys(this.cache);
        } catch (error) {
            console.error('Error loading Metakeep cache:', error);
        }
    }

    public saveCache() {
        try {
            window.localStorage.setItem(LOCAL_STORAGE_KEY_DATA, JSON.stringify(this.cache));
            if (this.logged) {
                window.localStorage.setItem(LOCAL_STORAGE_KEY_LOGGED, this.logged);
            } else {
                window.localStorage.removeItem(LOCAL_STORAGE_KEY_LOGGED);
            }
        } catch (error) {
            console.error('Error saving Metakeep cache:', error);
        }
    }

    private assertCache(email: string, chainId?: string) {
        if (!this.cache[email]) {
            this.cache[email] = {
                wallet: {
                    eosAddress: '',
                    solAddress: '',
                    ethAddress: '',
                },
                chains: {},
            };
        }
        if (chainId) {
            if (!this.cache[email].chains[chainId]) {
                this.cache[email].chains[chainId] = {
                    accounts: [],
                };
            }
        }
    }

    public getMails(): string[] {
        return Object.keys(this.cache);
    }

    public getEosAddress(email: string): string {
        this.assertCache(email);
        return this.cache[email]?.wallet?.eosAddress ?? '';
    }

    public getSolAddress(email: string): string {
        this.assertCache(email);
        return this.cache[email]?.wallet?.solAddress ?? '';
    }

    public getEthAddress(email: string): string {
        this.assertCache(email);
        return this.cache[email]?.wallet?.ethAddress ?? '';
    }

    public getAccountNames(email: string, chainId: string): string[] {
        this.assertCache(email, chainId);
        return this.cache[email]?.chains[chainId]?.accounts ?? [];
    }

    public getLogged(): string | null {
        return this.logged;
    }

    // setters --------------
    public setSelectedAccountName(email: string, chainId: string, accountName: string) {
        this.assertCache(email, chainId);
        const index = this.cache[email].chains[chainId].accounts.indexOf(accountName);
        if (index !== -1) {
            this.cache[email].chains[chainId].accounts.splice(index, 1);
        }
        this.cache[email].chains[chainId].accounts.unshift(accountName);
        this.saveCache();
    }

    public addAccountName(email: string, chainId: string, accountName: string) {
        this.assertCache(email, chainId);
        if (!this.cache[email].chains[chainId].accounts.includes(accountName)) {
            this.cache[email].chains[chainId].accounts.push(accountName);
        }
        this.saveCache();
    }

    public addCredentials(email: string, wallet: MetakeepWallets) {
        this.assertCache(email);
        this.cache[email].wallet = wallet;
        this.saveCache();
    }

    public setLogged(email: string | null) {
        if (email) {
            this.assertCache(email);
        }
        this.logged = email;
        this.saveCache();
    }
}

export const metakeepCache = new MetakeepCache();

