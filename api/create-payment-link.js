const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { order_id, email, amount, customer_name, subaccount_code } = req.body;
  if (!order_id || !amount || !subaccount_code) return res.status(400).json({ error: 'Missing required fields' });
  try {
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email || "customer@sabi.com",
        amount: Math.round(amount * 100),
        reference: `sabi_${order_id}_${Date.now()}`,
        subaccount: subaccount_code,
        metadata: { order_id, customer_name, platform: "Sabi" }
      }),
    });
    const data = await response.json();
    if (data.status) {
      await supabase.from('orders').update({ payment_reference: data.data.reference, payment_link: data.data.authorization_url, status: 'awaiting_payment', whatsapp_sent: false }).eq('id', order_id);
      return res.status(200).json({ success: true, payment_link: data.data.authorization_url, reference: data.data.reference });
    }
    return res.status(400).json({ error: data.message });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create payment link' });
  }
};
