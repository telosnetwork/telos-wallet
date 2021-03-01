import { __awaiter } from "tslib";
import { asset, check, symbol_code, number_to_asset, SymbolCode, asset_to_number, Asset, Sym, Name } from "eos-common";
export function get_bancor_output(base_reserve, quote_reserve, quantity) {
    const out = (quantity * quote_reserve) / (base_reserve + quantity);
    if (out < 0)
        return 0;
    return out;
}
export function get_bancor_input(quote_reserve, base_reserve, out) {
    const inp = (base_reserve * out) / (quote_reserve - out);
    if (inp < 0)
        return 0;
    return inp;
}
export function check_quantity(quantity) {
    check(new Asset(quantity).amount.greater(0), "[quantity] amount must be positive");
    check(new Asset(quantity).is_valid(), "[quantity] invalid symcode");
}
export function check_remaining_reserve(out, tokens) {
    const token = tokens[new Asset(out).symbol.code().to_string()];
    check(!!token, "[symcode] token does not exist");
    const remaining = Asset.minus(token.reserve, new Asset(out));
    check(remaining.amount.greaterOrEquals(0), remaining.symbol.code().to_string() + " insufficient remaining reserve");
}
export function get_fee(quantity, settings) {
    const { amount, symbol } = asset(quantity);
    const fee = (settings.fee * Number(amount)) / 10000;
    return new Asset(fee, symbol);
}
export function get_inverse_fee(out, settings) {
    const { amount, symbol } = asset(out);
    const fee = Number(amount) / ((10000 - settings.fee) / 10000) - Number(amount);
    return new Asset(fee, symbol);
}
export function get_price(quantity, symcode, tokens, settings) {
    const _quantity = new Asset(quantity);
    const in_amount = asset_to_number(_quantity);
    const base = _quantity.symbol.code();
    const quote = new SymbolCode(symcode);
    check_quantity(quantity);
    const [base_upper, quote_upper] = get_uppers(base, quote, tokens, settings);
    return get_bancor_output(base_upper, quote_upper, in_amount);
}
export function get_inverse_price(out, symcode, tokens, settings) {
    const _out = new Asset(out);
    const base = _out.symbol.code();
    const quote = symbol_code(symcode);
    const quote_sym = tokens[quote.to_string()].balance.symbol;
    check_quantity(_out);
    const [base_upper, quote_upper] = get_uppers(base, quote, tokens, settings);
    const in_amount = get_bancor_input(base_upper, quote_upper, asset_to_number(_out));
    return number_to_asset(in_amount, quote_sym);
}
export function get_rate(quantity, symcode, tokens, settings) {
    const _quantity = new Asset(quantity);
    const quote = new SymbolCode(symcode);
    const quote_sym = tokens[quote.to_string()].balance.symbol;
    const fee = get_fee(_quantity, settings);
    const price = get_price(Asset.minus(_quantity, fee), quote, tokens, settings);
    const rate = number_to_asset(price, quote_sym);
    return rate;
}
export function get_inverse_rate(out, symcode, tokens, settings) {
    const price = get_inverse_price(out, symcode, tokens, settings);
    const fee = get_inverse_fee(price, settings);
    const rate = Asset.plus(price, fee);
    return rate;
}
export function get_settings(rpc, code) {
    return __awaiter(this, void 0, void 0, function* () {
        const scope = code;
        const table = "settings";
        const results = yield rpc.get_table_rows({
            json: true,
            code,
            scope,
            table,
            limit: 1
        });
        if (!results.rows.length)
            throw new Error("contract is unavailable or currently disabled for maintenance");
        return {
            fee: results.rows[0].fee,
            amplifier: results.rows[0].amplifier,
            proxy_contract: new Name(results.rows[0].proxy_contract),
            proxy_token: new Sym(results.rows[0].proxy_token),
            maker_token: new Sym(results.rows[0].maker_token)
        };
    });
}
export function get_xchain_settings(rpc, code) {
    return __awaiter(this, void 0, void 0, function* () {
        const scope = code;
        const table = "settings";
        const results = yield rpc.get_table_rows({
            json: true,
            code,
            scope,
            table,
            limit: 1
        });
        if (!results.rows.length)
            throw new Error("contract is unavailable or currently disabled for maintenance");
        return {
            chain: results.rows[0].current_chain_name,
            enabled: results.rows[0].enabled,
            fee: results.rows[0].fees_percentage
        };
    });
}
export function get_slippage(quantity, symcode, tokens, settings) {
    const _quantity = new Asset(quantity);
    const price = get_price(_quantity, symcode, tokens, settings);
    const spot_price = 1.0 / get_spot_price(_quantity.symbol.code(), symcode, tokens, settings);
    const spot_price_per_unit = spot_price * asset_to_number(_quantity);
    return spot_price_per_unit / price - 1;
}
export function get_pool_balance(tokens, settings) {
    const proxy_token = settings.proxy_token.code();
    let a = 0.0;
    return a;
}
export function get_maker_balance(tokens, settings) {
    return asset_to_number(tokens[settings.maker_token.code().to_string()].balance);
}
export function is_maker_token(quote, tokens) {
    return false;
}
export function get_maker_spot_price(base, tokens, settings) {
    const proxy_spot_price = get_spot_price(base, settings.proxy_token.code().to_string(), tokens, settings);
    const pool_balance = get_pool_balance(tokens, settings);
    const maker_balance = get_maker_balance(tokens, settings);
    const maker_spot_price = maker_balance > 0 ? (proxy_spot_price * pool_balance) / maker_balance : 1.0;
    return (proxy_spot_price * pool_balance) / maker_balance;
}
export function get_spot_price(base, quote, tokens, settings) {
    if (is_maker_token(new SymbolCode(quote), tokens))
        return get_maker_spot_price(new SymbolCode(base), tokens, settings);
    const [base_upper, quote_upper] = get_uppers(new SymbolCode(base), new SymbolCode(quote), tokens, settings);
    return base_upper / quote_upper;
}
export function get_tokens(rpc, code, limit = 50) {
    return __awaiter(this, void 0, void 0, function* () {
        const tokens = {};
        const results = {
            more: false,
            rows: [
                { sym: "4,EOS", contract: "tokens.swaps", balance: "0.0000 EOS", depth: "1.0000 EOS", reserve: "1.0000 EOS", maker_pool: "1.0000 EOS", token_type: "token", enabled: 1 },
                { sym: "10,BNT", contract: "tokens.swaps", balance: "0.0000000000 BNT", depth: "1.0000000000 BNT", reserve: "1.0000000000 BNT", maker_pool: "1.0000000000 BNT", token_type: "token", enabled: 1 },
                { sym: "4,USDT", contract: "tokens.swaps", balance: "0.0000 USDT", depth: "1.0000 USDT", reserve: "1.0000 USDT", maker_pool: "1.0000 USDT", token_type: "token", enabled: 1 },
                { sym: "4,VIGOR", contract: "tokens.swaps", balance: "0.0000 VIGOR", depth: "1.0000 VIGOR", reserve: "1.0000 VIGOR", maker_pool: "1.0000 VIGOR", token_type: "token", enabled: 1 },
                { sym: "9,EOSDT", contract: "tokens.swaps", balance: "0.000000000 EOSDT", depth: "1.000000000 EOSDT", reserve: "1.000000000 EOSDT", maker_pool: "1.000000000 EOSDT", token_type: "token", enabled: 1 },
            ]
        };
        for (const row of results.rows) {
            const [precision, symcode] = row.sym.split(",");
            tokens[symcode] = {
                sym: new Sym(symcode, +precision),
                contract: new Name(row.contract),
                balance: new Asset(row.balance),
                depth: new Asset(row.depth),
                reserve: new Asset(row.reserve)
            };
        }
        return tokens;
    });
}
export function get_romote_tokens(rpc, code, limit = 50) {
    return __awaiter(this, void 0, void 0, function* () {
        const tokens = {};
        const results = {
            more: false,
            rows: [
                { sym: "4,EOS", contract: "eosio.token", balance: "0.0000 EOS", depth: "1.0000 EOS", reserve: "1.0000 EOS", maker_pool: "1.0000 EOS", token_type: "token", enabled: 1 },
                { sym: "10,BNT", contract: "bntbntbntbnt", balance: "0.0000000000 BNT", depth: "1.0000000000 BNT", reserve: "1.0000000000 BNT", maker_pool: "1.0000000000 BNT", token_type: "token", enabled: 1 },
                { sym: "4,USDT", contract: "tethertether", balance: "0.0000 USDT", depth: "1.0000 USDT", reserve: "1.0000 USDT", maker_pool: "1.0000 USDT", token_type: "token", enabled: 1 },
                { sym: "4,VIGOR", contract: "vigortoken11", balance: "0.0000 VIGOR", depth: "1.0000 VIGOR", reserve: "1.0000 VIGOR", maker_pool: "1.0000 VIGOR", token_type: "token", enabled: 1 },
                { sym: "9,EOSDT", contract: "eosdtsttoken", balance: "0.000000000 EOSDT", depth: "1.000000000 EOSDT", reserve: "1.000000000 EOSDT", maker_pool: "1.000000000 EOSDT", token_type: "token", enabled: 1 },
            ]
        };
        for (const row of results.rows) {
            const [precision, symcode] = row.sym.split(",");
            tokens[symcode] = {
                sym: new Sym(symcode, +precision),
                contract: new Name(row.contract),
                balance: new Asset(row.balance),
                depth: new Asset(row.depth),
                reserve: new Asset(row.reserve)
            };
        }
        return tokens;
    });
}
export function get_xchain_tokens(rpc, code, limit = 50) {
    return __awaiter(this, void 0, void 0, function* () {
        const tokens = {};
        const scope = code;
        const table = "tokens";
        const results = yield rpc.get_table_rows({
            json: true,
            code,
            scope,
            table,
            limit
        });
        for (const row of results.rows) {
            const [precision, symcode] = row.token_info.sym.split(",");
            tokens[symcode] = {
                chain: "telos",
                contract: new Name(row.token_info.contract),
                sym: new Sym(symcode, precision),
                min_quantity: new Asset(row.min_quantity),
                balance: new Asset(row.min_quantity),
                depth: new Asset(row.min_quantity),
                reserve: new Asset(row.min_quantity)
            };
        }
        return tokens;
    });
}
export function get_xchain_remote_tokens(rpc, code, limit = 50) {
    return __awaiter(this, void 0, void 0, function* () {
        const tokens = {};
        const scope = code;
        const table = "tokens";
        const results = yield rpc.get_table_rows({
            json: true,
            code,
            scope,
            table,
            limit
        });
        for (const row of results.rows) {
            const [precision, symcode] = row.remote_token.sym.split(",");
            tokens[symcode] = {
                chain: row.remote_chain,
                contract: new Name(row.remote_token.contract),
                sym: new Sym(symcode, precision),
                min_quantity: new Asset(row.min_quantity),
                balance: new Asset(row.min_quantity),
                depth: new Asset(row.min_quantity),
                reserve: new Asset(row.min_quantity)
            };
        }
        return tokens;
    });
}
export function get_uppers(base, quote, tokens, settings) {
    const base_balance = asset_to_number(tokens[base.to_string()].balance);
    const quote_balance = asset_to_number(tokens[quote.to_string()].balance);
    const base_depth = asset_to_number(tokens[base.to_string()].depth);
    const quote_depth = asset_to_number(tokens[quote.to_string()].depth);
    const base_ratio = base_balance / base_depth;
    const quote_ratio = quote_balance / quote_depth;
    const base_upper = settings.amplifier * base_depth - base_depth + base_depth * base_ratio;
    const quote_upper = settings.amplifier * quote_depth - quote_depth + quote_depth * quote_ratio;
    return [base_upper, quote_upper];
}
function parse_volume(row) {
    const volume = {};
    const fees = {};
    for (const { key, value } of row.volume) {
        volume[key] = Number(value.split(" ")[0]);
    }
    for (const { key, value } of row.fees) {
        fees[key] = Number(value.split(" ")[0]);
    }
    return {
        timestamp: row.timestamp,
        volume,
        fees
    };
}
export function get_volume(rpc, code, limit = 1) {
    return __awaiter(this, void 0, void 0, function* () {
        const scope = code;
        const table = "volume";
        const volume = [];
        const results = yield rpc.get_table_rows({
            json: true,
            code,
            scope,
            table,
            reverse: true,
            limit
        });
        for (const row of results.rows) {
            volume.push(parse_volume(row));
        }
        return volume;
    });
}
export const VERSION = 2.0;