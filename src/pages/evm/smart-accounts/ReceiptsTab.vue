<script setup lang="ts">
import { ref, computed } from 'vue';
import { useChainStore } from 'src/antelope';
import { useQuasar } from 'quasar';

// constants
const BUNDLER_RPC_BASE_URL = 'https://bundler.vorpalengineering.com/';

// stores
const chainStore = useChainStore();
const $q = useQuasar();

// data
const transactionHash = ref('');
const receiptResult = ref(null);
const showReceiptSummary = ref(false);

// computed
const hasValidReceipt = computed(() => {
    try {
        const result = receiptResult.value?.result;
        return result && result.userOpHash;
    } catch (error) {
        console.error('Error in hasValidReceipt computed:', error);
        return false;
    }
});

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

        const result = await getReceiptByHash(hash);

        // Store the result and show summary
        receiptResult.value = result;
        showReceiptSummary.value = true;

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
            message: 'Receipt found! Details displayed below.',
            position: 'top',
            timeout: 3000,
        });

        return data;

    } catch (err) {
        console.error('Error fetching receipt:', err);
        throw err;
    }
}

function clearResults() {
    receiptResult.value = null;
    showReceiptSummary.value = false;
    transactionHash.value = '';
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

        <!-- Clear Button -->
        <div v-if="showReceiptSummary && (hasValidReceipt || (receiptResult && !receiptResult.result))" class="c-receipts-tab__clear-section">
            <q-btn
                class="c-receipts-tab__clear-btn"
                color="secondary"
                icon="clear"
                label="Clear"
                @click="clearResults"
            />
        </div>

        <!-- UserOperation Not Found Message -->
        <div v-if="showReceiptSummary && receiptResult && !receiptResult.result" class="c-receipts-tab__not-found-section">
            <q-banner class="c-receipts-tab__not-found-banner" rounded>
                <div class="c-receipts-tab__not-found-content">
                    <div class="c-receipts-tab__not-found-icon">🔍</div>
                    <div class="c-receipts-tab__not-found-title">User Operation Not Found</div>
                    <div class="c-receipts-tab__not-found-message">
                        The UserOperation hash you entered was not found. This could mean:
                    </div>
                    <ul class="c-receipts-tab__not-found-list">
                        <li>The hash is invalid or incorrect</li>
                        <li>The UserOperation hasn't been submitted to a bundler</li>
                        <li>The UserOperation was executed on a different network</li>
                    </ul>
                </div>
            </q-banner>
        </div>

        <!-- UserOperation Summary Box -->
        <div v-if="showReceiptSummary && hasValidReceipt" class="c-receipts-tab__summary-section">
            <q-banner class="c-receipts-tab__summary-banner" rounded>
                <div class="c-receipts-tab__summary-content">
                    <div class="c-receipts-tab__top-row">
                        <div class="c-receipts-tab__hash-box">
                            <div class="c-receipts-tab__hash-section">
                                <div class="c-receipts-tab__hash-label">UserOperation Hash</div>
                                <div class="c-receipts-tab__hash-row">
                                    <div class="c-receipts-tab__hash-value">{{ receiptResult?.result?.userOpHash || 'Loading...' }}</div>
                                    <q-btn
                                        flat
                                        round
                                        dense
                                        icon="content_copy"
                                        class="c-receipts-tab__copy-btn"
                                        @click="copyToClipboard(receiptResult?.result?.userOpHash)"
                                    />
                                </div>
                            </div>
                        </div>
                        <div class="c-receipts-tab__status-box">
                            <div class="c-receipts-tab__status-section">
                                <div class="c-receipts-tab__status-label">Status</div>
                                <div class="c-receipts-tab__status-value" :class="{ 'success': receiptResult?.result?.success, 'failed': !receiptResult?.result?.success }">
                                    {{ receiptResult?.result?.success ? 'Success' : 'Failed' }}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="c-receipts-tab__middle-row">
                        <div class="c-receipts-tab__sender-box">
                            <div class="c-receipts-tab__sender-section">
                                <div class="c-receipts-tab__sender-label">Sender Address</div>
                                <div class="c-receipts-tab__sender-value-row">
                                    <div class="c-receipts-tab__sender-value">{{ receiptResult?.result?.sender || 'N/A' }}</div>
                                    <q-btn
                                        flat
                                        round
                                        dense
                                        icon="content_copy"
                                        class="c-receipts-tab__sender-copy-btn"
                                        @click="copyToClipboard(receiptResult?.result?.sender)"
                                    />
                                </div>
                            </div>
                        </div>
                        <div class="c-receipts-tab__gas-box">
                            <div class="c-receipts-tab__gas-section">
                                <div class="c-receipts-tab__gas-label">Gas Used</div>
                                <div class="c-receipts-tab__gas-value">{{ parseInt(receiptResult?.result?.actualGasUsed || '0', 16) }} </div>
                            </div>
                        </div>
                        <div class="c-receipts-tab__cost-box">
                            <div class="c-receipts-tab__cost-section">
                                <div class="c-receipts-tab__cost-label">Gas Cost</div>
                                <div class="c-receipts-tab__cost-value">{{ (parseInt(receiptResult?.result?.actualGasCost || '0', 16) / Math.pow(10, 18)).toFixed(6) }} TLOS</div>
                            </div>
                        </div>
                    </div>
                    <div class="c-receipts-tab__bottom-row">
                        <div class="c-receipts-tab__tx-box">
                            <div class="c-receipts-tab__tx-section">
                                <div class="c-receipts-tab__tx-label">Transaction Hash</div>
                                <div class="c-receipts-tab__tx-value-row">
                                    <div class="c-receipts-tab__tx-value">{{ receiptResult?.result?.receipt?.transactionHash || 'N/A' }}</div>
                                    <q-btn
                                        v-if="receiptResult?.result?.receipt?.transactionHash"
                                        flat
                                        round
                                        dense
                                        icon="content_copy"
                                        class="c-receipts-tab__tx-copy-btn"
                                        @click="copyToClipboard(receiptResult?.result?.receipt?.transactionHash)"
                                    />
                                </div>
                            </div>
                        </div>
                        <div class="c-receipts-tab__block-box">
                            <div class="c-receipts-tab__block-section">
                                <div class="c-receipts-tab__block-label">Block Number</div>
                                <div class="c-receipts-tab__block-value">{{ parseInt(receiptResult?.result?.receipt?.blockNumber || '0', 16) }}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </q-banner>
        </div>

        <!-- Info Section (shown when no receipt is displayed) -->
        <div v-if="!showReceiptSummary" class="c-receipts-tab__info-section">
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

    &__clear-section {
        margin-bottom: 16px;
        text-align: center;
    }

    &__clear-btn {
        padding: 8px 16px;
        border-radius: 6px;
        font-weight: 500;
        text-transform: none;
    }

    &__summary-section {
        margin-bottom: 24px;
        width: 100%;
    }

    &__not-found-section {
        margin-bottom: 24px;
        width: 100%;
    }

    &__not-found-banner {
        background-color: transparent !important;
        color: white !important;
        border: 1px solid var(--q-warning) !important;
        max-width: 600px;
        margin: 0 auto;
        padding: 24px;
    }

    &__not-found-content {
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 16px;
    }

    &__not-found-icon {
        font-size: 48px;
        opacity: 0.7;
    }

    &__not-found-title {
        font-size: 24px;
        font-weight: 600;
        color: var(--text-high-contrast);
    }

    &__not-found-message {
        font-size: 16px;
        color: var(--text-medium-contrast);
        text-align: left;
        max-width: 400px;
    }

    &__not-found-list {
        font-size: 14px;
        color: var(--text-medium-contrast);
        text-align: left;
        margin: 12px 0;
        padding-left: 20px;

        li {
            margin-bottom: 8px;
        }
    }

    &__summary-banner {
        background-color: transparent !important;
        color: white !important;
        border: 1px solid white !important;
        max-width: 800px;
        margin: 0 auto;
        padding: 20px;
    }

    &__summary-content {
        display: flex;
        flex-direction: column;
        gap: 20px;
    }

    &__top-row {
        display: flex;
        flex-direction: row;
        gap: 20px;
        align-items: stretch;
    }

    &__middle-row {
        display: flex;
        flex-direction: row;
        gap: 20px;
        align-items: stretch;
    }

    &__bottom-row {
        display: flex;
        flex-direction: row;
        gap: 20px;
        align-items: stretch;
    }

    &__hash-box {
        flex: 1;
        padding: 16px;
        background-color: var(--bg-secondary);
        border-radius: 8px;
        border: 1px solid var(--border-color);
        display: flex;
        align-items: center;
    }

    &__status-box {
        flex: 0 0 auto;
        padding: 16px;
        background-color: var(--bg-secondary);
        border-radius: 8px;
        border: 1px solid var(--border-color);
        min-width: 120px;
        display: flex;
        align-items: center;
    }

    &__sender-box {
        flex: 1;
        padding: 16px;
        background-color: var(--bg-secondary);
        border-radius: 8px;
        border: 1px solid var(--border-color);
        display: flex;
        align-items: center;
    }

    &__gas-box {
        flex: 0 0 auto;
        padding: 16px;
        background-color: var(--bg-secondary);
        border-radius: 8px;
        border: 1px solid var(--border-color);
        min-width: 120px;
        display: flex;
        align-items: center;
    }

    &__cost-box {
        flex: 0 0 auto;
        padding: 16px;
        background-color: var(--bg-secondary);
        border-radius: 8px;
        border: 1px solid var(--border-color);
        min-width: 120px;
        display: flex;
        align-items: center;
    }

    &__tx-box {
        flex: 1;
        padding: 16px;
        background-color: var(--bg-secondary);
        border-radius: 8px;
        border: 1px solid var(--border-color);
        display: flex;
        align-items: center;
    }

    &__block-box {
        flex: 0 0 auto;
        padding: 16px;
        background-color: var(--bg-secondary);
        border-radius: 8px;
        border: 1px solid var(--border-color);
        min-width: 120px;
        display: flex;
        align-items: center;
    }

    &__hash-section {
        display: flex;
        flex-direction: column;
        gap: 8px;
        justify-content: flex-start;
        width: 100%;
    }

    &__hash-label {
        font-size: 14px;
        font-weight: 500;
        color: var(--text-high-contrast);
    }

    &__hash-row {
        display: flex;
        align-items: center;
        gap: 12px;
    }

    &__hash-value {
        font-family: monospace;
        font-size: 12px;
        word-break: break-all;
        flex: 1;
        color: var(--text-high-contrast);
    }

    &__status-section {
        display: flex;
        flex-direction: column;
        gap: 8px;
        text-align: center;
    }

    &__status-label {
        font-size: 14px;
        font-weight: 500;
        color: var(--text-high-contrast);
    }

    &__status-value {
        font-size: 16px;
        font-weight: 600;

        &.success {
            color: var(--q-positive);
        }

        &.failed {
            color: var(--q-negative);
        }
    }

    &__sender-section {
        display: flex;
        flex-direction: column;
        gap: 8px;
        justify-content: flex-start;
        width: 100%;
    }

    &__sender-label {
        font-size: 14px;
        font-weight: 500;
        color: var(--text-high-contrast);
    }

    &__sender-value-row {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    &__sender-value {
        font-family: monospace;
        font-size: 12px;
        word-break: break-all;
        color: var(--text-high-contrast);
        flex: 1;
    }

    &__gas-section {
        display: flex;
        flex-direction: column;
        gap: 8px;
        text-align: center;
    }

    &__gas-label {
        font-size: 14px;
        font-weight: 500;
        color: var(--text-high-contrast);
    }

    &__gas-value {
        font-size: 16px;
        font-weight: 600;
        color: var(--q-primary);
    }

    &__cost-section {
        display: flex;
        flex-direction: column;
        gap: 8px;
        text-align: center;
    }

    &__cost-label {
        font-size: 14px;
        font-weight: 500;
        color: var(--text-high-contrast);
    }

    &__cost-value {
        font-size: 16px;
        font-weight: 600;
        color: var(--q-secondary);
    }

    &__tx-section {
        display: flex;
        flex-direction: column;
        gap: 8px;
        justify-content: flex-start;
        width: 100%;
    }

    &__tx-label {
        font-size: 14px;
        font-weight: 500;
        color: var(--text-high-contrast);
    }

    &__tx-value-row {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    &__tx-value {
        font-family: monospace;
        font-size: 12px;
        word-break: break-all;
        color: var(--text-high-contrast);
        flex: 1;
    }

    &__block-section {
        display: flex;
        flex-direction: column;
        gap: 8px;
        text-align: center;
    }

    &__block-label {
        font-size: 14px;
        font-weight: 500;
        color: var(--text-high-contrast);
    }

    &__block-value {
        font-size: 16px;
        font-weight: 600;
        color: var(--q-primary);
    }

    // Copy buttons
    &__copy-btn,
    &__sender-copy-btn,
    &__tx-copy-btn {
        color: var(--q-primary);
        flex-shrink: 0;

        &:hover {
            background-color: var(--bg-hover);
        }
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
