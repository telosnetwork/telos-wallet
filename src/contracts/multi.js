class MultiContractAction {
    constructor(contractName) {
        this.contractName = contractName;
    }
    addAccountProperty(action) {
        return this.contractName
            ? Object.assign(Object.assign({}, action), { account: this.contractName }) : action;
    }
    delreserve(converter, reserve) {
        return this.addAccountProperty({
            name: "delreserve",
            data: {
                converter,
                reserve
            }
        });
    }
    setreserve(converter_currency_code, currency, contract, ratio) {
        return this.addAccountProperty({
            name: "setreserve",
            data: {
                converter_currency_code,
                currency,
                contract,
                ratio
            }
        });
    }
    withdraw(sender, quantity, converter_currency_code) {
        return this.addAccountProperty({
            name: "withdraw",
            data: {
                sender,
                quantity,
                converter_currency_code
            }
        });
    }
    updateowner(currency, owner) {
        return this.addAccountProperty({
            name: "updateowner",
            data: {
                currency,
                new_owner: owner
            }
        });
    }
    delconverter(converter_currency_code) {
        return this.addAccountProperty({
            name: "delconverter",
            data: { converter_currency_code }
        });
    }
    fund(sender, quantity) {
        return this.addAccountProperty({
            name: "fund",
            data: {
                sender,
                quantity
            }
        });
    }
    enablecnvrt(currency, enabled) {
        return this.addAccountProperty({
            name: "enablecnvrt",
            data: {
                currency,
                enabled
            }
        });
    }
    updatefee(currency, fee) {
        return this.addAccountProperty({
            name: "updatefee",
            data: {
                currency,
                fee
            }
        });
    }
    create(owner, token_code, initial_supply) {
        return this.addAccountProperty({
            name: "create",
            data: {
                owner,
                token_code,
                initial_supply: String(initial_supply)
            }
        });
    }
}
export const multiContractAction = new MultiContractAction(process.env.VUE_APP_MULTICONTRACT);