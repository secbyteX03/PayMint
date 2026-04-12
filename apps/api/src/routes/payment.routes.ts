import { Router, Request, Response } from 'express';
import { supabase } from '../config/prisma';
import { PaymentService } from '../services/payment.service';
import { x402Service } from '../services/x402.service';
import { webhookService } from '../services/webhook.service';

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
    
    // Notify seller agent of new payment
    try {
      const { data: service } = await supabase
        .from('services')
        .select('agentId')
        .eq('id', serviceId)
        .single();
      
      if (service?.agentId) {
        await webhookService.notifyPaymentCreated(service.agentId, {
          id: payment.id,
          amount: payment.amount,
          buyerAddress: payment.buyerAddress,
          serviceId: payment.serviceId,
        });
      }
    } catch (webhookError) {
      console.error('Webhook notification failed:', webhookError);
    }
    
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
    
    // Notify seller agent of payment completed
    if (result) {
      try {
        const { data: payment } = await supabase
          .from('payments')
          .select('serviceId, amount')
          .eq('id', paymentId)
          .single();
        
        if (payment) {
          const { data: service } = await supabase
            .from('services')
            .select('agentId')
            .eq('id', payment.serviceId)
            .single();
          
          if (service?.agentId) {
            await webhookService.notifyPaymentCompleted(service.agentId, {
              id: paymentId,
              amount: payment.amount,
              transactionHash,
            });
          }
        }
      } catch (webhookError) {
        console.error('Webhook notification failed:', webhookError);
      }
    }
    
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Request refund - sets to REFUND_REQUESTED status, waiting for seller approval
router.post('/refund', async (req: Request, res: Response) => {
  try {
    const { paymentId, reason } = req.body;
    
    if (!paymentId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const result = await paymentService.requestRefund(paymentId, reason);
    
    // Notify seller agent of refund request and create database notification
    if (result) {
      try {
        const { data: payment } = await supabase
          .from('payments')
          .select('serviceId, amount, refundReason, sellerAddress')
          .eq('id', paymentId)
          .single();
        
        if (payment) {
          const { data: service } = await supabase
            .from('services')
            .select('agentId')
            .eq('id', payment.serviceId)
            .single();
          
          if (service?.agentId) {
            await webhookService.notifyRefundRequested(service.agentId, {
              paymentId: paymentId,
              amount: payment.amount,
              reason: payment.refundReason,
            });
          }
          
          // Create notification for seller
          await supabase.from('notifications').insert({
            userAddress: payment.sellerAddress,
            type: 'REFUND_REQUESTED',
            title: 'Refund Requested',
            message: `A buyer has requested a refund of ${payment.amount} XLM. Please review and approve or reject.`,
            paymentId,
          });
        }
      } catch (webhookError) {
        console.error('Refund webhook notification failed:', webhookError);
      }
    }
    
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Approve refund - actually refunds the payment
router.post('/approve-refund', async (req: Request, res: Response) => {
  try {
    const { paymentId } = req.body;
    
    if (!paymentId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const result = await paymentService.approveRefund(paymentId);
    
    // Notify seller agent that refund was approved (funds returned to buyer)
    if (result) {
      try {
        const { data: payment } = await supabase
          .from('payments')
          .select('serviceId, amount, buyerAddress')
          .eq('id', paymentId)
          .single();
        
        if (payment) {
          const { data: service } = await supabase
            .from('services')
            .select('agentId')
            .eq('id', payment.serviceId)
            .single();
          
          if (service?.agentId) {
            await webhookService.notifyPaymentRefunded(service.agentId, {
              id: paymentId,
              amount: payment.amount,
            });
          }
          
          // Create notification for buyer that refund was approved
          await supabase.from('notifications').insert({
            userAddress: payment.buyerAddress,
            type: 'REFUND_APPROVED',
            title: 'Refund Approved',
            message: `Your refund of ${payment.amount} XLM has been approved. The funds will be returned to your wallet.`,
            paymentId,
          });
        }
      } catch (webhookError) {
        console.error('Refund approved webhook notification failed:', webhookError);
      }
    }
    
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Reject refund - goes back to ESCROW_CREATED
router.post('/reject-refund', async (req: Request, res: Response) => {
  try {
    const { paymentId } = req.body;
    
    if (!paymentId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const result = await paymentService.rejectRefund(paymentId);
    
    // Notify buyer that refund was rejected
    if (result) {
      try {
        const { data: payment } = await supabase
          .from('payments')
          .select('buyerAddress, amount')
          .eq('id', paymentId)
          .single();
        
        if (payment?.buyerAddress) {
          // Create notification for buyer
          await supabase.from('notifications').insert({
            userAddress: payment.buyerAddress,
            type: 'REFUND_REJECTED',
            title: 'Refund Rejected',
            message: `Your refund request of ${payment.amount} XLM has been rejected. You can open a dispute if you disagree.`,
            paymentId,
          });
        }
      } catch (webhookError) {
        console.error('Refund reject notification failed:', webhookError);
      }
    }
    
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Dispute payment - opens a dispute for the payment
router.post('/dispute', async (req: Request, res: Response) => {
  try {
    const { paymentId, reason } = req.body;
    
    if (!paymentId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const result = await paymentService.openDispute(paymentId, reason);
    
    // Notify seller agent of dispute and create notifications
    if (result) {
      try {
        const { data: payment } = await supabase
          .from('payments')
          .select('serviceId, sellerAddress, buyerAddress')
          .eq('id', paymentId)
          .single();
        
        if (payment) {
          const { data: service } = await supabase
            .from('services')
            .select('agentId')
            .eq('id', payment.serviceId)
            .single();
          
          if (service?.agentId) {
            await webhookService.notifyDisputeOpened(service.agentId, {
              paymentId,
              reason,
            });
          }
          
          // Create notification for seller
          await supabase.from('notifications').insert({
            userAddress: payment.sellerAddress,
            type: 'DISPUTE_OPENED',
            title: 'Dispute Opened',
            message: `A dispute has been opened for this payment. Our support team will review the case.`,
            paymentId,
          });
        }
      } catch (webhookError) {
        console.error('Dispute webhook notification failed:', webhookError);
      }
    }
    
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Resolve dispute - resolves a disputed payment
router.post('/resolve-dispute', async (req: Request, res: Response) => {
  try {
    const { paymentId, resolution, refundBuyer } = req.body;
    
    if (!paymentId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const result = await paymentService.resolveDispute(paymentId, resolution, refundBuyer);
    
    // Notify parties of dispute resolution
    if (result) {
      try {
        const { data: payment } = await supabase
          .from('payments')
          .select('serviceId, buyerAddress, sellerAddress, amount')
          .eq('id', paymentId)
          .single();
        
        if (payment) {
          const { data: service } = await supabase
            .from('services')
            .select('agentId')
            .eq('id', payment.serviceId)
            .single();
          
          // Notify seller agent
          if (service?.agentId) {
            await webhookService.notifyDisputeResolved(service.agentId, {
              paymentId,
              resolution: resolution || 'Resolved',
              refunded: refundBuyer || false,
            });
          }
          
          // Create notification for seller
          await supabase.from('notifications').insert({
            userAddress: payment.sellerAddress,
            type: 'DISPUTE_RESOLVED',
            title: 'Dispute Resolved',
            message: refundBuyer 
              ? `The dispute has been resolved and the buyer will be refunded.`
              : `The dispute has been resolved in your favor. The payment remains released.`,
            paymentId,
          });
          
          // Create notification for buyer
          await supabase.from('notifications').insert({
            userAddress: payment.buyerAddress,
            type: 'DISPUTE_RESOLVED',
            title: 'Dispute Resolved',
            message: refundBuyer 
              ? `The dispute has been resolved. You will receive a refund of ${payment.amount} XLM.`
              : `The dispute has been resolved. The payment remains with the seller.`,
            paymentId,
          });
        }
      } catch (webhookError) {
        console.error('Dispute resolution notification failed:', webhookError);
      }
    }
    
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

// Get payment details for refund transaction (seller needs to send funds back to buyer)
router.get('/:id/refund-details', async (req: Request, res: Response) => {
  try {
    const payment = await paymentService.getPaymentForRefund(req.params.id);
    
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