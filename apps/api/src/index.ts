import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { agentRoutes } from './routes/agent.routes';
import { serviceRoutes } from './routes/service.routes';
import { paymentRoutes } from './routes/payment.routes';
import { stellarRoutes } from './routes/stellar.routes';
import { errorHandler } from './middleware/errorHandler';
import { connectDatabase } from './config/database';
import { agentDb, serviceDb, paymentDb } from './config/inMemoryDb';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Network statistics
app.get('/api/stats', (req: Request, res: Response) => {
  try {
    const allAgents = agentDb.findAll();
    const allServices = serviceDb.findAllActive();
    const allPayments = Array.from(paymentDb.findAll());
    
    const totalVolume = allPayments
      .filter(p => p.status === 'COMPLETED')
      .reduce((sum, p) => sum + p.amount, 0);
    
    res.json({
      totalAgents: allAgents.length,
      totalServices: allServices.length,
      totalPayments: allPayments.length,
      totalVolume: totalVolume.toFixed(2)
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
    console.log('Database connected successfully');
    
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