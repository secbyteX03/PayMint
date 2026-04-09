import { Router, Request, Response } from 'express';
import { supabase } from '../config/prisma';
import { PaymentService } from '../services/payment.service';
import { x402Service } from '../services/x402.service';

const router = Router();
const paymentService = new PaymentService();

// Create payment (x402 handshake)
router.post('/create', async (req: Request, res: Response) => {
  try {
    const { serviceId, buyerAddress, amount, currency } = req.body;
    
    if (!serviceId || !buyerAddress || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const payment = await paymentService.createPayment(
      serviceId,
      buyerAddress,
      amount,
      currency || 'USDC'
    );
    res.status(201).json(payment);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get x402 payment header for service call
router.post('/x402/header', async (req: Request, res: Response) => {
  try {
    const { serviceId, buyerAddress } = req.body;
    
    if (!serviceId || !buyerAddress) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const header = await x402Service.createPaymentHeader(serviceId, buyerAddress);
    res.json(header);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Verify payment and release escrow
router.post('/release', async (req: Request, res: Response) => {
  try {
    const { paymentId, transactionHash } = req.body;
    
    if (!paymentId || !transactionHash) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const result = await paymentService.releasePayment(paymentId, transactionHash);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Request refund
router.post('/refund', async (req: Request, res: Response) => {
  try {
    const { paymentId, reason } = req.body;
    
    if (!paymentId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const result = await paymentService.refundPayment(paymentId, reason);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get payment status
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const payment = await paymentService.getPayment(req.params.id);
    
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    
    res.json(payment);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get payments by service
router.get('/service/:serviceId', async (req: Request, res: Response) => {
  try {
    const payments = await paymentService.getPaymentsByService(req.params.serviceId);
    res.json(payments);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get all payments
router.get('/', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*, service:services(*)')
      .order('createdAt', { ascending: false });
    
    if (error) throw error;
    res.json(data || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export { router as paymentRoutes };