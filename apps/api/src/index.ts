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
import { errorHandler } from './middleware/errorHandler';
import { connectDatabase, supabase } from './config/database';

const app: Express = express();
const PORT = process.env.PORT || 3001;

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

// Error handling
app.use(errorHandler);

// Start server
async function startServer() {
  try {
    // Connect to database
    await connectDatabase();

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

export default app;
