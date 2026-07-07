# Unwearable – Premium Customizable E‑Commerce Platform

## 🚀 Overview
**Unwearable** is a modern, high‑performance e‑commerce application built with **Next.js (App Router)**, **Supabase**, **Clerk**, and **Qikink**. It provides a full‑featured product catalog, a **Design Builder** that lets customers customize predefined templates, and a secure **Admin Dashboard** for managing products, templates, and orders.

---

## 🛠️ Tech Stack
| Layer | Technology |
|------|------------|
| **Framework** | Next.js 16 (App Router, Turbopack) |
| **Styling** | Vanilla CSS + custom UI components (BrutalButton, BrutalInput) |
| **Auth** | Clerk (email‑only, phone auth disabled) |
| **Database / Storage** | Supabase (PostgreSQL + Storage bucket `designs`) |
| **Print Fulfillment** | Qikink API (sandbox) |
| **State Management** | React Context (`CartContext`, `DesignContext`) |
| **Image Rendering** | `html2canvas` for client‑side PNG generation |
| **Deployment** | Vercel (CI/CD) |

---

## ✨ Core Features
1. **Product Catalog & Cart**
   - Browse products (`/shop`).
   - Add items with size & color selection.
   - Live cart badge in the header.
2. **Admin Dashboard** (`/admin`)
   - **Product Manager** – create, edit, delete products and assign Qikink SKUs.
   - **Template Manager** (`/admin/templates`) – upload base images, define placement slots and allowed colors for each product.
   - **Access Control** – visible only to the email **`varungupta010307@gmail.com`** (hard‑coded fallback + env var). Protected by Clerk middleware.
3. **Design Builder** (`/customize/[templateId]`)
   - 4‑step wizard: **Select Template → Pick Color → Choose Placement → Confirm**.
   - Real‑time preview using CSS‑layered images.
   - Final preview rendered to PNG via `html2canvas` and uploaded to Supabase.
   - PNG URL (`designImageUrl`) attached to the order payload sent to Qikink.
4. **Qikink Order Integration** (`/api/orders/route.ts`)
   - Builds line items with optional `print_file` for custom designs.
   - Falls back to local SKU when a product is missing from Supabase.
5. **Clerk Authentication**
   - Email‑only sign‑in/out (phone authentication disabled in Clerk dashboard).
   - Admin link appears only for the authorized email.
6. **Supabase Schema**
   - `templates` table – stores base image, placement JSON, color palette JSON, active flag.
   - `designs` table – stores user‑specific customizations, references `templates`, and preview image URL.
   - Row‑Level Security (RLS) policies for public/template reads and user‑owned design writes.
7. **Premium UI / Brutalist Design**
   - Dark‑mode‑compatible, high‑contrast aesthetics with thick borders, hard shadows, and micro‑animations.
   - Reusable `BrutalButton` component with variants (`default`, `accent`, `toxic`, `ghost`).

---

## 📁 Project Structure (high‑level)
```
src/
├─ app/                     # Next.js app router pages
│   ├─ admin/               # Admin panel (product & template pages)
│   │   └─ templates/page.tsx   # Template manager UI
│   ├─ api/orders/route.ts   # Order creation + Qikink integration
│   ├─ customize/[templateId]/page.tsx  # Design Builder entry point
│   ├─ product/[slug]/page.tsx   # Product details with "Add to Cart" & "Customize"
│   └─ ...
├─ components/
│   ├─ admin/                # TemplateForm, TemplateList UI
│   ├─ builder/              # DesignBuilder, StepSelector, PreviewCanvas, etc.
│   ├─ layout/Navbar.tsx     # Header with conditional Admin link
│   └─ ui/BrutalButton.tsx   # Reusable button component
├─ context/CartContext.tsx   # Cart state management
├─ context/DesignContext.tsx # Wizard state machine for builder
├─ lib/
│   ├─ designApi.ts          # CRUD for templates & designs (Supabase)
│   ├─ renderDesign.ts       # html2canvas utility to create PNG
│   └─ api.ts                # Product fetch helpers
├─ types/index.ts            # TypeScript interfaces (Product, Template, Design, etc.)
└─ ...
```

---

## 📦 Supabase Schema (SQL)
```sql
-- templates table
CREATE TABLE public.templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id TEXT NOT NULL,           -- matches product slug
  name TEXT NOT NULL,
  base_image_url TEXT NOT NULL,
  placements JSONB NOT NULL DEFAULT '[]'::jsonb,
  colors JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- designs table
CREATE TABLE public.designs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,               -- Clerk user ID
  template_id UUID REFERENCES public.templates(id) ON DELETE CASCADE,
  product_slug TEXT NOT NULL,
  selected_color JSONB NOT NULL,
  selected_placement JSONB NOT NULL,
  design_config JSONB NOT NULL,
  preview_image_url TEXT,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);
```
> **Bucket:** Create a `designs` bucket in Supabase storage and set it to **Public** so `html2canvas` can access the images.

---

## 🔧 Environment Variables
| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public Supabase key |
| `ADMIN_EMAIL` | Email that may access the admin dashboard |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key |
| `CLERK_SECRET_KEY` | Clerk secret key (server) |
| `QIKINK_CLIENT_ID` / `QIKINK_CLIENT_SECRET` | Qikink credentials |
| `QIKINK_API_URL` | Qikink base URL |

Make sure the same values are added in **Vercel → Settings → Environment Variables** for production.

---

## 🏗️ Local Development
```bash
# Clone the repo (already done)
cd Unwearable

# Install dependencies
npm install

# Set up .env.local (see table above) and add:
# ADMIN_EMAIL=varungupta010307@gmail.com


# Run the dev server
npm run dev   # http://localhost:3000
```
Open the site, sign‑in with `varungupta010307@gmail.com`, and the **Admin** link will appear.

---

## 🚀 Production Deployment (Vercel)
1. Connect the GitHub repo `Varun-Gupta0/Unwearable` to Vercel.
2. Add the environment variables from the table to Vercel (both **Production** and **Preview**).
3. Vercel will automatically run `npm run build` and deploy.
4. After the first deploy, create the `designs` bucket in Supabase and set CORS to allow `https://<your‑vercel‑domain>.vercel.app`.

---

## 🎯 Using the Admin Dashboard
1. **Sign In** with the authorized email (`varungupta010307@gmail.com`).
2. Click the **Admin** link in the header.
3. **Products Tab** – add a new product (name, slug, price, image, Qikink SKU).
4. **Design Templates Tab** – click **+ Create New Template**, select a product slug, upload a base image, define placement slots (x, y, width, height) and allowed colors, then **Create**.
5. Once a template exists for a product, the **✦ Customize** button appears on that product’s page for customers.

---

## 📚 Testing the Design Builder
1. Browse to a product with an active template (e.g., `404‑not‑found‑tee`).
2. Click **✦ Customize**.
3. Follow the 4‑step wizard, pick a color, adjust placement, and hit **Confirm**.
4. The preview is rendered to PNG, uploaded to Supabase, and the design URL is attached to the order payload.
5. Add the customized item to the cart and proceed to checkout – the order will be sent to Qikink with the custom `print_file`.

---

## 🤝 Contributing
- Fork the repo, create a feature branch, and submit a Pull Request.
- Follow the existing code style (TypeScript, functional components, vanilla CSS).
- All UI components should use the **Brutal** design system for consistency.

---

## 📄 License
MIT © 2026 Varun Gupta
```

---

*This README was generated to reflect the current state of the project, covering every major feature, architecture piece, and setup instruction.*
