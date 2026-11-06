# Sarmelle — Handover Document

## Current Status
- **Active Branch:** `refactor/split-app`
- **Milestone:** Milestone 2 (Architecture, Refactoring & Setup) — In Progress.
- **Architecture Option Confirmed:** **Option B** — React 19 + TypeScript + Vite 8 + Tailwind CSS v4 built to static files, with a modular PHP 8.2+ / MySQL backend. No Node.js runtime on Hostinger in production.

---

## Architectural & Business Decisions Recorded
1. **Option B Stack:** React 19 + TypeScript + Vite 8 + Tailwind v4 bundled into static files (`dist/`) served by Apache/LiteSpeed on Hostinger, with PHP REST API under `/api/` and MySQL (`sarmelle_db`). Zero Node.js footprint in production.
2. **Vite Base Path:** Vite `base` stays locked to `'/'` (domain root deployment). Relative paths (`'./'`) are not used.
3. **Payments Suite:** Razorpay, **UPI ONLY** (Google Pay, PhonePe, Paytm, custom VPA). Credit/Debit Cards, NetBanking, and Cash on Delivery (COD) are removed.
4. **Product Slugs & Immutability:** Auto-generated from product names, permanently locked after initial publish. If renamed, legacy slugs trigger automated 301 HTTP redirects from a database mapping table.
5. **SEO & Social Sharing:** PHP-injected dynamic SEO `<title>`, `<meta name="description">`, and Open Graph tags on product pages, paired with an auto-generated sitemap and robots.txt.
6. **Dependency & Build Baseline:** The explicit `esbuild` devDependency was removed to resolve an npm `ERESOLVE` peer conflict with Vite 8. `npm install` completed with 0 vulnerabilities, generating `package-lock.json`.

---

## Refactoring Progress (Milestone 2)
- **Step 1 (Types Extraction) [COMPLETED]:**
  - Created `src/types/` containing `product.ts`, `campaign.ts`, and `order.ts`.
  - Converted `src/App.tsx` to type-only imports (`import type`).
  - Production build verified (`npm run build` succeeded).
  - Committed as `fdd1496`: *"refactor: extract TypeScript types from App.tsx"*.
- **Step 2 (Mock Data Extraction) [COMPLETED]:**
  - Created `src/data/` containing `products.ts`, `reviews.ts`, `campaign.ts`, and `orders.ts`.
  - Coupon rules retained inside `App.tsx` handlers.
  - Reduced `src/App.tsx` from 5,770 lines down to **5,019 lines**.
  - Production build verified (`npm run build` built in 1.43s).
  - Committed as `755b5a7`: *"refactor: extract mock data from App.tsx"*.

---

## Immediate Next Steps (in priority order)
1. **Finish App.tsx split (Steps 3 to 8):** Extract modals, context providers, layout header/footer, and view pages; merge into `main` after complete manual click-through.
2. **Checkout polish:** Restrict payment step to UPI only; remove cards, NetBanking, COD, and the "address type" field.
3. **Prune unused packages:** Remove `@google/genai`, `express`, `tsx`, and `dotenv` after verifying zero imports.
4. **Routing & URLs:** Implement real client routing with clean product/category URLs.
5. **Admin isolation:** Separate admin CMS code from public customer-facing storefront bundle.
6. **Payment gateway setup:** Confirm Razorpay business account activation and KYC requirements early.
