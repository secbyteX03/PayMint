import dotenv from 'dotenv';
dotenv.config();

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { agentRoutes } from './routes/agent.routes';
import { serviceRoutes } from './routes/service.routes';
import { paymentRoutes } from './routes/payment.routes';
import { stellarRoutes } from './routes/stellar.routes';
import { webhookRoutes } from './routes/webhook.routes';
import { notificationRoutes } from './routes/notification.routes';
import { webhookService } from './services/webhook.service';
import { errorHandler } from './middleware/errorHandler';
import { connectDatabase, supabase } from './config/database';
import { escrowService } from './services/escrow.service';

const app: Express = express();
const PORT = process.env.PORT || 3001;
const ESCROW_TIMEOUT_HOURS = 12; // Auto-release after 12 hours

// Only run auto-release interval in development (not on Vercel serverless)
const isDev = process.env.NODE_ENV !== 'production';

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', async (req: Request, res: Response) => {
  try {
    // Check database connection
    const { error } = await supabase.from('agents').select('id').limit(1);
    res.json({ status: 'ok', database: error ? 'error' : 'connected', timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ status: 'error', database: 'disconnected', timestamp: new Date().toISOString() });
  }
});

// Network statistics
app.get('/api/stats', async (req: Request, res: Response) => {
  try {
    const [agentsRes, servicesRes, paymentsRes] = await Promise.all([
      supabase.from('agents').select('*'),
      supabase.from('services').select('*').eq('isActive', true),
      supabase.from('payments').select('*'),
    ]);

    const allAgents = agentsRes.data || [];
    const allServices = servicesRes.data || [];
    const allPayments = paymentsRes.data || [];

    const totalVolume = allPayments
      .filter((p: any) => p.status === 'COMPLETED')
      .reduce((sum: number, p: any) => sum + Number(p.amount), 0);

    res.json({
      totalAgents: allAgents.length,
      totalServices: allServices.length,
      totalPayments: allPayments.length,
      totalVolume: totalVolume.toFixed(2),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// User-specific stats (by wallet address)
app.get('/api/stats/user/:address', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    
    if (!address) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    // Get user's agent(s)
    const { data: userAgents } = await supabase
      .from('agents')
      .select('*')
      .eq('ownerAddress', address);

    const userAgentIds = userAgents?.map(a => a.id) || [];

    // Get services for user's agent(s)
    const { data: userServices } = await supabase
      .from('services')
      .select('*')
      .in('agentId', userAgentIds.length > 0 ? userAgentIds : ['__empty__']);

    // Get payments for user's agent(s)
    const { data: userPayments } = await supabase
      .from('payments')
      .select('*')
      .eq('sellerAddress', address);

    // Calculate stats
    const completedPayments = userPayments?.filter(p => p.status === 'COMPLETED') || [];
    const totalRevenue = completedPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const activeEscrows = userServices?.filter(s => s.isActive).length || 0;

    res.json({
      totalRevenue: totalRevenue.toFixed(2),
      apiCalls: userPayments?.length || 0,
      activeEscrows: activeEscrows,
      agentCount: userAgents?.length || 0,
      serviceCount: userServices?.length || 0,
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ error: 'Failed to fetch user stats' });
  }
});

// API Routes
app.use('/api/agents', agentRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/stellar', stellarRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/notifications', notificationRoutes);

// Cron job endpoint for auto-release (called by Vercel Cron)
app.post('/api/cron/auto-release', async (req: Request, res: Response) => {
  try {
    // Verify cron secret for security
    const cronSecret = req.headers['x-cron-secret'];
    if (cronSecret !== process.env.CRON_SECRET) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    await checkAndAutoReleaseEscrows();
    res.json({ success: true, message: 'Auto-release check completed' });
  } catch (error) {
    console.error('Cron auto-release error:', error);
    res.status(500).json({ error: 'Auto-release check failed' });
  }
});

// Error handling
app.use(errorHandler);

// Start server
async function startServer() {
  try {
    // Connect to database
    await connectDatabase();

    // Load webhooks from database into memory
    await webhookService.loadWebhooksFromDatabase();

    // Start auto-release check interval (every 5 minutes) - only in development
    if (isDev) {
      setInterval(async () => {
        await checkAndAutoReleaseEscrows();
      }, 5 * 60 * 1000);
      
      // Run initial check on startup
      await checkAndAutoReleaseEscrows();
    }

    app.listen(PORT, () => {
      console.log(`AgentPay API running on port ${PORT}`);
      console.log(`Stellar Network: ${process.env.STELLAR_NETWORK || 'testnet'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

// Auto-release escrows that have been in ESCROW_CREATED status for more than X hours
async function checkAndAutoReleaseEscrows() {
  try {
    console.log('[Auto-Release] Checking for escrows to auto-release...');
    
    const twelveHoursAgo = new Date(Date.now() - ESCROW_TIMEOUT_HOURS * 60 * 60 * 1000).toISOString();
    
    // Find payments that have been in ESCROW_CREATED status for more than 12 hours
    // Exclude payments that have refund requests or disputes
    const { data: staleEscrows, error } = await supabase
      .from('payments')
      .select('*')
      .eq('status', 'ESCROW_CREATED')
      .lt('createdAt', twelveHoursAgo);
    
    if (error) {
      console.error('[Auto-Release] Error fetching stale escrows:', error);
      return;
    }
    
    if (!staleEscrows || staleEscrows.length === 0) {
      console.log('[Auto-Release] No escrows to auto-release');
      return;
    }
    
    console.log(`[Auto-Release] Found ${staleEscrows.length} escrows to auto-release`);
    
    for (const payment of staleEscrows) {
      try {
        // Release funds to seller
        const result = await escrowService.signAndSubmitEscrowTransaction(
          payment.sellerAddress,
          payment.amount.toString(),
          payment.currency || 'XLM'
        );
        
        if (result.success) {
          // Update payment status to COMPLETED
          await supabase
            .from('payments')
            .update({ status: 'COMPLETED' })
            .eq('id', payment.id);
          
          // Create notification for buyer
          await supabase.from('notifications').insert({
            userAddress: payment.buyerAddress,
            type: 'AUTO_RELEASE',
            title: 'Payment Auto-Released',
            message: `Your payment of ${payment.amount} ${payment.currency || 'XLM'} has been automatically released to the seller after 12 hours.`
          });
          
          // Create notification for seller
          await supabase.from('notifications').insert({
            userAddress: payment.sellerAddress,
            type: 'PAYMENT_RECEIVED',
            title: 'Payment Received',
            message: `You received ${payment.amount} ${payment.currency || 'XLM'} from an auto-released escrow.`
          });
          
          console.log(`[Auto-Release] Successfully auto-released payment ${payment.id} to ${payment.sellerAddress}`);
        }
      } catch (releaseError) {
        console.error(`[Auto-Release] Failed to release payment ${payment.id}:`, releaseError);
      }
    }
  } catch (error) {
    console.error('[Auto-Release] Error in auto-release check:', error);
  }
}

export default app;
