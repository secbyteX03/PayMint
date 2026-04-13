import { supabase } from '../config/prisma';

export class PaymentService {
  async createPayment(
    serviceId: string,
    buyerAddress: string,
    amount: number,
    currency: string
  ) {
    // Verify service exists and is active
    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select('*')
      .eq('id', serviceId)
      .single();

    if (serviceError || !service || !service.isActive) {
      throw new Error('Service not found or not active');
    }

    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('*')
      .eq('id', service.agentId)
      .single();

    if (agentError || !agent) {
      throw new Error('Agent not found');
    }

    // Create payment record
    const { data, error } = await supabase
      .from('payments')
      .insert({
        serviceId,
        buyerAddress,
        sellerAddress: agent.ownerAddress,
        amount,
        currency,
        status: 'ESCROW_CREATED', // Payment created and funds locked in escrow
      })
      .select()
      .single();

    // Log warning if escrow secret is not configured
    if (!process.env.ESCROW_SECRET) {
      console.warn('WARNING: ESCROW_SECRET not configured. Release/Refund will fail!');
    }

    if (error) throw new Error(error.message);
    return data;
  }

  async getPayment(id: string) {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data;
  }

  async getPaymentsByService(serviceId: string) {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('serviceId', serviceId);

    if (error) throw new Error(error.message);
    return data || [];
  }

  async releasePayment(paymentId: string, transactionHash: string) {
    const { data: payment, error: fetchError } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single();

    if (fetchError || !payment) {
      throw new Error('Payment not found');
    }

    if (payment.status !== 'PENDING' && payment.status !== 'ESCROW_CREATED') {
      throw new Error('Payment already processed');
    }

    // Update payment status
    const { data: updated, error } = await supabase
      .from('payments')
      .update({
        status: 'COMPLETED',
        transactionHash,
      })
      .eq('id', paymentId)
      .select()
      .single();

    if (error) throw new Error(error.message);

    // Increment service call count
    const { data: service } = await supabase
      .from('services')
      .select('totalCalls')
      .eq('id', payment.serviceId)
      .single();

    if (service) {
      await supabase
        .from('services')
        .update({ totalCalls: (service.totalCalls || 0) + 1 })
        .eq('id', payment.serviceId);
    }

    return updated;
  }

  async requestRefund(paymentId: string, reason?: string) {
    const { data: payment, error: fetchError } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single();

    if (fetchError || !payment) {
      throw new Error('Payment not found');
    }

    if (payment.status !== 'ESCROW_CREATED') {
      throw new Error('Only ESCROW_CREATED payments can have refund requested');
    }

    // Set status to REFUND_REQUESTED - waiting for seller approval
    const { data: updated, error } = await supabase
      .from('payments')
      .update({
        status: 'REFUND_REQUESTED',
        refundReason: reason,
      })
      .eq('id', paymentId)
      .select('*, services(*)')
      .single();

    if (error) throw new Error(error.message);
    return updated;
  }

  async approveRefund(paymentId: string) {
    const { data: payment, error: fetchError } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single();

    if (fetchError || !payment) {
      throw new Error('Payment not found');
    }

    if (payment.status !== 'REFUND_REQUESTED') {
      throw new Error('No refund request to approve');
    }

    // Actually refund the payment - update status to REFUNDED
    // Note: The actual fund transfer should be handled via Stellar transaction
    // This is done from the frontend after approval
    const { data: updated, error } = await supabase
      .from('payments')
      .update({
        status: 'REFUNDED',
      })
      .eq('id', paymentId)
      .select('*, services(*)')
      .single();

    if (error) throw new Error(error.message);
    return updated;
  }

  // Get payment details needed for refund transaction
  async getPaymentForRefund(paymentId: string) {
    const { data: payment, error: fetchError } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single();

    if (fetchError || !payment) {
      throw new Error('Payment not found');
    }

    return {
      sellerAddress: payment.sellerAddress,
      buyerAddress: payment.buyerAddress,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
    };
  }

