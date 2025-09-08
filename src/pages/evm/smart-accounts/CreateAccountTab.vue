<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { createPublicClient, http, type Address } from 'viem';
import { telos, telosTestnet } from 'viem/chains';
import { useAccountStore, useChainStore } from 'src/antelope';

//constants
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

// Create public client on page load
const publicClient = createPublicClient({
    chain: currentChain.value,
    transport: http(),
});

// methods
async function calculateSmartAccountAddress(ownerAddress: Address, saltValue: number): Promise<string | null> {
    try {
        const factoryAddress = SIMPLE_ACCOUNT_FACTORY_ADDRESS_V07 as Address;

        const result = await publicClient.readContract({
            address: factoryAddress,
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

async function createSmartAccount() {
    // TODO: Implement smart account creation logic
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
        return;
    }

    const ownerAddress = connectedAddress as Address;
    const saltValue = salt.value;

    const result = await calculateSmartAccountAddress(ownerAddress, saltValue);
    if (result) {
        calculatedSmartAccountAddress.value = result;
    } else {
        calculatedSmartAccountAddress.value = '';
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

        <div class="c-create-account-tab__address-display">
            <div class="c-create-account-tab__address-label">Expected Address:</div>
            <div class="c-create-account-tab__address-value">{{ calculatedSmartAccountAddress || 'Calculating...' }}</div>
        </div>

        <div class="c-create-account-tab__actions">
            <q-btn
                class="c-create-account-tab__create-btn"
                color="primary"
                size="lg"
                label="Create Smart Account"
                icon-right="add"
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

    &__address-display {
        margin-top: 16px;
        margin-bottom: 32px;
        text-align: center;
    }

    &__address-label {
        @include text--small;
        color: var(--text-default-contrast);
        margin-bottom: 8px;
        font-weight: 500;
    }

    &__address-value {
        @include text--paragraph;
        color: var(--text-high-contrast);
        font-family: monospace;
        word-break: break-all;
        padding: 8px 0;
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
