<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { createPublicClient, http, type Address } from 'viem';
import { telos, telosTestnet } from 'viem/chains';
import { useChainStore } from 'src/antelope';
import { useQuasar } from 'quasar';

// stores
const chainStore = useChainStore();
const $q = useQuasar();

// computed
const currentChain = computed(() => {
    const network = chainStore.loggedChain.settings.getNetwork();
    switch (network) {
    case 'telos-evm':
        return telos;
    case 'telos-evm-testnet':
        return telosTestnet;
    default:
        return telosTestnet; // fallback to testnet
    }
});

// Create public client
const publicClient = createPublicClient({
    chain: currentChain.value,
    transport: http(),
});

// data
const selectedAccount = ref('');
const smartAccountAddress = ref('');
const storedSmartAccounts = ref<Array<{
    smartAccountAddress: string;
    smartAccountType: string;
    salt: string;
}>>([]);
const accountBalance = ref(0n);
const balanceLoading = ref(false);

// computed
const formattedBalance = computed(() => {
    if (balanceLoading.value) {
        return 'Loading...';
    }
    // Convert wei to TLOS (assuming 18 decimals)
    const balanceInTlos = Number(accountBalance.value) / Math.pow(10, 18);
    return `${balanceInTlos.toFixed(6)} TLOS`;
});

// methods
async function connectSmartAccount() {
    // TODO: Implement smart account connection logic
    console.log('Connecting smart account:', smartAccountAddress.value);

    // Save the entered address to localStorage if it's valid
    if (smartAccountAddress.value && smartAccountAddress.value.trim() !== '') {
        await validateAndSaveAccount();
    }
}

async function validateSmartAccount(address: string): Promise<boolean> {
    try {
        const bytecode = await publicClient.getCode({ address: address as Address });
        console.log('Account bytecode:', bytecode);
        return bytecode !== undefined && bytecode !== '0x';
    } catch (err) {
        console.error('Error validating smart account:', err);
        return false;
    }
}

async function validateAndSaveAccount() {
    const address = smartAccountAddress.value.trim();

    // Validate that the address is a deployed smart account
    const isValidSmartAccount = await validateSmartAccount(address);

    if (!isValidSmartAccount) {
        // Show red alert popup
        $q.notify({
            type: 'negative',
            message: 'This address is not a deployed smart account. Please enter a valid smart account address.',
            position: 'top',
            timeout: 5000,
        });
        return;
    }

    // If validation passes, save to storage
    saveAccountToStorage();
}

function saveAccountToStorage() {
    try {
        // Get existing smart accounts from localStorage
        const existingAccounts = JSON.parse(localStorage.getItem('smartAccounts') || '[]');

        // Check if this address already exists
        const addressExists = existingAccounts.some(
            (account: any) => account.smartAccountAddress.toLowerCase() === smartAccountAddress.value.toLowerCase(),
        );

        if (!addressExists) {
            // Create new smart account data
            const newAccount = {
                smartAccountAddress: smartAccountAddress.value.trim(),
                smartAccountType: 'SimpleAccount v0.7', // Default type for manually entered accounts
                salt: '0', // Default salt for manually entered accounts
            };

            // Add the new account to the array
            existingAccounts.push(newAccount);

            // Save back to localStorage
            localStorage.setItem('smartAccounts', JSON.stringify(existingAccounts));
            console.log('Smart account saved to storage:', newAccount);

            // Clear the input field
            smartAccountAddress.value = '';

            // Refresh the accounts list
            loadStoredSmartAccounts();
        } else {
            console.log('Account already exists in storage');
            $q.notify({
                type: 'warning',
                message: 'This account is already in your watchlist.',
                position: 'top',
                timeout: 3000,
            });
        }
    } catch (err) {
        console.error('Error saving smart account to storage:', err);
    }
}

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

async function onAccountSelected(address: string) {
    if (address) {
        accountBalance.value = await fetchAccountBalance(address as Address);
    } else {
        accountBalance.value = 0n;
    }
}

function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
        $q.notify({
            type: 'positive',
            message: 'Address copied to clipboard',
            position: 'top',
            timeout: 2000,
        });
    }).catch(() => {
        $q.notify({
            type: 'negative',
            message: 'Failed to copy address',
            position: 'top',
            timeout: 2000,
        });
    });
}

// Load accounts on component mount
onMounted(() => {
    loadStoredSmartAccounts();
});
</script>

