<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { createSmartAccountClient } from 'permissionless';
import { toSimpleSmartAccount } from 'permissionless/accounts';
import { createPublicClient, createWalletClient, EIP1193Provider, http, type Address, custom, encodeFunctionData } from 'viem';
import { entryPoint07Address, getUserOperationHash, createBundlerClient } from 'viem/account-abstraction';
import { telos, telosTestnet } from 'viem/chains';
import { useAccountStore, useChainStore } from 'src/antelope';

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

// data
const salt = ref(0);
const calculatedSmartAccountAddress = ref('');
const smartAccountType = ref('SimpleAccount v0.7');
const accountExists = ref(false);
const accountBalance = ref(0n);
const balanceLoading = ref(false);

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

const formattedBalance = computed(() => {
    if (balanceLoading.value) {
        return 'Loading...';
    }
    // Convert wei to TLOS (assuming 18 decimals)
    const balanceInTlos = Number(accountBalance.value) / Math.pow(10, 18);
    return `${balanceInTlos.toFixed(6)} TLOS`;
});

// Create public client on page load
const publicClient = createPublicClient({
    chain: currentChain.value,
    transport: http(),
});

// methods
async function calculateSmartAccountAddress(ownerAddress: Address, saltValue: number): Promise<string | null> {
    try {
        const result = await publicClient.readContract({
            address: SIMPLE_ACCOUNT_FACTORY_ADDRESS_V07 as Address,
            abi: SIMPLE_ACCOUNT_FACTORY_ABI,
            functionName: 'getAddress',
            args: [ownerAddress, BigInt(saltValue)],
        });

        return result as string;
    } catch (err) {
        console.error('Error calculating smart account address:', err);
        return null;
    }
}

async function checkAccountExists(address: Address): Promise<boolean> {
    try {
        const bytecode = await publicClient.getCode({ address });
        console.log('bytecode: ', bytecode);
        return bytecode !== undefined && bytecode !== '0x';
    } catch (err) {
        console.error('Error checking account:', err);
        return false;
    }
}

async function fetchAccountBalance(address: Address): Promise<bigint> {
    try {
        balanceLoading.value = true;
        const balance = await publicClient.getBalance({ address });
        console.log('Account balance:', balance);
        return balance;
    } catch (err) {
        console.error('Error fetching account balance:', err);
        return 0n;
    } finally {
        balanceLoading.value = false;
    }
}

