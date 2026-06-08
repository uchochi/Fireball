# DEDE

Curated and AI-generated WhatsApp & Telegram status content platform — Nigerian vibe.

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript (Vite) |
| Backend | Fastify + TypeScript (Node.js) |
| Database | PostgreSQL via Supabase |
| Auth | Telegram Mini App HMAC (only auth method) |
| Storage | Supabase Storage (screenshots, logos) |
| AI | OpenRouter (OpenAI-compatible API) |
| Screenshots | Puppeteer (HTML → JPEG) |
| Bot | Telegraf (Telegram Bot API) |
| Payments | Paystack (dedicated virtual accounts) |
| Messaging | WhatsApp Cloud API (Meta) |

## Project Structure

```
dede/
├── apps/
│   ├── web/          Vite React app (also serves as Telegram Mini App)
│   ├── api/          Fastify REST server + optional background worker
│   └── bot/          Telegraf Telegram bot (polling or webhook)
├── packages/
│   └── shared/       Zod schemas + TS types shared by all 3 apps
└── supabase/
    └── migrations/   SQL to run in Supabase SQL Editor
```

---

## Prerequisites

- **Node.js** 20+ and **npm** 9+
- A **Supabase** project (free tier at [supabase.com](https://supabase.com))
- An **OpenRouter** API key ([openrouter.ai/keys](https://openrouter.ai/keys))
- A **Telegram Bot** token from [@BotFather](https://t.me/BotFather)
- A **Paystack** secret key ([dashboard](https://dashboard.paystack.com/#/settings/developer))
- **WhatsApp Business Account** + API access (Meta) — optional until you enable WhatsApp posting

---

## Setup

### 1. Clone and install

```bash
git clone <repo-url> dede
cd dede
npm install
```

### 2. Environment variables

```bash
cp .env.example .env
cp apps/web/.env.example apps/web/.env
```

Edit both files with your real credentials. See [Environment Variables Reference](#environment-variables-reference) below.

### 3. Supabase — Create the database tables

Open your Supabase Dashboard → **SQL Editor** → paste the entire contents of `supabase/migrations/00001_schema.sql` → click **Run**.

This single migration creates all 9 tables, Row Level Security policies, indexes, triggers, audit functions, and seeds the 5 subscription plans.

### 4. Supabase — Create the Storage bucket

1. Supabase Dashboard → **Storage** → **New Bucket**
2. Name: `content-screenshots`
3. Public bucket: **enabled**
4. Click **Create bucket**

### 5. Supabase — Configure Authentication

1. Supabase Dashboard → **Authentication** → **Settings**
2. Disable **Email + Password** sign-in (not used — auth is Telegram-only)
3. Disable **Confirm email** if enabled
4. Under **Site URL**: set to your web app URL (`http://localhost:5173` for local dev)

### 6. Install a Chromium browser (for screenshot rendering)

The screenshot service uses Puppeteer to render AI-generated HTML to JPEG. You need a Chromium binary on the system:

```bash
# Option A: Install via Puppeteer's built-in browser installer
npx puppeteer browsers install chrome

# Option B: Use your system package manager
# Debian/Ubuntu:
sudo apt install chromium-browser
# macOS:
brew install chromium
# Arch:
sudo pacman -S chromium
```

Puppeteer will auto-detect the system Chromium. No config needed.

### 7. Start development servers

```bash
# Start all three services concurrently
npm run dev

# Or start them individually:
npm run dev:api   # API server on http://localhost:3001
npm run dev:web   # Web app on http://localhost:5173
npm run dev:bot   # Telegram bot (polling mode)
```

### 8. Generate initial content (background worker)

```bash
# Generate 500 content items using OpenRouter AI
npx tsx apps/api/src/worker.ts batch

# Process due auto-publish jobs
npx tsx apps/api/src/worker.ts auto-publish

# Process a single custom generation job
npx tsx apps/api/src/worker.ts process-job <job-id>
```

---

## Environment Variables Reference

### Root `.env` (apps/api + apps/bot)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SUPABASE_URL` | **Yes** | — | Supabase Project URL (`https://xxx.supabase.co`) |
| `SUPABASE_ANON_KEY` | **Yes** | — | Supabase anon/public key (safe for client) |
| `SUPABASE_SERVICE_ROLE_KEY` | **Yes** | — | Supabase service_role key (server only — never expose) |
| `PORT` | No | `3001` | API server port |
| `CORS_ORIGIN` | No | `http://localhost:5173` | Allowed CORS origin for the API |
| `TELEGRAM_BOT_TOKEN` | **Yes** | — | Bot token from BotFather (required for auth) |
| `WEBAPP_URL` | No | `http://localhost:5173` | Public URL of the web app (used by bot for Mini App button) |
| `WEBHOOK_URL` | No | — | Public URL for bot webhook (`https://your-domain.com`). Leave empty for polling |
| `WHATSAPP_API_TOKEN` | No | — | WhatsApp Cloud API permanent access token |
| `WHATSAPP_PHONE_NUMBER_ID` | No | — | WhatsApp Business phone number ID |
| `WHATSAPP_VERIFY_TOKEN` | No | `dede_webhook_verify` | Webhook verify token (must match Meta config) |
| `PAYSTACK_SECRET_KEY` | Yes* | — | Paystack secret key (`sk_live_...` or `sk_test_...`) |
| `OPENROUTER_API_KEY` | Yes* | — | OpenRouter API key (`sk-or-v1-...`) |
| `OPENROUTER_BASE_URL` | No | `https://openrouter.ai/api/v1` | OpenRouter API base URL |
| `OPENROUTER_MODEL` | No | `openai/gpt-4o` | Model ID to use for content generation |
| `SCREENSHOT_SERVICE_URL` | No | — | External screenshot service URL (leave empty for local Puppeteer) |

\* Required if using that feature. The app starts without AI, Telegram, or payments configured — those features will simply return errors.

### `apps/web/.env`

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | **Yes** | Same as `SUPABASE_URL` from root .env |
| `VITE_SUPABASE_ANON_KEY` | **Yes** | Same as `SUPABASE_ANON_KEY` from root .env |
| `VITE_API_URL` | No* | Railway API domain (e.g. `https://api.up.railway.app`). Defaults to `/api` (same-origin proxy). Required when web app is on a different domain than the API. |

---

## Hosting & Deployment

### Deployment architecture

Three services need to be deployed:

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Web (Vite)  │     │  API (Fastify)│     │  Bot (Telegraf)│
│  Static SPA  │────▶│  Node server  │     │  Node server   │
│  Railway/Vercel│   │  Railway/Fly  │     │  Railway/Fly   │
└──────────────┘     └──────┬───────┘     └──────┬───────┘
                            │                    │
                            └────────┬───────────┘
                                     │
                            ┌────────▼────────┐
                            │   Supabase       │
                            │  (DB + Auth +    │
                            │   Storage)       │
                            └─────────────────┘
```

### Option A: Railway (all services)

1. Push your repo to GitHub
2. [Create a Railway project](https://railway.app/new) linked to the repo
3. Add three services:
   - **API**: root dir = `apps/api`, build command = `npm run build`, start command = `node dist/index.js`
   - **Bot**: root dir = `apps/bot`, build command = `npm run build`, start command = `node dist/index.js`
4. Add the environment variables (from the table above) to each service
5. Set `CORS_ORIGIN` to your web app's domain
6. Set `WEBAPP_URL` to your web app's domain
7. For the bot, either set `WEBHOOK_URL` to the API's Railway domain (webhook mode) or leave empty (polling mode)

### Option B: Vercel (Web) + Railway (API + Bot) — recommended

**Web → Vercel:**

1. Go to [vercel.com](https://vercel.com) → **Add New Project** → import your GitHub repo
2. Set **Root Directory** to `apps/web`
3. Set **Build Command** to `npm run build`
4. Set **Output Directory** to `dist`
5. Add environment variables:
   - `VITE_SUPABASE_URL` — from Supabase dashboard
   - `VITE_SUPABASE_ANON_KEY` — from Supabase dashboard
   - `VITE_API_URL` — your Railway API domain (e.g. `https://api.up.railway.app`)
6. Deploy

The `vercel.json` in `apps/web/` handles SPA routing (all paths fall back to `index.html`).

**API → Railway:**

1. [Create a Railway project](https://railway.app/new) linked to your repo
2. Add service: root dir = `apps/api`, build command = `npm run build`, start command = `node dist/index.js`
3. Add env vars: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `TELEGRAM_BOT_TOKEN`, `OPENROUTER_API_KEY`, `PAYSTACK_SECRET_KEY`
4. **Important**: Set `CORS_ORIGIN` to your Vercel domain (so the web app can make API calls)

**Bot → Railway:**

1. Add service: root dir = `apps/bot`, build command = `npm run build`, start command = `node dist/index.js`
2. Add env vars: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `TELEGRAM_BOT_TOKEN`, `WEBAPP_URL`

### Option C: Fly.io (API + Bot) + Vercel (Web)

Same as Option B for Vercel, but deploy API and Bot on Fly.io instead.

### Option C: Traditional VPS (Ubuntu/Debian)

```bash
# Install Node.js 20+
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs chromium-browser nginx

# Clone and build
git clone <repo-url> /opt/dede
cd /opt/dede
npm install && npm run build

# Set up PM2 process manager
npm install -g pm2
pm2 start apps/api/dist/index.js --name dede-api
pm2 start apps/bot/dist/index.js --name dede-bot

# Serve web static build via nginx
# Point nginx root to /opt/dede/apps/web/dist
# Proxy /api/ requests to localhost:3001

pm2 save
pm2 startup
```

### Post-deployment checklist

- [ ] Supabase Storage bucket `content-screenshots` exists and is public
- [ ] Supabase Auth Site URL points to deployed web app (for session handling)
- [ ] Railway API `CORS_ORIGIN` env var set to your Vercel domain (if web is on Vercel)
- [ ] Telegram Bot webhook set (if using webhook mode): `https://api.telegram.org/bot<TOKEN>/setWebhook?url=<DEPLOYED_API_URL>/api/webhooks/telegram`
- [ ] WhatsApp webhook configured in Meta dashboard: `<DEPLOYED_API_URL>/api/webhooks/whatsapp`
- [ ] Paystack webhook configured: `<DEPLOYED_API_URL>/api/webhooks/paystack`
- [ ] Daily cron set up for `worker.ts batch` (e.g., cron job or Railway cron)
- [ ] CORS_ORIGIN matches the actual web app URL
- [ ] Railway env var **RAILPACK_NO_SPA** = `true` on the web service (prevents Caddy from handling SPA routes; your Node.js server handles fallback properly)

---

## Telegram Mini App

The web app doubles as a Telegram Mini App. When opened inside Telegram, it:
- Auto-authenticates via `window.Telegram.WebApp.initData` (HMAC-verified server-side)
- Requests the user's phone number via `window.Telegram.WebApp.requestContact()` (optional — used as identifier)
- Applies Telegram's native theme colors
- Uses `MainButton` and `BackButton` for a native feel

**Setup in BotFather:**

```
/setmenubutton → your bot → URL → https://your-deployed-web.com
```

Then users can open DEDE directly from the bot's menu or via the `/start` command.

---

## Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start all 3 services concurrently |
| `npm run dev:api` | API server with hot reload |
| `npm run dev:web` | Web dev server with HMR |
| `npm run dev:bot` | Telegram bot with auto-restart |
| `npm run build` | Build all packages and apps |
| `npm run lint` | ESLint across all workspaces |
| `npm run typecheck` | TypeScript type-check all packages |
| `npm run test` | Run all tests (Vitest) |
| `npx tsx apps/api/src/worker.ts batch` | Generate 500 daily content items |
| `npx tsx apps/api/src/worker.ts auto-publish` | Process due auto-publish jobs |
| `npx tsx apps/api/src/worker.ts process-job <id>` | Process a single custom generation |

---

## Supabase Integration (Step-by-Step)

### Database

The entire database schema lives in `supabase/migrations/00001_schema.sql`. It creates:

| Table | Purpose |
|-------|---------|
| `subscription_plans` | Pre-seeded with 5 plans (Monthly → Yearly) |
| `profiles` | Extends Supabase Auth users with Nigerian-specific fields |
| `contents` | All generated/curated/user-created content |
| `content_generation_jobs` | Tracks async AI generation requests |
| `user_subscriptions` | Tracks trial/active/expired subscriptions per user |
| `auto_publish_jobs` | Scheduled content posting jobs |
| `analytics_events` | Post views, shares, downloads, etc. |
| `whatsapp_sessions` | WhatsApp API session tokens per user |

Every table has **Row Level Security** enabled. Policies use `auth.uid()` to scope data to the authenticated user.

### Storage

- Bucket: `content-screenshots` (public)
- Folders created automatically: `screenshots/`, `user-generated/`, `auto-publish/`

### Auth

- **Only auth method**: Telegram Mini App HMAC validation
- The API uses `supabaseAdmin` (service_role key) for mutations that bypass RLS
- The web app uses `supabase` (anon key) for authenticated user reads
- Telegram `initData` is HMAC-verified server-side against the bot token; user identity is derived deterministically from `telegram_id`
- A Supabase Auth session is created on the server using a deterministic password derived from `telegram_id` + bot token, and returned to the client via `supabase.auth.setSession()`
- On first login, a Supabase Auth user is auto-created (synthetic email), along with profile + 14-day trial subscription
- The user's Telegram phone number is collected via `window.Telegram.WebApp.requestContact()`

### Adding a new migration

```bash
# Create the SQL file
touch supabase/migrations/00002_<description>.sql

# Write your SQL, then run it in Supabase SQL Editor
# Generate updated TypeScript types:
npx supabase gen types typescript --linked > packages/shared/src/supabase-types.ts
```

---

## Architecture Notes

- **Content pipeline**: OpenRouter AI generates structured JSON → HTML template → Puppeteer screenshots to JPEG → stored in Supabase Storage
- **Daily batch**: `worker.ts batch` cycles through 8 categories × 2 vibes × 4 aspect ratios to produce ~500 items
- **Auto-publish**: A scheduled worker picks due jobs, screenshots content, and posts to WhatsApp/Telegram
- **Telegram Mini App auth (only method)**: Server verifies `initData` by computing HMAC-SHA256(WebAppData, bot_token) and comparing the `hash` parameter. A Supabase Auth session is created deterministically from `telegram_id` + bot token. No email/password required.
- **Paystack flow**: User selects a plan → API calls Paystack to initialize transaction → user is redirected to Paystack → Paystack webhook activates the subscription
