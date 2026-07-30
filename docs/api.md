# Internal API Reference

This document outlines the core internal API endpoints used by the frontend and third-party webhooks.

## 1. Webhooks

### `POST /api/payment/webhook`
Receives asynchronous payment updates from Razorpay.
- **Security**: Validates the `x-razorpay-signature` header using `RAZORPAY_WEBHOOK_SECRET`.
- **Payload**: Razorpay event object (`payment.captured`, `payment.failed`).
- **Action**: Updates the database order status using `service_role` and triggers Qikink fulfillment via `waitUntil()`.
- **Returns**: `200 OK` immediately upon signature validation.

## 2. Order Management

### `POST /api/orders`
Creates a new pending order in the database before sending the user to checkout.
- **Security**: Requires an active Clerk session (enforced by middleware).
- **Payload**:
  ```json
  {
    "amount": 2500,
    "items": [...],
    "shippingDetails": { "name": "John", "address": "..." }
  }
  ```
- **Returns**: `{ orderId: "uuid", razorpayOrderId: "order_xyz123" }`

### `POST /api/orders/submit`
An internal-only endpoint that submits an order to the Qikink dropshipping API.
- **Security**: Requires `x-internal-api-key` header to match `INTERNAL_API_KEY`.
- **Payload**:
  ```json
  {
    "orderId": "uuid"
  }
  ```
- **Action**: Fetches order details from Supabase, maps them to Qikink's format, and POSTs to Qikink. Records any failures into the `error_logs` table.
- **Returns**: `{ success: true, qikinkOrderId: "..." }`

## 3. Administration

### `POST /api/admin/orders/retry`
Allows administrators to manually retry an order fulfillment that previously failed (e.g., due to a Qikink timeout).
- **Security**: Enforced by Clerk middleware (admin role required).
- **Payload**:
  ```json
  {
    "orderId": "uuid"
  }
  ```
- **Action**: Internally re-invokes the `/api/orders/submit` logic.
- **Returns**: Success or Failure status.
