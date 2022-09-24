import { __awaiter, __decorate } from "tslib";
import { action, createModule, mutation } from "vuex-class-component";
import {
    buildTokenId,
    compareString,
    compareToken,
    fetchMultiRelay,
    fetchMultiRelays,
    fetchTokenStats,
    fetchTradeData,
    findOrThrow,
    getBalance,
    getTokenMeta,
    updateArray
} from "../../../api/helpers";
import {
    Asset,
    asset_to_number,
    number_to_asset,
    Sym as Symbol,
    Sym
} from "eos-common";
import { multiContract } from "../../../api/multiContractTx";
import { vxm } from "../../../store";
import { rpc } from "../../../api/rpc";
import {
    calculateFundReturn,
    composeMemo,
    findCost,
    findNewPath,
    findReturn,
    relaysToConvertPaths
} from "../../../api/eosBancorCalc";
import _ from "lodash";
import { getHardCodedRelays } from "./staticRelays";
import { sortByNetworkTokens } from "../../../api/sortByNetworkTokens";
import { liquidateAction, hydrateAction } from "../../../api/singleContractTx";
const compareAgnosticToBalanceParam = (agnostic, balance) =>
    compareString(balance.contract, agnostic.contract) &&
    compareString(agnostic.symbol, balance.symbol);
const agnosticToTokenBalanceParam = agnostic => ({
    contract: agnostic.contract,
    symbol: agnostic.symbol
});
const dryToTraditionalEdge = relay => [
    buildTokenId({
        contract: relay.reserves[0].contract,
        symbol: relay.reserves[0].symbol.code().to_string()
    }),
    buildTokenId({
        contract: relay.reserves[1].contract,
        symbol: relay.reserves[1].symbol.code().to_string()
    })
];
const pureTimesAsset = (asset, multiplier) => {
    const newAsset = new Asset(asset.to_string());
    return newAsset.times(multiplier);
};
const tokenContractSupportsOpen = contractName =>
    __awaiter(void 0, void 0, void 0, function* () {
        const abiConf = yield rpc.get_abi(contractName);
        return abiConf.abi.actions.some(action => action.name == "open");
    });
const getSymbolName = tokenSymbol => tokenSymbol.symbol.code().to_string();
const relayHasReserveBalances = relay =>
    relay.reserves.every(reserve => reserve.amount > 0);
const reservesIncludeTokenMeta = tokenMeta => relay => {
    const status = relay.reserves.every(reserve =>
        tokenMeta.some(
            meta =>
                compareString(reserve.contract, meta.account) &&
                compareString(reserve.symbol, meta.symbol)
        )
    );
    if (!status)
        console.warn(
            "Dropping relay",
            relay.reserves.map(x => x.symbol),
            "because it does not exist in tokenMeta"
        );
    return status;
};
const compareEosTokenSymbol = (a, b) =>
    compareString(a.contract, b.contract) && a.symbol.isEqual(b.symbol);
const reservesIncludeTokenMetaDry = tokenMeta => relay => {
    const status = relay.reserves.every(reserve =>
        tokenMeta.some(
            meta =>
                compareString(reserve.contract, meta.account) &&
                compareString(reserve.symbol.code().to_string(), meta.symbol)
        )
    );
    if (!status)
        console.warn(
            "Dropping relay containing reserves",
            relay.reserves.map(x => x.symbol).toString(),
            "because they are not included in reserves"
        );
    return status;
};
const compareEosMultiToDry = (multi, dry) =>
    compareString(
        buildTokenId({
            contract: multi.smartToken.contract,
            symbol: multi.smartToken.symbol
        }),
        buildTokenId({
            contract: dry.smartToken.contract,
            symbol: dry.smartToken.symbol.code().to_string()
        })
    );
const fetchBalanceAssets = (tokens, account) =>
    __awaiter(void 0, void 0, void 0, function* () {
        return Promise.all(
            tokens.map(token =>
                __awaiter(void 0, void 0, void 0, function* () {
                    const res = yield rpc.get_table_rows({
                        code: token.contract,
                        scope: account,
                        table: "accounts"
                    });
                    const assets = res.rows.map(row => new Asset(row.balance));
                    const foundAsset = assets.find(
                        asset => asset.symbol.code().to_string() == token.symbol
                    );
                    return foundAsset;
                })
            )
        );
    });
const blackListedTokens = [
    { contract: "therealkarma", symbol: "KARMA" },
    { contract: "wizznetwork1", symbol: "WIZZ" }
];
const noBlackListedReservesDry = blackListedTokens => relay =>
    !relay.reserves.some(reserve =>
        blackListedTokens.some(
            token =>
                compareString(reserve.contract, token.contract) &&
                compareString(reserve.symbol.code().to_string(), token.symbol)
        )
    );
const noBlackListedReserves = blackListedTokens => relay =>
    !relay.reserves.some(reserve =>
        blackListedTokens.some(
            token =>
                compareString(reserve.contract, token.contract) &&
                compareString(reserve.symbol, reserve.symbol)
        )
    );
const mandatoryNetworkTokens = [{ contract: "eosio.token", symbol: "TLOS" }];
const isBaseToken = token => comparasion =>
    token.symbol == comparasion.symbol && token.contract == comparasion.contract;
const relayIncludesBothTokens = (networkTokens, tradingTokens) => {
    const networkTokensExcluded = _.differenceWith(
        tradingTokens,
        networkTokens,
        _.isEqual
    );
    return relay => {
        const includesNetworkToken = relay.reserves.some(reserve =>
            networkTokens.some(isBaseToken(reserve))
        );
        const includesTradingToken = relay.reserves.some(reserve =>
            networkTokensExcluded.some(isBaseToken(reserve))
        );
        const includesNetworkTokens = relay.reserves.every(reserve =>
            networkTokens.some(isBaseToken(reserve))
        );
        return (
            (includesNetworkToken && includesTradingToken) || includesNetworkTokens
        );
    };
};
const lowestAsset = (assetOne, assetTwo) =>
    assetOne.isLessThan(assetTwo) ? assetOne : assetTwo;
const assetToSymbolName = asset => asset.symbol.code().to_string();
const agnosticToAsset = agnostic =>
    number_to_asset(
        agnostic.amount,
        new Sym(agnostic.symbol, agnostic.precision)
    );
const agnosticToTokenAmount = agnostic => ({
    contract: agnostic.contract,
    amount: agnosticToAsset(agnostic)
});
const simpleReturn = (from, to) => asset_to_number(to) / asset_to_number(from);
const baseReturn = (from, to, decAmount = 1) => {
    const fromAsset = agnosticToAsset(from);
    const toAsset = agnosticToAsset(to);
    const reward = simpleReturn(fromAsset, toAsset);
    return number_to_asset(reward, toAsset.symbol);
};
const compareTokenSymbol = (t1, t2) =>
    compareString(t1.contract, t2.contract) &&
    compareString(t1.symbol.code().to_string(), t2.symbol.code().to_string());
const compareEosMultiRelay = (r1, r2) => compareString(r1.id, r2.id);
const compareAssetPrice = (asset, knownPrice) =>
    compareString(assetToSymbolName(asset), knownPrice.symbol);
const sortByKnownToken = (assets, knownPrices) =>
    assets.sort(a =>
        knownPrices.some(price => compareAssetPrice(a, price)) ? -1 : 1
    );
