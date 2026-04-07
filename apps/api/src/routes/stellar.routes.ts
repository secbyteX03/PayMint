import { Router, Request, Response } from 'express';
import { stellarService } from '../services/stellar.service';

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

export { router as stellarRoutes };