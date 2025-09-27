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
const smartAccountAddress = ref('');
const storedSmartAccounts = ref<Array<{
    smartAccountAddress: string;
    smartAccountType: string;
    salt: string;
}>>([]);

const tableColumns = ref([
    {
        name: 'smartAccountAddress',
        label: 'Smart Account Address',
        field: 'smartAccountAddress',
        align: 'left' as const,
        sortable: true,
    },
    {
        name: 'smartAccountType',
        label: 'Account Type',
        field: 'smartAccountType',
        align: 'left' as const,
        sortable: true,
    },
    {
        name: 'actions',
        label: 'Actions',
        field: 'actions',
        align: 'center' as const,
        sortable: false,
    },
]);

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

            // Refresh the table
            loadStoredSmartAccounts();
        } else {
            console.log('Account already exists in storage');
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
        console.log('Table columns:', tableColumns);
    } catch (err) {
        console.error('Error loading smart accounts from storage:', err);
        storedSmartAccounts.value = [];
    }
}

function deleteAccount(address: string) {
    try {
        // Get existing smart accounts from localStorage
        const existingAccounts = JSON.parse(localStorage.getItem('smartAccounts') || '[]');

        // Filter out the account with the matching address
        const updatedAccounts = existingAccounts.filter(
            (account: any) => account.smartAccountAddress.toLowerCase() !== address.toLowerCase(),
        );

        // Save the updated array back to localStorage
        localStorage.setItem('smartAccounts', JSON.stringify(updatedAccounts));

        console.log('Account deleted from storage:', address);

        // Refresh the table
        loadStoredSmartAccounts();

    } catch (err) {
        console.error('Error deleting smart account from storage:', err);
    }
}

function fundAccount(address: string) {
    // TODO: Implement funding logic
    console.log('Funding account:', address);
}

// Load accounts on component mount
onMounted(() => {
    loadStoredSmartAccounts();
});
</script>

<template>
<div class="c-view-account-tab">
    <div class="c-view-account-tab__content">
        <div class="c-view-account-tab__connect-section">
            <q-input
                v-model="smartAccountAddress"
                class="c-view-account-tab__address-input"
                placeholder="Enter Smart Account address"
                outlined
                dense
            />
            <q-btn
                class="c-view-account-tab__connect-btn"
                color="secondary"
                icon="🔍"
                @click="connectSmartAccount"
            />
        </div>

        <div v-if="storedSmartAccounts.length > 0" class="c-view-account-tab__accounts-table">
            <h3 class="c-view-account-tab__table-title">Watchlist</h3>
            <q-table
                :rows="storedSmartAccounts"
                :columns="tableColumns"
                row-key="smartAccountAddress"
                flat
                bordered
                class="c-view-account-tab__table"
            >
                <template v-slot:body-cell-smartAccountAddress="props">
                    <q-td :props="props">
                        <div class="c-view-account-tab__address-cell">
                            {{ props.value }}
                        </div>
                    </q-td>
                </template>

                <template v-slot:body-cell-smartAccountType="props">
                    <q-td :props="props">
                        {{ props.value }}
                    </q-td>
                </template>

                <template v-slot:body-cell-actions="props">
                    <q-td :props="props">
                        <q-btn-dropdown
                            flat
                            round
                            dense
                            icon="more_vert"
                            class="c-view-account-tab__actions-btn"
                        >
                            <q-list>
                                <q-item v-close-popup clickable @click="fundAccount(props.row.smartAccountAddress)">
                                    <q-item-section avatar>
                                        <q-icon name="account_balance_wallet" />
                                    </q-item-section>
                                    <q-item-section>Fund</q-item-section>
                                </q-item>
                                <q-item v-close-popup clickable @click="deleteAccount(props.row.smartAccountAddress)">
                                    <q-item-section avatar>
                                        <q-icon name="delete" color="negative" />
                                    </q-item-section>
                                    <q-item-section>Delete</q-item-section>
                                </q-item>
                            </q-list>
                        </q-btn-dropdown>
                    </q-td>
                </template>
            </q-table>
        </div>

        <div v-else class="c-view-account-tab__no-accounts">
            <p>No smart accounts found in storage.</p>
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

    &__connect-section {
        display: flex;
        flex-direction: row;
        gap: 12px;
        margin-bottom: 24px;
        align-items: center;
    }

    &__address-input {
        flex: 1;
        max-width: 400px;
    }

    &__connect-btn {
        padding: 8px 16px;
        border-radius: 6px;
        font-weight: 500;
        text-transform: none;
        white-space: nowrap;
    }

    &__accounts-table {
        margin-top: 32px;
        width: 100%;
    }

    &__table-title {
        margin-bottom: 16px;
        font-size: 18px;
        font-weight: 600;
        color: var(--text-high-contrast);
    }

    &__table {
        width: 100%;
    }

    &__address-cell {
        font-family: monospace;
        font-size: 12px;
        word-break: break-all;
    }

    &__no-accounts {
        margin-top: 32px;
        text-align: center;
        color: var(--text-default-contrast);
    }

    &__actions-btn {
        color: var(--text-default-contrast);

        &:hover {
            background-color: var(--bg-hover);
        }
    }
}
</style>
