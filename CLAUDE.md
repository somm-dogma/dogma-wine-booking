# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Wine tasting booking system for Dogma Wine Bar (Porto, Portugal). Guests select a tasting experience, fill in a booking form, and pay via Stripe. There is no database — Stripe is the source of truth for all booking data.

## Development & Deployment

There are no build steps, test suites, or lint scripts. This is a Vercel serverless project deployed directly from source.

**Local development** (Vercel CLI):
```bash
npm install -g vercel
vercel dev        # Runs serverless functions locally on http://localhost:3000
```

**Deploy:**
```bash
vercel            # Preview deployment
vercel --prod     # Production deployment
```

**Testing webhooks locally** requires forwarding with the Stripe CLI:
```bash
stripe listen --forward-to localhost:3000/api/webhook
```

## Architecture

### Request Flow
```
dogma-clean.html (frontend, hosted on dogmawinebar.com)
  → POST /api/checkout   → creates Stripe Checkout session, sends Telegram alert, redirects guest
  → (Stripe redirect)
  → GET  /api/success    → reads session from Stripe API, renders confirmation HTML
  → (Stripe webhook)
  → POST /api/webhook    → sends Telegram alert + confirmation email to guest
```

### Key Design Decisions
- **No database.** All booking metadata (date, time, guests, contact info) is stored inside the Stripe session's `metadata` field and retrieved via the Stripe API on demand.
- **Notifications are non-blocking.** Telegram and email failures are caught and logged but do not cause the API function to return an error.
- **`/api/success` is stateless.** It receives a `?session_id=` query param, fetches the session from Stripe, and renders HTML inline — no template engine.
- **Serverless function signature** follows Vercel convention: `module.exports = async (req, res) => {}`.

### Frontend (`dogma-clean.html`)
Single HTML file with embedded CSS and vanilla JS. Tasting options are defined as `<div>` elements with `data-price` and `data-name` attributes. The JS reads these at runtime to build the Stripe checkout payload. Sundays are blocked client-side in date validation. Price is recalculated live on any form change.

## Environment Variables

| Variable | Purpose |
|---|---|
| `STRIPE_SECRET_KEY` | Stripe secret API key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook endpoint signing secret |
| `EMAIL_USER` | Gmail address used to send confirmations |
| `EMAIL_PASS` | Gmail app password (not account password) |

Set these in Vercel project settings (or a `.env` file for local `vercel dev`).

> **Note:** `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` are currently hardcoded in `api/checkout.js` and `api/webhook.js`. They should be moved to environment variables.

## Tasting Options

Defined in `dogma-clean.html` and must stay in sync with any backend validation. Current offerings:

| ID | Name | Price |
|---|---|---|
| `test-tasting` | Test | €0 |
| `vinho-verde` | Vinho Verde | €51 |
| `top-wines` | Top Wines | €75 |
| `icons` | Icons | €99 |
| `ports` | Ports | €210 |

## CORS & Redirect URLs

- All API functions set `Access-Control-Allow-Origin: *` manually (no middleware).
- Success and cancel URLs in `api/checkout.js` are hardcoded to the Vercel deployment URL — update these if the deployment domain changes.
