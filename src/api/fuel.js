// Most of this code was taken and addapted from https://gist.github.com/aaroncox/d74a73b3d9fbc20836c32ea9deda5d70
import {
    User,
} from 'universal-authenticator-library';
import {
    APIClient,
    Name,
    PackedTransaction,
    PermissionLevel,
    Serializer,
    Transaction,
} from '@greymass/eosio';
import { Dialog } from 'quasar';

// this simulates the getChain function from OBE
const getChain = () => ({
    getHyperionEndpoint: () => (process.env.HYPERION_ENDPOINT),
    getFuelRPCEndpoint: () => {
        if (typeof process.env.FUEL_RPC === 'string') {
            return process.env.FUEL_RPC;
        } else {
            return '';
        }
    },
});

// The maximum fee per transaction this script is willing to accept
const maxFee = 0.05;

// expire time in millisec
const expireSeconds = 3600;

const chain = getChain();
const client = new APIClient({
    url: chain.getHyperionEndpoint(),
});

const fuelrpc = chain.getFuelRPCEndpoint();
const resourceProviderEndpoint = `${fuelrpc}/v1/resource_provider/request_transaction`;

// Wrapper for the user to intersect the signTransaction call
// Use initFuelUserWrapper() method to initialize an instance of the class
class FuelUserWrapper extends User {
    user = null;
    fuelServiceEnabled = false;

    constructor(user/*: User*/) {
        super();
        this.user = user;
    }

    // called immediately after class instantiation in initFuelUserWrapper()
    async setAvailability() {
        if (!fuelrpc){
            return;
        };
        try {
            // verify fuel service is available
            this.fuelServiceEnabled = (await fetch(fuelrpc)).status === 200;
        } catch(e) {
            console.error(e);
        }
    }

    async signTransaction(
        originalTransaction/*: AnyTransaction*/,
        originalconfig, /*: SignTransactionConfig*/
    )/*: Promise<SignTransactionResponse>*/ {
        try {
            // if fuel service disabled, send tx using generic ual user method
            if (!this.fuelServiceEnabled) {
                return this.user.signTransaction(originalTransaction, originalconfig);
            }

            // Retrieve transaction headers
            const info = await client.v1.chain.get_info();
            const header = info.getTransactionHeader(expireSeconds);

            // collect all contract abis
            const abi_promises = originalTransaction.actions.map(a =>
                client.v1.chain.get_abi(a.account),
            );
            const responses = await Promise.all(abi_promises);
            const abis = responses.map(x => x.abi);
            const abis_and_names = originalTransaction.actions.map((x, i) => ({
                contract: x.account,
                abi: abis[i],
            }));

            // create complete well formed transaction
            const transaction = Transaction.from(
                {
                    ...header,
                    actions: originalTransaction.actions,
                },
                abis_and_names,
            );

            // Pack the transaction for transport
            const packedTransaction = PackedTransaction.from({
                signatures: [],
                packed_context_free_data: '',
                packed_trx: Serializer.encode({ object: transaction }),
            });

            const signer = PermissionLevel.from({
                actor: (await this.user.getAccountName()),
                permission: this.requestPermission,
            });

            // Submit the transaction to the resource provider endpoint
            const cosigned = await fetch(resourceProviderEndpoint, {
                body: JSON.stringify({
                    signer,
                    packedTransaction,
                }),
                method: 'POST',
            });

            // Interpret the resulting JSON
            const rpResponse = await cosigned.json(); /*as ResourceProviderResponse*/

            switch (rpResponse.code) {
            case 402: {
            // Resource Provider provided signature in exchange for a fee
            // is ok to treat them with the same logic of code = 200?
            // Yes according to this: https://gist.github.com/aaroncox/d74a73b3d9fbc20836c32ea9deda5d70#file-fuel-core-presign-js-L128-L159
            // Aron rightly suggests that we should show and confirm the fee costs for this service:
            // https://github.com/telosnetwork/open-block-explorer/pull/477#discussion_r1053417964
            }
            case 200: {
            // Resource Provider provided signature for free

                const { data } = rpResponse;
                const [, returnedTransaction] = data.request;
                const modifiedTransaction/*: SignedTransaction*/ = returnedTransaction;

                const fee/*: string | null*/ = data.fee;

                // Ensure the modified transaction is what the application expects
                // These validation methods will throw an exception if invalid data exists
                validateTransaction(
                    signer,
                    modifiedTransaction,
                    transaction,
                    data.costs,
                );

                // validate with the user whether to use the service at all
                try {
                    await confirmWithUser(this.user, fee);
                } catch (e) {
                    // The user refused to use the service
                    break;
                }

                modifiedTransaction.signatures = [...data.signatures];
                // Sign the modified transaction
                const locallySigned/*: SignedTransactionResponse*/ =
                await this.user.signTransaction(
                    modifiedTransaction,
                    Object.assign(originalconfig, { broadcast: false }),
                ); /* as SignedTransactionResponse*/

                // When using CleosAuthenticator the transaction returns empty
                if (!locallySigned.transaction.signatures) {
                    return Promise.reject(
                        'The transaction was not broadcasted because no signatures were obtained',
                    );
                }

                // Merge signatures from the user and the cosigned response tab
                modifiedTransaction.signatures = [
                    ...locallySigned.transaction.signatures,
                    ...data.signatures,
                ];

                // Broadcast the signed transaction to the blockchain
                const pushResponse = await client.v1.chain.push_transaction(
                    modifiedTransaction,
                );

                // we compose the final response
                const finalResponse/*: SignTransactionResponse*/ = {
                    wasBroadcast: true,
                    transactionId: pushResponse.transaction_id,
                    status: pushResponse.processed.receipt.status,
                    transaction: modifiedTransaction,
                };

                return Promise.resolve(finalResponse);
            }
            case 400: {
            // Resource Provider refused to sign the transaction, aborting
                break;
            }
            default:
                throw (
                    'Code ' +
                (+rpResponse.code).toString() +
                ' not expected from resource provider endpoint: ' +
                resourceProviderEndpoint
                );
            }

            // If we got here it means the resource provider will not participate in this transaction
            return this.user.signTransaction(originalTransaction, originalconfig);
        } catch (e) {
            throw e;
        }
    }

