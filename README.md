# OrderFlow

Order management for small vendors. Turns a WhatsApp conversation into a tracked order with a payment link and a fulfilment record.

## What it does

- Captures an order from a vendor's chat workflow.
- Generates a payment link through Paystack.
- Confirms payment by webhook and records fulfilment.
- Keeps an order history the vendor can look up.

## Stack

| Layer | Choice |
| --- | --- |
| Runtime | Node.js serverless functions |
| Database | Supabase Postgres |
| Payments | Paystack (payment links + webhook verification) |
| Hosting | Vercel |

## Repository layout

```
api/            Serverless endpoints (orders, payment links, webhook)
public/         Static frontend
```

## Getting started

```bash
git clone https://github.com/kennyorlando65-prog/orderflow.git
cd orderflow
cp .env.example .env        # then fill in real values locally
npm install
```

## Environment variables

Documented as placeholders in [`.env.example`](.env.example). Set production values in **Vercel -> Project -> Settings -> Environment Variables**.

`SUPABASE_SERVICE_ROLE_KEY` and `PAYSTACK_SECRET_KEY` are server-only. Never expose them to the browser.

## Security

An unauthenticated debug endpoint that enumerated environment variable names was previously committed and reachable in production. It has been removed, and a gitleaks scan now runs on every push and pull request.

## Status

Working prototype. Order capture, payment links and webhook confirmation are implemented. Fulfilment is not yet idempotent, so a retried webhook can double-record an order - that is the next fix.
