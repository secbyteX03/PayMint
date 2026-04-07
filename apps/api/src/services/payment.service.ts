import { paymentDb, serviceDb, agentDb, Payment } from '../config/inMemoryDb';

export class PaymentService {
  async createPayment(
    serviceId: string,
    buyerAddress: string,
    amount: number,
    currency: string
  ): Promise<Payment> {
    // Verify service exists and is active
    const service = serviceDb.findById(serviceId);

    if (!service || !service.isActive) {
      throw new Error('Service not found or not active');
    }

    const agent = agentDb.findById(service.agentId);
    if (!agent) throw new Error('Agent not found');

    // Create payment record
    return paymentDb.create({
      serviceId,
      buyerAddress,
      sellerAddress: agent.ownerAddress,
      amount,
      currency,
      status: 'PENDING',
      transactionHash: null,
    });
  }

  async getPayment(id: string): Promise<Payment | null> {
    const payment = paymentDb.findById(id);
    if (!payment) return null;
    
    const service = serviceDb.findById(payment.serviceId);
    return { ...payment, service } as any;
  }

  async getPaymentsByService(serviceId: string): Promise<Payment[]> {
    return paymentDb.findByServiceId(serviceId);
  }

  async releasePayment(paymentId: string, transactionHash: string): Promise<Payment> {
    const payment = paymentDb.findById(paymentId);

    if (!payment) {
      throw new Error('Payment not found');
    }

    if (payment.status !== 'PENDING' && payment.status !== 'ESCROW_CREATED') {
      throw new Error('Payment already processed');
    }

    // Update payment status
    const updated = paymentDb.update(paymentId, {
      status: 'COMPLETED',
      transactionHash,
    });

    if (!updated) throw new Error('Failed to update payment');

    // Increment service call count
    serviceDb.incrementCalls(payment.serviceId);

    return updated;
  }

  async refundPayment(paymentId: string, reason?: string): Promise<Payment> {
    const payment = paymentDb.findById(paymentId);

    if (!payment) {
      throw new Error('Payment not found');
    }

    if (payment.status !== 'PENDING' && payment.status !== 'ESCROW_CREATED') {
      throw new Error('Payment already processed');
    }

    const updated = paymentDb.update(paymentId, {
      status: 'REFUNDED',
    });

    if (!updated) throw new Error('Failed to update payment');

    return updated;
  }

  async getPaymentStats(serviceId: string): Promise<{
    totalPayments: number;
    completedPayments: number;
    totalRevenue: string;
  }> {
    const payments = paymentDb.findByServiceId(serviceId);

    const completedPayments = payments.filter((p) => p.status === 'COMPLETED');
    const totalRevenue = completedPayments.reduce(
      (sum, p) => sum + p.amount,
      0
    ).toString();

    return {
      totalPayments: payments.length,
      completedPayments: completedPayments.length,
      totalRevenue,
    };
  }
}