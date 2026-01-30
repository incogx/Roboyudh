import { getUserFromRequest, requireAdmin } from '../utils/auth';
import { supabase } from '../../src/lib/supabase';

export default async function handler(req, res) {
  const user = await getUserFromRequest(req);
  if (!requireAdmin(user)) return res.status(403).json({ error: 'Forbidden' });

  if (req.method === 'GET') {
    const { data, error } = await supabase.from('teams').select('*');
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }
  return res.status(405).json({ error: 'Method not allowed' });
}
