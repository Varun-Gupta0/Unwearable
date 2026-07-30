# Frontend Architecture

Unwearable utilizes the latest features of React 19 and Next.js App Router to deliver a fast, responsive, and highly interactive user experience.

## Styling
The platform is styled strictly with Tailwind CSS. It uses utility classes for layout, typography, and responsive design, ensuring a clean and consistent aesthetic across all components. Custom configurations and theme variables (like standard spacing and brand colors) are defined in `tailwind.config.ts`.

## Component Structure

The frontend is highly modularized inside `src/components`:
- **`/ui`**: Generic, reusable UI atoms (Buttons, Inputs, Modals, Cards).
- **`/shop`**: Product grids, single product pages, and filtering logic.
- **`/cart`**: Shopping cart slide-out, item management, and checkout summaries.
- **`/account`**: User profile management and order history views.
- **`/admin`**: Dashboard components for managing the platform.
- **`/builder`**: The custom design canvas interface.

## State Management
We utilize the React Context API to manage global state without the overhead of Redux.
- **`CartContext`**: Manages the user's shopping cart, persisting data to local storage for guest checkouts, and calculating totals.
- **`DesignContext`**: Manages the complex state of the Custom Builder (layers, text properties, active templates, and rendering logic).

## Data Fetching
Next.js App Router allows for a hybrid approach to data fetching:
- **Server Components (RSC)**: Used heavily for product listings, reading from Supabase directly on the server, resulting in zero-JS shipping for initial renders.
- **Client Components (`'use client'`)**: Used for interactive sections, like the Cart, Checkout flows, and the Design Builder, where local state and browser APIs are required.

## Performance Optimization
- **Image Optimization**: Utilizes `next/image` for automatic WebP conversion, resizing, and lazy loading.
- **Edge Runtime**: Certain middleware checks execute on the Vercel Edge Network for sub-millisecond response times.
