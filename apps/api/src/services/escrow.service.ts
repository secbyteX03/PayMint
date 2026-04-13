/**
 * Escrow Service - True escrow implementation using Stellar
 * 
 * This service handles real escrow transactions on Stellar blockchain:
 * - Lock funds: Buyer sends funds to escrow wallet when purchasing
 * - Release funds: Escrow wallet sends funds to seller on release
 * - Refund funds: Escrow wallet sends funds back to buyer on refund
 */

const HORIZON_TESTNET_URL = 'https://horizon-testnet.stellar.org';
const TESTNET_NETWORK_PASSPHRASE = 'Test SDF Network ; September 2015';

export class EscrowService {
  private escrowWallet: string;
  private escrowSecret: string;
  private horizonUrl: string;
  private networkPassphrase: string;

  constructor() {
    this.escrowWallet = process.env.ESCROW_WALLET || 'GBDDHIRCVK2W6C3M5J5P5P3K5X4K6J5L5X5P3K5X4K6J5L5X5P3K5X4';
    this.escrowSecret = process.env.ESCROW_SECRET || '';
    this.horizonUrl = process.env.HORIZON_URL || HORIZON_TESTNET_URL;
    this.networkPassphrase = TESTNET_NETWORK_PASSPHRASE;
  }

  /**
   * Get the escrow wallet address
   */
  getEscrowWallet(): string {
    return this.escrowWallet;
  }

  /**
   * Build transaction to lock funds into escrow
   * Buyer sends funds to escrow wallet
   */
  async buildLockFundsTransaction(
    from: string,
    amount: string,
    assetCode: string = 'XLM'
  ): Promise<{
    transactionXdr: string;
    fee: string;
    sequence: string;
    escrowWallet: string;
  }> {
    try {
      const StellarSdk = await import('@stellar/stellar-sdk');
      const server = new StellarSdk.Horizon.Server(this.horizonUrl, { allowHttp: true });
      
      // Load the source account (buyer)
      const sourceAccount = await server.loadAccount(from);
      
      // Build transaction
      const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
        fee: '100', // 0.1 XLM
        networkPassphrase: this.networkPassphrase,
        timebounds: await this.getTimebounds(server),
      })
        .addOperation(
          StellarSdk.Operation.payment({
            destination: this.escrowWallet,
            asset: assetCode === 'USDC' 
              ? new StellarSdk.Asset('USDC', process.env.USDC_ISSUER)
              : StellarSdk.Asset.native(),
            amount: amount,
          })
        )
        .build();

