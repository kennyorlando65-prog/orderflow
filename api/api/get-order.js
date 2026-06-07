// api/get-order.js
// Rename to: api/get-order.js in your GitHub repo
// This allows pay.html to load order data even when Supabase RLS blocks anon reads.
// Uses service role key (server-side only — never exposed to browser).

const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
  // CORS — allow any origin since customers come from anywhere
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  if (!id || typeof id !== 'string' || id.length < 10) {
    return res.status(400).json({ error: 'Invalid order ID' });
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Fetch order
  const { data: order, error } = await supabase
    .from('orders')
    .select('id, user_id, customer_name, phone, items, total, address, notes, status, payment_status, payment_link, payment_reference, paid_at, created_at')
    .eq('id', id)
    .single();

  if (error || !order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  // Only expose orders that have a payment link (were actually shared with a customer)
  if (!order.payment_link) {
    return res.status(403).json({ error: 'Order not available for payment' });
  }

  // Fetch vendor business name (only safe fields)
  const { data: vendor } = await supabase
    .from('profiles')
    .select('business_name, paystack_subaccount')
    .eq('id', order.user_id)
    .single();

  return res.status(200).json({
    order,
    vendor: vendor ? { business_name: vendor.business_name, paystack_subaccount: vendor.paystack_subaccount } : null
  });
};
