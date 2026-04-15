import { Router, Request, Response } from 'express';
import { supabase } from '../config/prisma';

const router = Router();

// Create a notification
router.post('/', async (req: Request, res: Response) => {
  try {
    const { userAddress, type, title, message, paymentId } = req.body;
    
    if (!userAddress || !type || !title || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        useraddress: userAddress,
        type,
        title,
        message,
        paymentId,
      })
      .select()
      .single();
    
    if (error) throw error;
    
    res.status(201).json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get notifications for a user
router.get('/address/:address', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    const { unreadOnly } = req.query;
    
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('useraddress', address)
      .order('createdat', { ascending: false })
      .limit(50);
    
    if (unreadOnly === 'true') {
      query = query.eq('isRead', false);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    res.json(data || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Mark notification as read
router.patch('/:id/read', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabase
      .from('notifications')
      .update({ isRead: true })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Mark all notifications as read for a user
router.post('/address/:address/read-all', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    
    const { error } = await supabase
      .from('notifications')
      .update({ isRead: true })
      .eq('user_address', address)
      .eq('is_read', false);
    
    if (error) throw error;
    
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get unread count for a user
router.get('/address/:address/unread-count', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_address', address)
      .eq('is_read', false);
    
    if (error) throw error;
    
    res.json({ count: count || 0 });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export { router as notificationRoutes };