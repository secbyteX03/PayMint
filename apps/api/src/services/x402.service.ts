import { supabase } from '../config/prisma';

/**
 * x402 Payment Header Service
 * 
 * Implements the x402 protocol for HTTP payments.
 * x402 allows HTTP requests to include payment headers that enable
 * micropayments for API calls and services.
 * 
 * Reference: https://x402.org
 */

export interface x402PaymentHeader {
  scheme: 'stellar';
  amount: string;
  recipient: string;
  token?: string;
  description?: string;
  expires?: number;
}

export class X402PaymentService {
  /**
   * Create x402 payment header for a service call
   */
  async createPaymentHeader(
    serviceId: string,
    buyerAddress: string
  ): Promise<x402PaymentHeader> {
    // Get service details
    const { data: service, error } = await supabase
      .from('services')
      .select('*, agents(*)')
      .eq('id', serviceId)
      .single();

    if (error || !service || !service.isActive) {
      throw new Error('Service not found or not active');
    }

    if (!service.agents) {
      throw new Error('Agent not found');
    }

    // Create x402 payment header
    const header: x402PaymentHeader = {
      scheme: 'stellar',
      amount: service.pricePerCall.toString(),
      recipient: service.agents.ownerAddress,
      description: `Payment for ${service.name}`,
      expires: Math.floor(Date.now() / 1000) + 3600, // 1 hour expiry
    };

    return header;
  }

  /**
   * Verify payment header
   */
  async verifyPaymentHeader(
    header: x402PaymentHeader,
    serviceId: string
  ): Promise<boolean> {
    const { data: service, error } = await supabase
      .from('services')
      .select('*, agents(*)')
      .eq('id', serviceId)
      .single();

    if (error || !service || !service.agents) {
      return false;
    }

    // Verify recipient matches
    if (header.recipient !== service.agents.ownerAddress) {
      return false;
    }

    // Verify amount matches
    if (parseFloat(header.amount) < Number(service.pricePerCall)) {
      return false;
    }

    // Check expiry
    if (header.expires && header.expires < Math.floor(Date.now() / 1000)) {
      return false;
    }

    return true;
  }

  /**
   * Get payment schemes supported
   */
  getSupportedSchemes(): string[] {
    return ['stellar'];
  }

  /**
   * Calculate micropayment amount
   */
  calculateMicropayment(
    basePrice: number,
    quantity: number,
    discount?: number
  ): string {
    let total = basePrice * quantity;
    if (discount) {
      total = total * (1 - discount / 100);
    }
    return total.toFixed(7);
  }
}

export const x402Service = new X402PaymentService();
