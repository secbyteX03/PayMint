import { Router, Request, Response } from 'express';
import { AgentService } from '../services/agent.service';

const router = Router();
const agentService = new AgentService();

// Register new agent
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { ownerAddress, name, description } = req.body;
    
    if (!ownerAddress || !name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const agent = await agentService.registerAgent(ownerAddress, name, description);
    res.status(201).json(agent);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
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
    const agent = await agentService.getAgentByOwner(req.params.address);
    
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    
    res.json(agent);
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

// Reset/clear all agents (debug endpoint)
router.delete('/reset', async (req: Request, res: Response) => {
  try {
    const { agentDb } = await import('../config/inMemoryDb');
    agentDb.deleteAll();
    res.json({ message: 'All agents cleared' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export { router as agentRoutes };