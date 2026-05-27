const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { business_name, bank_code, account_number, user_id } = req.body;
  if (!business_name || !bank_code || !account_number || !user_id) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    const response = await fetch('https://api.paystack.co/subaccount', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ business_name, bank_code, account_number, percentage_charge: 2, settlement_schedule: "auto" }),
    });
    const data = await response.json();
    if (!data.status) return res.status(400).json({ error: data.message });
    await supabase.from('profiles').update({ paystack_subaccount: data.data.subaccount_code, business_name }).eq('id', user_id);
    return res.status(200).json({ success: true, subaccount: data.data });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create subaccount' });
  }
};
