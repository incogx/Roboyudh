import { supabase } from '../../src/lib/supabase';

export default async function handler(req: any, res: any) {
  // TODO: Add proper admin authentication check
  if (req.method === 'GET') {
    const { data, error } = await supabase.from('payments').select('*');
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }
  return res.status(405).json({ error: 'Method not allowed' });
}
