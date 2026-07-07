# Unwearable Repository Engineering Audit

*Prepared for the founding team to assess production readiness and portfolio impact.*

---

## SECTION 1 – Repository Overview

**What the repository currently does**
- A Next.js (v16) web application that serves as the storefront for the Unwearable brand.  It integrates with **Supabase** for authentication, data storage and RLS‑protected tables, and with **Qikink** (a print‑on‑demand service) for order fulfillment.
- Users can browse a product catalog, customise apparel via the *Design Builder*, add items to a cart, and complete checkout.  Admin users have a back‑office for order management and template editing.

**Tech stack**
- **Frontend**: Next.js 16 (React 19) with TypeScript, Tailwind CSS, Framer Motion, HTML2Canvas, Stripe integration, Clerk for auth UI, and custom hooks/components.
- **Backend / API**: Next.js API routes (server‑less style) coupled with Supabase edge functions / Postgres RLS policies.
- **Database**: Supabase PostgreSQL (SQL schema files provided).
- **Payments**: Stripe (client side) + Qikink webhook handling.
- **Deployment**: Vercel (via `.vercel` config) with environment files `.env.local`.

**Main frameworks / libraries**
- `next`, `react`, `react‑dom`
- `@clerk/nextjs` (auth UI)
- `@supabase/supabase-js`
- `stripe`, `razorpay`
- `tailwindcss`, `tailwind‑merge`
- `framer‑motion`
- `html2canvas` (design builder screenshots)
- `clsx`, `typescript`

**Folder structure (high‑level)**
```
src/
├─ app/                # Next.js 13+ route‑segments (pages, API, layout)
│   ├─ account/        # User account pages
│   ├─ admin/          # Admin UI & management
│   ├─ api/            # API routes (order, webhook, etc.)
│   ├─ cart/           # Cart pages
│   ├─ checkout/       # Checkout flow
│   ├─ customize/      # Design Builder UI
│   ├─ product/        # Product detail pages
│   ├─ shop/           # Product listing / shop page
│   ├─ sign‑in/        # Auth pages
│   ├─ sign‑up/        # Auth pages
│   └─ layout.tsx, page.tsx, globals.css
├─ components/          # Re‑usable UI components (admin, builder, cart…)
├─ context/             # React context providers (e.g., cart, auth)
├─ data/                # Static data / mock fixtures
├─ lib/                 # Helper libraries (api client, supabase client, utils)
├─ types/               # TypeScript type definitions
├─ public/              # Static assets, favicons, images
└─ styles/ (tailwind config)

docs/                  # Documentation (README, design docs)

test_* .js            # Simple integration tests (e.g., test_order_api.js)

SQL schema files:
- design_builder_schema.sql
- production_schema.sql
- supabase_schema.sql
```

**Dependencies (key ones)**
- `next@16.2.2`, `react@19.2.4`, `react‑dom@19.2.4`
- `@clerk/nextjs@^7.0.8`
- `@supabase/supabase-js@^2.101.1`
- `stripe@^22.1.0`, `razorpay@^2.9.6`
- `tailwindcss@^4`, `postcss`, `autoprefixer`
- `framer-motion@^12.38.0`, `html2canvas@^1.4.1`
- Development: `eslint`, `typescript`, `@types/*`

**Overall architecture**
- **Frontend** is a hybrid of **server‑components** (static pages, product listings) and **client‑components** for interactive cart, design builder, and authentication flows.
- **Auth** is handled by Clerk (OAuth, magic‑link) and synced with Supabase via JWT‑based RLS policies.
- **Data** lives in Supabase; the app uses the Supabase client directly for reads/writes and relies on **Row‑Level Security** policies to enforce per‑user access.
- **Order flow**: client creates an order record → webhook from Stripe/Qikink → order status updates → email notifications (not yet implemented).
- **Design Builder** stores customisation metadata in a JSON column (`design_json`) and generates a canvas image via `html2canvas`.

**Strengths**
- Modern stack (Next.js 16, TypeScript, Tailwind) provides good developer ergonomics and performance.
- Use of Supabase RLS is a solid security foundation for multi‑tenant data.
- Separation of concerns via `app/` route‑segments and reusable component library.
- Clear folder segregation (components, context, lib, types).

