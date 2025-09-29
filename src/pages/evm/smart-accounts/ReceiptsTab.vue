<script setup lang="ts">
import { ref } from 'vue';
import { useChainStore } from 'src/antelope';
import { useQuasar } from 'quasar';

// constants
const BUNDLER_RPC_BASE_URL = 'https://bundler.vorpalengineering.com/';

// stores
const chainStore = useChainStore();
const $q = useQuasar();

// data
const transactionHash = ref('');

// methods
async function searchReceipt() {
    if (!transactionHash.value || transactionHash.value.trim() === '') {
        $q.notify({
            type: 'warning',
            message: 'Please enter a transaction hash',
            position: 'top',
            timeout: 3000,
        });
        return;
    }

    try {
        const hash = transactionHash.value.trim();
        console.log('Searching for transaction receipt:', hash);

        await getReceiptByHash(hash);

        // Clear the input field after successful search
        transactionHash.value = '';
    } catch (err) {
        console.error('Error searching receipt:', err);
        $q.notify({
            type: 'negative',
            message: 'Failed to search receipt. Please check the hash and try again.',
            position: 'top',
            timeout: 5000,
        });
    }
}

async function getReceiptByHash(hash: string) {
    try {
        // Get the current chain network
        const network = chainStore.loggedChain.settings.getNetwork();
        console.log('Current network:', network);

        // Determine the bundler RPC URL based on the network
        let bundlerRpcUrl: string;
        switch (network) {
        case 'telos-evm':
            bundlerRpcUrl = BUNDLER_RPC_BASE_URL + '40/';
            break;
        case 'telos-evm-testnet':
            bundlerRpcUrl = BUNDLER_RPC_BASE_URL + '41/';
            break;
        default:
            bundlerRpcUrl = BUNDLER_RPC_BASE_URL + '41/'; // Default to testnet
        }

        console.log('Bundler RPC URL:', bundlerRpcUrl);

        // Make the RPC call to get the UserOperation receipt
        const response = await fetch(bundlerRpcUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'eth_getUserOperationReceipt',
                params: [hash],
                id: 1,
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Receipt response:', data);

        // Log the full response to console as requested
        console.log('=== UserOperation Receipt Search Result ===');
        console.log('Hash:', hash);
        console.log('Full Response:', JSON.stringify(data, null, 2));

        // Log key receipt details if available
        if (data.result) {
            console.log('Receipt Details:');
            console.log('- Entry Point:', data.result.entryPoint);
            console.log('- Sender:', data.result.sender);
            console.log('- Success:', data.result.success);
            console.log('- Gas Used:', data.result.actualGasUsed);
            console.log('- Gas Cost:', data.result.actualGasCost);
            console.log('- Transaction Hash:', data.result.receipt?.transactionHash);
            console.log('- Block Number:', data.result.receipt?.blockNumber);
        }
        console.log('===========================================');

        // Optional: Show success notification
        $q.notify({
            type: 'positive',
            message: 'Receipt found! Check console for details.',
            position: 'top',
            timeout: 3000,
        });

    } catch (err) {
        console.error('Error fetching receipt:', err);
        throw err;
    }
}

function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
        $q.notify({
            type: 'positive',
            message: 'Hash copied to clipboard',
            position: 'top',
            timeout: 2000,
        });
    }).catch(() => {
        $q.notify({
            type: 'negative',
            message: 'Failed to copy hash',
            position: 'top',
            timeout: 2000,
        });
    });
}
</script>

<template>
<div class="c-receipts-tab">
    <div class="c-receipts-tab__content">
        <div class="c-receipts-tab__search-section">
            <h3 class="c-receipts-tab__section-title">Search UserOperation Receipt</h3>
            <p class="c-receipts-tab__section-description">
                Enter a UserOperation hash to retrieve the transaction receipt for a smart account execution.
            </p>

            <div class="c-receipts-tab__search-controls">
                <q-input
                    v-model="transactionHash"
                    class="c-receipts-tab__hash-input"
                    placeholder="Enter UserOperation hash (0x...)"
                    outlined
                    dense
                />
                <q-btn
                    class="c-receipts-tab__search-btn"
                    color="primary"
                    icon="search"
                    label="Search"
                    @click="searchReceipt"
                />
            </div>
        </div>

        <div class="c-receipts-tab__info-section">
            <h4 class="c-receipts-tab__info-title">About UserOperation Receipts</h4>
            <div class="c-receipts-tab__info-content">
                <p>
                    UserOperation receipts contain detailed information about smart account executions,
                    including the actual transaction receipt, gas consumption, and execution results. Each receipt includes:
                </p>
                <ul class="c-receipts-tab__info-list">
                    <li>Smart account sender address and entry point details</li>
                    <li>Execution success status and gas usage information</li>
                    <li>Block number, transaction hash, and transaction index</li>
                    <li>Event logs and contract interactions</li>
                    <li>Actual gas costs and effective gas price</li>
                </ul>
                <p class="c-receipts-tab__info-note">
                    <strong>Note:</strong> Search results will be displayed in the browser console for detailed inspection.
                </p>
            </div>
        </div>
    </div>
</div>
</template>

<style lang="scss" scoped>
.c-receipts-tab {
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

    &__section-title {
        margin-bottom: 8px;
        font-size: 24px;
        font-weight: 600;
        color: var(--text-high-contrast);
    }

    &__section-description {
        margin-bottom: 24px;
        font-size: 16px;
        color: var(--text-medium-contrast);
        line-height: 1.5;
    }

    &__search-section {
        margin-bottom: 32px;
        padding: 24px;
        background-color: var(--bg-secondary);
        border-radius: 12px;
        border: 1px solid var(--border-color);
    }

    &__search-controls {
        display: flex;
        flex-direction: row;
        gap: 12px;
        align-items: center;
    }

    &__hash-input {
        flex: 1;
    }

    &__search-btn {
        padding: 12px 24px;
        border-radius: 8px;
        font-weight: 500;
        text-transform: none;
        white-space: nowrap;
    }

    &__info-section {
        text-align: left;
        padding: 24px;
        background-color: var(--bg-secondary);
        border-radius: 12px;
        border: 1px solid var(--border-color);
    }

    &__info-title {
        margin-bottom: 16px;
        font-size: 18px;
        font-weight: 600;
        color: var(--text-high-contrast);
    }

    &__info-content {
        font-size: 14px;
        color: var(--text-medium-contrast);
        line-height: 1.6;

        p {
            margin-bottom: 12px;
        }
    }

    &__info-list {
        margin: 12px 0;
        padding-left: 20px;

        li {
            margin-bottom: 8px;
        }
    }

    &__info-note {
        margin-top: 16px;
        padding: 12px;
        background-color: var(--bg-tertiary);
        border-radius: 8px;
        border-left: 4px solid var(--q-primary);
    }
}
</style>
