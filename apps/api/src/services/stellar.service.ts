/**
 * Stellar Service - Simplified mock implementation
 * 
 * For demo purposes, this returns mock data.
 * In production, integrate with @stellar/stellar-sdk
 */

export class StellarService {
  /**
   * Get network status
   */
  async getNetworkStatus() {
    return {
      network: 'testnet',
      horizonUrl: 'https://horizon-testnet.stellar.org',
      latestLedger: 1234567,
      latestLedgerCloseTime: new Date().toISOString(),
      coreVersion: '20.0.0',
    };
  }

  /**
   * Create test account (mock)
   */
  async createTestAccount(publicKey: string) {
    return {
      address: publicKey,
      message: 'Account created (mock - use Friendbot for real testnet funds)',
    };
  }

  /**
   * Get account balance (mock)
   */
  async getAccountBalance(address: string) {
    return {
      address,
      sequence: '1234567890',
      balances: [
        { asset: 'XLM', balance: '10000.00', limit: null, isAuthorized: null },
        { asset: 'USDC', balance: '100.00', limit: '10000', isAuthorized: true },
      ],
    };
  }

  /**
   * Build payment transaction (mock)
   */
  async buildPaymentTransaction(
    from: string,
    to: string,
    amount: string,
    assetCode: string = 'XLM'
  ): Promise<{
    transactionXdr: string;
    fee: string;
    sequence: string;
  }> {
    return {
      transactionXdr: 'mock_xdr_' + Date.now(),
      fee: '100',
      sequence: '1234567890',
    };
  }

  /**
   * Submit signed transaction (mock)
   */
  async submitTransaction(signedTransactionXdr: string): Promise<{
    hash: string;
    ledger: number;
    timestamp: string;
  }> {
    return {
      hash: 'mock_hash_' + Date.now(),
      ledger: 1234567,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get recent payments (mock)
   */
  async getRecentPayments(address: string, limit: number = 10) {
    return [];
  }

  /**
   * Stream payments (mock - returns cleanup function)
   */
  streamPayments(
    address: string,
    callback: (payment: unknown) => void
  ): () => void {
    return () => {};
  }

  /**
   * Build trustline transaction (mock)
   */
  async buildTrustlineTransaction(
    address: string,
    assetCode: string,
    issuer: string
  ): Promise<string> {
    return 'mock_trustline_xdr_' + Date.now();
  }
}

export const stellarService = new StellarService();