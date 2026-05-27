module.exports = function handler(req, res) {
  res.status(200).json({
    supabaseUrl: process.env.SUPABASE_URL ? "✅ Defined" : "❌ Undefined",
    paystackSecret: process.env.PAYSTACK_SECRET_KEY ? "✅ Defined" : "❌ Undefined",
    allKeys: Object.keys(process.env).filter(key => 
      key.includes('SUPABASE') || key.includes('PAYSTACK')
    )
  });
};
