<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { createSmartAccountClient } from 'permissionless';
import { toSimpleSmartAccount } from 'permissionless/accounts';
import { createPublicClient, createWalletClient, EIP1193Provider, http, type Address, custom, encodeFunctionData, parseEther } from 'viem';
import { entryPoint07Address, getUserOperationHash, createBundlerClient } from 'viem/account-abstraction';
import { telos, telosTestnet } from 'viem/chains';
import { useAccountStore, useChainStore } from 'src/antelope';
import { useQuasar } from 'quasar';

//constants
const BUNDLER_RPC_BASE_URL = 'https://bundler.vorpalengineering.com/';
const SIMPLE_ACCOUNT_FACTORY_ADDRESS_V07 = '0x91E60e0613810449d098b0b5Ec8b51A0FE8c8985';
const SIMPLE_ACCOUNT_FACTORY_ABI = [
    {
        inputs: [
            { name: 'owner', type: 'address' },
            { name: 'salt', type: 'uint256' },
        ],
        name: 'getAddress',
        outputs: [{ name: '', type: 'address' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            { name: 'owner', type: 'address' },
            { name: 'salt', type: 'uint256' },
        ],
        name: 'createAccount',
        outputs: [{ name: '', type: 'address' }],
        stateMutability: 'nonpayable',
        type: 'function',
    },
];

// stores
const accountStore = useAccountStore();
const chainStore = useChainStore();
const $q = useQuasar();

// data
const selectedAccount = ref('');
const recipientAddress = ref('');
const transferAmount = ref(0);
const storedSmartAccounts = ref<Array<{
    smartAccountAddress: string;
    smartAccountType: string;
    salt: string;
}>>([]);
const transferInProgress = ref(false);

// computed
const currentChain = computed(() => {
    const network = chainStore.loggedChain.settings.getNetwork();
    console.log('connected network: ', network);
    switch (network) {
    case 'telos-evm':
        return telos;
    case 'telos-evm-testnet':
        return telosTestnet;
    default:
        return telosTestnet; // fallback to testnet
    }
});

const currentBundler = computed(() => {
    const network = chainStore.loggedChain.settings.getNetwork();
    switch (network) {
    case 'telos-evm':
        return BUNDLER_RPC_BASE_URL + '40/';
    case 'telos-evm-testnet':
        return BUNDLER_RPC_BASE_URL + '41/';
    default:
        return BUNDLER_RPC_BASE_URL + '41/'; // fallback to testnet
    }
});

// Create public client on page load
const publicClient = createPublicClient({
    chain: currentChain.value,
    transport: http(),
});

// methods
function loadStoredSmartAccounts() {
    try {
        const accounts = JSON.parse(localStorage.getItem('smartAccounts') || '[]');
        storedSmartAccounts.value = accounts;
        console.log('Loaded smart accounts from storage:', accounts);
    } catch (err) {
        console.error('Error loading smart accounts from storage:', err);
        storedSmartAccounts.value = [];
    }
}

async function estimateTransferUserOp(amount: bigint, recipient: Address): Promise<{
    gasEstimates: any;
    gasPrice: bigint;
    maxFeePerGas: bigint;
    maxPriorityFeePerGas: bigint;
    preVerificationGasMultiplier: bigint;
} | null> {
    try {
        // Check if wallet is connected
        const connectedAddress = accountStore.loggedEvmAccount?.address;
        if (!connectedAddress) {
            console.error('No wallet connected. Please connect your wallet first.');
            return null;
        }

        // Create the simple account client using the selected account address
        const simpleAccount = await toSimpleSmartAccount({
            client: publicClient,
            owner: window.ethereum as EIP1193Provider,
            address: selectedAccount.value as Address,
            entryPoint: {
                address: entryPoint07Address,
                version: '0.7',
            },
        });

        // Create bundler client for gas estimation
        console.log('>>> bundler url: ', currentBundler.value);
        const bundlerClient = createBundlerClient({
            transport: http(currentBundler.value),
            chain: currentChain.value,
        });

        // Prepare user operation with calls array format for native transfer
        const userOperation = await bundlerClient.prepareUserOperation({
            account: simpleAccount,
            calls: [{
                to: recipient,
                value: amount,
            }],
        });
        console.log('>>> User operation prepared:', userOperation);

        // For Telos (legacy transactions), we need to get gas price instead of EIP-1559 fees
        const gasPrice = await publicClient.getGasPrice();
        console.log('>>> Gas price:', gasPrice);

        // For legacy transactions, maxFeePerGas and maxPriorityFeePerGas should be the same as gasPrice
        const maxFeePerGas = gasPrice;
        const maxPriorityFeePerGas = gasPrice;
        const preVerificationGasMultiplier = 5n;

        return {
            gasEstimates: userOperation,
            gasPrice,
            maxFeePerGas,
            maxPriorityFeePerGas,
            preVerificationGasMultiplier,
        };
    } catch (err) {
        console.error('Error estimating transfer user operation:', err);
        return null;
    }
}

async function transferUserOp() {
    try {
        // Set loading state
        transferInProgress.value = true;

        console.log('Creating transfer user operation...');

        // Check if wallet is connected
        const connectedAddress = accountStore.loggedEvmAccount?.address;
        if (!connectedAddress) {
            console.error('No wallet connected. Please connect your wallet first.');
            return;
        }

        // Check if account is selected
        if (!selectedAccount.value) {
            $q.notify({
                type: 'negative',
                message: 'Please select a smart account to send from.',
                position: 'top',
                timeout: 5000,
            });
            return;
        }

        // Check if recipient address is valid
        if (!recipientAddress.value || recipientAddress.value.trim() === '') {
            $q.notify({
                type: 'negative',
                message: 'Please enter a recipient address.',
                position: 'top',
                timeout: 5000,
            });
            return;
        }

        // Check if amount is valid
        if (transferAmount.value <= 0) {
            $q.notify({
                type: 'negative',
                message: 'Please enter a valid transfer amount.',
                position: 'top',
                timeout: 5000,
            });
            return;
        }

        const amountInWei = BigInt(Math.floor(transferAmount.value * Math.pow(10, 18)));
        console.log('>>> amountInWei: ', amountInWei);

        // Get gas estimates using the dedicated function
        const gasEstimationResult = await estimateTransferUserOp(amountInWei, recipientAddress.value as Address);
        if (!gasEstimationResult) {
            console.error('Failed to estimate gas for transfer user operation');
            return;
        }

        const {
            gasEstimates,
            maxFeePerGas,
            maxPriorityFeePerGas,
            preVerificationGasMultiplier,
        } = gasEstimationResult;

        // Create wallet client for signing
        const walletClient = createWalletClient({
            chain: currentChain.value,
            transport: custom(window.ethereum),
        });

        // Create the simple account client using the selected account address
        const simpleAccount = await toSimpleSmartAccount({
            client: publicClient,
            owner: window.ethereum as EIP1193Provider,
            address: selectedAccount.value as Address,
            entryPoint: {
                address: entryPoint07Address,
                version: '0.7',
            },
        });

        // Create smart account client with proper bundler transport
        const smartAccountClient = createSmartAccountClient({
            account: simpleAccount,
            chain: currentChain.value,
            bundlerTransport: http(currentBundler.value),
        });

        // Step 1: Prepare the user operation with proper gas estimates
        const userOperation = await smartAccountClient.prepareUserOperation({
            callData: '0x',
            to: recipientAddress.value as Address,
            value: amountInWei,
            maxFeePerGas,
            maxPriorityFeePerGas,
            callGasLimit: gasEstimates.callGasLimit,
            preVerificationGas: gasEstimates.preVerificationGas * preVerificationGasMultiplier,
            verificationGasLimit: gasEstimates.verificationGasLimit,
        });

        // Step 2: Get the user operation hash and sign it manually
        const userOperationHash = getUserOperationHash({
            userOperation,
            entryPointAddress: entryPoint07Address,
            entryPointVersion: '0.7',
            chainId: currentChain.value.id,
        });

        // Sign the user operation hash with MetaMask
        const userOpSignature = await walletClient.signMessage({
            account: connectedAddress as Address,
            message: { raw: userOperationHash },
        });
        console.log('>>> userOpSignature: ', userOpSignature);

        // Update the user operation with the real signature
        const signedUserOperation = {
            ...userOperation,
            signature: userOpSignature,
        };
        console.log('>>>> signed UserOp', signedUserOperation);

        // Step 3: Send the signed user operation
        const userOperationHashResult = await smartAccountClient.sendUserOperation(signedUserOperation);
        console.log('>>> result: ', userOperationHashResult);

        // Step 4: Wait for the user operation receipt
        const receipt = await smartAccountClient.waitForUserOperationReceipt({
            hash: userOperationHashResult,
        });
        console.log('>>> receipt: ', receipt);

        // Show success notification
        $q.notify({
            type: 'positive',
            message: 'Transfer Completed Successfully',
            position: 'top',
            timeout: 5000,
        });
    } catch (err) {
        console.error('Error creating transfer user operation:', err);
        $q.notify({
            type: 'negative',
            message: 'Transfer failed. Please try again.',
            position: 'top',
            timeout: 5000,
        });
    } finally {
        // Clear loading state
        transferInProgress.value = false;
    }
}

// Load accounts on component mount
onMounted(() => {
    loadStoredSmartAccounts();
});
</script>

<template>
<div class="c-transact-account-tab">
    <div class="c-transact-account-tab__content">
        <div class="c-transact-account-tab__account-section">
            <q-select
                v-model="selectedAccount"
                class="c-transact-account-tab__account-select"
                label="Select Smart Account"
                outlined
                dense
                :options="storedSmartAccounts.map(account => account.smartAccountAddress)"
                :disable="storedSmartAccounts.length === 0"
            />
        </div>

        <div v-if="selectedAccount" class="c-transact-account-tab__transfer-section">
            <q-banner class="c-transact-account-tab__transfer-banner" rounded>
                <div class="c-transact-account-tab__transfer-content">
                    <div class="c-transact-account-tab__from-label">From Address</div>
                    <q-input
                        :model-value="selectedAccount"
                        class="c-transact-account-tab__from-input"
                        outlined
                        dense
                        readonly
                        disable
                    />
                    <div class="c-transact-account-tab__recipient-label">To Address</div>
                    <q-input
                        v-model="recipientAddress"
                        class="c-transact-account-tab__recipient-input"
                        placeholder="0x..."
                        outlined
                        dense
                    />
                    <div class="c-transact-account-tab__amount-label">Transfer Amount (TLOS)</div>
                    <q-input
                        v-model.number="transferAmount"
                        class="c-transact-account-tab__amount-input"
                        placeholder="0.0"
                        outlined
                        dense
                        type="number"
                        min="0"
                        step="0.001"
                    />
                    <q-btn
                        class="c-transact-account-tab__send-btn"
                        color="primary"
                        size="lg"
                        :label="transferInProgress ? 'Sending...' : 'Send'"
                        :loading="transferInProgress"
                        :disable="transferInProgress || transferAmount <= 0 || !recipientAddress.trim()"
                        @click="transferUserOp"
                    />
                </div>
            </q-banner>
        </div>

        <div v-if="storedSmartAccounts.length === 0" class="c-transact-account-tab__no-accounts">
            <q-banner class="bg-warning text-dark" rounded>
                <template v-slot:avatar>
                    <q-icon name="warning" color="dark" />
                </template>
                No smart accounts found. Please create a smart account first.
            </q-banner>
        </div>
    </div>
</div>
</template>

<style lang="scss" scoped>
.c-transact-account-tab {
    display: flex;
    justify-content: center;
    align-items: flex-start;
    min-height: 40vh;
    padding: 16px 24px;

    &__content {
        text-align: center;
        max-width: 600px;
        width: 100%;
    }

    &__account-section {
        margin-bottom: 24px;
    }

    &__account-select {
        max-width: 500px;
        width: 100%;
        margin: 0 auto;
    }

    &__transfer-section {
        margin: 16px 0;
        max-width: 600px;
        margin-left: auto;
        margin-right: auto;
    }

    &__transfer-banner {
        background-color: transparent !important;
        color: white !important;
        border: 1px solid white !important;
    }

    &__transfer-content {
        display: flex;
        flex-direction: column;
        gap: 16px;
    }

    &__from-label {
        @include text--small;
        color: white;
        font-weight: 500;
    }

    &__from-input {
        max-width: 400px;
        width: 100%;
        margin: 0 auto;
    }

    &__recipient-label {
        @include text--small;
        color: white;
        font-weight: 500;
    }

    &__recipient-input {
        max-width: 400px;
        width: 100%;
        margin: 0 auto;
    }

    &__amount-label {
        @include text--small;
        color: white;
        font-weight: 500;
    }

    &__amount-input {
        max-width: 400px;
        width: 100%;
        margin: 0 auto;
    }

    &__send-btn {
        padding: 12px 32px;
        border-radius: 8px;
        font-weight: 600;
        text-transform: none;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        transition: all 0.2s ease;
        max-width: 200px;
        margin: 0 auto;

        &:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
        }
    }

    &__no-accounts {
        margin: 16px 0;
        max-width: 600px;
        margin-left: auto;
        margin-right: auto;
    }
}
</style>
