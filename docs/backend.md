# Backend Architecture

Unwearable utilizes Next.js Serverless Functions (`app/api/*`) as its backend layer. This provides a highly scalable, zero-maintenance API layer perfectly suited for Vercel deployment.

## Core API Routes

The backend is logically separated into three domains:
- `/api/orders`: Standard user-facing order creation and retrieval.
- `/api/payment`: Payment processing and webhook endpoints.
- `/api/admin`: Administrative endpoints for managing products, templates, and overriding order states.

## Security & Middleware

All routes are protected by Clerk Middleware (`src/proxy.ts`), which acts as an edge-level proxy.

### Route Protection
1. **Public Routes**: The homepage, product pages, and shop are completely public.
2. **Protected Routes**: The `/account` and `/admin` paths enforce active user sessions.
3. **Webhook Bypasses**: Specific API routes (like `/api/payment/webhook`) are configured in the middleware as explicitly public. Security for these routes is handled at the controller level via payload signatures (e.g., Razorpay HMAC).

### Internal API Key
Certain serverless endpoints must be called by other internal systems (e.g., triggering Qikink order submission asynchronously). These routes are protected by an `INTERNAL_API_KEY`. The backend checks `request.headers.get('x-internal-api-key')` against the environment variable to ensure only authorized edge functions can trigger these processes.

## Third-Party Integrations

### Razorpay Payments
The backend creates orders using the Razorpay Node SDK. 
The crucial component is the `/api/payment/webhook` route, which:
1. Receives the `payment.captured` event.
2. Validates the signature using `RAZORPAY_WEBHOOK_SECRET`.
3. Updates the Supabase order status using the `service_role` key to bypass RLS.
4. Triggers the internal Qikink fulfillment API.

### Qikink Fulfillment
Because Vercel serverless functions freeze execution the moment an HTTP response is sent, the Qikink order submission process utilizes Vercel's `waitUntil()` utility.

When a webhook arrives:
1. The backend immediately responds `200 OK` to Razorpay (preventing retries and timeouts).
2. The heavy lifting (contacting Qikink, parsing responses, saving tracking IDs) is queued via `waitUntil()`, allowing it to resolve in the background before the Lambda spins down.

## Error Handling

All backend routes follow a strict `try-catch` pattern, utilizing a custom `QikinkError` class and logging critical failures into a dedicated `error_logs` table in Supabase. This allows admins to retry failed fulfillments without requiring manual database intervention.
