// api/create-payment-link.js
const https = require('https');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { order_id, amount, customer_name, customer_email, business_name, subaccount } = req.body;

  if (!order_id || !amount) {
    return res.status(400).json({ error: 'order_id and amount are required' });
  }

  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    return res.status(500).json({ error: 'Paystack secret key not configured' });
  }

  const ref = `sabi-${order_id.slice(-12)}-${Date.now()}`;

  // Build payload — subaccount is optional
  const payload = {
    email: customer_email || `order-${order_id.slice(-8)}@sabi.pay`,
    amount: Math.round(amount * 100), // convert to kobo
    reference: ref,
    currency: 'NGN',
    metadata: {
      order_id,
      customer_name: customer_name || '',
      vendor: business_name || ''
    },
    callback_url: `https://orderflow-dkga.vercel.app/pay.html?order=${order_id}`
  };

  // Only add subaccount if a real one exists (not placeholder)
  if (subaccount && subaccount !== 'ACCT_test_placeholder' && subaccount.startsWith('ACCT_')) {
    payload.subaccount = subaccount;
    payload.bearer = 'subaccount'; // platform fee deducted from subaccount
    payload.transaction_charge = Math.round(amount * 100 * 0.02); // 2% platform fee in kobo
  }

  const postData = JSON.stringify(payload);

  const options = {
    hostname: 'api.paystack.co',
    port: 443,
    path: '/transaction/initialize',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${secretKey}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  return new Promise((resolve) => {
    const request = https.request(options, (response) => {
      let data = '';
      response.on('data', (chunk) => { data += chunk; });
      response.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.status && parsed.data?.authorization_url) {
            res.status(200).json({
              payment_link: parsed.data.authorization_url,
              reference: parsed.data.reference
            });
          } else {
            res.status(400).json({ error: parsed.message || 'Paystack error' });
          }
        } catch (e) {
          res.status(500).json({ error: 'Failed to parse Paystack response' });
        }
        resolve();
      });
    });

    request.on('error', (e) => {
      res.status(500).json({ error: e.message });
      resolve();
    });

    request.write(postData);
    request.end();
  });
};
