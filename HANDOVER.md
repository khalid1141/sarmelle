# Sarmelle — Handover Document

## Current Status
- **Active Branch:** `refactor/split-app`
- **Milestone:** Milestone 2 (Architecture, Refactoring & Setup) — In Progress.
- **Architecture Option Confirmed:** **Option B** — React 19 + TypeScript + Vite 8 + Tailwind CSS v4 built to static files, with a modular PHP 8.2+ / MySQL backend. No Node.js runtime on Hostinger in production.
- **Step 7C [COMPLETED]:** ProductDetailView, AccountView and AdminView extracted (`f7e2732`, `4d9dfc5`, `82bc893`); `currentView` render guards for HomeView and CollectionView restored in `3e53375`.
- **Cleanup [COMPLETED]:** Unused lucide-react icon imports and the dead `activeFilterCount` / `hasActiveFilters` helpers removed from App.tsx (`5a3b4fd`). `src/App.tsx` is now **591 lines** (from 5,770 at the start of Milestone 2).
- **Folder layout:**
  - `src/types/` — `product.ts`, `campaign.ts`, `order.ts`, `cart.ts`
  - `src/data/` — `products.ts`, `reviews.ts`, `campaign.ts`, `orders.ts`
  - `src/components/modals/` — `SizeChartModal`, `ReviewsModal`, `ChangePasswordModal`, `WishlistDrawer`, `CartDrawer`, `AuthModal`, `OrderTrackingModal`, `ReturnModal`, `CheckoutModal`
  - `src/components/common/` — `Header`, `Footer`, `MobileNav`
  - `src/components/views/` — `HomeView`, `CollectionView`, `ProductDetailView`, `AccountView`, `AdminView`
- **Tool rotation rule:** One agent works in this repository at a time. Before switching tools/agents, the working tree must be clean (only the untracked `MILESTONE2_ASSESSMENT.md/.doc` may be present), and every new prompt must open with the preamble: read `HANDOVER.md` and `TODO.md`, run `git status`, and confirm the expected branch/HEAD.

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
1. **Complete Milestone 2 split:** The App.tsx split (Steps 1–8) is finished; run the full manual click-through on `refactor/split-app`, then merge into `main`.
2. **Checkout polish:** Restrict payment step to UPI only; remove cards, NetBanking, COD, and the "address type" field.
3. **Prune unused packages:** Remove `@google/genai`, `express`, `tsx`, and `dotenv` after verifying zero imports.
4. **Routing & URLs:** Implement real client routing with clean product/category URLs.
5. **Admin isolation:** Separate admin CMS code from public customer-facing storefront bundle.
6. **Payment gateway setup:** Confirm Razorpay business account activation and KYC requirements early.
