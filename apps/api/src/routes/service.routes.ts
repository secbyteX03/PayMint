import { Router, Request, Response } from 'express';
import { ServiceService } from '../services/service.service';

const router = Router();
const serviceService = new ServiceService();

// Register new service
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { agentId, name, description, serviceType, pricePerCall, currency } = req.body;
    
    if (!agentId || !name || !pricePerCall) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const service = await serviceService.registerService(
      agentId,
      name,
      description,
      serviceType || 'CUSTOM',
      pricePerCall,
      currency || 'USDC'
    );
    res.status(201).json(service);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get service by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const service = await serviceService.getService(req.params.id);
    
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }
    
    res.json(service);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get services by agent
router.get('/agent/:agentId', async (req: Request, res: Response) => {
  try {
    const services = await serviceService.getServicesByAgent(req.params.agentId);
    res.json(services);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get all active services
router.get('/', async (req: Request, res: Response) => {
  try {
    const services = await serviceService.listActiveServices();
    res.json(services);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update service status
router.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const { isActive } = req.body;
    const service = await serviceService.updateServiceStatus(req.params.id, isActive);
    res.json(service);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export { router as serviceRoutes };