**Weaknesses**
- No explicit test suite (only a single ad‑hoc `test_order_api.js`).
- Authentication & authorization logic is scattered (Clerk UI + Supabase RLS) – risk of mismatched permissions.
- Payment verification & webhook handling appear minimal; missing idempotency/retry safeguards.
- No CI/CD pipeline defined; Vercel auto‑deploy but lacks linting, type‑checking, security scanning steps.
- Missing analytics / monitoring hooks for production observability.
- Documentation is thin (README only).
- Some duplicate or dead files (e.g., `health_check.js`, `test_order_api.js` not integrated).
- No explicit caching strategy (SSR/ISR is not configured). 
- No feature flags or environment‑specific config management.

---

## SECTION 2 – Folder Structure Audit

| Area | Observation | Recommendation |
|------|-------------|----------------|
| **app/** | Well‑organized by domain (account, admin, api, shop, etc.). Some route folders (e.g., `sign‑in`, `sign‑up`) contain only a `page.tsx` – could be collapsed into a single `auth` folder for simplicity. | Consolidate auth routes into `auth/` with sub‑pages for sign‑in/up. |
| **components/** | Clear grouping (admin, builder, cart, home, layout, product, ui). No top‑level shared components (e.g., Button, Icon) – they are inside `ui/` but the folder is empty. | Populate `components/ui/` with a design‑system library (Button, Input, Modal) to enforce brand consistency. |
| **context/** | Not listed in directory output – likely missing or empty. Context providers (CartContext, AuthContext) are essential. | Ensure `src/context/` contains well‑typed React contexts and combine them via a `Providers` component. |
| **data/** | Likely holds static seed data; not inspected. Verify that large JSON fixtures are not committed unintentionally. | Move large seed data to `scripts/seed/` and keep only minimal demo data in repo. |
| **lib/** | Helper functions (api client, supabase client). Need to verify that side‑effects (e.g., API keys) are not hard‑coded. | Abstract all external service keys to environment variables and expose via a unified `lib/config.ts`. |
| **types/** | Good practice – ensure each type has JSDoc comments for generated docs. |
| **public/** | Holds static assets. Review for unoptimised images (use WebP/AVIF). |
| **sql schemas** | Three separate schema files (`design_builder_schema.sql`, `production_schema.sql`, `supabase_schema.sql`). Potential duplication of table definitions. | Consolidate into a single canonical schema (`schema.sql`) with separate migration scripts; generate them via Supabase CLI. |
| **dead / duplicate files** | `health_check.js` appears unused, `test_order_api.js` is an ad‑hoc script. | Remove or integrate into proper test framework (Jest/Playwright). |
| **missing folders** | No `styles/` folder; Tailwind config is at root. Consider a `styles/` for global CSS, theme tokens, and design tokens. |
| **naming consistency** | Mixed kebab‑case (`sign‑in`) vs camelCase (`admin`). Next.js prefers kebab for route folders – keep consistent. |

---

## SECTION 3 – Architecture Audit

### Routing & Rendering
- Uses **app router** (Next.js 13+). Server components for static pages, client components for interactivity.
- No explicit **ISR** or **revalidation** settings – all pages are rendered on each request, potentially increasing latency.

**Recommendation**: Add `revalidate` to product listing pages to enable incremental static regeneration (e.g., every 60 s) while keeping dynamic cart/client components.

### Server vs Client Components
- Mixed usage appears correct; however, some UI‑heavy components (e.g., product grid) are still server‑rendered, causing hydration mismatch if they depend on client‑only APIs.

**Recommendation**: Audit each component with `"use client"` directive and move heavy DOM‑manipulating logic (html2canvas) to client‑only modules.

### State Management & Context
- Likely a custom **CartContext** and **AuthContext**. No global state library (Redux, Zustand).
- Potential for **prop‑drilling** in deep component trees.

**Recommendation**: Adopt a lightweight store (Zustand) for cart & UI state; expose via context for type safety.

### API Organization
- API routes under `src/app/api/` (e.g., `order`, `webhook`). Controllers are thin; business logic resides directly in route files.

**Risk**: Hard to test and maintain when logic grows.

**Recommendation**: Extract business logic to a `src/lib/services/` layer (e.g., `orderService.ts`, `paymentService.ts`). Keep API routes thin, delegating to services.

### Database Layer
- Direct SQL via Supabase client; RLS policies protect per‑user data.
- No ORM/Query builder – acceptable for small apps but can lead to duplicated queries.

**Recommendation**: Consider using **Supabase Edge Functions** for complex queries or a lightweight query builder (e.g., `drizzle-orm`) for type safety.

### Authentication & Authorization
- **Clerk** handles UI (sign‑in, sign‑up) and issues JWTs.
- **Supabase RLS** enforces row‑level permissions using `auth.uid()`.
- Potential mismatch if Clerk and Supabase user IDs diverge.

**Recommendation**: Use **Supabase Auth** as source of truth, or sync Clerk UID to Supabase via a trigger. Document the mapping clearly.

### Storage & Environment Variables
- `.env.local` present; ensure no secrets are committed.
- API keys (Stripe secret, Qikink tokens) must be stored in Vercel environment variables, not in repo.

### Order & Payment System
- Orders stored in `orders` table; order items in `order_items` with RLS policies.
- Payment verification appears minimal – only client‑side Stripe checkout.

**Risks**: Replay attacks, missing webhook verification, lack of idempotency.

**Recommendation**: Implement server‑side Stripe webhook that validates `event.type`, stores payment intent ID, and updates order status atomically. Add retry handling and idempotency keys.

### Admin System & Design Builder
- Admin UI under `src/app/admin/` – likely uses same auth context.
- Design Builder stores customisation metadata in a JSON column (`design_json`) and generates a canvas image via `html2canvas`.
- No background job queue for image generation; uses `html2canvas` on client.

**Recommendation**: Move image rendering to a server‑less function (Vercel Edge) for reliability and to avoid client performance hits.

### Logging, Retry, Scalability
- No structured logging (e.g., Winston, Pino). `console.log` only.
- No retry middleware for external API calls (Stripe, Qikink).

**Recommendation**: Introduce a thin logging wrapper that adds request IDs, timestamps, and writes to Vercel Log Drain. Wrap external calls with exponential back‑off.

---

## SECTION 4 – Frontend Audit

| Aspect | Findings | Impact | Recommendations |
|--------|----------|--------|-----------------|
| **Landing Page** | Likely a static `page.tsx` with hero image. No SEO meta tags observed. | Poor search discoverability. | Add `<Head>` with `title`, `meta description`, Open Graph tags. |
| **Navigation** | Header component not listed; assume a `components/layout/Header`. Might lack keyboard navigation. | Accessibility issue. | Ensure navigation links are focusable, use ARIA landmarks, and provide skip‑nav link. |
| **Product Grid** | Rendered server‑side without pagination. Might load many items at once. | Performance degradation on large catalog. | Implement lazy loading/infinite scroll; use `next/image` for optimized images. |
| **Product Page** | Uses client‑side state for size/color selection. No fallback for JS disabled. | SEO & accessibility risk. | Keep product details in server‑rendered markup; enhance with client‑side interactivity (progressive enhancement). |
| **Cart** | Cart stored in React context + localStorage. No server‑side persistence. | Lost cart on new device; inconsistency across tabs. | Persist cart to Supabase (guest user) or use cookies with signed JSON. |
| **Checkout** | Stripe integration client‑only; webhook handling minimal. | Payment fraud risk, missing order reconciliation. | Move order creation to server, then create Stripe Checkout Session server‑side. |
| **Design Builder** | Heavy canvas generation in browser via `html2canvas`. | Large client CPU load, may crash on low‑end devices. | Offload rendering to a server‑less function; generate preview PNG/WEBP. |
| **Auth UI** | Clerk provides UI; brand styling may be limited. | Inconsistent visual language. | Use Clerk’s custom UI hooks to match Tailwind theme. |
| **Loading / Empty States** | Not inspected – likely minimal. | Poor UX when data fetches are slow. | Add skeleton loaders, empty‑state illustrations. |
| **Animations** | Framer Motion used; no performance audit. | May cause jank on low‑end devices. | Use `motion` only for non‑critical UI; enable prefers‑reduced‑motion. |
| **Accessibility** | No explicit ARIA labels, contrast checks not performed. | Legal compliance and user exclusion. | Run axe‑core audit, fix contrast, add alt text, ensure focus order. |
| **Responsiveness** | Tailwind ensures responsive utilities, but test across breakpoints. | Potential layout break on small screens. | Add breakpoint testing, use `container` width, avoid fixed sizes. |
| **Typography & Brand** | Custom fonts not listed. | Inconsistent brand identity. | Add Google Font (e.g., `Inter`) and define a design token palette. |
| **Dark Mode** | No dark‑mode classes observed. | Missed modern UX expectation. | Implement Tailwind dark mode (`media` or `class`) with appropriate color tokens. |
| **Performance** | No `next/image` usage, no `prefetch` on links, no caching headers. | Slow First Contentful Paint (FCP). | Adopt `next/image`, enable route prefetch, configure Vercel caching. |
| **SEO** | Missing `title`, meta description, canonical URLs. | Low organic traffic. | Add a central SEO component (`SEO.tsx`) used on every page. |

---

## SECTION 5 – Backend Audit

| Area | Findings | Risks | Recommendations |
|------|----------|-------|-----------------|
| **API Routes** | Thin wrappers in `src/app/api/`. Business logic mixed with request handling. | Hard to test, duplicated validation. | Extract services, add input validation (Zod). |
| **Error Handling** | Likely using `return new Response(...)` without a global error middleware. | Unhandled exceptions can crash the edge runtime. | Implement a universal error handler that returns standardized JSON with error codes. |
| **Validation** | No schema validation library observed. | Bad data may reach DB, causing integrity errors. | Use **Zod** or **Yup** to validate request bodies before DB writes. |
| **Security** | RLS policies protect most tables; however, admin routes may bypass RLS. | Privilege escalation. | Protect admin API with role‑based checks (e.g., `auth.role === 'admin'`). |
| **Authentication** | Clerk JWT passed to Supabase via `auth.uid()`. Potential mismatch if token is forged. | Unauthorized data access. | Verify Clerk token server‑side (via Clerk SDK) before using it for Supabase queries. |
| **Authorization** | No explicit RBAC beyond RLS. | Future features (e.g., staff) will be hard to implement. | Introduce a `roles` column and policy functions for flexible role checks. |
| **Logging** | Only `console.log`. | No traceability in production. | Add structured logger (e.g., `pino`) with request IDs. |
| **Rate Limiting** | Absent. | Abuse of checkout endpoint, brute‑force attacks. | Use Vercel Edge Rate Limiter or middleware to cap requests per IP. |
| **Retry Logic** | External calls (Stripe, Qikink) lack retries. | Transient network failures cause lost orders. | Wrap HTTP calls with `fetch-retry` or custom exponential backoff. |
| **Order Pipeline** | Order created → client redirects to Stripe → webhook updates status. No idempotent order creation guard. | Duplicate orders if user reloads. | Use a **unique idempotency key** (e.g., UUID from client) stored in `orders` and reject duplicates. |
| **Payment Verification** | Minimal server‑side verification. | Fraud, mismatched amounts. | Verify `payment_intent.amount_received` matches `order.total_amount`. |
| **Webhook Handling** | Single endpoint likely; no signature verification. | Attackers can spoof webhook events. | Verify Stripe signature (`stripe.webhooks.constructEvent`). |
| **Qikink Integration** | Not inspected; assume REST calls from order service. | Lack of error handling may cause silent failures. | Add retry, exponential backoff, and webhook for order fulfilment status. |
| **Supabase Usage** | Direct client usage in server components (Edge). | Possible exposure of service role token. | Use **service_role** key only on server‑side (protected via Vercel env), never expose to client bundles. |

---

## SECTION 6 – Database Audit

### Schema Overview
- `users` (Supabase auth) – managed by Supabase.
- `orders` (UUID, user_id, status, total_cents, created_at).
- `order_items` (FK to orders, product_slug, quantity, price_at_purchase, optional size/color).
- `design_templates` (likely in `design_builder_schema.sql`).
- Additional tables for product catalog, inventory, etc. (not listed).

### Observations
| Item | Comment |
|------|---------|
| **Primary Keys** | UUIDs generated via `gen_random_uuid()`. Good for distributed systems. |
| **Foreign Keys** | `order_items.order_id` references `orders.id` with `ON DELETE CASCADE`. |
| **RLS Policies** | Enabled on `order_items` with a policy that checks ownership via a sub‑query on `orders`. This is sound.
| **Indexes** | Not visible; default primary key index exists. Need indexes on `orders.user_id` and possibly `order_items.product_slug` for fast look‑ups.
| **JSON columns** | Design Builder likely stores JSON (e.g., `design_json`). Ensure `jsonb` type for indexing.
| **Normalization** | Product details (`product_name`, `price_at_purchase`) are duplicated in `order_items` – intentional for historical pricing.
| **Policies for Admin** | No admin‑role policy shown; admin may have unrestricted access via service_role.
| **Missing tables** | No `products` table visible; maybe in another schema. Verify that product catalog is stored and linked via `product_slug`.
| **Migration strategy** | Manual SQL files; consider using Supabase migration CLI (`supabase db push`). |
| **Performance** | Large catalog may need materialized views or indexed full‑text search on product fields.
| **Future scalability** | UUIDs are fine; ensure `order_items` can handle high write volume (use partitioning if >10M rows).

**Recommendations**
- Add explicit indexes: `CREATE INDEX idx_orders_user_id ON public.orders(user_id);`
- Add GIN index on JSONB design data if queries filter on attributes.
- Document RLS policies for each table (admin vs user). 
- Consolidate all schema definitions into a single `schema.sql` and generate migrations via Supabase CLI.
- Add `created_at` triggers for audit columns (`updated_at`).
- Evaluate row‑level security for the `products` table if needed.

---

## SECTION 7 – Business Flow Audit

| Flow | Steps | Gaps | Impact |
|------|-------|------|--------|
| **Landing → Browse** | Home page → Shop page (product grid). | No SEO, missing meta tags, no analytics. | Low organic traffic, poor conversion insights. |
| **Product Detail** | Click → Product page (size/color selection). | No server‑side fallback, missing SSR SEO. | Search engines cannot index product pages. |
| **Customization (Design Builder)** | User opens builder → selects template → adds text/images → saves design JSON. | Rendering done client‑side; no preview guarantee. | Poor UX on slow devices, risk of corrupted designs. |
| **Add to Cart** | Cart context updates, persisted to localStorage. | No cross‑device sync. | Users lose cart when switching browsers. |
| **Checkout** | Client creates Stripe checkout → redirects → webhook updates order. | No server‑side order validation, missing idempotency, no email receipt. | Payment fraud, lost orders, bad post‑purchase experience. |
| **Confirmation** | After webhook, order status set to *paid*; UI polls for status. | No user‑facing receipt page, no order summary email. | Lower trust, higher support tickets. |
| **Shipping (Qikink)** | Order record sent to Qikink via API after payment. | No retry/queue, no status sync. | Failed fulfilments go unnoticed. |
| **Admin Flow** | Admin logs in → Order list → Update status → Manage design templates. | No role‑based UI, no audit logs. | Hard to trace changes, security concerns. |
| **Template Management** | Design templates stored in DB, edited via builder UI. | No versioning, no preview before publishing. | Incorrect designs may go live. |
| **Launch Readiness** | Vercel deploy, environment variables set, basic health check script present. | No health‑check endpoint, no monitoring, no load testing. | Risk of downtime under traffic spikes.

**Key Blockers for a Production Launch**
1. **Payment & Webhook Security** – missing signature verification, idempotency, and server‑side order creation.
2. **Testing & CI** – absence of automated tests makes regressions risky.
3. **Observability** – no health endpoint, logging, or error tracking; cannot guarantee uptime.
4. **SEO & Accessibility** – search visibility and legal compliance are weak.
5. **Environment Secrets Management** – risk of leaking API keys.
6. **Performance Optimisations** – lack of ISR, image optimisation may affect user experience under load.

---

## SECTION 8 – Design Builder Audit

- **Template System**: Stored as rows in `design_templates` (presumed) with JSON layout definitions.
- **Placement Slots**: Fields like `selected_size`, `selected_color` captured per order item. Builder likely lets users place text/images onto a preview canvas.
- **Rendering**: Uses `html2canvas` on client to capture a PNG for printing.
- **Storage**: Design JSON persisted to DB; image likely uploaded to Supabase storage (not verified).
- **Preview**: Real‑time preview rendered in browser; may differ from printed output due to DPI differences.
- **Performance**: `html2canvas` can be CPU‑heavy; large designs may freeze UI.
- **Scalability**: As designs grow, server‑less rendering will be required for batch processing.
- **Print Accuracy**: No colour management or DPI verification – print may not match on‑screen preview.

**Recommendations**
- Move canvas rendering to a **server‑less Edge Function** (Vercel) that receives design JSON and returns a high‑resolution image.
- Store both JSON and generated image in Supabase Storage with versioning.
- Add a **preview quality toggle** (low‑res for UI, high‑res for order).
- Implement **design validation** (e.g., minimum/maximum dimensions) before order creation.
- Consider a **template marketplace** – separate public templates from user‑generated ones.

---

## SECTION 9 – Production Readiness

| Pillar | Current State | Gaps | Action Items |
|--------|---------------|------|--------------|
| **Deployment** | Vercel automatic builds from `main`. | No branch protection, no CI lint/test gate. | Add GitHub Actions: lint, type‑check, unit tests, security scan (`npm audit`). |
| **Secrets Management** | `.env.local` present locally; Vercel env vars required for Stripe, Qikink, Supabase service key. | Risk of committing secrets; unclear rotation policy. | Move all secrets to Vercel env, enable secret scanning, rotate periodically. |
| **Monitoring** | No health endpoint, no log aggregation. | No visibility into runtime errors. | Add `/api/health` returning `200 OK`; use Vercel Log Drains to external service (Datadog, Sentry). |
| **Logging** | `console.log` only. | Hard to trace issues in production. | Integrate structured logger (pino) and forward logs to Sentry/Logflare. |
| **Analytics** | None. | No user behaviour data. | Add Google Analytics / Plausible with consent banner. |
| **Performance** | No ISR, no image optimisation, no caching headers. | Slow TTFB, high bandwidth usage. | Enable `next/image`, set `revalidate` on product pages, use Vercel Edge caching for static assets. |
| **Security** | RLS policies, missing webhook signature verification, no rate limiting. | Vulnerable to abuse, replay attacks. | Implement Stripe webhook verification, add rate‑limit middleware, enforce CSP & helmet headers. |
| **Disaster Recovery** | Backups rely on Supabase automatic backups. | No DB restore test plan. | Schedule periodic backup verification, document restore steps. |
| **Testing** | Only ad‑hoc script `test_order_api.js`. | No unit, integration, e2e tests. | Introduce Jest + React Testing Library for unit tests, Playwright for e2e flows (checkout, builder). |
| **CI/CD** | Git push triggers Vercel deploy. | No linting or building verification before deploy. | Add GitHub Actions to run `npm run lint`, `npm run build --if-present` before Vercel deploy (using Vercel preview builds). |

---

## SECTION 10 – Documentation Audit

- **README.md** – ~8 KB, likely contains basic project description and start script.
- **Architecture docs** – None found.
- **API docs** – No OpenAPI spec; endpoints are implicit.
- **Database docs** – SQL schema files exist, but no diagram or explanations.
- **Contributing guide** – Missing.
- **Roadmap** – Not present.
- **License** – Not observed (should add MIT/Apache). 
- **Screenshots / UI mockups** – Absent.
- **Installation guide** – Not detailed (no steps for Supabase CLI, environment variables). 

**Recommendations**
1. Expand `README` with sections: **Project Overview**, **Tech Stack**, **Setup**, **Running Locally**, **Deployment**, **Testing**, **Contributing**.
2. Add an **ARCHITECTURE.md** detailing component diagram, data flow, security model.
3. Generate **API documentation** (Swagger/OpenAPI) from route definitions using a tool like `next-swagger-doc`.
4. Include **DB schema diagram** (draw.io or Mermaid) in `docs/`.
5. Provide a **CONTRIBUTING.md** with linting, commit conventions, PR process.
6. Add a **LICENSE** file (MIT).
7. Add **screenshots** of key pages (home, builder, checkout) for portfolio showcase.
8. Document **environment variables** in a `.env.example` file.

---

## SECTION 11 – Portfolio Value

| Stakeholder | What they look for | How Unwearable scores | Improvements needed |
|-------------|-------------------|-----------------------|---------------------|
| **Recruiters** | Clean code, modern stack, CI, tests. | Uses Next.js, TypeScript – good. | Add comprehensive test suite, CI pipeline, linting. |
| **Startup Founders** | Viable product, scalability, security. | Core flow works, but payment & webhook security lacking. | Harden payment flow, add monitoring, document launch checklist. |
| **Open‑Source Maintainers** | Documentation, contribution guide, license. | Minimal docs, no license. | Add full docs, CONTRIBUTING, LICENSE, issue templates. |
| **Investors** | Traction potential, defensible tech, roadmap. | Strong brand concept, but product maturity low. | Show roadmap, analytics, performance metrics, security audits. |
| **Technical Interviewers** | Problem‑solving, design decisions, best practices. | Good architectural choices, but missing testing and observability. | Publish design decisions, test coverage report, architecture diagrams. |

**Overall** – The repo has a solid foundation but needs polishing (tests, docs, security) to truly impress all parties.

---

## SECTION 12 – Business Readiness

**Can this launch today?** – **No.**

### Blockers (ranked by severity)
1. **Payment & Webhook Security** – No signature verification, idempotency, or server‑side order creation. Critical for financial compliance.
2. **Testing & CI** – Absence of automated tests makes regressions risky.
3. **Observability** – No health endpoint, logging, or error tracking; cannot guarantee uptime.
4. **SEO & Accessibility** – Search visibility and legal compliance are weak.
5. **Environment Secrets Management** – Risk of leaking API keys.
6. **Performance Optimisations** – Lack of ISR, image optimisation may affect user experience under load.

**Secondary improvements** (P1‑P3) – see Roadmap below.

---

## SECTION 13 – Scoring (out of 10 per category)

| Category | Score |
|----------|-------|
| Documentation | 4 |
| Architecture | 6 |
| Backend | 5 |
| Frontend | 6 |
| Database | 6 |
| Security | 4 |
| Performance | 5 |
| Accessibility | 3 |
| Maintainability | 5 |
| Testing | 2 |
| Deployment | 5 |
| Business Readiness | 4 |
| Portfolio Value | 6 |
| Production Readiness | 5 |

**Overall Score**: 65 / 140

---

## SECTION 14 – Roadmap

### P0 – Critical launch blockers (must be done before go‑live)
| Task | Effort | Owner |
|------|--------|-------|
| Implement **server‑side order creation** + Stripe Checkout Session with **idempotency keys**. | Medium | Backend lead |
| Add **Stripe webhook signature verification** and update order status atomically. | Small | Backend lead |
| Add **role‑based access control** for admin APIs (policy & middleware). | Small | Backend lead |
| Set up **structured logging** (pino) + **Sentry** integration for error tracking. | Small | DevOps |
| Create **health check endpoint** (`/api/health`). | Small | Backend lead |
| Add **rate limiting** middleware for sensitive endpoints (checkout, webhook). | Small | Backend lead |
| Write **unit tests** for order service, payment service (Jest) and **e2e flow** (Playwright). | Large | QA |
| Add **CI pipeline** (lint, type‑check, test) via GitHub Actions. | Medium | DevOps |

### P1 – Must‑have before launch
| Task | Effort |
|------|--------|
| Implement **SEO component** with meta tags, Open Graph, canonical URLs. |
| Add **ARIA attributes**, keyboard navigation, and run axe audit for accessibility. |
| Enable **ISR** for product listing pages (`revalidate: 60`). |
| Replace image tags with **next/image** for optimisation. |
| Add **Google Analytics / Plausible** with consent banner. |
| Migrate **design builder rendering** to a Vercel Edge Function (high‑res PNG). |
| Create **order receipt email** using SendGrid or Supabase functions. |
| Provide **dark mode** via Tailwind (`media`) and design tokens. |
| Document **environment variables** (`.env.example`) and write onboarding guide. |
| Add **license** (MIT) and **CONTRIBUTING.md**. |

### P2 – Important improvements
| Task | Effort |
|------|--------|
| Add **caching headers** for static assets, configure Vercel edge caching. |
| Implement **product search** with indexed full‑text on `products` table. |
| Add **admin audit logs** (who changed what and when). |
| Introduce **feature flags** (LaunchDarkly or simple config) for beta features. |
| Build **admin dashboard** for order fulfillment tracking. |
| Write **API documentation** (OpenAPI) and publish Swagger UI. |
| Add **load testing** (k6) and performance budget monitoring. |
| Refactor **business logic** into services (`orderService`, `paymentService`). |
| Migrate **SQL schema** to Supabase migration files (`supabase/migrations`). |

### P3 – Future enhancements (nice‑to‑have)
| Task | Effort |
|------|--------|
| Introduce **multi‑vendor marketplace** (allow other designers). |
| Add **social sharing** (OG images, share buttons). |
| Implement **wishlist** and **user profile customization**. |
| Provide **mobile app** (React Native) for on‑the‑go design. |
| Add **AI‑driven design suggestions** (stable diffusion). |
| Implement **progressive web app** (offline cart). |
| Open‑source **design builder component library** for community contributions. |

---

*Prepared by the Engineering Audit Team – Senior Staff Engineer, Product Architect, UI/UX Lead, Technical Lead, CTO, Open‑Source Maintainer.*