    // since this is a wrapper is also wraps the possible requestPermission hidden property
    get requestPermission() {
        return this.user.requestPermission || 'active';
    }

    // These functions are just proxies
    signArbitrary = async (
        publicKey/*: string*/,
        data/*: string*/,
        helpText, /*: string*/
    )/*: Promise<string>*/ => this.user.signArbitrary(publicKey, data, helpText);
    verifyKeyOwnership = async (challenge/*: string*/)/*: Promise<boolean>*/ =>
        this.user.verifyKeyOwnership(challenge);
    getAccountName = async ()/*: Promise<string>*/ => this.user.getAccountName();
    getChainId = async ()/*: Promise<string>*/ => this.user.getChainId();
    getKeys = async ()/*: Promise<string[]>*/ => this.user.getKeys();
}

// create an instance of FuelUserWrapper class and check fuel service availability
export async function initFuelUserWrapper(user) {
    const fuelUserWrapper = new FuelUserWrapper(user);
    await fuelUserWrapper.setAvailability();
    return fuelUserWrapper;
}

// Auxiliary functions to validate with the user the use of the service
/*
interface Preference {
  remember?: boolean;
  approve?: boolean;
}
*/
export default class GreymassFuelService {
  static preferences/*: { [account: string]: Preference }*/ = {};
  static globals/*: Record<string, (s: string) => string>*/ = null;
  static save() {
      localStorage.setItem(
          'fuel_preferences',
          JSON.stringify(GreymassFuelService.preferences),
      );
  }
  static drop() {
      localStorage.removeItem('fuel_preferences');
  }
  static load() {
      try {
          GreymassFuelService.preferences = GreymassFuelService.preferences || {};
          const str = localStorage.getItem('fuel_preferences');
          if (str) {
              GreymassFuelService.preferences = JSON.parse(str);
          }
      } catch (e) {
          console.error('ERROR: ', e);
      }
  }

  static setPreferences(account/*: string*/, p/*: Preference*/) {
      GreymassFuelService.preferences[account] = {
          ...GreymassFuelService.preferences[account],
          ...p,
      };
      if (GreymassFuelService.preferences[account].remember) {
          GreymassFuelService.save();
      } else {
          GreymassFuelService.drop();
      }
  }
  static setGlobals(g/*: Record<string, (s: string) => string>*/) {
      GreymassFuelService.globals = g;
  }
}