const calculatePriceBothWays = (reserves, knownPrices) => {
    const atLeastOnePriceKnown = reserves.some(reserve =>
        knownPrices.some(price => compareString(reserve.symbol, price.symbol))
    );
    if (reserves.length !== 2)
        throw new Error("This only works for 2 reserve relays");
    if (!atLeastOnePriceKnown)
        throw new Error(
            "Failed to determine USD price, was not passed in known prices"
        );
    if (reserves.some(reserve => reserve.amount == 0))
        throw new Error("One of more of the reserves passed has a zero balance");
    const [reserveOne, reserveTwo] = reserves;
    const rewards = [
        baseReturn(reserveOne, reserveTwo),
        baseReturn(reserveTwo, reserveOne)
    ];
    const [knownValue, unknownValue] = sortByKnownToken(rewards, knownPrices);
    const knownToken = knownPrices.find(price =>
        compareAssetPrice(knownValue, price)
    ).unitPrice;
    const unknownToken = asset_to_number(knownValue) * knownToken;
    return [
        {
            unitPrice: knownToken,
            symbol: knownValue.symbol.code().to_string()
        },
        {
            unitPrice: unknownToken,
            symbol: unknownValue.symbol.code().to_string()
        }
    ];
};
const calculateLiquidtyDepth = (relay, knownPrices) => {
    const [indexedToken] = sortByKnownToken(
        relay.reserves.map(agnosticToAsset),
        knownPrices
    );
    return (
        asset_to_number(indexedToken) *
        knownPrices.find(price => compareAssetPrice(indexedToken, price)).unitPrice
    );
};
const buildTwoFeedsFromRelay = (relay, knownPrices) => {
    const prices = calculatePriceBothWays(relay.reserves, knownPrices);
    return prices.map(price => {
        const token = relay.reserves.find(reserve =>
            compareString(reserve.symbol, price.symbol)
        );
        return {
            costByNetworkUsd: price.unitPrice,
            liqDepth: calculateLiquidtyDepth(relay, knownPrices),
            smartTokenId: buildTokenId({
                contract: relay.smartToken.contract,
                symbol: relay.smartToken.symbol
            }),
            smartPriceApr: relay.apr,
            tokenId: buildTokenId({ contract: token.contract, symbol: token.symbol })
        };
    });
};
const getEosioTokenPrecision = (symbol, contract) =>
    __awaiter(void 0, void 0, void 0, function* () {
        const res = yield rpc.get_table_rows({
            code: contract,
            table: "stat",
            scope: symbol
        });
        if (res.rows.length == 0) throw new Error("Failed to find token");
        return new Asset(res.rows[0].supply).symbol.precision();
    });
const chopSecondSymbol = (one, two, maxLength = 7) =>
    two.slice(0, maxLength - one.length) + one;
const chopSecondLastChar = (text, backUp) => {
    const secondLastIndex = text.length - backUp - 1;
    return text
        .split("")
        .filter((_, index) => index !== secondLastIndex)
        .join("");
};
const tokenStrategies = [
    chopSecondSymbol,
    (one, two) => chopSecondSymbol(one, chopSecondLastChar(two, 1)),
    (one, two) => chopSecondSymbol(one, chopSecondLastChar(two, 2)),
    (one, two) => chopSecondSymbol(one, chopSecondLastChar(two, 3)),
    (one, two) =>
        chopSecondSymbol(
            one,
            two
                .split("")
                .reverse()
                .join("")
        )
];
const generateSmartTokenSymbol = (symbolOne, symbolTwo, multiTokenContract) =>
    __awaiter(void 0, void 0, void 0, function* () {
        for (const strat in tokenStrategies) {
            const draftedToken = tokenStrategies[strat](symbolOne, symbolTwo);
            try {
                yield getEosioTokenPrecision(draftedToken, multiTokenContract);
            } catch (e) {
                return draftedToken;
            }
        }
        throw new Error("Failed to find a new SmartTokenSymbol!");
    });
const multiToDry = relay => ({
    reserves: relay.reserves.map(reserve => ({
        contract: reserve.contract,
        symbol: new Symbol(reserve.symbol, reserve.precision)
    })),
    contract: relay.contract,
    smartToken: {
        symbol: new Symbol(relay.smartToken.symbol, relay.smartToken.precision),
        contract: relay.smartToken.contract
    },
    isMultiContract: relay.isMultiContract
});
const eosMultiToHydrated = relay => ({
    reserves: relay.reserves.map(reserve => ({
        contract: reserve.contract,
        amount: number_to_asset(
            reserve.amount,
            new Symbol(reserve.symbol, reserve.precision)
        )
    })),
    contract: relay.contract,
    fee: relay.fee,
    isMultiContract: relay.isMultiContract,
    smartToken: {
        symbol: new Symbol(relay.smartToken.symbol, relay.smartToken.precision),
        contract: relay.smartToken.contract
    },
    apr: relay.apr
});
const isOwner = (relay, account) => relay.owner == account;
const multiRelayToSmartTokenId = relay =>
    buildTokenId({
        contract: relay.smartToken.contract,
        symbol: relay.smartToken.symbol
    });
