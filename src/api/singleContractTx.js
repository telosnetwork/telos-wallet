import { composeMemo } from "./eosBancorCalc";
export const liquidateAction = (smartTokenAmount, smartTokenContract, expectedReserve, relayContract, userAccount) => ({
    account: smartTokenContract,
    name: "transfer",
    data: {
        from: userAccount,
        to: process.env.VUE_APP_NETWORKCONTRACT,
        quantity: smartTokenAmount.to_string(),
        memo: composeMemo([
            {
                account: relayContract,
                symbol: expectedReserve.symbol.code().to_string()
            }
        ], expectedReserve.to_string().split(" ")[0], userAccount)
    }
});
export const hydrateAction = (tokenAmount, tokenContract, expectedReserve, relayContract, userAccount) => ({
    account: tokenContract,
    name: "transfer",
    data: {
        from: userAccount,
        to: process.env.VUE_APP_NETWORKCONTRACT,
        quantity: tokenAmount.to_string(),
        memo: composeMemo([
            {
                account: relayContract,
                symbol: expectedReserve.symbol.code().to_string()
            }
        ], expectedReserve.to_string().split(" ")[0], userAccount)
    }
});