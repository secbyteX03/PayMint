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
