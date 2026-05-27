const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const rawBody = await new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
  const hash = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY).update(rawBody).digest('hex');
  if (hash !== req.headers['x-paystack-signature']) return res.status(401).json({ error: 'Invalid signature' });
  const event = JSON.parse(rawBody);
  if (event.event === 'charge.success') {
    const { reference, amount } = event.data;
    await supabase.from('orders').update({ payment_status: 'paid', paid_at: new Date().toISOString(), status: 'confirmed' }).eq('payment_reference', reference);
    console.log(`✅ Payment confirmed: ₦${amount/100} | Ref: ${reference}`);
  }
  return res.status(200).json({ received: true });
};

module.exports.config = { api: { bodyParser: false } };
