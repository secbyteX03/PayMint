import { Router, Request, Response } from 'express';
import { ServiceService } from '../services/service.service';

const router = Router();
const serviceService = new ServiceService();

// Register new service
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { 
      agentId, 
      name, 
      description, 
      serviceType, 
      pricePerCall, 
      currency,
      endpoint,
      method,
      rateLimit,
      timeout,
      retryPolicy,
      responseFormat,
      schema,
      usageExamples
    } = req.body;
    
    if (!agentId || !name || !pricePerCall) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const service = await serviceService.registerService(
      agentId,
      name,
      description,
      serviceType || 'CUSTOM',
      pricePerCall,
      currency || 'USDC',
      endpoint,
      method,
      rateLimit ? parseInt(rateLimit) : undefined,
      timeout ? parseInt(timeout) : undefined,
      retryPolicy,
      responseFormat,
      schema,
      usageExamples
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

// Update service
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { 
      name, 
      description, 
      serviceType, 
      pricePerCall, 
      currency,
      endpoint,
      method,
      rateLimit,
      timeout,
      retryPolicy,
      responseFormat,
      schema,
      usageExamples
    } = req.body;
    
    const service = await serviceService.updateService(req.params.id, {
      name,
      description,
      serviceType,
      pricePerCall,
      currency,
      endpoint,
      method,
      rateLimit,
      timeout,
      retryPolicy,
      responseFormat,
      schema,
      usageExamples
    });
    res.json(service);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete service
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await serviceService.deleteService(req.params.id);
    res.json({ message: 'Service deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get all services with agent info (for services page)
router.get('/all/list', async (req: Request, res: Response) => {
  try {
    const services = await serviceService.listAllServicesWithAgent();
    res.json(services);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export { router as serviceRoutes };