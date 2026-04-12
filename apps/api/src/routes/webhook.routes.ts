import { Router, Request, Response } from 'express';
import { webhookService } from '../services/webhook.service';
import { supabase } from '../config/prisma';

const router = Router();

// Register webhook for an agent
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { agentId, url, secret, events } = req.body;

    if (!agentId || !url) {
      return res.status(400).json({ error: 'agentId and url are required' });
    }

    await webhookService.registerWebhook(agentId, url, secret, events);
    res.json({ success: true, message: 'Webhook registered successfully' });
  } catch (error: any) {
    console.error('Webhook registration error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Remove webhook for an agent
router.delete('/agent/:agentId', async (req: Request, res: Response) => {
  try {
    await webhookService.removeWebhook(req.params.agentId);
    res.json({ success: true, message: 'Webhook removed successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get webhook config for an agent
router.get('/agent/:agentId', async (req: Request, res: Response) => {
  try {
    const config = webhookService.getWebhookConfig(req.params.agentId);
    
    if (!config) {
      return res.status(404).json({ error: 'No webhook configured for this agent' });
    }

    res.json(config);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Test webhook URL
router.post('/test', async (req: Request, res: Response) => {
  try {
    const { url, secret } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'url is required' });
    }

    const result = await webhookService.testWebhook(url, secret);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Manual webhook trigger (for testing)
router.post('/trigger/:agentId', async (req: Request, res: Response) => {
  try {
    const { event, data } = req.body;

    if (!event) {
      return res.status(400).json({ error: 'event is required' });
    }

    const result = await webhookService.sendWebhook(
      req.params.agentId,
      event,
      data || {}
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get all webhooks (admin endpoint)
router.get('/', async (req: Request, res: Response) => {
  try {
    // Get all agents with webhooks
    const { data, error } = await supabase
      .from('agents')
      .select('id, name, webhookUrl')
      .not('webhookUrl', 'is', null);

    if (error) throw error;
    res.json(data || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export { router as webhookRoutes };
