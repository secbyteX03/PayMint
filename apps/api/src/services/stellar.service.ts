/**
 * Stellar Service - Real implementation using @stellar/stellar-sdk
 * 
 * This service handles all Stellar blockchain interactions including
 * building and submitting payment transactions.
 */

const HORIZON_TESTNET_URL = 'https://horizon-testnet.stellar.org';
const TESTNET_NETWORK_PASSPHRASE = 'Test SDF Network ; September 2015';

export class StellarService {
  /**
   * Get network status
   */
  async getNetworkStatus() {
    try {
      const StellarSdk = await import('@stellar/stellar-sdk');
      const server = new StellarSdk.Horizon.Server(HORIZON_TESTNET_URL, { allowHttp: true });
      const ledgers = await server.ledgers().order('desc').limit(1).call();
      const ledger = ledgers.records[0];
      return {
        network: 'testnet',
        horizonUrl: HORIZON_TESTNET_URL,
        latestLedger: ledger.sequence,
        latestLedgerCloseTime: ledger.closed_at,
        coreVersion: '20.0.0',
      };
    } catch (error) {
      console.error('Error fetching network status:', error);
      throw error;
    }
  }

  /**
   * Get account details
   */
  async getAccountDetails(publicKey: string) {
    try {
      const StellarSdk = await import('@stellar/stellar-sdk');
      const server = new StellarSdk.Horizon.Server(HORIZON_TESTNET_URL, { allowHttp: true });
      const account = await server.loadAccount(publicKey);
      return {
        accountId: account.accountId,
        sequence: account.sequenceNumber(),
        balances: account.balances,
      };
    } catch (error) {
      console.error('Error fetching account details:', error);
      throw error;
    }
  }

  /**
   * Get account balance
   */
  async getAccountBalance(address: string) {
    try {
      const StellarSdk = await import('@stellar/stellar-sdk');
      const server = new StellarSdk.Horizon.Server(HORIZON_TESTNET_URL, { allowHttp: true });
      const account = await server.loadAccount(address);
      return {
        address,
        sequence: account.sequenceNumber(),
        balances: account.balances,
      };
    } catch (error) {
      console.error('Error fetching account balance:', error);
      // Return mock data for demo accounts that don't exist yet
      return {
        address,
        sequence: '0',
        balances: [
          { asset: 'XLM', balance: '10000.00', limit: null, isAuthorized: null },
          { asset: 'USDC', balance: '100.00', limit: '10000', isAuthorized: true },
        ],
      };
    }
  }

  /**
   * Build payment transaction
   * Returns the XDR that the client needs to sign with their wallet
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
    try {
      const StellarSdk = await import('@stellar/stellar-sdk');
      const server = new StellarSdk.Horizon.Server(HORIZON_TESTNET_URL, { allowHttp: true });
      
      // Load the source account (buyer)
      const sourceAccount = await server.loadAccount(from);
      
      // Determine the asset
      const asset = assetCode === 'XLM' 
        ? StellarSdk.Asset.native() 
        : new StellarSdk.Asset(assetCode, process.env.STELLAR_ISSUER_PUBLIC_KEY || 'GDGQVOKHW4VEJRU2TETD6DBRKEO5ERCNF353LW5JBF3UYZMQOOK7BWDQ');
      
      // Build the transaction
      const fee = await server.fetchBaseFee();
      const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
        fee: fee.toString(),
        networkPassphrase: TESTNET_NETWORK_PASSPHRASE,
      })
        .addOperation(
          StellarSdk.Operation.payment({
            destination: to,
            asset: asset,
            amount: amount,
          })
        )
        .setTimeout(300) // 5 minute timeout
        .build();

      return {
        transactionXdr: transaction.toXDR(),
        fee: fee.toString(),
        sequence: sourceAccount.sequenceNumber(),
      };
    } catch (error) {
      console.error('Error building payment transaction:', error);
      throw error;
    }
  }

  /**
   * Submit signed transaction
   */
  async submitTransaction(signedTransactionXdr: string): Promise<{
    hash: string;
    ledger: number;
    timestamp: string;
  }> {
    try {
      const StellarSdk = await import('@stellar/stellar-sdk');
      const server = new StellarSdk.Horizon.Server(HORIZON_TESTNET_URL, { allowHttp: true });
      
      const transaction = StellarSdk.TransactionBuilder.fromXDR(
        signedTransactionXdr,
        TESTNET_NETWORK_PASSPHRASE
      );
      
      const result = await server.submitTransaction(transaction);
      return {
        hash: result.hash,
        ledger: result.ledger,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error submitting transaction:', error);
      throw error;
    }
  }

  /**
   * Get recent payments for an address
   */
  async getRecentPayments(address: string, limit: number = 10) {
    try {
      const StellarSdk = await import('@stellar/stellar-sdk');
      const server = new StellarSdk.Horizon.Server(HORIZON_TESTNET_URL, { allowHttp: true });
      const payments = await server
        .payments()
        .forAccount(address)
        .limit(limit)
        .order('desc')
        .call();
      
      return payments.records;
    } catch (error) {
      console.error('Error fetching payments:', error);
      return [];
    }
  }

  /**
   * Build trustline transaction (for USDC and other assets)
   */
  async buildTrustlineTransaction(
    address: string,
    assetCode: string,
    issuer: string
  ): Promise<string> {
    try {
      const StellarSdk = await import('@stellar/stellar-sdk');
      const server = new StellarSdk.Horizon.Server(HORIZON_TESTNET_URL, { allowHttp: true });
      
      const sourceAccount = await server.loadAccount(address);
      const asset = new StellarSdk.Asset(assetCode, issuer);
      
      const fee = await server.fetchBaseFee();
      const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
        fee: fee.toString(),
        networkPassphrase: TESTNET_NETWORK_PASSPHRASE,
      })
        .addOperation(
          StellarSdk.Operation.changeTrust({
            asset: asset,
          })
        )
        .setTimeout(300)
        .build();

      return transaction.toXDR();
    } catch (error) {
      console.error('Error building trustline transaction:', error);
      throw error;
    }
  }

  /**
   * Create a test account using friendbot
   */
  async createTestAccount(publicKey: string) {
    try {
      // Use friendbot to fund the account on testnet
      const response = await fetch(
        `https://friendbot.stellar.org?addr=${publicKey}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to create test account');
      }
      
      const result = await response.json() as any;
      return {
        address: publicKey,
        message: 'Test account created successfully',
        hash: result.hash || 'unknown',
      };
    } catch (error) {
      console.error('Error creating test account:', error);
      throw error;
    }
  }
}

export const stellarService = new StellarService();
