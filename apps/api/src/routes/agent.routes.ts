import { Router, Request, Response } from 'express';
import { agentService } from '../services/agent.service';
import prisma from '../config/prisma';

const router = Router();

// Register new agent
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { 
      ownerAddress, 
      name, 
      description,
      apiEndpoint,
      apiKey,
      webhookUrl,
      documentationUrl,
      capabilities,
      pricingModel,
      pricePerCall,
      pricePerMonth,
      logoUrl,
      websiteUrl,
      supportEmail,
      termsOfServiceUrl
    } = req.body;
    
    if (!ownerAddress || !name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const agent = await agentService.registerAgent(
      ownerAddress, 
      name, 
      description,
      apiEndpoint,
      apiKey,
      webhookUrl,
      documentationUrl,
      capabilities,
      pricingModel,
      pricePerCall ? parseFloat(pricePerCall) : undefined,
      pricePerMonth ? parseFloat(pricePerMonth) : undefined,
      logoUrl,
      websiteUrl,
      supportEmail,
      termsOfServiceUrl
    );
    res.status(201).json(agent);
  } catch (error: any) {
    console.error('Agent registration error:', error);
    res.status(500).json({ error: error.message || 'Failed to register agent' });
  }
});

// Get agent by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const agent = await agentService.getAgent(req.params.id);
    
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    
    res.json(agent);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get agent by owner address
router.get('/address/:address', async (req: Request, res: Response) => {
  try {
    const agents = await agentService.getAgentByOwner(req.params.address);
    
    // Return all agents (can have multiple agents per address)
    res.json(agents);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update agent status
router.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const agent = await agentService.updateAgentStatus(req.params.id, status);
    res.json(agent);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// List all agents
router.get('/', async (req: Request, res: Response) => {
  try {
    const agents = await agentService.listAgents();
    res.json(agents);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get agent stats
router.get('/:id/stats', async (req: Request, res: Response) => {
  try {
    const stats = await agentService.getAgentStats(req.params.id);
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update agent
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { 
      name, 
      description,
      apiEndpoint,
      apiKey,
      webhookUrl,
      documentationUrl,
      capabilities,
      pricingModel,
      pricePerCall,
      pricePerMonth,
      logoUrl,
      websiteUrl,
      supportEmail,
      termsOfServiceUrl
    } = req.body;
    
    const agent = await agentService.updateAgent(req.params.id, {
      name,
      description,
      apiEndpoint,
      apiKey,
      webhookUrl,
      documentationUrl,
      capabilities,
      pricingModel,
      pricePerCall,
      pricePerMonth,
      logoUrl,
      websiteUrl,
      supportEmail,
      termsOfServiceUrl
    });
    res.json(agent);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get agent by owner address with services count
router.get('/owner/:address', async (req: Request, res: Response) => {
  try {
    const agents = await agentService.getAgentByOwnerWithStats(req.params.address);
    res.json(agents);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Reset/clear all agents (debug endpoint)
router.delete('/reset', async (req: Request, res: Response) => {
  try {
    // Delete all payments first (due to foreign key)
    await prisma.payment.deleteMany({});
    // Delete all services
    await prisma.service.deleteMany({});
    // Delete all agents
    await prisma.agent.deleteMany({});
    res.json({ message: 'All agents, services, and payments cleared' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export { router as agentRoutes };