async function confirmWithUser(user/*: User*/, fees/*: string | null*/) {
    const username = await user.getAccountName();
    let mymodel/*: string[]*/ = [];
    mymodel = [];

    return new Promise((resolve, reject) => {
    // Try and see if the user already answer (remembered)
        if (
            GreymassFuelService.preferences[username] &&
            GreymassFuelService.preferences[username].remember
        ) {
            // ok, the user did. What's the answer?
            if (GreymassFuelService.preferences[username].approve) {
                resolve();
            } else {
                reject();
            }
            return;
        }

        const handler = function (approve/*: boolean*/) {
            GreymassFuelService.setPreferences(username, { approve });
            if (approve) {
                resolve();
            } else {
                reject();
            }
        };

        // this are the normal texts for random wallet.
        const cancel/*: string | boolean*/ = GreymassFuelService.globals.$t('api.reject');
        const ok = GreymassFuelService.globals.$t('api.confirm');

        if (typeof fees === 'string') {
            // Only if there's some feed to charge the user wi show the confirmation Dialog
            const message = GreymassFuelService.globals.$t('api.greymass_fuel_message_fees', { fees });
            Dialog.create({
                title: GreymassFuelService.globals.$t('api.greymass_dialog_title'),
                message,
                html: true,
                cancel,
                ok,
                persistent: true,
                class: 'text-black',
                options: {
                    type: 'checkbox',
                    model: mymodel,
                    isValid: (model/*: string | string[]*/) => {
                        GreymassFuelService.setPreferences(username, {
                            remember: model.length === 1,
                        });
                        return true;
                    },
                    items: [
                        {
                            label: GreymassFuelService.globals.$t('api.remember_my_decision'),
                            value: 'remember',
                            color: 'primary' },
                    ],
                },
            })
            // all answers should save the preferences
                .onOk(() => handler(true))
                .onCancel(() => handler(false));
        } else {
            // otherwise we go ahead without asking
            handler(true);
        }

    });
}

// Auxiliary functions to validate modified transaction returned by the resource provider

// Validate the transaction
function validateTransaction(
    signer/*: PermissionLevel*/,
    modifiedTransaction/*: Transaction*/,
    transaction/*: Transaction*/,
    costs, /*: CostsType | null = null*/
)/*: string | null*/ {

    // Ensure the first action is the `greymassnoop:noop`
    validateNoop(modifiedTransaction);

    // Ensure the actions within the transaction match what was provided
    return validateActions(signer, modifiedTransaction, transaction, costs);
}

// Validate the actions of the modified transaction vs the original transaction
function validateActions(
    signer/*: PermissionLevel*/,
    modifiedTransaction/*: Transaction*/,
    transaction/*: Transaction*/,
    costs, /*: CostsType | null*/
)/*: string | null*/ {
    // Determine how many actions we expect to have been added to the transaction based on the costs
    const expectedNewActions = determineExpectedActionsLength(costs, modifiedTransaction);

    // Ensure the proper number of actions was returned
    validateActionsLength(expectedNewActions, modifiedTransaction, transaction);

    // Ensure the appended actions were expected
    return validateActionsContent(
        signer,
        expectedNewActions,
        modifiedTransaction,
        transaction,
    );
}

// Validate the number of actions is the number expected
function determineExpectedActionsLength(costs/*: CostsType | null*/, modifiedTransaction/*: Transaction*/) {
    // By default, 1 new action is appended (noop)
    let expectedNewActions = 1;

    // if the second action is a ram purchase, 1 new action is added (the ram purchase)
    if (
        costs === null &&
        modifiedTransaction.actions.length > 1 &&
        modifiedTransaction.actions[1].account.toString() === 'eosio' &&
        ['buyram', 'buyrambytes'].includes(modifiedTransaction.actions[1].name.toString())
    ) {
        expectedNewActions += 1;
    }

    // If there are costs associated with this transaction, 1 new actions is added (the fee transfer) as second action
    if (costs) {
        expectedNewActions += 1;
        // If there is a RAM cost associated with this transaction, 1 new action is added (the ram purchase) (buyrambytes or buyram)
        if (costs.ram !== '0.0000 TLOS') {
            expectedNewActions += 1;
        }
    }

    return expectedNewActions;
}

// Validate the contents of each action
function validateActionsContent(
    signer/*: PermissionLevel*/,
    expectedNewActions/*: number*/,
    modifiedTransaction/*: Transaction*/,
    transaction, /*: Transaction*/
)/*: string | null*/ {
    // Make sure the originally requested actions are still intact and unmodified
    validateActionsOriginalContent(
        expectedNewActions,
        modifiedTransaction,
        transaction,
    );

    // If a ram purchase was expected, ensure it is valid
    // if (expectedNewActions > 1) {
    //     validateActionsRamContent(signer, modifiedTransaction);
    // }
    return null;
}
/*
interface AuxTransactionData {
  [key: string]: string;
}
*/
function descerialize(data/*: string*/)/*: AuxTransactionData*/ {
    // we use the Serializer to decode the data string
    const deserialized = Serializer.decode(data);
    return deserialized;
}

