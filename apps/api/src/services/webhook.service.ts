import { supabase } from '../config/prisma';

/**
 * Webhook Service
 * 
 * Sends HTTP POST notifications to registered webhook URLs
 * when events occur in the system (payments, service calls, etc.)
 */

export interface WebhookPayload {
  event: string;
  timestamp: number;
  data: Record<string, any>;
}

export interface WebhookConfig {
  url: string;
  secret?: string;
  events: string[];
}

export class WebhookService {
  private activeWebhooks: Map<string, WebhookConfig> = new Map();

  /**
   * Register a webhook for an agent
   */
  async registerWebhook(
    agentId: string,
    url: string,
    secret?: string,
    events: string[] = ['payment.created', 'payment.completed', 'payment.refunded']
  ): Promise<void> {
    // Validate URL
    try {
      new URL(url);
    } catch {
      throw new Error('Invalid webhook URL');
    }

    // Store webhook configuration
    this.activeWebhooks.set(agentId, { url, secret, events });

    // Also store in database for persistence
    await supabase
      .from('agents')
      .update({ webhookUrl: url })
      .eq('id', agentId);
  }

  /**
   * Remove a webhook for an agent
   */
  async removeWebhook(agentId: string): Promise<void> {
    this.activeWebhooks.delete(agentId);
    
    await supabase
      .from('agents')
      .update({ webhookUrl: null })
      .eq('id', agentId);
  }

  /**
   * Load all webhooks from database into memory on server startup
   */
  async loadWebhooksFromDatabase(): Promise<void> {
    try {
      const { data: agents, error } = await supabase
        .from('agents')
        .select('id, webhookUrl')
        .not('webhookUrl', 'is', null);

      if (error) {
        console.error('Failed to load webhooks from database:', error);
        return;
      }

      if (agents && agents.length > 0) {
        for (const agent of agents) {
          this.activeWebhooks.set(agent.id, {
            url: agent.webhookUrl,
            events: ['payment.created', 'payment.completed', 'payment.refunded', 'service.called'],
          });
          console.log(`Loaded webhook for agent ${agent.id}: ${agent.webhookUrl}`);
        }
        console.log(`Loaded ${agents.length} webhooks from database`);
      }
    } catch (error) {
      console.error('Error loading webhooks from database:', error);
    }
  }

  /**
   * Get webhook config for an agent
   */
  getWebhookConfig(agentId: string): WebhookConfig | undefined {
    return this.activeWebhooks.get(agentId);
  }

  /**
   * Send webhook notification
   */
  async sendWebhook(
    agentId: string,
    event: string,
    data: Record<string, any>
  ): Promise<{ success: boolean; statusCode?: number; error?: string }> {
    const config = this.activeWebhooks.get(agentId);
    
    if (!config) {
      return { success: false, error: 'No webhook configured' };
    }

    // Check if event is subscribed
    if (!config.events.includes(event) && !config.events.includes('*')) {
      return { success: false, error: 'Event not subscribed' };
    }

    const payload: WebhookPayload = {
      event,
      timestamp: Math.floor(Date.now() / 1000),
      data,
    };

    try {
      const response = await fetch(config.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Event': event,
          'X-Agent-Id': agentId,
          ...(config.secret && { 'X-Webhook-Secret': config.secret }),
        },
        body: JSON.stringify(payload),
      });

      return {
        success: response.ok,
        statusCode: response.status,
        error: response.ok ? undefined : `HTTP ${response.status}`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  /**
   * Notify agent of new payment (escrow created)
   */
  async notifyPaymentCreated(
    agentId: string,
    payment: { id: string; amount: number; buyerAddress: string; serviceId: string }
  ): Promise<void> {
    await this.sendWebhook(agentId, 'payment.created', {
      paymentId: payment.id,
      amount: payment.amount,
      buyer: payment.buyerAddress,
      serviceId: payment.serviceId,
    });
  }

  /**
   * Notify agent of payment completed (escrow released)
   */
  async notifyPaymentCompleted(
    agentId: string,
    payment: { id: string; amount: number; transactionHash: string }
  ): Promise<void> {
    await this.sendWebhook(agentId, 'payment.completed', {
      paymentId: payment.id,
      amount: payment.amount,
      transactionHash: payment.transactionHash,
    });
  }

  /**
   * Notify agent of payment refunded
   */
  async notifyPaymentRefunded(
    agentId: string,
    payment: { id: string; amount: number; reason?: string }
  ): Promise<void> {
    await this.sendWebhook(agentId, 'payment.refunded', {
      paymentId: payment.id,
      amount: payment.amount,
      reason: payment.reason,
    });
  }

  /**
   * Notify agent of refund requested (buyer requesting refund, waiting for seller approval)
   */
  async notifyRefundRequested(
    agentId: string,
    payment: { paymentId: string; amount: number; reason?: string }
  ): Promise<void> {
    await this.sendWebhook(agentId, 'payment.refund_requested', {
      paymentId: payment.paymentId,
      amount: payment.amount,
      reason: payment.reason,
    });
  }

  /**
   * Notify agent of dispute opened
   */
  async notifyDisputeOpened(
    agentId: string,
    dispute: { paymentId: string; reason?: string }
  ): Promise<void> {
    await this.sendWebhook(agentId, 'payment.dispute_opened', {
      paymentId: dispute.paymentId,
      reason: dispute.reason,
    });
  }

  /**
   * Notify agent of dispute resolved
   */
  async notifyDisputeResolved(
    agentId: string,
    dispute: { paymentId: string; resolution: string; refunded: boolean }
  ): Promise<void> {
    await this.sendWebhook(agentId, 'payment.dispute_resolved', {
      paymentId: dispute.paymentId,
      resolution: dispute.resolution,
      refunded: dispute.refunded,
    });
  }

  /**
   * Notify agent of new service call
   */
  async notifyServiceCalled(
    agentId: string,
    serviceCall: { serviceId: string; buyerAddress: string; timestamp: number }
  ): Promise<void> {
    await this.sendWebhook(agentId, 'service.called', {
      serviceId: serviceCall.serviceId,
      buyer: serviceCall.buyerAddress,
      timestamp: serviceCall.timestamp,
    });
  }

  /**
   * Health check - test webhook URL
   */
  async testWebhook(
    url: string,
    secret?: string
  ): Promise<{ success: boolean; responseTime?: number; error?: string }> {
    const startTime = Date.now();
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Event': 'health_check',
          ...(secret && { 'X-Webhook-Secret': secret }),
        },
        body: JSON.stringify({
          event: 'health_check',
          timestamp: Math.floor(Date.now() / 1000),
          data: { message: 'Webhook health check' },
        }),
      });

      const responseTime = Date.now() - startTime;
      
      return {
        success: response.ok,
        responseTime,
        error: response.ok ? undefined : `HTTP ${response.status}`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }
}

export const webhookService = new WebhookService();
