export default async function handler(req: any, res: any) {
  try {
    // Check both naming conventions
    const RAZORPAY_KEY_ID_NO_PREFIX = process.env.RAZORPAY_KEY_ID;
    const RAZORPAY_KEY_ID_WITH_PREFIX = process.env.VITE_RAZORPAY_KEY_ID;
    const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
    
    const SUPABASE_URL_NO_PREFIX = process.env.SUPABASE_URL;
    const SUPABASE_URL_WITH_PREFIX = process.env.VITE_SUPABASE_URL;
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

    return res.status(200).json({
      env_vars: {
        "RAZORPAY_KEY_ID": !!RAZORPAY_KEY_ID_NO_PREFIX,
        "VITE_RAZORPAY_KEY_ID": !!RAZORPAY_KEY_ID_WITH_PREFIX,
        "RAZORPAY_KEY_SECRET": !!RAZORPAY_KEY_SECRET,
        "SUPABASE_URL": !!SUPABASE_URL_NO_PREFIX,
        "VITE_SUPABASE_URL": !!SUPABASE_URL_WITH_PREFIX,
        "SUPABASE_SERVICE_ROLE_KEY": !!SUPABASE_SERVICE_ROLE_KEY,
        "VITE_SUPABASE_ANON_KEY": !!SUPABASE_ANON_KEY,
      },
      keys_available: {
        razorpay_with_vite_prefix: !!RAZORPAY_KEY_ID_WITH_PREFIX,
        razorpay_secret: !!RAZORPAY_KEY_SECRET,
        supabase_url_with_vite_prefix: !!SUPABASE_URL_WITH_PREFIX,
        supabase_service_role: !!SUPABASE_SERVICE_ROLE_KEY,
      }
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