const VuexModule = createModule({
    strict: false
});
export class TlosBancorModule extends VuexModule.With({
    namespaced: "tlosBancor/"
}) {
    constructor() {
        super(...arguments);
        this.initialised = false;
        this.relaysList = [];
        this.relayFeed = [];
        this.loadingPools = true;
        this.usdPrice = 0;
        this.usdPriceOfTlos = 0;
        this.usdTlos24hPriceMove = 0.0;
        this.tokenMeta = [];
        this.moreTokensAvailable = false;
        this.loadingTokens = false;
    }
    get morePoolsAvailable() {
        return false;
    }
    setLoadingPools(status) {
        this.loadingPools = status;
    }
    loadMorePools() {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    get supportedFeatures() {
        return id => {
            const isAuthenticated = this.isAuthenticated;
            const relay = this.relaysList.find(relay => compareString(relay.id, id));
            const features = [
                ["addLiquidity", () => true],
                [
                    "removeLiquidity",
                    relay => relay.reserves.some(reserve => reserve.amount > 0)
                ]
            ];
            return features
                .filter(([name, test]) => test(relay, isAuthenticated))
                .map(([name]) => name);
        };
    }
    get isAuthenticated() {
      const test = this.$store;
        return this.$store.getters[`${this.wallet}Wallet/isAuthenticated`];
    }
    get wallet() {
        return "tlos";
    }
    get balance() {
        return token => {
            return this.$store.getters[`${this.wallet}Network/balance`](token);
        };
    }
    get newPoolTokenChoices() {
        return networkToken => {
            return this.tokenMeta
                .map(tokenMeta => {
                    const { symbol, account: contract } = tokenMeta;
                    const balance = this.balance({
                        contract,
                        symbol
                    });
                    return {
                        id: buildTokenId({ contract, symbol }),
                        symbol,
                        contract,
                        balance: balance && balance.balance,
                        img: tokenMeta.logo
                    };
                })
                .filter(
                    (value, index, array) =>
                        array.findIndex(token => value.symbol == token.symbol) == index
                )
                .filter(tokenMeta => {
                    return true;
                })
                .filter(
                    token =>
                        !mandatoryNetworkTokens.some(
                            networkToken => token.symbol == networkToken.symbol
                        )
                )
                .sort((a, b) => {
                    const second = isNaN(b.balance) ? 0 : Number(b.balance);
                    const first = isNaN(a.balance) ? 0 : Number(a.balance);
                    return second - first;
                });
        };
    }
    get newNetworkTokenChoices() {
        const tlos = {
            symbol: "TLOS",
            contract: "eosio.token"
        };

        const tlosd = {
            symbol: "TLOSD",
            contract: "tokens.swaps"
        };

        return [
            {
                ...tlos,
                id: buildTokenId(tlos),
                usdValue: this.usdPriceOfTlos
            },
            {
                ...tlosd,
                id: buildTokenId(tlosd),
                usdValue: 1
            }
        ].map(choice => ({
            ...choice,
            balance: this.balance(choice) ? this.balance(choice).balance : null,
            img: this.tokenMetaObj(choice.id).logo
        }));
    }
    get currentUserBalances() {
        return vxm.tlosNetwork.balances;
    }
    fetchTokenBalancesIfPossible(tokens) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.isAuthenticated) return;
            const tokensFetched = this.currentUserBalances;
            const allTokens = _.uniqBy(
                this.relaysList.flatMap(relay => relay.reserves),
                "id"
            );
            const tokenBalancesNotYetFetched = _.differenceWith(
                allTokens,
                tokensFetched,
                compareAgnosticToBalanceParam
            );
            const tokensToAskFor = _.uniqWith(
                [
                    ...tokens,
                    ...tokenBalancesNotYetFetched.map(agnosticToTokenBalanceParam)
                ],
                compareToken
            );
            return vxm.tlosNetwork.getBalances({
                tokens: tokensToAskFor,
                slow: false
            });
        });
    }
    updateFee({ fee, id }) {
        return __awaiter(this, void 0, void 0, function* () {
            const relay = yield this.relayById(id);
            const updateFeeAction = multiContract.updateFeeAction(
                relay.smartToken.symbol,
                fee
            );
            const txRes = yield this.triggerTx([updateFeeAction]);
            return txRes.transaction_id;
        });
    }
    removeRelay(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const relay = yield this.relayById(id);
            const reserves = relay.reserves.map(reserve => reserve.symbol);
            const nukeRelayActions = multiContract.nukeRelayAction(
                relay.smartToken.symbol,
                reserves
            );
            const txRes = yield this.triggerTx(nukeRelayActions);
            this.waitAndUpdate();
            return txRes.transaction_id;
        });
    }
    updateOwner({ id, newOwner }) {
        return __awaiter(this, void 0, void 0, function* () {
            const relay = yield this.relayById(id);
            const updateOwnerAction = multiContract.updateOwnerAction(
                relay.smartToken.symbol,
                newOwner
            );
            const txRes = yield this.triggerTx([updateOwnerAction]);
            return txRes.transaction_id;
        });
    }
    createPool(poolParams) {
        return __awaiter(this, void 0, void 0, function* () {
            const reserveAssets = yield Promise.all(
                poolParams.reserves.map(reserve =>
                    __awaiter(this, void 0, void 0, function* () {
                        const data = this.tokenMetaObj(reserve.id);
                        return {
                            amount: number_to_asset(
                                Number(reserve.amount),
                                new Symbol(
                                    data.symbol,
                                    yield getEosioTokenPrecision(data.symbol, data.account)
                                )
                            ),
                            contract: data.account
                        };
                    })
                )
            );
            const [networkAsset, tokenAsset] = sortByNetworkTokens(
                reserveAssets.map(reserveAsset => reserveAsset.amount),
                asset => asset.symbol.code().to_string()
            );
            const smartTokenSymbol = yield generateSmartTokenSymbol(
                tokenAsset.symbol.code().to_string(),
                networkAsset.symbol.code().to_string(),
                process.env.VUE_APP_SMARTTOKENCONTRACT
            );
            const networkSymbol = networkAsset.symbol.code().to_string();
            const initialLiquidity = compareString(networkSymbol, "TLOSD")
                ? 0.5
                : 1 * asset_to_number(networkAsset);
            const actions = yield multiContract.kickStartRelay(
                smartTokenSymbol,
                reserveAssets,
                Number(initialLiquidity.toFixed(0)),
                poolParams.fee
            );
            const res = yield this.triggerTx(actions);
            return res.transaction_id;
        });
    }
    get tokenMetaObj() {
        return id => {
            return findOrThrow(
                this.tokenMeta,
                meta => compareString(meta.id, id),
                `Failed to find token meta for ${id}`
            );
        };
    }
    get relaysWithFeeds() {
        return this.relaysList
            .filter(
                relayIncludesBothTokens(
                    mandatoryNetworkTokens,
                    this.tokenMeta.map(token => ({
                        contract: token.account,
                        symbol: token.symbol
                    }))
                )
            )
            .filter(relay =>
                relay.reserves.every(reserve => {
                    const relayId = buildTokenId({
                        contract: relay.smartToken.contract,
                        symbol: relay.smartToken.symbol
                    });
                    const reserveId = buildTokenId({
                        contract: reserve.contract,
                        symbol: reserve.symbol
                    });
                    const feed = this.relayFeed.find(
                        feed =>
                            compareString(feed.smartTokenId, relayId) &&
                            compareString(feed.tokenId, reserveId)
                    );
                    return feed;
                })
            );
    }
    get tokens() {
        return this.relaysWithFeeds
            .flatMap(relay =>
                relay.reserves.map(reserve => {
                    const reserveTokenId = buildTokenId({
                        contract: reserve.contract,
                        symbol: reserve.symbol
                    });
                    const feed = findOrThrow(
                        this.relayFeed,
                        feed =>
                            compareString(feed.smartTokenId, relay.id) &&
                            compareString(feed.tokenId, reserveTokenId),
                        `failed finding relay feed for ${relay.id} ${reserveTokenId}`
                    );
                    return {
                        id: reserveTokenId,
                        symbol: reserve.symbol,
                        price: feed.costByNetworkUsd,
                        change24h: feed.change24H,
                        liqDepth: feed.liqDepth,
                        volume24h: feed.volume24H,
                        contract: reserve.contract,
                        precision: reserve.precision
                    };
                })
            )
            .sort((a, b) => b.liqDepth - a.liqDepth)
            .reduce((acc, item) => {
                const existingToken = acc.find(token =>
                    compareString(token.id, item.id)
                );
                return existingToken
                    ? updateArray(
                        acc,
                        token => compareString(token.id, item.id),
                        token =>
                            Object.assign(
                                Object.assign(
                                    Object.assign(Object.assign({}, token), {
                                        liqDepth: existingToken.liqDepth + item.liqDepth
                                    }),
                                    !existingToken.change24h &&
                                    item.change24h && { change24h: item.change24h }
                                ),
                                !existingToken.volume24h &&
                                item.volume24h && { volume24h: item.volume24h }
                            )
                    )
                    : [...acc, item];
            }, [])
            .map(token => {
                const id = token.id;
                const contract = token.contract;
                const symbol = token.symbol;
                const tokenMeta = findOrThrow(this.tokenMeta, token =>
                    compareString(token.id, id)
                );
                const tokenBalance = vxm.tlosNetwork.balance({
                    contract,
                    symbol
                });
                return Object.assign(Object.assign({}, token), {
                    name: tokenMeta.name,
                    balance: tokenBalance && Number(tokenBalance.balance),
                    logo: tokenMeta.logo
                });
            });
    }
    get token() {
        return id => {
            const tradableToken = this.tokens.find(token =>
                compareString(token.id, id)
            );
            if (tradableToken) {
                return tradableToken;
            } else {
                const token = findOrThrow(
                    this.relaysList.flatMap(relay => relay.reserves),
                    token => compareString(token.id, id),
                    `Failed to find token ${id} in this.token on Telos`
                );
                const meta = this.tokenMetaObj(token.id);
                return Object.assign(Object.assign({}, token), {
                    name: meta.name,
                    logo: meta.logo
                });
            }
        };
    }
    get relay() {
        return id => {
            return findOrThrow(
                this.relays,
                relay => compareString(relay.id, id),
                `Failed to find relay with ID of ${id}`
            );
        };
    }
    get relays() {
        return this.relaysList
            .filter(
                relayIncludesBothTokens(
                    mandatoryNetworkTokens,
                    this.tokenMeta.map(token => ({
                        contract: token.account,
                        symbol: token.symbol
                    }))
                )
            )
            .filter(reservesIncludeTokenMeta(this.tokenMeta))
            .map(relay => {
                const relayFeed = this.relayFeed.find(feed =>
                    compareString(
                        feed.smartTokenId,
                        buildTokenId({
                            contract: relay.smartToken.contract,
                            symbol: relay.smartToken.symbol
                        })
                    )
                );
                const sortedReserves = sortByNetworkTokens(
                    relay.reserves,
                    reserve => reserve.symbol
                );
                return Object.assign(Object.assign({}, relay), {
                    id: buildTokenId({
                        contract: relay.smartToken.contract,
                        symbol: relay.smartToken.symbol
                    }),
                    symbol: sortedReserves[1].symbol,
                    smartTokenSymbol: relay.smartToken.symbol,
                    apr: relayFeed && relayFeed.smartPriceApr,
                    liqDepth: relayFeed && relayFeed.liqDepth,
                    addLiquiditySupported: true,
                    removeLiquiditySupported: true,
                    focusAvailable: false,
                    reserves: sortedReserves.map(reserve =>
                        Object.assign(
                            Object.assign(Object.assign({}, reserve), {
                                reserveId: relay.smartToken.symbol + reserve.symbol,
                                logo: [this.token(reserve.id).logo]
                            }),
                            reserve.amount && { balance: reserve.amount }
                        )
                    )
                });
            });
    }
    get convertableRelays() {
        return this.relaysWithFeeds
            .map(relay => {
                const relayId = buildTokenId({
                    contract: relay.smartToken.contract,
                    symbol: relay.smartToken.symbol
                });
                const feed = this.relayFeed.find(feed =>
                    compareString(feed.smartTokenId, relayId)
                );
                return Object.assign(Object.assign({}, relay), {
                    liqDepth: feed.liqDepth
                });
            })
            .sort((a, b) => b.liqDepth - a.liqDepth)
            .filter(
                (value, index, arr) =>
                    arr.findIndex(x =>
                        x.reserves.every(reserve =>
                            value.reserves.some(
                                y =>
                                    reserve.symbol == y.symbol && reserve.contract == y.contract
                            )
                        )
                    ) == index
            );
    }
    buildManuallyIfNotIncludedInExistingFeeds({ relays, existingFeeds }) {
        return __awaiter(this, void 0, void 0, function* () {
            this.updateMultiRelays(relays);
            const relaysNotFulfilled = _.differenceWith(
                relays,
                existingFeeds,
                (a, b) =>
                    compareString(
                        buildTokenId({
                            contract: a.smartToken.contract,
                            symbol: a.smartToken.symbol
                        }),
                        b.smartTokenId
                    )
            );
            yield this.buildPossibleRelayFeedsFromHydrated(
                relaysNotFulfilled.filter(relayHasReserveBalances)
            );
        });
    }
    addDryPools({ dryRelays, chunkSize, waitTime }) {
        return __awaiter(this, void 0, void 0, function* () {
            const chunked = _.chunk(dryRelays, chunkSize);
            const [firstChunk, ...remainingChunks] = chunked;
            const [bancorApiFeeds, firstBatch] = yield Promise.all([
                this.buildPossibleRelayFeedsFromBancorApi({ relays: dryRelays }),
                this.hydrateOldRelays(firstChunk)
            ]);
            this.buildManuallyIfNotIncludedInExistingFeeds({
                relays: firstBatch,
                existingFeeds: bancorApiFeeds
            });
            for (const chunk in remainingChunks) {
                yield new Promise(res => setTimeout(res, waitTime));
                let relays = yield this.hydrateOldRelays(remainingChunks[chunk]);
                this.buildManuallyIfNotIncludedInExistingFeeds({
                    relays,
                    existingFeeds: bancorApiFeeds
                });
            }
        });
    }
    addPools({ multiRelays, dryDelays, tokenMeta }) {
        return __awaiter(this, void 0, void 0, function* () {
            const passedMultiRelays = multiRelays
                .filter(reservesIncludeTokenMeta(tokenMeta))
                .filter(noBlackListedReserves(blackListedTokens));
            this.updateMultiRelays(passedMultiRelays);
            yield this.buildPossibleRelayFeedsFromHydrated(
                passedMultiRelays.filter(relayHasReserveBalances)
            );
            const passedDryPools = dryDelays
                .filter(noBlackListedReservesDry(blackListedTokens))
                .filter(reservesIncludeTokenMetaDry(tokenMeta));
            yield this.addDryPools({
                dryRelays: passedDryPools,
                chunkSize: 4,
                waitTime: 250
            });
        });
    }
    setInitialised(status) {
        this.initialised = status;
    }
    refresh() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("refresh called, doing some stuff");
            const v1Relays = getHardCodedRelays();
            this.fetchTokenBalancesIfPossible(
                _.uniqWith(
                    v1Relays.flatMap(x =>
                        x.reserves.map(x =>
                            Object.assign(Object.assign({}, x), {
                                symbol: x.symbol.code().to_string()
                            })
                        )
                    ),
                    compareToken
                )
            );
            return;
        });
    }
    fetchBalancesFromReserves(relays) {
        return __awaiter(this, void 0, void 0, function* () {
            const tokens = relays
                .flatMap(relay => relay.reserves)
                .map(reserve => ({
                    contract: reserve.contract,
                    symbol: reserve.symbol.code().to_string()
                }));
            const uniqueTokens = _.uniqWith(
                tokens,
                (a, b) =>
                    compareString(a.symbol, b.symbol) &&
                    compareString(a.contract, b.contract)
            );
            return vxm.tlosNetwork.getBalances({
                tokens: uniqueTokens,
                slow: false
            });
        });
    }
    bareMinimumForTrade({ fromId, toId, v1Relays, v2Relays, tokenMeta }) {
        return __awaiter(this, void 0, void 0, function* () {
            const allDry = [...v1Relays, ...v2Relays.map(multiToDry)];
            const foundPath = yield findNewPath(fromId, toId, allDry, dry => {
                const [from, to] = dry.reserves.map(r =>
                    buildTokenId({
                        contract: r.contract,
                        symbol: r.symbol.code().to_string()
                    })
                );
                return [from, to];
            });
            const relaysInvolved = foundPath.hops.flat(1);
            const requiredV1s = relaysInvolved.filter(
                relay => !relay.isMultiContract
            );
            const accomodatingV1Relays = requiredV1s;
            yield this.addPools({
                multiRelays: v2Relays,
                dryDelays: accomodatingV1Relays,
                tokenMeta
            });
            const remainingV1Relays = v1Relays.filter(
                relay =>
                    !accomodatingV1Relays.some(r =>
                        compareTokenSymbol(relay.smartToken, r.smartToken)
                    )
            );
            this.addPools({
                multiRelays: [],
                tokenMeta,
                dryDelays: remainingV1Relays
            });
        });
    }
    loadMoreTokens(tokenIds) {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    get convertibleTokens() {
        return this.tokens.map(token =>
            Object.assign(Object.assign({}, token), { img: token.logo })
        );
    }
    init(param) {
        return __awaiter(this, void 0, void 0, function* () {
            console.count("eosInit");
            console.time("eos");
            console.log("eosInit received", param);
            if (this.initialised) {
                console.log("eos refreshing instead");
                return this.refresh();
            }
            try {
                const [usdPriceOfTlos, v2Relays, tokenMeta] = yield Promise.all([
                    vxm.bancor.fetchusdPriceOfTlos(),
                    fetchMultiRelays(),
                    getTokenMeta()
                ]);
                this.setTokenMeta(tokenMeta);
                this.setTlosPrice(usdPriceOfTlos);
                this.setTlos24hPriceMove(0.0);
                const v1Relays = getHardCodedRelays();
                const allDry = [...v1Relays, ...v2Relays.map(multiToDry)].filter(
                    noBlackListedReservesDry(blackListedTokens)
                );
                this.fetchTokenBalancesIfPossible(
                    _.uniqWith(
                        allDry.flatMap(x =>
                            x.reserves.map(x =>
                                Object.assign(Object.assign({}, x), {
                                    symbol: x.symbol.code().to_string()
                                })
                            )
                        ),
                        compareToken
                    )
                );
                const quickTrade =
                    param &&
                    param.tradeQuery &&
                    param.tradeQuery.base &&
                    param.tradeQuery.quote;
                if (quickTrade) {
                    const { base: fromId, quote: toId } = param.tradeQuery;
                    yield this.bareMinimumForTrade({
                        fromId,
                        toId,
                        v1Relays,
                        v2Relays,
                        tokenMeta
                    });
                } else {
                    yield this.addPools({
                        multiRelays: v2Relays,
                        dryDelays: v1Relays,
                        tokenMeta
                    });
                }
                this.setInitialised(true);
                this.setLoadingPools(false);
                console.timeEnd("eos");
            } catch (e) {
                throw new Error(`Threw inside eosBancor: ${e.message}`);
            }
        });
    }
    updateRelayFeed(feeds) {
        this.relayFeed = _.uniqWith(
            [...feeds, ...this.relayFeed],
            (a, b) =>
                compareString(a.smartTokenId, b.smartTokenId) &&
                compareString(a.tokenId, b.tokenId)
        );
    }
    buildPossibleRelayFeedsFromHydrated(relays) {
        return __awaiter(this, void 0, void 0, function* () {
            const feeds = relays.flatMap(relay =>
                buildTwoFeedsFromRelay(relay, [
                    { symbol: "TLOSD", unitPrice: 1 },
                    { symbol: "TLOS", unitPrice: this.usdPriceOfTlos }
                ])
            );
            this.updateRelayFeed(feeds);
        });
    }
    buildPossibleRelayFeedsFromBancorApi({ relays }) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const [tokenPrices] = yield Promise.all([fetchTradeData()]);
                const tlosToken = findOrThrow(tokenPrices, token =>
                    compareString(token.code, "TLOS")
                );
                const relayFeeds = relays.flatMap(relay => {
                    const [
                        secondaryReserve,
                        primaryReserve
                    ] = sortByNetworkTokens(relay.reserves, reserve =>
                        reserve.symbol.code().to_string()
                    );
                    const token = findOrThrow(
                        tokenPrices,
                        price =>
                            compareString(
                                price.code,
                                primaryReserve.symbol.code().to_string()
                            ),
                        "failed to find token in possible relayfeeds from bancor API"
                    );
                    const includeTLOS = compareString(
                        secondaryReserve.symbol.code().to_string(),
                        "TLOS"
                    );
                    const liqDepth = token.liquidityDepth;
                    const secondary = {
                        tokenId: buildTokenId({
                            contract: secondaryReserve.contract,
                            symbol: secondaryReserve.symbol.code().to_string()
                        }),
                        smartTokenId: buildTokenId({
                            contract: relay.smartToken.contract,
                            symbol: relay.smartToken.symbol.code().to_string()
                        })
                    };
                    return [
                        {
                            change24H: token.change24h,
                            costByNetworkUsd: token.price,
                            liqDepth,
                            tokenId: buildTokenId({
                                contract: primaryReserve.contract,
                                symbol: primaryReserve.symbol.code().to_string()
                            }),
                            smartTokenId: buildTokenId({
                                contract: relay.smartToken.contract,
                                symbol: relay.smartToken.symbol.code().to_string()
                            }),
                            volume24H: token.volume24h.USD,
                            smartPriceApr: token.smartPriceApr
                        },
                        includeTLOS
                            ? Object.assign(Object.assign({}, secondary), {
                                liqDepth,
                                costByNetworkUsd: tlosToken.price,
                                change24H: tlosToken.change24h,
                                volume24H: tlosToken.volume24h.USD,
                                smartPriceApr: tlosToken.smartPriceApr
                            })
                            : Object.assign(Object.assign({}, secondary), { liqDepth })
                    ];
                });
                this.updateRelayFeed(relayFeeds);
                return relayFeeds;
            } catch (e) {
                console.error(e);
                return [];
            }
        });
    }
    hydrateOldRelays(relays) {
        return __awaiter(this, void 0, void 0, function* () {
            return Promise.all(
                relays.map(relay =>
                    __awaiter(this, void 0, void 0, function* () {
                        const [settings, reserveBalances] = yield Promise.all([
                            rpc.get_table_rows({
                                code: relay.contract,
                                scope: relay.contract,
                                table: "settings"
                            }),
                            fetchBalanceAssets(
                                relay.reserves.map(reserve => ({
                                    contract: reserve.contract,
                                    symbol: reserve.symbol.code().to_string()
                                })),
                                relay.contract
                            )
                        ]);
                        const allBalancesFetched = reserveBalances.every(Boolean);
                        if (!allBalancesFetched)
                            throw new Error(
                                `Failed to find both reserve balances on old pool ${relay.contract}`
                            );
                        const mergedBalances = relay.reserves.map(reserve =>
                            Object.assign(Object.assign({}, reserve), {
                                amount: reserveBalances.find(balance =>
                                    balance.symbol.isEqual(reserve.symbol)
                                )
                            })
                        );
                        const smartTokenSymbol = relay.smartToken.symbol.code().to_string();
                        const smartTokenId = buildTokenId({
                            contract: relay.smartToken.contract,
                            symbol: smartTokenSymbol
                        });
                        const feed = this.relayFeed.find(feed =>
                            compareString(feed.smartTokenId, smartTokenId)
                        );
                        const apr = feed && feed.smartPriceApr ? feed.smartPriceApr : 0.0;
                        return {
                            id: smartTokenId,
                            contract: relay.contract,
                            isMultiContract: false,
                            fee: settings.rows[0].fee / 1000000,
                            owner: relay.contract,
                            smartEnabled: settings.rows[0].smart_enabled,
                            smartToken: {
                                id: smartTokenId,
                                amount: 0,
                                contract: relay.smartToken.contract,
                                precision: 4,
                                network: "tlos",
                                symbol: smartTokenSymbol
                            },
                            reserves: mergedBalances.map(reserve =>
                                Object.assign(Object.assign({}, reserve), {
                                    id: buildTokenId({
                                        contract: reserve.contract,
                                        symbol: assetToSymbolName(reserve.amount)
                                    }),
                                    network: "tlos",
                                    precision: reserve.amount.symbol.precision(),
                                    contract: reserve.contract,
                                    symbol: assetToSymbolName(reserve.amount),
                                    amount: asset_to_number(reserve.amount)
                                })
                            ),
                            apr: apr
                        };
                    })
                )
            );
        });
    }
    refreshBalances(tokens = []) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.isAuthenticated) return;
            if (tokens.length > 0) {
                yield vxm.tlosNetwork.getBalances({ tokens });
                return;
            }
            yield vxm.tlosNetwork.getBalances();
        });
    }
    addLiquidity({ id: relayId, reserves, onUpdate }) {
        return __awaiter(this, void 0, void 0, function* () {
            const relay = yield this.relayById(relayId);
            const tokenAmounts = yield this.viewAmountToTokenAmounts(reserves);
            const relaySymbol = new Symbol(
                relay.smartToken.symbol,
                relay.smartToken.precision
            );
            const relaySymbolCode = relaySymbol.code().to_string();
            if (tokenAmounts.length !== 2)
                throw new Error("Was expecting 2 reserve assets");
            const action1 = hydrateAction(
                tokenAmounts[0].amount,
                tokenAmounts[0].contract,
                number_to_asset(0, relaySymbol),
                relay.contract,
                this.isAuthenticated
            );
            const action2 = hydrateAction(
                tokenAmounts[1].amount,
                tokenAmounts[1].contract,
                number_to_asset(0, relaySymbol),
                relay.contract,
                this.isAuthenticated
            );
            let depositActions = [action1, action2];
            const txRes = yield this.triggerTx(depositActions);
            return txRes.transaction_id;
        });
    }
    fetchBankBalances({ smartTokenSymbol, accountHolder }) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield rpc.get_table_rows({
                code: process.env.VUE_APP_MULTICONTRACT,
                scope: accountHolder,
                table: "accounts"
            });
            return res.rows.filter(row => compareString(row.symbl, smartTokenSymbol));
        });
    }
    relayById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return findOrThrow(
                this.relaysList,
                relay => compareString(relay.id, id),
                `failed to find a pool by id of ${id}`
            );
        });
    }
    viewAmountToTokenAmounts(amounts) {
        return __awaiter(this, void 0, void 0, function* () {
            return Promise.all(
                amounts.map(amount =>
                    __awaiter(this, void 0, void 0, function* () {
                        const token = yield this.tokenById(amount.id);
                        return {
                            contract: token.contract,
                            amount: number_to_asset(
                                Number(amount.amount),
                                yield this.idToSymbol(token.id)
                            )
                        };
                    })
                )
            );
        });
    }
    doubleLiquidateActions({ relay, smartTokenAmount, reserveAssets }) {
        return __awaiter(this, void 0, void 0, function* () {
            if (reserveAssets.length !== 2)
                throw new Error("Was expecting only 2 reserve assets");
            const actions = reserveAssets.map(reserveAsset =>
                liquidateAction(
                    pureTimesAsset(smartTokenAmount, 0.5),
                    relay.smartToken.contract,
                    number_to_asset(0, reserveAsset.symbol),
                    relay.contract,
                    this.isAuthenticated
                )
            );
            return actions;
        });
    }
    removeLiquidity({ reserves, id: relayId, onUpdate }) {
        return __awaiter(this, void 0, void 0, function* () {
            const relay = yield this.relayById(relayId);
            const supply = yield fetchTokenStats(
                relay.smartToken.contract,
                relay.smartToken.symbol
            );
            const { smartTokenAmount } = yield this.calculateOpposingWithdraw({
                id: relayId,
                reserve: reserves[0]
            });
            const percentChunkOfRelay =
                asset_to_number(smartTokenAmount) / asset_to_number(supply.supply);
            const bigPlaya = percentChunkOfRelay > 0.3;
            if (bigPlaya)
                throw new Error(
                    "This trade makes more than 30% of the pools liquidity, it makes sense use another method for withdrawing liquidity manually due to potential slippage. Please engage us on the Telegram channel for more information."
                );
            const reserveAssets = yield this.viewAmountToTokenAmounts(reserves);
            if (reserveAssets.length !== 2)
                throw new Error("Anything other than 2 reserves not supported");
            const maxSlippage = 0.01;
            let suggestTxs = parseInt(String(percentChunkOfRelay / maxSlippage));
            if (suggestTxs == 0) suggestTxs = 1;
            const tooSmall =
                asset_to_number(pureTimesAsset(smartTokenAmount, 1 / suggestTxs)) == 0;
            if (tooSmall) suggestTxs = 1;
            const steps = Array(suggestTxs)
                .fill(null)
                .map((_, i) => ({
                    name: `Withdraw${i}`,
                    description: `Withdrawing Liquidity stage ${i + 1}`
                }));
            let lastTxId = "";
            for (let i = 0; i < suggestTxs; i++) {
                onUpdate(i, steps);
                let txRes = yield this.triggerTx(
                    yield this.doubleLiquidateActions({
                        relay,
                        reserveAssets: reserveAssets.map(asset => asset.amount),
                        smartTokenAmount: pureTimesAsset(smartTokenAmount, 1 / suggestTxs)
                    })
                );
                lastTxId = txRes.transaction_id;
            }
            return lastTxId;
        });
    }
    waitAndUpdate(time = 4000) {
        return __awaiter(this, void 0, void 0, function* () {
            yield new Promise(res => setTimeout(res, time));
            return this.init();
        });
    }
    expectNewRelay(smartToken) {
        return __awaiter(this, void 0, void 0, function* () {
            const attempts = 10;
            const waitPeriod = 1000;
            for (let i = 0; i < attempts; i++) {
                const relays = yield fetchMultiRelays();
                const includesRelay = relays.find(relay =>
                    compareString(relay.smartToken.symbol, smartToken)
                );
                if (includesRelay) {
                    this.setMultiRelays(relays);
                    this.refreshBalances(
                        includesRelay.reserves.map(reserve => ({
                            contract: reserve.contract,
                            symbol: reserve.symbol
                        }))
                    );
                    return;
                }
                yield new Promise(res => setTimeout(res, waitPeriod));
            }
        });
    }
    updateMultiRelays(relays) {
        const meshedRelays = _.uniqWith(
            [...relays, ...this.relaysList],
            compareEosMultiRelay
        );
        this.relaysList = meshedRelays;
    }
    fetchRelayReservesAsAssets(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const relay = yield this.relayById(id);
            if (relay.isMultiContract) {
                const hydratedRelay = yield fetchMultiRelay(relay.smartToken.symbol);
                return hydratedRelay.reserves.map(agnosticToTokenAmount);
            } else {
                const dryRelay = multiToDry(relay);
                const [hydrated] = yield this.hydrateOldRelays([dryRelay]);
                return hydrated.reserves.map(agnosticToTokenAmount);
            }
        });
    }
    accountChange() {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    getUserBalances(relayId) {
        return __awaiter(this, void 0, void 0, function* () {
            const relay = yield this.relayById(relayId);
            const [[smartTokenBalance], reserves, supply] = yield Promise.all([
                vxm.tlosNetwork.getBalances({
                    tokens: [
                        {
                            contract: relay.smartToken.contract,
                            symbol: relay.smartToken.symbol
                        }
                    ]
                }),
                this.fetchRelayReservesAsAssets(relayId),
                fetchTokenStats(relay.smartToken.contract, relay.smartToken.symbol)
            ]);
            const smartSupply = asset_to_number(supply.supply);
            const percent = smartTokenBalance.balance / smartSupply;
            const maxWithdrawals = reserves.map(reserve => ({
                id: buildTokenId({
                    contract: reserve.contract,
                    symbol: reserve.amount.symbol.code().to_string()
                }),
                amount: String(asset_to_number(reserve.amount) * percent)
            }));
            return {
                maxWithdrawals,
                smartTokenBalance: String(smartTokenBalance.balance)
            };
        });
    }
    tokenSupplyAsAsset({ contract, symbol }) {
        return __awaiter(this, void 0, void 0, function* () {
            const stats = yield fetchTokenStats(contract, symbol);
            return stats.supply;
        });
    }
    calculateOpposingDeposit(suggestedDeposit) {
        return __awaiter(this, void 0, void 0, function* () {
            const relay = yield this.relayById(suggestedDeposit.id);
            const [reserves, supply] = yield Promise.all([
                this.fetchRelayReservesAsAssets(relay.id),
                this.tokenSupplyAsAsset({
                    contract: relay.smartToken.contract,
                    symbol: relay.smartToken.symbol
                })
            ]);
            const sameAsset = yield this.viewAmountToAsset(suggestedDeposit.reserve);
            const tokenAmount = suggestedDeposit.reserve.amount;
            const [sameReserve, opposingReserve] = sortByNetworkTokens(
                reserves.map(reserve => reserve.amount),
                assetToSymbolName,
                [assetToSymbolName(sameAsset)]
            );
            const reserveBalance = asset_to_number(sameReserve);
            const percent = Number(tokenAmount) / reserveBalance;
            const opposingNumberAmount = percent * asset_to_number(opposingReserve);
            const opposingAsset = number_to_asset(
                opposingNumberAmount,
                opposingReserve.symbol
            );
            const sameReserveFundReturn = calculateFundReturn(
                sameAsset,
                sameReserve,
                supply
            );
            const opposingReserveFundReturn = calculateFundReturn(
                opposingAsset,
                opposingReserve,
                supply
            );
            const lowerAsset = lowestAsset(
                sameReserveFundReturn,
                opposingReserveFundReturn
            );
            return {
                opposingAmount: String(asset_to_number(opposingAsset)),
                smartTokenAmount: lowerAsset
            };
        });
    }
    idToSymbol(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const token = yield this.tokenById(id);
            return new Sym(token.symbol, token.precision);
        });
    }
    viewAmountToAsset(amount) {
        return __awaiter(this, void 0, void 0, function* () {
            return number_to_asset(
                Number(amount.amount),
                yield this.idToSymbol(amount.id)
            );
        });
    }
    calculateOpposingWithdraw(suggestWithdraw) {
        return __awaiter(this, void 0, void 0, function* () {
            const relay = yield this.relayById(suggestWithdraw.id);
            const sameAmountAsset = yield this.viewAmountToAsset(
                suggestWithdraw.reserve
            );
            const tokenAmount = suggestWithdraw.reserve.amount;
            const [reserves, supply, smartUserBalanceString] = yield Promise.all([
                this.fetchRelayReservesAsAssets(suggestWithdraw.id),
                fetchTokenStats(relay.smartToken.contract, relay.smartToken.symbol),
                getBalance(relay.smartToken.contract, relay.smartToken.symbol)
            ]);
            const smartUserBalance = new Asset(smartUserBalanceString);
            const smartSupply = asset_to_number(supply.supply);
            const [sameReserve, opposingReserve] = sortByNetworkTokens(
                reserves.map(reserve => reserve.amount),
                assetToSymbolName,
                [assetToSymbolName(sameAmountAsset)]
            );
            const reserveBalance = asset_to_number(sameReserve);
            const percent = Number(tokenAmount) / reserveBalance;
            const smartTokenAmount = (percent * smartSupply) / 2.0;
            const opposingAmountNumber = percent * asset_to_number(opposingReserve);
            const opposingAsset = number_to_asset(
                opposingAmountNumber,
                opposingReserve.symbol
            );
            return {
                opposingAmount: String(asset_to_number(opposingAsset)),
                smartTokenAmount:
                    smartTokenAmount / asset_to_number(smartUserBalance) > 0.99
                        ? smartUserBalance
                        : number_to_asset(smartTokenAmount, smartUserBalance.symbol)
            };
        });
    }
    focusSymbol(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const reserveToken = this.tokens.find(token =>
                compareString(token.id, id)
            );
            if (reserveToken) {
                const tokens = [
                    {
                        contract: reserveToken.contract,
                        symbol: reserveToken.symbol,
                        precision: reserveToken.precision
                    }
                ];
                yield this.fetchTokenBalancesIfPossible(tokens);
            } else {
                const token = findOrThrow(this.tokenMeta, meta =>
                    compareString(meta.id, id)
                );
                const tokens = [{ contract: token.account, symbol: token.symbol }];
                yield this.fetchTokenBalancesIfPossible(tokens);
            }
        });
    }
    hasExistingBalance({ contract, symbol }) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const res = yield rpc.get_table_rows({
                    code: contract,
                    scope: this.isAuthenticated,
                    table: "accounts"
                });
                return (
                    res.rows.length > 0 &&
                    res.rows
                        .map(({ balance }) => balance)
                        .some(balance => balance.includes(symbol))
                );
            } catch (e) {
                console.log("Balance error", e);
                return false;
            }
        });
    }
    tokenById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return findOrThrow(
                this.relaysList.flatMap(relay => relay.reserves),
                token => compareString(token.id, id),
                `failed to find token by its ID of ${id}`
            );
        });
    }
    convert(proposal) {
        return __awaiter(this, void 0, void 0, function* () {
            const { from, to } = proposal.tx;
            if (compareString(from.id, to.id))
                throw new Error("Cannot convert a token to itself.");
            const fromAmount = from.amount;
            const toAmount = Number(to.amount);
            const [fromToken, toToken] = yield Promise.all([
                this.tokenById(from.id),
                this.tokenById(to.id)
            ]);
            const fromSymbolInit = new Symbol(fromToken.symbol, fromToken.precision);
            const toSymbolInit = new Symbol(toToken.symbol, toToken.precision);
            const assetAmount = number_to_asset(Number(fromAmount), fromSymbolInit);
            const allRelays = this.convertableRelays;
            const path = yield this.findPath({
                fromId: fromToken.id,
                toId: toToken.id,
                relays: allRelays.map(multiToDry)
            });
            const convertPath = relaysToConvertPaths(fromSymbolInit, path);
            const isAuthenticated = this.isAuthenticated;
            const memo = composeMemo(
                convertPath,
                String((toAmount * 0.96).toFixed(toSymbolInit.precision())),
                isAuthenticated
            );
            const fromTokenContract = fromToken.contract;
            let convertActions = yield multiContract.convert(
                fromTokenContract,
                assetAmount,
                memo
            );
            const toContract = toToken.contract;
            const toSymbol = toToken.symbol;
            const existingBalance = yield this.hasExistingBalance({
                contract: toContract,
                symbol: toSymbol
            });
            if (!existingBalance) {
                const openActions = yield this.generateOpenActions({
                    contract: toToken.contract,
                    symbol: toSymbolInit
                });
                convertActions = [...openActions, ...convertActions];
            }
            // const txRes = yield this.triggerTxAndWatchBalances({
            //     actions: convertActions,
            //     tokenIds: [from.id, to.id]
            // });
            // this.refresh();
            const txRes = yield this.triggerTx({
                actions: convertActions,
                detail: proposal.detail
            });
            return txRes;
        });
    }
    generateOpenActions({ contract, symbol }) {
        return __awaiter(this, void 0, void 0, function* () {
            const openSupported = yield tokenContractSupportsOpen(contract);
            if (!openSupported)
                throw new Error(
                    `You do not have an existing balance of ${symbol} and it's token contract ${contract} does not support 'open' functionality.`
                );
            const openActions = yield multiContract.openActions(
                contract,
                symbol.toString(true),
                this.isAuthenticated
            );
            return openActions;
        });
    }
    triggerTxAndWatchBalances({ actions, tokenIds }) {
        return __awaiter(this, void 0, void 0, function* () {
            const fullTokens = yield Promise.all(
                tokenIds.map(tokenId => this.tokenById(tokenId))
            );
            const tokens = fullTokens;
            const [txRes, originalBalances] = yield Promise.all([
                this.triggerTx(actions),
                vxm.tlosNetwork.getBalances({
                    tokens
                })
            ]);
            vxm.tlosNetwork.pingTillChange({ originalBalances });
            return txRes;
        });
    }
    hydrateV1Relays(v1Relays) {
        return __awaiter(this, void 0, void 0, function* () {
            if (v1Relays.length == 0) return [];
            const hydrated = yield this.hydrateOldRelays(v1Relays);
            return hydrated.map(eosMultiToHydrated);
        });
    }
    hydrateRelays(relays) {
        return __awaiter(this, void 0, void 0, function* () {
            const v1Relays = relays.filter(relay => !relay.isMultiContract);
            const v2Relays = relays.filter(relay => relay.isMultiContract);
            const [v1, v2] = yield Promise.all([
                this.hydrateV1Relays(v1Relays),
                this.hydrateV2Relays(v2Relays)
            ]);
            const flat = [...v2, ...v1];
            return relays.map(relay =>
                flat.find(
                    r =>
                        r.smartToken.symbol.isEqual(relay.smartToken.symbol) &&
                        compareString(r.smartToken.contract, relay.smartToken.contract)
                )
            );
        });
    }
    hydrateV2Relays(relays) {
        return __awaiter(this, void 0, void 0, function* () {
            if (relays.length == 0) return [];
            const freshRelays = yield fetchMultiRelays();
            const hydratedRelays = freshRelays.map(eosMultiToHydrated);
            const result = hydratedRelays.filter(relay =>
                relays.some(
                    r =>
                        compareString(relay.smartToken.contract, r.smartToken.contract) &&
                        relay.smartToken.symbol.isEqual(r.smartToken.symbol)
                )
            );
            if (relays.length !== result.length)
                throw new Error(
                    "Failed to hydrate all relays requested in hydrateV2Relays"
                );
            return result;
        });
    }
    findPath({ fromId, toId, relays }) {
        return __awaiter(this, void 0, void 0, function* () {
            const path = yield findNewPath(
                fromId,
                toId,
                relays,
                dryToTraditionalEdge
            );
            return path.hops.flatMap(hop => hop[0]);
        });
    }
    async getReturn({ from, toId }) {
        return __awaiter(this, void 0, void 0, function* () {
            if (compareString(from.id, toId))
                throw new Error("Cannot convert a token to itself.");
            const assetAmount = yield this.viewAmountToAsset(from);
            const allRelays = this.convertableRelays.map(multiToDry);
            const path = yield this.findPath({
                fromId: from.id,
                toId: toId,
                relays: allRelays
            });
            const hydratedRelays = yield this.hydrateRelays(path);
            const calculatedReturn = findReturn(assetAmount, hydratedRelays);
            return {
                amount: String(asset_to_number(calculatedReturn.amount)),
                slippage: calculatedReturn.highestSlippage
            };
        });
    }
    async getCost({ fromId, to }) {
        return __awaiter(this, void 0, void 0, function* () {
            if (compareString(fromId, to.id))
                throw new Error("Cannot convert a token to itself.");
            const assetAmount = yield this.viewAmountToAsset(to);
            const allRelays = this.convertableRelays.map(multiToDry);
            const path = yield this.findPath({
                fromId,
                toId: to.id,
                relays: allRelays
            });
            const hydratedRelays = yield this.hydrateRelays(path);
            const calculatedCost = findCost(assetAmount, hydratedRelays);
            return {
                amount: String(asset_to_number(calculatedCost.amount)),
                slippage: calculatedCost.highestSlippage
            };
        });
    }
    triggerTx(actions) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.$store.dispatch("tlosWallet/tx", actions, { root: true });
        });
    }
    setMultiRelays(relays) {
        this.relaysList = relays;
    }
    setTlosPrice(price) {
        this.usdPriceOfTlos = price;
    }
    setTlos24hPriceMove(priceMove) {
        this.usdTlos24hPriceMove = priceMove;
    }
    setTokenMeta(tokens) {
        this.tokenMeta = tokens.filter(token => compareString(token.chain, "eos"));
    }
}
__decorate([mutation], TlosBancorModule.prototype, "setLoadingPools", null);
__decorate([action], TlosBancorModule.prototype, "loadMorePools", null);
__decorate(
    [action],
    TlosBancorModule.prototype,
    "fetchTokenBalancesIfPossible",
    null
);
__decorate([action], TlosBancorModule.prototype, "updateFee", null);
__decorate([action], TlosBancorModule.prototype, "removeRelay", null);
__decorate([action], TlosBancorModule.prototype, "updateOwner", null);
__decorate([action], TlosBancorModule.prototype, "createPool", null);
__decorate(
    [action],
    TlosBancorModule.prototype,
    "buildManuallyIfNotIncludedInExistingFeeds",
    null
);
__decorate([action], TlosBancorModule.prototype, "addDryPools", null);
__decorate([action], TlosBancorModule.prototype, "addPools", null);
__decorate([mutation], TlosBancorModule.prototype, "setInitialised", null);
__decorate([action], TlosBancorModule.prototype, "refresh", null);
__decorate(
    [action],
    TlosBancorModule.prototype,
    "fetchBalancesFromReserves",
    null
);
__decorate([action], TlosBancorModule.prototype, "bareMinimumForTrade", null);
__decorate([action], TlosBancorModule.prototype, "loadMoreTokens", null);
__decorate([action], TlosBancorModule.prototype, "init", null);
__decorate([mutation], TlosBancorModule.prototype, "updateRelayFeed", null);
__decorate(
    [action],
    TlosBancorModule.prototype,
    "buildPossibleRelayFeedsFromHydrated",
    null
);
__decorate(
    [action],
    TlosBancorModule.prototype,
    "buildPossibleRelayFeedsFromBancorApi",
    null
);
__decorate([action], TlosBancorModule.prototype, "hydrateOldRelays", null);
__decorate([action], TlosBancorModule.prototype, "refreshBalances", null);
__decorate([action], TlosBancorModule.prototype, "addLiquidity", null);
__decorate([action], TlosBancorModule.prototype, "fetchBankBalances", null);
__decorate([action], TlosBancorModule.prototype, "relayById", null);
__decorate(
    [action],
    TlosBancorModule.prototype,
    "viewAmountToTokenAmounts",
    null
);
__decorate(
    [action],
    TlosBancorModule.prototype,
    "doubleLiquidateActions",
    null
);
__decorate([action], TlosBancorModule.prototype, "removeLiquidity", null);
__decorate([action], TlosBancorModule.prototype, "waitAndUpdate", null);
__decorate([action], TlosBancorModule.prototype, "expectNewRelay", null);
__decorate([mutation], TlosBancorModule.prototype, "updateMultiRelays", null);
__decorate(
    [action],
    TlosBancorModule.prototype,
    "fetchRelayReservesAsAssets",
    null
);
__decorate([action], TlosBancorModule.prototype, "accountChange", null);
__decorate([action], TlosBancorModule.prototype, "getUserBalances", null);
__decorate([action], TlosBancorModule.prototype, "tokenSupplyAsAsset", null);
__decorate(
    [action],
    TlosBancorModule.prototype,
    "calculateOpposingDeposit",
    null
);
__decorate([action], TlosBancorModule.prototype, "idToSymbol", null);
__decorate([action], TlosBancorModule.prototype, "viewAmountToAsset", null);
__decorate(
    [action],
    TlosBancorModule.prototype,
    "calculateOpposingWithdraw",
    null
);
__decorate([action], TlosBancorModule.prototype, "focusSymbol", null);
__decorate([action], TlosBancorModule.prototype, "hasExistingBalance", null);
__decorate([action], TlosBancorModule.prototype, "tokenById", null);
__decorate([action], TlosBancorModule.prototype, "convert", null);
__decorate([action], TlosBancorModule.prototype, "generateOpenActions", null);
__decorate(
    [action],
    TlosBancorModule.prototype,
    "triggerTxAndWatchBalances",
    null
);
__decorate([action], TlosBancorModule.prototype, "hydrateV1Relays", null);
__decorate([action], TlosBancorModule.prototype, "hydrateRelays", null);
__decorate([action], TlosBancorModule.prototype, "hydrateV2Relays", null);
__decorate([action], TlosBancorModule.prototype, "findPath", null);
__decorate([action], TlosBancorModule.prototype, "getReturn", null);
__decorate([action], TlosBancorModule.prototype, "getCost", null);
__decorate([action], TlosBancorModule.prototype, "triggerTx", null);
__decorate([mutation], TlosBancorModule.prototype, "setMultiRelays", null);
__decorate([mutation], TlosBancorModule.prototype, "setTlosPrice", null);
__decorate([mutation], TlosBancorModule.prototype, "setTlos24hPriceMove", null);
__decorate([mutation], TlosBancorModule.prototype, "setTokenMeta", null);
