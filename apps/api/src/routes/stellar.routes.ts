import { Router, Request, Response } from 'express';
import { stellarService } from '../services/stellar.service';
import { escrowService } from '../services/escrow.service';

const router = Router();

// Get server status
router.get('/status', async (req: Request, res: Response) => {
  try {
    const status = await stellarService.getNetworkStatus();
    res.json(status);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create Stellar account (for testing)
router.post('/account', async (req: Request, res: Response) => {
  try {
    const { publicKey } = req.body;
    
    if (!publicKey) {
      return res.status(400).json({ error: 'Public key required' });
    }
    
    const account = await stellarService.createTestAccount(publicKey);
    res.json(account);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get account balance
router.get('/account/:address/balance', async (req: Request, res: Response) => {
  try {
    const balance = await stellarService.getAccountBalance(req.params.address);
    res.json(balance);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Build payment transaction
router.post('/payment/build', async (req: Request, res: Response) => {
  try {
    const { from, to, amount, asset } = req.body;
    
    if (!from || !to || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const transaction = await stellarService.buildPaymentTransaction(
      from,
      to,
      amount,
      asset || 'XLM'
    );
    res.json(transaction);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Submit payment transaction
router.post('/payment/submit', async (req: Request, res: Response) => {
  try {
    const { signedTransaction } = req.body;
    
    if (!signedTransaction) {
      return res.status(400).json({ error: 'Signed transaction required' });
    }
    
    const result = await stellarService.submitTransaction(signedTransaction);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Watch for payments
router.get('/payments/:address', async (req: Request, res: Response) => {
  try {
    const payments = await stellarService.getRecentPayments(req.params.address);
    res.json(payments);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get escrow wallet address
router.get('/escrow/wallet', async (req: Request, res: Response) => {
  try {
    const wallet = escrowService.getEscrowWallet();
    res.json({ escrowWallet: wallet });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Build lock funds transaction (buyer sends to escrow)
router.post('/escrow/lock', async (req: Request, res: Response) => {
  try {
    const { from, amount, asset } = req.body;
    
    if (!from || !amount) {
      return res.status(400).json({ error: 'Missing required fields: from, amount' });
    }
    
    const transaction = await escrowService.buildLockFundsTransaction(
      from,
      amount,
      asset || 'XLM'
    );
    res.json(transaction);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Build release funds transaction (escrow sends to seller)
router.post('/escrow/release', async (req: Request, res: Response) => {
  try {
    const { to, amount, asset } = req.body;
    
    if (!to || !amount) {
      return res.status(400).json({ error: 'Missing required fields: to, amount' });
    }
    
    const transaction = await escrowService.buildReleaseFundsTransaction(
      to,
      amount,
      asset || 'XLM'
    );
    res.json(transaction);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Build refund funds transaction (escrow sends back to buyer)
router.post('/escrow/refund', async (req: Request, res: Response) => {
  try {
    const { to, amount, asset } = req.body;
    
    if (!to || !amount) {
      return res.status(400).json({ error: 'Missing required fields: to, amount' });
    }
    
    const transaction = await escrowService.buildRefundFundsTransaction(
      to,
      amount,
      asset || 'XLM'
    );
    res.json(transaction);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get escrow wallet balance
router.get('/escrow/balance', async (req: Request, res: Response) => {
  try {
    const balance = await escrowService.getEscrowBalance();
    res.json(balance);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Verify funds are locked in escrow
router.post('/escrow/verify', async (req: Request, res: Response) => {
  try {
    const { buyerAddress, amount, asset } = req.body;
    
    if (!buyerAddress || !amount) {
      return res.status(400).json({ error: 'Missing required fields: buyerAddress, amount' });
    }
    
    const verified = await escrowService.verifyFundsLocked(
      buyerAddress,
      amount,
      asset || 'XLM'
    );
    res.json({ verified });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Server-side release funds (escrow wallet signs and sends)
router.post('/escrow/release/execute', async (req: Request, res: Response) => {
  try {
    const { to, amount, asset } = req.body;
    
    if (!to || !amount) {
      return res.status(400).json({ error: 'Missing required fields: to, amount' });
    }
    
    const result = await escrowService.signAndSubmitEscrowTransaction(
      to,
      amount,
      asset || 'XLM'
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Server-side refund funds (escrow wallet signs and sends back)
router.post('/escrow/refund/execute', async (req: Request, res: Response) => {
  try {
    const { to, amount, asset } = req.body;
    
    if (!to || !amount) {
      return res.status(400).json({ error: 'Missing required fields: to, amount' });
    }
    
    // Refund uses the same method as release, just sending back to buyer
    const result = await escrowService.signAndSubmitEscrowTransaction(
      to,
      amount,
      asset || 'XLM'
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Fund escrow wallet with XLM from fee account (for testing)
router.post('/escrow/fund', async (req: Request, res: Response) => {
  try {
    const { amount } = req.body;
    const fundAmount = amount || '1000'; // Default 1000 XLM
    
    const feeSecret = process.env.FEE_SECRET;
    if (!feeSecret) {
      return res.status(500).json({ error: 'Fee account secret not configured' });
    }
    
    const StellarSdk = await import('@stellar/stellar-sdk');
    const server = new StellarSdk.Horizon.Server(process.env.HORIZON_URL || HORIZON_TESTNET_URL, { allowHttp: true });
    
    // Load fee source account
    const feeSource = process.env.FEE_SOURCE;
    let sourceAccount;
    try {
      sourceAccount = await server.loadAccount(feeSource!);
    } catch (e) {
      return res.status(400).json({ error: 'Fee account not found on network' });
    }
    
    const escrowWallet = escrowService.getEscrowWallet();
    
    // Check if escrow account exists
    let escrowExists = true;
    try {
      await server.loadAccount(escrowWallet);
    } catch (e) {
      escrowExists = false;
    }
    
    if (!escrowExists) {
      // Create escrow account first
      const createTx = new StellarSdk.TransactionBuilder(sourceAccount, {
        fee: '200',
        networkPassphrase: TESTNET_NETWORK_PASSPHRASE,
        timebounds: await getTimebounds(server),
      })
        .addOperation(
          StellarSdk.Operation.createAccount({
            destination: escrowWallet,
            startingBalance: '50',
          })
        )
        .build();
      
      const keypair = StellarSdk.Keypair.fromSecret(feeSecret);
      createTx.sign(keypair);
      
      try {
        await server.submitTransaction(createTx);
        console.log('Escrow account created!');
      } catch (submitError: any) {
        return res.status(500).json({ error: `Failed to create escrow: ${submitError.message}` });
      }
    }
    
    // Now fund the escrow
    const sourceAccount2 = await server.loadAccount(feeSource!);
    const fundTx = new StellarSdk.TransactionBuilder(sourceAccount2, {
      fee: '100',
      networkPassphrase: TESTNET_NETWORK_PASSPHRASE,
      timebounds: await getTimebounds(server),
    })
      .addOperation(
        StellarSdk.Operation.payment({
          destination: escrowWallet,
          asset: StellarSdk.Asset.native(),
          amount: fundAmount,
        })
      )
      .build();
    
    const keypair = StellarSdk.Keypair.fromSecret(feeSecret);
    fundTx.sign(keypair);
    
    try {
      const result = await server.submitTransaction(fundTx);
      res.json({ 
        success: true, 
        message: `Funded escrow with ${fundAmount} XLM`,
        transactionHash: result.hash 
      });
    } catch (submitError: any) {
      return res.status(500).json({ error: `Failed to fund escrow: ${submitError.message}` });
    }
  } catch (error: any) {
    console.error('Error funding escrow:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper function for timebounds
async function getTimebounds(server: any) {
  const currentTime = Math.floor(Date.now() / 1000);
  return { minTime: currentTime, maxTime: currentTime + 300 };
}

export { router as stellarRoutes };