
export class CosignAuthorityProvider {
    async getRequiredKeys(args) {
        const { transaction } = args;
        // Iterate over the actions and authorizations
        transaction.actions.forEach((action, ti) => {
        action.authorization.forEach((auth, ai) => {
            // If the authorization matches the expected cosigner
            // then remove it from the transaction while checking
            // for what public keys are required
            if (
            auth.actor === 'greymassfuel'
            && auth.permission === 'cosign'
            ) {
            delete transaction.actions[ti].authorization.splice(ai, 1)
            }
        })
        });
        return convertLegacyPublicKeys((await rpc.fetch('/v1/chain/get_required_keys', {
        transaction,
        available_keys: args.availableKeys,
        })).required_keys);
    }
}

export const cosign_noop = {
    account: 'greymassnoop',
    name: 'noop',
    authorization: [
        {
            actor: 'greymassfuel',
            permission: 'cosign',
        }
    ],
    data: {}
}