  async rejectRefund(paymentId: string) {
    const { data: payment, error: fetchError } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single();

    if (fetchError || !payment) {
      throw new Error('Payment not found');
    }

    if (payment.status !== 'REFUND_REQUESTED') {
      throw new Error('No refund request to reject');
    }

    // Reject refund - set status to REFUND_REJECTED
    console.log('Rejecting refund for payment:', paymentId, 'Current status:', payment.status);
    const { data: updated, error } = await supabase
      .from('payments')
      .update({
        status: 'REFUND_REJECTED',
      })
      .eq('id', paymentId)
      .select('*, services(*)')
      .single();

    if (error) {
      console.error('Error updating status to REFUND_REJECTED:', error);
      throw new Error(error.message);
    }
    console.log('Payment updated to REFUND_REJECTED:', updated);
    return updated;
  }

  async openDispute(paymentId: string, reason?: string) {
    console.log('openDispute called with paymentId:', paymentId, 'reason:', reason);
    const { data: payment, error: fetchError } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single();

    console.log('Fetched payment:', payment);
    console.log('Fetch error:', fetchError);

    if (fetchError || !payment) {
      throw new Error('Payment not found');
    }

    // Can open dispute for ESCROW_CREATED, REFUND_REQUESTED, or REFUND_REJECTED
    console.log('Current payment status:', payment.status);
    if (payment.status !== 'ESCROW_CREATED' && payment.status !== 'REFUND_REQUESTED' && payment.status !== 'REFUND_REJECTED') {
      throw new Error('Cannot open dispute for this payment status: ' + payment.status);
    }

    // Set status to DISPUTED - just update status without the extra columns to avoid schema cache issues
    const { data: updatedPayment, error } = await supabase
      .from('payments')
      .update({ status: 'DISPUTED' })
      .eq('id', paymentId)
      .select('*')
      .single();

    if (error) {
      console.error('Error updating payment to DISPUTED:', error);
      throw new Error(error.message);
    }
    
    // Now update the dispute reason separately
    if (reason) {
      await supabase
        .from('payments')
        .update({ disputeReason: reason })
        .eq('id', paymentId);
    }
    
    return updatedPayment;
  }

  async resolveDispute(paymentId: string, resolution?: string, refundBuyer: boolean = false) {
    const { data: payment, error: fetchError } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single();

    if (fetchError || !payment) {
      throw new Error('Payment not found');
    }

    if (payment.status !== 'DISPUTED') {
      throw new Error('No disputed payment to resolve');
    }

    // Resolve the dispute - either refund buyer or keep for seller
    const newStatus = refundBuyer ? 'REFUNDED' : 'COMPLETED';
    
    const { data: updated, error } = await supabase
      .from('payments')
      .update({
        status: newStatus,
        refundReason: resolution || (refundBuyer ? 'Refund via dispute resolution' : 'Kept via dispute resolution'),
      })
      .eq('id', paymentId)
      .select('*, services(*)')
      .single();

    if (error) throw new Error(error.message);
    return updated;
  }

  async cancelPayment(paymentId: string, reason?: string) {
    const { data: payment, error: fetchError } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single();

    if (fetchError || !payment) {
      throw new Error('Payment not found');
    }

    // Cancel is only allowed for PENDING payments (before escrow is created)
    if (payment.status !== 'PENDING') {
      throw new Error('Only PENDING payments can be cancelled. For ESCROW_CREATED, please request a refund.');
    }

    const { data: updated, error } = await supabase
      .from('payments')
      .update({
        status: 'CANCELLED',
      })
      .eq('id', paymentId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return updated;
  }

  async getPaymentStats(serviceId: string) {
    const { data: payments, error } = await supabase
      .from('payments')
      .select('*')
      .eq('serviceId', serviceId);

    if (error) throw new Error(error.message);

    const completedPayments = (payments || []).filter((p) => p.status === 'COMPLETED');
    const totalRevenue = completedPayments.reduce(
      (sum: number, p) => sum + Number(p.amount),
      0
    ).toString();

    return {
      totalPayments: payments?.length || 0,
      completedPayments: completedPayments.length,
      totalRevenue,
    };
  }
}

export const paymentService = new PaymentService();
