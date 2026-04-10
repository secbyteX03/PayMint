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

// Cancel payment (only for PENDING status, before escrow is created)
router.post('/cancel', async (req: Request, res: Response) => {
  try {
    const { paymentId, reason } = req.body;
    
    if (!paymentId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const result = await paymentService.cancelPayment(paymentId, reason);
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

// Get payments by wallet address (buyer or seller)
router.get('/address/:address', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    
    if (!address) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }
    
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .or(`buyerAddress.eq.${address},sellerAddress.eq.${address}`)
      .order('createdAt', { ascending: false });
    
    if (error) throw error;
    res.json(data || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get all payments (without service join to avoid issues)
router.get('/', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .order('createdAt', { ascending: false });
    
    if (error) throw error;
    res.json(data || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get purchases with full service and agent details (for buyer's purchases page)
router.get('/buyer/:address', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    
    if (!address) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }
    
    // Get payments where user is the buyer
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('*')
      .eq('buyerAddress', address)
      .order('createdAt', { ascending: false });
    
    if (paymentsError) throw paymentsError;
    
    if (!payments || payments.length === 0) {
      return res.json([]);
    }
    
    // Get service IDs from payments
    const serviceIds = payments.map(p => p.serviceId);
    
    // Get services details
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('*')
      .in('id', serviceIds);
    
    if (servicesError) throw servicesError;
    
    // Get agent IDs from services
    const agentIds = services ? [...new Set(services.map(s => s.agentId))] : [];
    
    // Get agents details
    const { data: agents, error: agentsError } = await supabase
      .from('agents')
      .select('*')
      .in('id', agentIds);
    
    if (agentsError) throw agentsError;
    
    // Build the response with nested data
    const purchases = payments.map(payment => {
      const service = services?.find(s => s.id === payment.serviceId);
      const agent = agents?.find(a => a && service && a.id === service.agentId);
      
      return {
        ...payment,
        service: service || null,
        agent: agent || null
      };
    });
    
    res.json(purchases);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export { router as paymentRoutes };