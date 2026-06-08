# AGENTS.md

## Architecture

Monorepo with npm workspaces:

```
dede/
├── apps/
│   ├── web/          Vite+React SPA (also serves as Telegram Mini App)
│   ├── api/          Fastify REST server + optional background worker
│   └── bot/          Telegraf Telegram bot (polling or webhook)
├── packages/
│   └── shared/       Zod schemas + TS types shared by all 3 apps
└── supabase/migrations/  SQL to run in Supabase SQL Editor
```

- **Auth**: Supabase Auth (email/password + Telegram Mini App HMAC validation)
- **Database**: PostgreSQL via Supabase (Row Level Security on all tables)
- **AI**: OpenRouter (default `openai/gpt-4o`) → generates JSON with HTML template → Puppeteer renders JPEG
- **Payments**: Paystack (dedicated virtual accounts per user for transfer payments)

## Setup

```bash
npm install
cp .env.example .env && cp apps/web/.env.example apps/web/.env
```

Then run the SQL in `supabase/migrations/00001_schema.sql` in the Supabase SQL Editor.

## Key commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | All three services concurrently |
| `npm run dev:api` | API on :3001 |
| `npm run dev:web` | Web on :5173 |
| `npm run dev:bot` | Telegram bot |
| `npm run typecheck` | TypeScript check all |
| `npm run lint` | ESLint all |
| `npm run start` | Production web static server (via `server.cjs`) |
| `npm run build` | Build all |

## Worker commands (background jobs)

```bash
npx tsx apps/api/src/worker.ts batch          # Generate 500 daily content items
npx tsx apps/api/src/worker.ts auto-publish   # Process due auto-publish jobs
npx tsx apps/api/src/worker.ts process-job <id>  # Single custom generation
```

## Architecture quirks

- **Screenshot service** (`apps/api/src/services/screenshot.ts`) needs a Chromium binary on the system. Install via `npx puppeteer browsers install chrome` or your system package manager. Falls back gracefully if no binary is found.
- **Content pipeline** runs headless Puppeteer to render AI-generated HTML→JPEG. This is the most resource-intensive part.
- **Telegram Mini App** auth works by verifying the `initData` HMAC server-side against the bot token. The `useTelegram` hook handles the client side.
- **WhatsApp Cloud API** requires a Meta Business Account and WhatsApp Business Account. The `WHATSAPP_VERIFY_TOKEN` in `.env` must match the token entered in Meta's webhook config.
- **Paystack webhook** must be configured at `<deployed-url>/api/webhooks/paystack` in the Paystack dashboard.

## Things to know before editing

- Shared types are in `packages/shared/src/schemas.ts` (Zod) and `types.ts` (re-exported types). Apps import from `@dede/shared`.
- The `api/src/config.ts` validates all env vars with Zod on startup.
- Every database mutating API route uses `supabaseAdmin` (service role key) to bypass RLS; user-facing reads use `supabase` (anon key). Never use `supabaseAdmin` on client-facing endpoints that need user-scoping.
- New Supabase migrations go in `supabase/migrations/` with an incrementing prefix (`00002_...`).