<template>
<div class="c-view-account-tab">
    <div class="c-view-account-tab__content">
        <div class="c-view-account-tab__accounts-section">
            <h3 class="c-view-account-tab__section-title">Select a Smart Account</h3>
            <q-select
                v-model="selectedAccount"
                class="c-view-account-tab__account-select"
                label="Smart Account"
                outlined
                dense
                :options="storedSmartAccounts.map(account => account.smartAccountAddress)"
                :disable="storedSmartAccounts.length === 0"
                @update:model-value="onAccountSelected"
            />

            <div v-if="!selectedAccount" class="c-view-account-tab__add-section">
                <h4 class="c-view-account-tab__add-label">Or Add to Watchlist</h4>
                <div class="c-view-account-tab__add-controls">
                    <q-input
                        v-model="smartAccountAddress"
                        class="c-view-account-tab__address-input"
                        placeholder="Enter Smart Account address"
                        outlined
                        dense
                    />
                    <q-btn
                        class="c-view-account-tab__add-btn"
                        color="secondary"
                        icon="🔍"
                        @click="connectSmartAccount"
                    />
                </div>
            </div>
        </div>

        <div v-if="selectedAccount" class="c-view-account-tab__account-summary">
            <q-banner class="c-view-account-tab__summary-banner" rounded>
                <div class="c-view-account-tab__summary-content">
                    <div class="c-view-account-tab__address-section">
                        <div class="c-view-account-tab__address-label">Smart Account Address</div>
                        <div class="c-view-account-tab__address-row">
                            <div class="c-view-account-tab__address-value">{{ selectedAccount }}</div>
                            <q-btn
                                flat
                                round
                                dense
                                icon="content_copy"
                                class="c-view-account-tab__copy-btn"
                                @click="copyToClipboard(selectedAccount)"
                            />
                        </div>
                    </div>
                    <div class="c-view-account-tab__balance-section">
                        <div class="c-view-account-tab__balance-label">Balance</div>
                        <div class="c-view-account-tab__balance-value">{{ formattedBalance }}</div>
                    </div>
                </div>
            </q-banner>
        </div>

    </div>
</div>
</template>

<style lang="scss" scoped>
.c-view-account-tab {
    display: flex;
    justify-content: center;
    align-items: flex-start;
    min-height: 40vh;
    padding: 16px 24px;

    &__content {
        text-align: center;
        max-width: 500px;
        width: 100%;
    }


    &__accounts-section {
        margin-top: 32px;
        width: 100%;
    }

    &__section-title {
        margin-bottom: 16px;
        font-size: 18px;
        font-weight: 600;
        color: var(--text-high-contrast);
    }

    &__account-select {
        max-width: 500px;
        width: 100%;
        margin: 0 auto 24px;
    }

    &__add-label {
        margin-bottom: 12px;
        font-size: 16px;
        font-weight: 500;
        color: var(--text-high-contrast);
        text-align: center;
    }

    &__add-section {
        max-width: 500px;
        margin: 0 auto;
    }

    &__add-controls {
        display: flex;
        flex-direction: row;
        gap: 12px;
        align-items: center;
    }

    &__address-input {
        flex: 1;
    }

    &__add-btn {
        padding: 8px 16px;
        border-radius: 6px;
        font-weight: 500;
        text-transform: none;
        white-space: nowrap;
    }

    &__account-summary {
        margin-top: 24px;
        width: 100%;
    }

    &__summary-banner {
        background-color: transparent !important;
        color: white !important;
        border: 1px solid white !important;
        max-width: 600px;
        margin: 0 auto;
    }

    &__summary-content {
        display: flex;
        flex-direction: column;
        gap: 20px;
    }

    &__address-section {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    &__address-label {
        font-size: 14px;
        font-weight: 500;
        color: var(--text-high-contrast);
    }

    &__address-row {
        display: flex;
        align-items: center;
        gap: 12px;
    }

    &__address-value {
        font-family: monospace;
        font-size: 12px;
        word-break: break-all;
        flex: 1;
        color: var(--text-high-contrast);
    }

    &__copy-btn {
        color: var(--q-primary);
        flex-shrink: 0;

        &:hover {
            background-color: var(--bg-hover);
        }
    }

    &__balance-section {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    &__balance-label {
        font-size: 14px;
        font-weight: 500;
        color: var(--text-high-contrast);
    }

    &__balance-value {
        font-size: 16px;
        font-weight: 600;
        color: var(--q-primary);
    }

}
</style>
