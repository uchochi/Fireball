# DEDE — Development Plan

**Stack confirmed:**
- Frontend: **React + TypeScript** (Vite)
- Backend: **Node.js + Fastify**
- Database / Auth / Storage: **Supabase** (PostgreSQL + BaaS)
- **Telegram Bot + Mini App** integration (added requirement)

---

## Phase 0 — Project Scaffolding

| # | Task | Notes |
|---|------|-------|
| 0.1 | Initialize monorepo (npm workspaces or turborepo) | `apps/web`, `apps/bot`, `packages/shared` |
| 0.2 | Scaffold `apps/web` — Vite + React + TypeScript | |
| 0.3 | Scaffold `apps/api` — Fastify + TypeScript | |
| 0.4 | Scaffold `apps/bot` — Telegram bot service (node) | Telegraf or node-telegram-bot-api |
| 0.5 | Set up Supabase project, run initial migration | Enable Row Level Security |
| 0.6 | Set up shared types package (`packages/shared`) | Zod schemas shared across all apps |
| 0.7 | Configure lint + prettier across all workspaces | ESLint + Prettier |
| 0.8 | Set up environment variable management | dotenv, env validation via Zod |

---

## Phase 1 — Authentication & User System

| # | Task | Notes |
|---|------|-------|
| 1.1 | Design `profiles` table in Supabase | Extends Supabase Auth users |
| 1.2 | Implement Supabase Auth UI (email + password) | @supabase/supabase-js + @supabase/ssr |
| 1.3 | Implement Telegram OAuth / Mini App auth | Validate `initData` via bot token hash; link Telegram account to profile |
| 1.4 | Implement "WhatsApp login" flow | Either WhatsApp Cloud API OAuth or phone verification; store WA session token per user |
| 1.5 | Create onboarding flow | Collect vibe preference (pidgin/English), brand name, intro to features |
| 1.6 | Design subscription `plans` and `user_subscriptions` tables | |

---

## Phase 2 — Telegram Bot + Mini App

| # | Task | Notes |
|---|------|-------|
| 2.1 | Create Telegram Bot via BotFather | Save token, set commands |
| 2.2 | Set up webhook for bot (or polling) | Telegraf webhook → Fastify route |
| 2.3 | Implement Mini App launch button from bot | Bot sends inline keyboard → opens Mini App URL |
| 2.4 | Build Mini App entry point in Vite | Detect Telegram WebApp context, apply `tg-theme-*` CSS variables |
| 2.5 | Implement Mini App auth flow | Verify `WebApp.initData` HMAC signature server-side |
| 2.6 | Add bot commands: `/start`, `/feed`, `/stats`, `/settings` | Scenes/wizards for multi-step interactions |
| 2.7 | Allow posting via bot inline mode | User searches content inline, bot sends it / posts directly |
| 2.8 | Schedule auto-posts from within Telegram | Bot asks time & frequency, saves to `auto_publish_jobs` |

---

## Phase 3 — WhatsApp Integration

| # | Task | Notes |
|---|------|-------|
| 3.1 | Register for WhatsApp Cloud API (Meta) | Business Account + WhatsApp Business Account |
| 3.2 | Implement WhatsApp login / phone linking | OTP verification via Twilio / Meta; store session tokens |
| 3.3 | Build WhatsApp media upload pipeline | API endpoint to upload images to WhatsApp servers |
| 3.4 | Implement WhatsApp Status posting | Use WhatsApp Business API `POST /{{phone-number-id}}/message` with image + caption |
| 3.5 | Handle WhatsApp webhook callbacks | Delivery receipts, user replies, rate-limit handling |
| 3.6 | Allow "Download instead of post" flow | User picks download vs auto-post per content item |

---

## Phase 4 — AI Content Engine

| # | Task | Notes |
|---|------|-------|
| 4.1 | Design `contents` table | Columns: type, status, nigerian_category, vibe, aspect_ratio, html_template, screenshot_url, metadata |
| 4.2 | Implement LLM integration layer | OpenAI / Claude API; prompt templates per content type |
| 4.3 | Build content prompt library | Categories: local politics, humour, jokes, hustle motivation, relationship, quotes, national commentary |
| 4.4 | Implement web search / curation pipeline | Search + summarise trending Nigerian topics via Perplexity / SerpAPI |
| 4.5 | Build HTML + CSS content template engine | React on server (ReactDOMServer.renderToString) or Handlebars; templates for memes, quotes, ads |
| 4.6 | Implement screenshot service (HTML → JPEG) | Puppeteer / Playwright headless; renders HTML page then screenshots |
| 4.7 | Build dynamic image fetching for memes | Search for watermark-free funny images via Unsplash / Pexels API |
| 4.8 | Implement "Creative Mode" (User-guided generation) | User gives description, optional image assets, aspect ratio, vibe → LLM generates HTML content |
| 4.9 | Build daily batch pipeline (500 content/day) | Cron trigger → LLM batch → HTML per content → screenshot → store in Supabase |
| 4.10 | Implement content variation / dedup | Avoid generating near-identical content in same batch |

---

## Phase 5 — Core User Features (Web App)