async function estimateCreateSmartAccount(): Promise<{
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

        // Define required variables
        const ownerAddress = connectedAddress as Address;
        const saltValue = salt.value;

        // Create the simple account client
        const simpleAccount = await toSimpleSmartAccount({
            client: publicClient,
            owner: window.ethereum as EIP1193Provider,
            factoryAddress: SIMPLE_ACCOUNT_FACTORY_ADDRESS_V07 as Address,
            index: BigInt(saltValue),
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

        // Encode the factory data for createAccount function
        const factoryData = encodeFunctionData({
            abi: SIMPLE_ACCOUNT_FACTORY_ABI,
            functionName: 'createAccount',
            args: [ownerAddress, BigInt(saltValue)],
        });
        console.log('>>> Factory data:', factoryData);

        // Estimate gas using bundler client for account creation
        const gasEstimates = await bundlerClient.estimateUserOperationGas({
            account: simpleAccount,
            callData: '0x',
            factory: SIMPLE_ACCOUNT_FACTORY_ADDRESS_V07 as Address,
            factoryData,
        });
        console.log('>>> Gas estimates:', gasEstimates);

        // For Telos (legacy transactions), we need to get gas price instead of EIP-1559 fees
        const gasPrice = await publicClient.getGasPrice();
        console.log('>>> Gas price:', gasPrice);

        // For legacy transactions, maxFeePerGas and maxPriorityFeePerGas should be the same as gasPrice
        const maxFeePerGas = gasPrice;
        const maxPriorityFeePerGas = gasPrice;
        const preVerificationGasMultiplier = 5n;

        return {
            gasEstimates,
            gasPrice,
            maxFeePerGas,
            maxPriorityFeePerGas,
            preVerificationGasMultiplier,
        };
    } catch (err) {
        console.error('Error estimating smart account creation:', err);
        return null;
    }
}

async function createSmartAccount() {
    console.log('Creating smart account...');

    // Check if wallet is connected
    const connectedAddress = accountStore.loggedEvmAccount?.address;
    if (!connectedAddress) {
        console.error('No wallet connected. Please connect your wallet first.');
        return;
    }

    // Define required variables
    const ownerAddress = connectedAddress as Address; // Use connected wallet address
    const saltValue = salt.value; // Use salt from input field

    // Calculate and store the smart account address
    const result = await calculateSmartAccountAddress(ownerAddress, saltValue);
    if (result) {
        calculatedSmartAccountAddress.value = result;
        console.log('Smart account address:', result);
    }

    // Check if the account already has code deployed
    const accountExists = await checkAccountExists(result as Address);
    console.log('Account exists:', accountExists);

    // Get gas estimates using the dedicated function
    const gasEstimationResult = await estimateCreateSmartAccount();
    if (!gasEstimationResult) {
        console.error('Failed to estimate gas for smart account creation');
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

    // Create the simple account client
    const simpleAccount = await toSimpleSmartAccount({
        client: publicClient,
        owner: window.ethereum as EIP1193Provider,
        factoryAddress: SIMPLE_ACCOUNT_FACTORY_ADDRESS_V07 as Address,
        index: BigInt(salt.value),
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
        account: ownerAddress as Address,
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
}

function randomizeSalt() {
    // Generate a random salt value between 0 and 2^32 - 1
    const randomSalt = Math.floor(Math.random() * Math.pow(2, 32));
    salt.value = randomSalt;
    console.log('Randomized salt to:', randomSalt);

    // Automatically calculate the smart account address when salt changes
    updateSmartAccountAddress();
}

async function updateSmartAccountAddress() {
    const connectedAddress = accountStore.loggedEvmAccount?.address;
    if (!connectedAddress) {
        calculatedSmartAccountAddress.value = '';
        accountExists.value = false;
        accountBalance.value = 0n;
        return;
    }

    const ownerAddress = connectedAddress as Address;
    const saltValue = salt.value;

    const result = await calculateSmartAccountAddress(ownerAddress, saltValue);
    if (result) {
        calculatedSmartAccountAddress.value = result;
        // Check if the account already exists
        accountExists.value = await checkAccountExists(result as Address);
        // Fetch the account balance
        accountBalance.value = await fetchAccountBalance(result as Address);
    } else {
        calculatedSmartAccountAddress.value = '';
        accountExists.value = false;
        accountBalance.value = 0n;
    }
}

// Calculate address on page load
onMounted(() => {
    updateSmartAccountAddress();
});
</script>

<template>
<div class="c-create-account-tab">
    <div class="c-create-account-tab__content">
        <div class="c-create-account-tab__type-section">
            <q-select
                v-model="smartAccountType"
                class="c-create-account-tab__type-select"
                label="Smart Account Type"
                outlined
                dense
                :options="['SimpleAccount v0.7']"
                readonly
            />
            <q-icon
                name="info"
                class="c-create-account-tab__info-icon"
                color="grey-6"
            >
                <q-tooltip class="c-create-account-tab__info-tooltip">
                    SimpleAccount v0.7 is currently the only supported smart account type
                </q-tooltip>
            </q-icon>
        </div>

        <div class="c-create-account-tab__salt-section">
            <q-input
                v-model.number="salt"
                class="c-create-account-tab__salt-input"
                placeholder="Enter salt value (number)"
                label="Salt"
                outlined
                dense
                type="number"
                min="0"
                @update:model-value="updateSmartAccountAddress"
            />
            <q-btn
                class="c-create-account-tab__randomize-btn"
                color="secondary"
                round
                dense
                @click="randomizeSalt"
            >
                🎲
                <q-tooltip>Randomize Salt</q-tooltip>
            </q-btn>
        </div>

        <div v-if="calculatedSmartAccountAddress" class="c-create-account-tab__balance-info">
            <q-banner class="c-create-account-tab__balance-banner" rounded>
                <div class="c-create-account-tab__balance-content">
                    <div class="c-create-account-tab__address-label">Expected Address:</div>
                    <div class="c-create-account-tab__address-value">{{ calculatedSmartAccountAddress }}</div>
                    <div class="c-create-account-tab__balance-value">{{ formattedBalance }}</div>
                </div>
            </q-banner>
        </div>

        <div v-if="accountExists" class="c-create-account-tab__warning-box">
            <q-banner class="bg-warning text-dark" rounded>
                <template v-slot:avatar>
                    <q-icon name="warning" color="dark" />
                </template>
                This smart account has already been created.
            </q-banner>
        </div>

        <div class="c-create-account-tab__actions">
            <q-btn
                class="c-create-account-tab__create-btn"
                color="primary"
                size="lg"
                label="Create Smart Account"
                icon-right="add"
                :disable="accountExists"
                @click="createSmartAccount"
            />
        </div>
    </div>
</div>
</template>

<style lang="scss" scoped>
.c-create-account-tab {
    display: flex;
    justify-content: center;
    align-items: flex-start;
    min-height: 40vh;
    padding: 16px 24px;

    &__content {
        text-align: center;
        max-width: 600px;
    }

    &__type-section {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 8px;
        margin-bottom: 24px;
    }

    &__type-select {
        max-width: 300px;
        width: 100%;
    }

    &__info-icon {
        flex-shrink: 0;
        cursor: help;
        font-size: 18px;
    }

    &__info-tooltip {
        font-size: 12px;
        max-width: 250px;
        text-align: center;
    }

    &__salt-section {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 12px;
        margin-bottom: 24px;
    }

    &__salt-input {
        max-width: 300px;
        width: 100%;
    }

    &__randomize-btn {
        flex-shrink: 0;
        width: 40px;
        height: 40px;
    }

    &__address-label {
        @include text--small;
        color: white;
        margin-bottom: 4px;
        font-weight: 500;
    }

    &__address-value {
        @include text--paragraph;
        color: white;
        font-family: monospace;
        word-break: break-all;
        margin-bottom: 8px;
    }

    &__warning-box {
        margin: 16px 0;
        max-width: 600px;
        margin-left: auto;
        margin-right: auto;
    }

    &__balance-info {
        margin: 16px 0;
        max-width: 600px;
        margin-left: auto;
        margin-right: auto;
    }

    &__balance-banner {
        background-color: transparent !important;
        color: white !important;
        border: 1px solid white !important;
    }

    &__balance-content {
        display: flex;
        flex-direction: column;
        gap: 4px;
    }

    &__balance-value {
        @include text--paragraph;
        font-family: monospace;
        font-weight: 600;
        font-size: 1.1em;
        color: white;
    }

    &__actions {
        display: flex;
        justify-content: center;
    }

    &__create-btn {
        padding: 12px 32px;
        border-radius: 8px;
        font-weight: 600;
        text-transform: none;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        transition: all 0.2s ease;

        &:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
        }
    }
}
</style>
