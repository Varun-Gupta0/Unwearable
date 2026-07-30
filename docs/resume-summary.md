# Resume Summary

*The following points are designed to be copied directly into a professional resume to highlight the technical achievements of this project.*

### **Full-Stack Software Engineer** | Unwearable (E-Commerce Platform)

- Architected and deployed a highly scalable, serverless e-commerce platform using **Next.js (App Router)** and **React 19**, resulting in a high-performance frontend with zero-JS initial loads for product listings.
- Integrated **Razorpay** for secure payment processing, implementing robust webhook handlers that explicitly verify HMAC signatures to prevent payload spoofing.
- Engineered a background processing pipeline using Vercel's `waitUntil()` to bypass serverless execution timeouts, successfully bridging asynchronous payment webhooks with the synchronous **Qikink Dropshipping API** for automated fulfillment.
- Designed a secure **PostgreSQL** database schema on **Supabase**, leveraging strictly enforced **Row Level Security (RLS)** to protect user data, while utilizing `service_role` keys for internal administrative automation.
- Implemented edge-level route protection and authentication using **Clerk Middleware**, creating a secure separation between public storefronts, authenticated user portals, and protected admin dashboards.
- Refactored and optimized the codebase by conducting comprehensive security audits, removing unused dependencies, and consolidating legacy database schemas into a unified migration pipeline.
- Built a complex client-side Custom Design Builder utilizing HTML5 Canvas and React Context to allow users to dynamically customize apparel in real-time before ordering.
