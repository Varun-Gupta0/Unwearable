# Deployment & Infrastructure

Unwearable is designed to be hosted on Vercel, utilizing their Global Edge Network and Serverless Functions.

## Vercel Constraints & Solutions

Serverless platforms like Vercel have strict timeout limits and execution behaviors. The most critical constraint is that a serverless function halts execution immediately when a response is sent to the client.

**The Problem**: When Razorpay sends a payment webhook, we must respond `200 OK` as fast as possible to prevent Razorpay from timing out and retrying the webhook. However, we also need to contact the Qikink API to submit the order, which can take several seconds.

**The Solution**: We utilize `waitUntil()`.
By importing `@vercel/functions`, we wrap the long-running Qikink API call in `waitUntil()`. This explicitly instructs the Vercel execution environment to keep the Lambda function warm and running in the background even after the `200 OK` is returned to Razorpay.

## Deployment Steps

1. **Link the Repository**: Connect your GitHub repository to a new Vercel project.
2. **Environment Variables**: Configure all required production keys in the Vercel dashboard (see README for the complete list).
3. **Database Migrations**: Ensure the Supabase production database is migrated up to date.
4. **Deploy**: Trigger a production build. Vercel automatically detects the Next.js framework and configures the build settings (`npm run build`).

## Production Readiness
Before any major launch, the deployment must pass a production-readiness audit checking:
- **Middleware integrity**: Ensuring admin routes are tightly guarded.
- **Service Role enforcement**: Verifying RLS bypasses are strictly limited to webhook handling.
- **Error Boundaries**: Ensuring frontend crashes do not bring down the entire application.
