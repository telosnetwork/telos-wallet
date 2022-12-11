import { __awaiter } from "tslib";
import { vxm } from "~/store";
import { multiContractAction } from "~/contracts/multi";
class MultiContractTx {
    constructor(contractName, getAuth) {
        this.contractName = contractName;
        this.getAuth = getAuth;
        this.triggerTx = () => console.log("MultiContract needs to be updated");
    }
    tx(actions) {
        return __awaiter(this, void 0, void 0, function* () {
            const authedActions = actions.map((action) => (Object.assign(Object.assign({}, action), { authorization: this.getAuth() })));
            return authedActions;
        });
    }
    openActions(contract, symbol, owner, payer = owner) {
        return this.tx([
            {
                account: contract,
                name: "open",
                data: {
                    owner,
                    symbol,
                    ram_payer: payer
                }
            }
        ]);
    }
    deleteReserve(symbolCode, currency) {
        const action = multiContractAction.delreserve(symbolCode, currency);
        return this.tx([action]);
    }
    setReserveAction(symbolCode, symbol, tokenContract, ratio) {
        const adjustedRatio = ratio * 10000;
        const action = multiContractAction.setreserve(symbolCode, symbol, tokenContract, adjustedRatio);
        return action;
    }
    setReserve(symbolCode, symbol, tokenContract, saleEnabled, ratio) {
        const action = this.setReserveAction(symbolCode, symbol, tokenContract, ratio);
        return this.tx([action]);
    }
    convert(tokenContract, amount, memo) {
        const action = {
            account: tokenContract,
            name: "transfer",
            data: {
                from: this.getAuth()[0].actor,
                to: 'bancor.tbn',
                quantity: amount.to_string(),
                memo
            }
        };
        return this.tx([action]);
    }
    nukeRelayAction(symbolName, reserves) {
        const deleteReserveActions = reserves.map(reserveSymbolCode => multiContractAction.delreserve(symbolName, reserveSymbolCode));
        const deleteRelayAction = multiContractAction.delconverter(symbolName);
        return [...deleteReserveActions, deleteRelayAction];
    }
    updateFeeAction(symbolCode, decimalPercent) {
        return multiContractAction.updatefee(symbolCode, decimalPercent * 1000000);
    }
    updateOwnerAction(symbolCode, owner) {
        const action = multiContractAction.updateowner(symbolCode, owner);
        return action;
    }
    fund(quantity) {
        const action = multiContractAction.fund(this.getAuth()[0].actor, quantity);
        return this.tx([action]);
    }
    enableConversionAction(symbolCode, enabled) {
        const action = multiContractAction.enablecnvrt(symbolCode, enabled);
        return action;
    }
    enableConversion(symbolCode, enabled) {
        const action = this.enableConversionAction(symbolCode, enabled);
        return this.tx([action]);
    }
    createRelay(symbol, initialSupply) {
        const owner = this.getAuth()[0].actor;
        const action = multiContractAction.create(owner, symbol, initialSupply);
        return this.tx([action]);
    }
    setupTransfer(tokenContract, amountString, symbolCode) {
        return this.tx([
            {
                account: tokenContract,
                name: "transfer",
                data: {
                    from: this.getAuth()[0].actor,
                    to: this.contractName,
                    quantity: amountString,
                    memo: `setup;${symbolCode}`
                }
            }
        ]);
    }

    kickStartRelay(symbolCode, reserves, initialSupply, fee) {
        if (reserves.length !== 2)
            throw new Error("Reserves of two is only supported with this method");
        if (fee < 0)
            throw new Error("Fee cannot be less than zero");
        const createRelayAction = multiContractAction.create(this.getAuth()[0].actor, symbolCode, initialSupply);
        const setReserveActions = reserves.map((reserve) => this.setReserveAction(symbolCode, `${reserve.amount.symbol.precision()},${reserve.amount.symbol
            .code()
            .to_string()}`, reserve.contract, 50));
        const addLiquidityActions = this.addLiquidityActions(symbolCode, reserves);
        const actions = [
            createRelayAction,
            ...setReserveActions,
            ...addLiquidityActions
        ];
        if (fee > 0) {
            actions.push(this.updateFeeAction(symbolCode, fee));
        }
        console.log(actions, "were actions");
        return this.tx(actions);
    }
    withdrawAction(symbolCode, amount) {
        const owner = this.getAuth()[0].actor;
        const action = multiContractAction.withdraw(owner, amount.to_string(), symbolCode);
        console.log(action, "was the action");
        return action;
    }
    withdraw(symbolCode, amount) {
        return this.tx([this.withdrawAction(symbolCode, amount)]);
    }
    addLiquidity(symbolCode, tokens) {
        return this.tx(this.addLiquidityActions(symbolCode, tokens));
    }
    removeLiquidityAction(quantity) {
        return {
            account: process.env.VUE_APP_SMARTTOKENCONTRACT,
            name: "transfer",
            data: {
                from: this.getAuth()[0].actor,
                to: this.contractName,
                quantity: quantity.to_string(),
                memo: "liquidate;"
            }
        };
    }
    addLiquidityActions(symbolCode, tokens) {
        return tokens.map((token) => ({
            account: token.contract,
            name: `transfer`,
            data: {
                from: this.getAuth()[0].actor,
                to: this.contractName,
                quantity: token.amount.to_string(),
                memo: `fund;${symbolCode}`
            }
        }));
    }
    fundTransfer(tokenContract, amountString, symbolCode) {
        return this.tx([
            {
                account: tokenContract,
                name: `transfer`,
                data: {
                    from: this.getAuth()[0].actor,
                    to: this.contractName,
                    quantity: amountString,
                    memo: `fund;${symbolCode}`
                }
            }
        ]);
    }
    tokenTransfer(tokenContract, transferParams) {
        return this.tx([
            {
                account: tokenContract,
                name: "transfer",
                data: {
                    from: this.getAuth()[0].actor,
                    to: transferParams.to,
                    quantity: transferParams.quantity,
                    memo: transferParams.memo || ""
                }
            }
        ]);
    }
}
const getAuth = () => {
    const wallet = vxm.tlosWallet.wallet;
    return [
        {
            actor: wallet.auth.accountName,
            permission: wallet.auth.permission
        }
    ];
};
export const multiContract = new MultiContractTx(process.env.VUE_APP_MULTICONTRACT, getAuth);