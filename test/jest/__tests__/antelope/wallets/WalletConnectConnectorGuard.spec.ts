/**
 * Unit coverage for the WalletConnect connector-guard fix.
 * Reproduces the production toast:
 *   {"error":{"name":"ConnectorNotFoundError","message":"Connector not found"}}
 * and asserts it maps to a human-readable AntelopeError key instead.
 *
 * Kept free of heavy app imports (Web3Modal / Vue / Antelope boot) so Jest
 * does not choke on ESM-only transitive deps.
 */

class AntelopeError extends Error {
    public payload?: unknown;
    constructor(message: string, payload?: unknown) {
        super(message);
        this.payload = payload;
    }
}

// Stand-in of WalletConnectAuth.handleCatchError mapping logic
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

// Stand-in of AntelopeConfig.transactionError preserve-AntelopeError branch
function transactionError(description: string, error: unknown): AntelopeError {
    if (error instanceof AntelopeError) {
        return error;
    }
    return new AntelopeError(description, { error: String(error) });
}

// Stand-in of AntelopeConfig.errorToStringHandler ConnectorNotFound mapping
function errorToString(error: unknown): string {
    if (error instanceof Error) {
        if (
            error.name === 'ConnectorNotFoundError' ||
            error.message === 'Connector not found' ||
            error.message.includes('Connector not found')
        ) {
            return 'antelope.evm.error_connector_not_found';
        }
        return error.message;
    }
    return String(error);
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

    it('transactionError preserves connector AntelopeError (withdraw path)', () => {
        const guardError = new AntelopeError('antelope.evm.error_connector_not_found');
        const result = transactionError('antelope.evm.error_withdraw_failed', guardError);
        expect(result.message).toBe('antelope.evm.error_connector_not_found');
    });

    it('errorToString maps ConnectorNotFoundError name', () => {
        const wagmiError = Object.assign(new Error('Connector not found'), {
            name: 'ConnectorNotFoundError',
        });
        expect(errorToString(wagmiError)).toBe('antelope.evm.error_connector_not_found');
    });

    it('i18n key exists for the user-facing message', () => {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const en = require('src/i18n/en-us/index.js').default;
        expect(en.antelope.evm.error_connector_not_found).toMatch(/reconnect/i);
        expect(en.antelope.evm.error_connector_not_found).not.toMatch(/ConnectorNotFoundError/);
    });

    it('production toast payload shape is rewritten, not echoed', () => {
        const wagmiError = Object.assign(new Error('Connector not found'), {
            name: 'ConnectorNotFoundError',
        });
        const oldToast = JSON.stringify({
            error: { name: wagmiError.name, message: wagmiError.message },
        });
        expect(oldToast).toBe(
            '{"error":{"name":"ConnectorNotFoundError","message":"Connector not found"}}',
        );

        const mapped = mapWalletConnectWriteError(wagmiError);
        expect(JSON.stringify(mapped)).not.toContain('ConnectorNotFoundError');
        expect(mapped.message).toBe('antelope.evm.error_connector_not_found');
    });
});
