/**
 * Unit coverage for the WalletConnect connector-guard fix.
 * Reproduces the production toast:
 *   {"error":{"name":"ConnectorNotFoundError","message":"Connector not found"}}
 * and asserts it maps to a human-readable AntelopeError key instead.
 */

import { AntelopeError } from 'src/antelope/types';
import { AntelopeConfig } from 'src/antelope/config/AntelopeConfig';
import { AntelopeDebug } from 'src/antelope/config/AntelopeDebug';

// Minimal stand-in of the catch/mapping logic from WalletConnectAuth.handleCatchError
// (keeps this test free of Web3Modal / Quasar boot wiring).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapWalletConnectWriteError(error: any): AntelopeError {
    if (error instanceof AntelopeError) {
        return error;
    }
    const message = String(error?.message ?? '');
    const errName = String(error?.name ?? '');
    if (errName === 'ConnectorNotFoundError' || message.includes('Connector not found')) {
        return new AntelopeError('antelope.evm.error_connector_not_found');
    }
    if (message.includes('User rejected the')) {
        return new AntelopeError('antelope.evm.error_transaction_canceled');
    }
    return new AntelopeError('antelope.evm.error_send_transaction', { error });
}

function makeConfig(): AntelopeConfig {
    return new AntelopeConfig(new AntelopeDebug());
}

describe('WalletConnect connector guard', () => {
    it('maps wagmi ConnectorNotFoundError to a human-readable AntelopeError key', () => {
        const wagmiError = Object.assign(new Error('Connector not found'), {
            name: 'ConnectorNotFoundError',
        });

        const mapped = mapWalletConnectWriteError(wagmiError);

        expect(mapped).toBeInstanceOf(AntelopeError);
        expect(mapped.message).toBe('antelope.evm.error_connector_not_found');
        // Must NOT carry the raw error object as payload (that became the JSON toast)
        expect(mapped.payload).toBeUndefined();
    });

    it('preserves AntelopeError thrown by ensureLiveConnector without wrapping', () => {
        const guardError = new AntelopeError('antelope.evm.error_connector_not_found');
        const mapped = mapWalletConnectWriteError(guardError);
        expect(mapped.message).toBe('antelope.evm.error_connector_not_found');
    });

    it('AntelopeConfig.transactionError preserves connector AntelopeError', () => {
        const config = makeConfig();
        const guardError = new AntelopeError('antelope.evm.error_connector_not_found');
        const result = config.transactionError('antelope.evm.error_withdraw_failed', guardError);
        expect(result.message).toBe('antelope.evm.error_connector_not_found');
    });

    it('AntelopeConfig.errorToStringHandler maps ConnectorNotFoundError name', () => {
        const config = makeConfig();
        const wagmiError = Object.assign(new Error('Connector not found'), {
            name: 'ConnectorNotFoundError',
        });
        expect(config.errorToStringHandler(wagmiError)).toBe('antelope.evm.error_connector_not_found');
    });

    it('i18n key exists for the user-facing message', () => {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const en = require('src/i18n/en-us/index.js').default;
        expect(en.antelope.evm.error_connector_not_found).toMatch(/reconnect/i);
        expect(en.antelope.evm.error_connector_not_found).not.toMatch(/ConnectorNotFoundError/);
    });
});