| # | Task | Notes |
|---|------|-------|
| 5.1 | Build content feed UI | Infinite scroll, filter by category/vibe, grid/list toggle |
| 5.2 | Build content detail / preview modal | Shows rendered content at actual aspect ratio, swipe between items |
| 5.3 | Build "Post" flow | Modal with WhatsApp / Telegram target toggle, "Post" or "Download" buttons |
| 5.4 | Implement screenshot-on-post | If user clicks "Post", render + screenshot + send to chosen platform |
| 5.5 | Build custom content creation form | User provides prompt, uploads images, selects aspect ratio & vibe |
| 5.6 | Implement brand logo upload & watermark | Store in Supabase Storage; overlay on generated screenshots |
| 5.7 | Build auto-publish scheduler UI | User sets schedule (time, frequency, categories) per platform |
| 5.8 | Implement `/api/auto-publish` worker | Background job queue (Bull/BullMQ) checks schedule, generates + posts |

---

## Phase 6 — Payments & Subscriptions

| # | Task | Notes |
|---|------|-------|
| 6.1 | Set up Paystack integration | Create Paystack secret key, webhook endpoint |
| 6.2 | Implement dedicated virtual account per user | Paystack DVA: creates unique account number per user for transfer payments |
| 6.3 | Build subscription checkout UI | Plan selection → Paystack payment page / transfer instructions |
| 6.4 | Implement Paystack webhook handler | `charge.success` → activate subscription; `subscription.renewal` → extend |
| 6.5 | Implement free trial logic | 14-day trial on signup; `trial_ends_at` column, flag in middleware |
| 6.6 | Build subscription status endpoint + UI badge | Shows plan name, days remaining, renewal date |
| 6.7 | Implement subscription gating middleware | API route guard for paid-only features (auto-publish, custom content, analytics) |
| 6.8 | Handle subscription expiry + grace period | Soft block paid features, show upgrade prompt |

---

## Phase 7 — Analytics Dashboard

| # | Task | Notes |
|---|------|-------|
| 7.1 | Design `content_analytics` table | Per-post: views, clicks, shares, platform, posted_at, engagement_score |
| 7.2 | Implement webhook listeners for WhatsApp & Telegram | Track post delivery, views (where available) |
| 7.3 | Build analytics dashboard UI | Cards: total posted, engagement rate, platform breakdown, daily trend |
| 7.4 | Build per-post insights panel | Individual post metrics, comparison to average |
| 7.5 | Implement export (CSV / PDF) | Download analytics report |

---

## Phase 8 — Infrastructure & DevOps

| # | Task | Notes |
|---|------|-------|
| 8.1 | Dockerise all apps | Dockerfile for web, api, bot |
| 8.2 | Set up CI/CD | GitHub Actions: lint → typecheck → build → deploy |
| 8.3 | Choose hosting (recommend: Railway / Fly.io / VPS) | |
| 8.4 | Set up Supabase production project | Separate from dev project |
| 8.5 | Set up cron job for daily 500-content generation | Cloudflare Workers / in-app cron / external scheduler |
| 8.6 | Set up monitoring & logging | Sentry for errors, basic uptime monitoring |
| 8.7 | Configure custom domain + SSL | |

---

## Phase 9 — Testing

| # | Task | Notes |
|---|------|-------|
| 9.1 | Set up Vitest for frontend + backend | Shared config |
| 9.2 | Unit tests for API routes | Use `supertest` / `light-my-request` for Fastify |
| 9.3 | Unit tests for content generation pipeline | Mock LLM, test prompt templates + HTML rendering |
| 9.4 | Integration tests for auth flows | Signup → trial → subscribe → gated content access |
| 9.5 | Integration tests for posting flows | Content select → screenshot → WhatsApp/Telegram send |
| 9.6 | E2E tests for critical user journeys | Playwright: feed browse → select → post / download flow |
| 9.7 | Load test screenshot service | Puppeteer can be memory-heavy; benchmark 500 daily renders |
| 9.8 | Telegram Mini App E2E (manual) | Test inside real Telegram client |

---

## Quick Reference: Key Commands (once scaffolded)

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start all services in dev mode |
| `npm run lint` | Lint all workspaces |
| `npm run typecheck` | TypeScript check all packages |
| `npm run test` | Run all tests |
| `npm run test -- --filter=api` | Run tests for api workspace only |
| `npm run migrate` | Apply Supabase migrations |
| `npm run generate:content` | Manually trigger content batch generation |
| `npm run screenshot:preview` | Preview how a piece of content will render as JPEG |

---

## Architecture Notes

- **Telegram Mini App** is a Vite SPA loaded inside Telegram's WebView. It uses `@tma.js/sdk` (or raw `window.Telegram.WebApp`) for init data, theme, back button, and main button.
- **Content rendering pipeline**: LLM generates structured JSON → React template on server renders HTML → Puppeteer screenshots to JPEG → URL stored in Supabase. This avoids heavy client-side rendering.
- **Daily batch**: A cron job (or BullMQ repeatable job) calls the LLM pipeline 500 times/day. Results are pre-screenshotted and stored. Users browse already-generated content.
- **Supabase RLS**: Every API call passes through Supabase Row Level Security — all policies scoped to `auth.uid()`.
- **Auto-publish**: Separate queue worker runs on a loop, picks due jobs from `auto_publish_jobs`, executes screenshot + platform send.
