import { Router, Request, Response } from 'express';
import { agentService } from '../services/agent.service';
import { supabase } from '../config/prisma';

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
    // Delete all records using raw queries via rpc or direct table access
    await supabase.from('payments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('services').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('reviews').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('agents').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    res.json({ message: 'All agents, services, payments, and reviews cleared' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Submit a review for an agent
router.post('/:id/review', async (req: Request, res: Response) => {
  try {
    const { buyerAddress, rating, comment } = req.body;
    
    if (!buyerAddress || !rating) {
      return res.status(400).json({ error: 'buyerAddress and rating are required' });
    }
    
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const agentId = req.params.id;

    // Check if review already exists
    const { data: existingReview } = await supabase
      .from('reviews')
      .select('id')
      .eq('agentId', agentId)
      .eq('buyerAddress', buyerAddress)
      .single();

    let review;
    if (existingReview) {
      // Update existing review
      const { data: updatedReview, error: updateError } = await supabase
        .from('reviews')
        .update({
          rating,
          comment: comment || null,
        })
        .eq('id', existingReview.id)
        .select()
        .single();
      
      if (updateError) throw new Error(updateError.message);
      review = updatedReview;
    } else {
      // Insert new review
      const { data: newReview, error: insertError } = await supabase
        .from('reviews')
        .insert({
          agentId,
          buyerAddress,
          rating,
          comment: comment || null,
        })
        .select()
        .single();
      
      if (insertError) throw new Error(insertError.message);
      review = newReview;
    }

    // Recalculate agent's average rating
    const { data: reviews } = await supabase
      .from('reviews')
      .select('rating')
      .eq('agentId', agentId);

    if (reviews && reviews.length > 0) {
      const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
      const avgRating = totalRating / reviews.length;
      
      // Use lowercase column names for Supabase
      await supabase
        .from('agents')
        .update({ 
          rating: avgRating, 
          ratingcount: reviews.length 
        })
        .eq('id', agentId);
    }

    res.status(201).json(review);
  } catch (error: any) {
    console.error('Review submission error:', error);
    res.status(500).json({ error: error.message || 'Failed to submit review' });
  }
});

// Get reviews for an agent
router.get('/:id/reviews', async (req: Request, res: Response) => {
  try {
    const { data: reviews, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('agentId', req.params.id)
      .order('createdAt', { ascending: false });

    if (error) throw new Error(error.message);

    res.json(reviews || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export { router as agentRoutes };
