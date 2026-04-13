import { Router, Request, Response } from 'express';
import { supabase } from '../config/prisma';
import { PaymentService } from '../services/payment.service';
import { x402Service } from '../services/x402.service';
import { webhookService } from '../services/webhook.service';
import { escrowService } from '../services/escrow.service';

const router = Router();
const paymentService = new PaymentService();

// Get escrow wallet address (for frontend to know where to send funds)
router.get('/escrow/wallet', async (req: Request, res: Response) => {
  try {
    const wallet = escrowService.getEscrowWallet();
    res.json({ escrowWallet: wallet });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create payment and get escrow lock instructions
router.post('/create', async (req: Request, res: Response) => {
  try {
    const { serviceId, buyerAddress, amount, currency } = req.body;
    
    if (!serviceId || !buyerAddress || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Get escrow wallet address
    const escrowWallet = escrowService.getEscrowWallet();
    
    // Create payment record with ESCROW_PENDING status (waiting for funds to be locked)
    const payment = await paymentService.createPayment(
      serviceId,
      buyerAddress,
      amount,
      currency || 'USDC'
    );
    
    // Return the payment along with escrow instructions
    res.status(201).json({
      ...payment,
      escrowWallet,
      needsLock: true, // Frontend should call lock endpoint
      message: `Send ${amount} ${currency || 'XLM'} to escrow wallet ${escrowWallet}`
    });
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

// Confirm escrow lock - record transaction hash after buyer sends funds to escrow
router.post('/lock-confirm', async (req: Request, res: Response) => {
  try {
    const { paymentId, transactionHash } = req.body;
    
    if (!paymentId || !transactionHash) {
      return res.status(400).json({ error: 'Missing required fields: paymentId, transactionHash' });
    }
    
    // Get payment details
    const { data: payment, error: fetchError } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single();
    
    if (fetchError || !payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    
    if (payment.status !== 'ESCROW_CREATED') {
      return res.status(400).json({ error: 'Payment is not in escrow status' });
    }
    
    // Record the transaction hash
    const { data: updatedPayment, error: updateError } = await supabase
      .from('payments')
      .update({ 
        transactionHash: transactionHash,
        status: 'ESCROW_LOCKED'
      })
      .eq('id', paymentId)
      .select()
      .single();
    
    if (updateError) {
      console.error('Error recording transaction hash:', updateError);
      return res.status(500).json({ error: 'Failed to record transaction hash' });
    }
    
    console.log('Escrow lock confirmed for payment:', paymentId, { transactionHash });
    
    res.json({
      success: true,
      payment: updatedPayment,
      message: 'Transaction hash recorded. Funds are now locked in escrow.'
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Verify payment and release escrow (sends funds from escrow to seller)
router.post('/release', async (req: Request, res: Response) => {
  try {
    const { paymentId, transactionHash } = req.body;
    
    if (!paymentId) {
      return res.status(400).json({ error: 'Missing required fields: paymentId' });
    }
    
    // Get payment details
    const { data: payment, error: fetchError } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single();
    
    if (fetchError || !payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    
    if (payment.status !== 'ESCROW_CREATED') {
      return res.status(400).json({ error: 'Payment is not in escrow status' });
    }
    
    // Execute release: send funds from escrow to seller
    try {
      const releaseResult = await escrowService.signAndSubmitEscrowTransaction(
        payment.sellerAddress,
        payment.amount.toString(),
        payment.currency || 'XLM'
      );
      
      console.log('Escrow release transaction:', releaseResult);
    } catch (escrowError: any) {
      console.error('Escrow release failed:', escrowError);
      return res.status(500).json({ error: `Escrow release failed: ${escrowError.message}` });
    }
    
    // Update payment status
    const result = await paymentService.releasePayment(paymentId, transactionHash || 'escrow_release');
    
    // Notify seller agent of payment completed
    if (result) {
      try {
        const { data: service } = await supabase
          .from('services')
          .select('agentId')
          .eq('id', payment.serviceId)
          .single();
        
        if (service?.agentId) {
          await webhookService.notifyPaymentCompleted(service.agentId, {
            id: paymentId,
            amount: payment.amount,
            transactionHash: 'escrow_release',
          });
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

// Approve refund - actually refunds the payment (sends funds from escrow back to buyer)
router.post('/approve-refund', async (req: Request, res: Response) => {
  try {
    const { paymentId } = req.body;
    
    if (!paymentId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Get payment details first
    const { data: payment, error: fetchError } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single();
    
    if (fetchError || !payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    
    if (payment.status !== 'REFUND_REQUESTED') {
      return res.status(400).json({ error: 'No refund request to approve' });
    }
    
    // Execute refund: send funds from escrow back to buyer
    try {
      const refundResult = await escrowService.signAndSubmitEscrowTransaction(
        payment.buyerAddress,
        payment.amount.toString(),
        payment.currency || 'XLM'
      );
      
      console.log('Escrow refund transaction:', refundResult);
    } catch (escrowError: any) {
      console.error('Escrow refund failed:', escrowError);
      return res.status(500).json({ error: `Escrow refund failed: ${escrowError.message}` });
    }
    
    // Update payment status
    const result = await paymentService.approveRefund(paymentId);
    
    // Notify seller agent that refund was approved (funds returned to buyer)
    if (result) {
      try {
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
          user_address: payment.buyerAddress,
          type: 'REFUND_APPROVED',
          title: 'Refund Approved',
          message: `Your refund of ${payment.amount} XLM has been approved. The funds will be returned to your wallet.`,
          paymentId,
        });
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
    
    // Get payment details first
    const { data: payment, error: fetchError } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single();
    
    if (fetchError || !payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    
    if (payment.status !== 'DISPUTED') {
      return res.status(400).json({ error: 'Payment is not in disputed status' });
    }
    
    // Validate that escrow was actually created (funds were locked)
    // Check for ESCROW_CREATED status (payment created) or ESCROW_LOCKED (funds confirmed)
    // or transactionHash/escrowId exists
    const hasEscrow = !!(payment.escrowId || payment.transactionHash || payment.status === 'ESCROW_LOCKED');
    if (!hasEscrow) {
      console.warn('No escrow found for payment:', paymentId, { escrowId: payment.escrowId, txHash: payment.transactionHash });
      console.warn('Proceeding with dispute resolution WITHOUT Stellar transaction. Funds may not have been locked.');
    }
    
    // Execute escrow transaction only if escrow exists
    if (hasEscrow) {
      // Check if escrow secret is configured
      if (!process.env.ESCROW_SECRET) {
        console.error('ESCROW_SECRET not configured');
        return res.status(500).json({ error: 'Escrow wallet is not configured. Please contact administrator.' });
      }
      
      // Execute escrow transaction if refunding buyer
      if (refundBuyer) {
        try {
          const refundResult = await escrowService.signAndSubmitEscrowTransaction(
            payment.buyerAddress,
            payment.amount.toString(),
            payment.currency || 'XLM'
          );
          console.log('Dispute resolution - refund to buyer:', refundResult);
        } catch (escrowError: any) {
          console.error('Escrow refund failed during dispute resolution:', escrowError);
          return res.status(500).json({ error: `Escrow refund failed: ${escrowError.message}` });
        }
      } else {
        // Release funds to seller (they weren't released before since payment was disputed)
        try {
          const releaseResult = await escrowService.signAndSubmitEscrowTransaction(
            payment.sellerAddress,
            payment.amount.toString(),
            payment.currency || 'XLM'
          );
          console.log('Dispute resolution - release to seller:', releaseResult);
        } catch (escrowError: any) {
          console.error('Escrow release failed during dispute resolution:', escrowError);
          return res.status(500).json({ error: `Escrow release failed: ${escrowError.message}` });
        }
      }
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
    // Check if there's an address query parameter (for user-specific payments)
    const address = req.query.address as string;
    
    let query = supabase
      .from('payments')
      .select('*');
    
    // If address is provided, filter by buyer or seller
    if (address) {
      query = query.or(`buyerAddress.eq.${address},sellerAddress.eq.${address})`);
    }
    
    const { data, error } = await query.order('createdAt', { ascending: false }).limit(200);
    
    if (error) {
      console.error('Error fetching payments:', error);
      return res.status(500).json({ error: error.message });
    }
    
    console.log('Fetched payments:', data?.length || 0);
    res.json(data || []);
  } catch (error: any) {
    console.error('Error in payments route:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create test payment for testing dispute resolution
router.post('/test/create', async (req: Request, res: Response) => {
  try {
    // First get an existing service
    const { data: services } = await supabase
      .from('services')
      .select('id, agentId')
      .limit(1);
    
    if (!services || services.length === 0) {
      return res.status(400).json({ error: 'No services available to create test payment' });
    }
    
    const service = services[0];
    
    // Get the agent's owner address (seller)
    const { data: agent } = await supabase
      .from('agents')
      .select('ownerAddress')
      .eq('id', service.agentId)
      .single();
    
    if (!agent) {
      return res.status(400).json({ error: 'Agent not found' });
    }
    
    // Generate random test addresses
    const buyerAddress = 'G' + Math.random().toString(36).substring(2, 58).padEnd(56, 'A').slice(0, 56);
    const sellerAddress = agent.ownerAddress;
    
    // Create a disputed payment
    const { data: payment, error } = await supabase
      .from('payments')
      .insert({
        serviceId: service.id,
        buyerAddress,
        sellerAddress,
        amount: 100,
        currency: 'XLM',
        status: 'DISPUTED',
        refundReason: 'Test dispute - buyer claims service not delivered',
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating test payment:', error);
      return res.status(500).json({ error: error.message });
    }
    
    res.json({ 
      message: 'Test disputed payment created', 
      payment 
    });
  } catch (error: any) {
    console.error('Error creating test payment:', error);
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