      return {
        transactionXdr: transaction.toXDR(),
        fee: transaction.fee,
        sequence: sourceAccount.sequenceNumber(),
        escrowWallet: this.escrowWallet,
      };
    } catch (error) {
      console.error('Error building lock funds transaction:', error);
      throw error;
    }
  }

  /**
   * Build transaction to release funds from escrow
   * Escrow wallet sends funds to seller
   */
  async buildReleaseFundsTransaction(
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
      const server = new StellarSdk.Horizon.Server(this.horizonUrl, { allowHttp: true });
      
      // Load the escrow wallet account
      const sourceAccount = await server.loadAccount(this.escrowWallet);
      
      // Build transaction
      const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
        fee: '100',
        networkPassphrase: this.networkPassphrase,
        timebounds: await this.getTimebounds(server),
      })
        .addOperation(
          StellarSdk.Operation.payment({
            destination: to,
            asset: assetCode === 'USDC'
              ? new StellarSdk.Asset('USDC', process.env.USDC_ISSUER)
              : StellarSdk.Asset.native(),
            amount: amount,
          })
        )
        .build();

      return {
        transactionXdr: transaction.toXDR(),
        fee: transaction.fee,
        sequence: sourceAccount.sequenceNumber(),
      };
    } catch (error) {
      console.error('Error building release funds transaction:', error);
      throw error;
    }
  }

  /**
   * Build transaction to refund funds from escrow
   * Escrow wallet sends funds back to buyer
   */
  async buildRefundFundsTransaction(
    to: string,
    amount: string,
    assetCode: string = 'XLM'
  ): Promise<{
    transactionXdr: string;
    fee: string;
    sequence: string;
  }> {
    // Refund uses the same logic as release, just to the original buyer
    return this.buildReleaseFundsTransaction(to, amount, assetCode);
  }

  /**
   * Get escrow wallet balance
   */
  async getEscrowBalance(): Promise<{
    address: string;
    balances: any[];
  }> {
    try {
      const StellarSdk = await import('@stellar/stellar-sdk');
      const server = new StellarSdk.Horizon.Server(this.horizonUrl, { allowHttp: true });
      const account = await server.loadAccount(this.escrowWallet);
      return {
        address: this.escrowWallet,
        balances: account.balances,
      };
    } catch (error) {
      console.error('Error fetching escrow balance:', error);
      return {
        address: this.escrowWallet,
        balances: [],
      };
    }
  }

  /**
   * Verify that funds were sent to escrow
   * This checks if a payment was made to the escrow wallet
   */
  async verifyFundsLocked(
    buyerAddress: string,
    amount: string,
    assetCode: string = 'XLM'
  ): Promise<boolean> {
    try {
      const StellarSdk = await import('@stellar/stellar-sdk');
      const server = new StellarSdk.Horizon.Server(this.horizonUrl, { allowHttp: true });
      
      // Get recent transactions for the buyer
      const transactions = await server
        .transactions()
        .forAccount(buyerAddress)
        .limit(10)
        .call();

      // Check if there's a recent payment to escrow
      for (const tx of transactions.records) {
        if (tx.successful && tx.operation_count > 0) {
          // Get operations for this transaction
          const operations = await server
            .operations()
            .forTransaction(tx.id)
            .limit(20)
            .call();

          for (const op of operations.records) {
            if (op.type === 'payment' && 
                (op as any).destination === this.escrowWallet &&
                parseFloat((op as any).amount) >= parseFloat(amount)) {
              return true;
            }
          }
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error verifying funds locked:', error);
      // If we can't verify, assume funds are not locked
      return false;
    }
  }

  /**
   * Submit a signed transaction
   */
  async submitTransaction(signedTransaction: string): Promise<{
    hash: string;
    success: boolean;
  }> {
    try {
      const StellarSdk = await import('@stellar/stellar-sdk');
      const server = new StellarSdk.Horizon.Server(this.horizonUrl, { allowHttp: true });
      
      const transaction = StellarSdk.TransactionBuilder.fromXDR(
        signedTransaction,
        this.networkPassphrase
      );
      
      const result = await server.submitTransaction(transaction);
      
      return {
        hash: result.hash,
        success: true,
      };
    } catch (error) {
      console.error('Error submitting transaction:', error);
      throw error;
    }
  }

  /**
   * Sign and submit a transaction using escrow wallet
   * This is used for release and refund transactions
   */
  async signAndSubmitEscrowTransaction(
    to: string,
    amount: string,
    assetCode: string = 'XLM'
  ): Promise<{
    hash: string;
    success: boolean;
  }> {
    if (!this.escrowSecret) {
      throw new Error('ESCROW_SECRET environment variable not configured. Please set up the escrow wallet secret.');
    }
    
    try {
      const StellarSdk = await import('@stellar/stellar-sdk');
      const server = new StellarSdk.Horizon.Server(this.horizonUrl, { allowHttp: true });
      
      // Verify escrow account exists and get balance
      let sourceAccount;
      try {
        sourceAccount = await server.loadAccount(this.escrowWallet);
      } catch (accountError: any) {
        console.error('Failed to load escrow account:', this.escrowWallet, accountError);
        throw new Error(`Escrow wallet account not found on Stellar network: ${this.escrowWallet}. Please ensure the escrow wallet is funded.`);
      }
      
      // Build transaction
      const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
        fee: '100',
        networkPassphrase: this.networkPassphrase,
        timebounds: await this.getTimebounds(server),
      })
        .addOperation(
          StellarSdk.Operation.payment({
            destination: to,
            asset: assetCode === 'USDC'
              ? new StellarSdk.Asset('USDC', process.env.USDC_ISSUER)
              : StellarSdk.Asset.native(),
            amount: amount,
          })
        )
        .build();
      
      // Sign with escrow secret
      const keypair = StellarSdk.Keypair.fromSecret(this.escrowSecret);
      transaction.sign(keypair);
      
      // Submit
      const result = await server.submitTransaction(transaction);
      
      return {
        hash: result.hash,
        success: true,
      };
    } catch (error: any) {
      console.error('Error signing/submitting escrow transaction:', error);
      
      // Provide better error messages for common issues
      if (error.response?.status === 400) {
        const errorData = error.response?.data?.extras?.reason || error.response?.data?.detail || 'Invalid transaction';
        throw new Error(`Transaction rejected (400): ${errorData}. Please check the escrow wallet has sufficient funds and the recipient address is valid.`);
      } else if (error.response?.status === 504) {
        throw new Error('Transaction timed out. Please try again later. The Stellar network may be experiencing high load.');
      } else if (error.code === 'ERR_NETWORK') {
        throw new Error('Network error. Please check your internet connection and try again.');
      }
      
      throw error;
    }
  }

  /**
   * Get timebounds for transactions (valid for 5 minutes)
   */
  private async getTimebounds(server: any): Promise<{ minTime: number, maxTime: number }> {
    const currentTime = Math.floor(Date.now() / 1000);
    
    // Transaction valid for 5 minutes
    return {
      minTime: currentTime,
      maxTime: currentTime + 300,
    };
  }
}

export const escrowService = new EscrowService();