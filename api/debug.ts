export default async function handler(req: any, res: any) {
  try {
    const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
    const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    return res.status(200).json({
      razorpay_key_id_exists: !!RAZORPAY_KEY_ID,
      razorpay_key_secret_exists: !!RAZORPAY_KEY_SECRET,
      supabase_url_exists: !!SUPABASE_URL,
      supabase_service_role_exists: !!SUPABASE_SERVICE_ROLE_KEY,
      env_vars_available: !!(RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET && SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY),
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
