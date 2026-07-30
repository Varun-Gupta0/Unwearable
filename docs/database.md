# Database Architecture

Unwearable is powered by Supabase, a managed PostgreSQL service. The database handles products, users (synced from Clerk), orders, custom designs, and error logging.

## Schema Overview

The primary tables in the schema include:

- **`products`**: Information on available items (SKU, pricing, stock).
- **`orders`**: Master record of customer orders, Razorpay session IDs, and Qikink fulfillment IDs. Total amounts are stored as integers (in cents) to prevent floating-point errors.
- **`order_items`**: (Replaced by `customer_details` JSONB field in newer schemas for flexibility, but heavily utilized in legacy flows).
- **`templates` & `designs`**: Used by the Custom Builder to store user-created apparel designs.
- **`error_logs`**: A critical table used for tracking asynchronous failures (like Qikink API timeouts) to allow administrators to safely retry fulfillment.

## Security (Row Level Security)

PostgreSQL's Row Level Security (RLS) is heavily utilized to ensure data privacy. By default, all tables restrict read and write access.

- **User Access**: Users can only read rows where the `user_id` matches their authenticated Clerk session `auth.uid()`.
- **Admin Access**: Administrators (identified via Clerk metadata or specific roles) have elevated privileges to read all orders.
- **Service Role**: Serverless functions handling sensitive webhooks bypass RLS entirely by connecting via the `service_role` key. This ensures the backend can always write order statuses, regardless of the active user session.

## Migration Strategy

The initial schema configuration is managed in `supabase/migrations/00000000000000_initial_schema.sql`. Changes to production databases should always be performed via new migration scripts to maintain a strict version history.

## Environment Variables
Connections are established using two primary environment variables:
- `NEXT_PUBLIC_SUPABASE_URL`: The project URL (Safe for client).
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: The anonymous key for client-side RLS enforcement.
- `SUPABASE_SERVICE_ROLE_KEY`: A strictly server-side key used for administrative actions.
