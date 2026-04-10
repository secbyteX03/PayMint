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

  async refundPayment(paymentId: string, reason?: string) {
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