// Ensure the transaction fee transfer is valid
function validateActionsFeeContent(
    signer/*: PermissionLevel*/,
    modifiedTransaction, /*: Transaction*/
)/*: number*/ {
    const feeAction = modifiedTransaction.actions[1];
    const data = descerialize(feeAction.data);
    const amount = parseFloat(data.quantity?.split(' ')[0]);
    if (amount > maxFee) {
        throw new Error(`Fee of ${amount} exceeds the maximum fee of ${maxFee}.`);
    }
    if (
        feeAction.account.toString() !== 'eosio.token' ||
        feeAction.name.toString() !== 'transfer' ||
        data.to.toString() !== 'fuel.gm'
    ) {
        throw new Error('Fee action was deemed invalid.');
    }
    return amount;
}

// Ensure the RAM purchasing action is valid
function validateActionsRamContent(
    signer/*: PermissionLevel*/,
    modifiedTransaction, /*: Transaction*/
)/*: number*/ {
    const ramAction = modifiedTransaction.actions[1];
    const data = descerialize(ramAction.data);
    const amount = parseFloat(data.quant?.split(' ')[0]);

    if (
        ramAction.account.toString() !== 'eosio' ||
        !['buyram', 'buyrambytes'].includes(String(ramAction.name)) ||
        data.payer.toString() !== 'greymassfuel' ||
        data.receiver.toString() !== signer.actor.toString()
    ) {
        throw new Error('RAM action was deemed invalid.');
    }
    return amount;
}

// Make sure the actions returned in the API response match what was submitted
function validateActionsOriginalContent(
    expectedNewActions/*: number*/,
    modifiedTransaction/*: Transaction*/,
    transaction, /*: Transaction*/
) {
    for (const [i] of modifiedTransaction.actions.entries()) {
        // Skip the expected new actions
        if (i < expectedNewActions) {
            continue;
        }
        // Compare each action to the originally generated actions
        const original = transaction.actions[i - expectedNewActions];
        const action = modifiedTransaction.actions[i];
        const matchesAccount =
            action.account.toString() === original.account.toString();
        const matchesAction = action.name.toString() === original.name.toString();
        const matchesLength =
            action.authorization.length === original.authorization.length;
        const matchesActor =
            action.authorization[0].actor.toString() ===
            original.authorization[0].actor.toString();
        const matchesPermission =
            action.authorization[0].permission.toString() ===
            original.authorization[0].permission.toString();
        const matchesData = action.data.toString() === original.data.toString();
        if (
            !action ||
            !matchesAccount ||
            !matchesAction ||
            !matchesLength ||
            !matchesActor ||
            !matchesPermission ||
            !matchesData
        ) {
            const { account, name } = original;
            throw new Error(
                `Transaction returned by API has non-matching action at index ${i} (${account.toString()}:${name.toString()})`,
            );
        }
    }
}

// Ensure no unexpected actions were appended in the response
function validateActionsLength(
    expectedNewActions/*: number*/,
    modifiedTransaction/*: Transaction*/,
    transaction, /*: Transaction*/
) {
    if (
        modifiedTransaction.actions.length !==
        transaction.actions.length + expectedNewActions
    ) {
        throw new Error('Transaction returned contains additional actions.');
    }
}

const expectedCosignerContract = Name.from('greymassnoop');
const expectedCosignerAction = Name.from('noop');
const expectedCosignerAccountName = Name.from('greymassfuel');
const expectedCosignerAccountPermission = Name.from('cosign');

// Make sure the first action is the greymassnoop:noop and properly defined
function validateNoop(modifiedTransaction/*: Transaction*/) {
    const [firstAction] = modifiedTransaction.actions;
    const [firstAuthorization] = firstAction.authorization;
    if (
        firstAction.account.toString() !== expectedCosignerContract.toString() ||
        firstAction.name.toString() !== expectedCosignerAction.toString() ||
        firstAuthorization.actor.toString() !==
        expectedCosignerAccountName.toString() ||
        firstAuthorization.permission.toString() !==
        expectedCosignerAccountPermission.toString() ||
        (JSON.stringify(firstAction.data) !== '""' &&
        JSON.stringify(firstAction.data) !== '{}')
    ) {
        throw new Error(
            `First action within transaction response is not valid noop (${expectedCosignerContract.toString()}:${expectedCosignerAction.toString()} signed by ${expectedCosignerAccountName.toString()}:${expectedCosignerAccountPermission.toString()}).`,
        );
    }
}
