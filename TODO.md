# Sarmelle E-Commerce Platform — Project Roadmap & TODO

> **Naming note:** the backend foundation is now called **Milestone 4** (see `docs/MILESTONE4_DESIGN.md`); the headings below are not renumbered.

## Architecture Decisions (Option B Confirmed)
- **Frontend & Build:** React 19 + TypeScript + Vite 8 + Tailwind CSS v4 built to static files (`dist/`).
- **Backend:** PHP 8.2+ REST API endpoints under `/api/` with PDO prepared statements and MySQL database (`sarmelle_db`).
- **Production Server:** Hostinger Premium Shared Hosting with Apache/LiteSpeed. Strictly **no Node.js process** runs on the server in production.
- **Base Path:** Vite `base` stays `'/'` (storefront lives at domain root; do not use `'./'`).
- **Payments:** Razorpay, **UPI ONLY** (Google Pay, PhonePe, Paytm, custom UPI ID). No credit/debit cards, no NetBanking, and no Cash on Delivery (COD).
- **Product Slugs & SEO:** Slugs are auto-generated from product names, locked after publish, with redirects from old slugs. Product pages get PHP-injected SEO and Open Graph tags, an auto-generated sitemap, and robots.txt.
- **Dependency Hygiene:** `esbuild` devDependency was removed to fix an npm `ERESOLVE` peer dependency conflict, and `package-lock.json` was generated and committed.

---

## Milestone 0 — Environment and Git setup [COMPLETED]
- [x] Resolve XAMPP MySQL port 3306 conflict and verify XAMPP Apache/MySQL startup.
- [x] Initialize Git repository structure and documentation framework.
- [x] Create private GitHub repository and link local workspace.

## Milestone 1 — UI First (Frontend Storefront Prototype) [COMPLETED]
- [x] Build responsive Homepage based on Sarmelle Diwali Festive Collection reference (`/public/assets/aistudio/Sarmelle_Festive_Fashion_Homepage_edb12098.png`).
- [x] Build Cart drawer with free shipping progress bar, quantity counters, coupon code engine (`DIWALI30`, `WELCOME10`, `FESTIVE500`), and full 4-step Checkout Stepper.
- [x] Build Category & Collection pages with multi-faceted filters (Fabric, Color palette, Category, Offer, Price budget slider), active filter chips, mobile filter drawer, and 6 sorting modes.
- [x] Build Customer login/registration/account UI with Profile management, simple Password Change dialog, single-line Order status cards, and self-ship Return/Exchange initiation flow.
- [x] Build Admin Dashboard UI prototype for campaign banners and product catalogue editing.
- [x] Complete comprehensive pre-backend audit on tech stack, Hostinger compatibility, mock data boundaries, and architectural security.
- [x] Establish reproducible build baseline: resolved `esbuild` peer dependency conflict and committed `package-lock.json`.

## Milestone 2 — Architecture, Refactoring & Setup [IN PROGRESS]
- [x] Extraction Step 1 (Types): Extract TypeScript interfaces to `src/types/` (`product.ts`, `campaign.ts`, `order.ts`).
- [x] Extraction Step 2 (Mock Data): Extract mock arrays to `src/data/` (`products.ts`, `reviews.ts`, `campaign.ts`, `orders.ts`).
- [ ] Finish App.tsx split (Steps 3 to 8), merge to main after a manual click-through.
- [ ] Fix breadcrumb navigation: breadcrumb text beyond "Home" (e.g. category on collection page, category and product on product page) is currently not clickable.
- [ ] Fix hero slide index: resets to 1 when returning to Home. Cause: HomeView unmounts when leaving Home (side effect of the split; at baseline the index lived in App and persisted). No code resets it on browser-tab switch; a jump after switching tabs is likely throttled timers. Cosmetic. Fix later by lifting currentHeroSlide to App or accepting it.
- [x] Enforce checkout authentication: guest users can currently reach checkout; must trigger login modal first while keeping cart, and backend server must reject unauthenticated orders.
- [x] Checkout polish: UPI only, remove cards, NetBanking, COD and the "address type" field.
- [ ] Remove mock demo account from AuthModal in Milestone 4.
- [ ] Payment countdown resets when the payment step is re-entered; server must enforce the real 8-minute expiry.
- [ ] Login accepts email or phone with the same password; real backend must support both.
- [ ] Remove unused packages (@google/genai, express, tsx, dotenv) after verifying nothing uses them.
- [ ] Remove unused React default import in App.tsx; ordersSubFilter is dead state (written, never read).
- [ ] Add real routing and product/category URLs.
- [ ] Separate admin code from the public storefront bundle.
- [ ] Confirm Razorpay account activation requirements early.
- [ ] Define modular PHP backend structure and security boundaries under `/api/`.
- [ ] Design complete MySQL schema (`sarmelle_db` tables: products, variants, categories, customers, addresses, orders, order items, inventory movements, payments, coupons, campaigns, audit logs).
- [ ] Document database relationships, indexes, and test seeding strategy in `DATABASE.md`.
- [ ] **Review checkpoint:** Request user approval before backend code implementation.

## Milestone 3 — Backend Foundation
- [ ] Database connection class (PDO with prepared statements & error handling).
- [ ] Secure Session Management & Authentication service (password hashing, CSRF protection, RBAC).
- [ ] Input validation, sanitization, and rate-limiting middleware.
- [ ] Audit logging service.

## Milestone 4 — Storefront and Business Workflows
- [ ] Product catalogue, search, filters, and pagination backend API/controllers (`/api/products.php`).
- [ ] Persistent cart and checkout server-side recalculation (preventing client price tampering).
- [ ] Inventory locking, transactions, and overselling prevention.
- [ ] Order placement flow -> Awaiting Owner Stock Review status.
- [ ] Payment gateway integration (Razorpay sandbox mode, UPI ONLY, webhook signature verification, idempotency).
- [ ] Server must reject unauthenticated order creation.
- [ ] Order acceptance, rejection, and refund workflows.
- [ ] Courier shipping tracking and notification adapters.

## Milestone 5 — Advanced Features & Campaigns
- [ ] Admin-managed discount coupons, seasonal campaigns (Diwali special pricing).
- [ ] Sales reports, revenue dashboards, stock movement reports, and CSV/PDF data exports.
- [ ] Email & WhatsApp Business integration (adapters).
- [ ] SEO metadata management, sitemaps, and Google Analytics / Search Console hooks.
- [ ] Festive banner text: editable banner/campaign text without a rebuild.
- [ ] `ADMIN_SPEC.md` v3 is the source of truth for admin screens and replaces the rough admin map.

## Milestone 6 — Quality, Security & Claude Review
- [ ] Functional, responsive, accessibility, and concurrency testing.
- [ ] Independent Claude security review and documented fixes.

## Milestone 7 — Staging Deployment (`stag.sarmelle.com`)
- [ ] Configure Hostinger staging subdomain, separate staging database, and deployment script.
- [ ] Test backups, restoration, and rollback procedures.

## Milestone 8 — Production Launch (`sarmelle.com`)
- [ ] Razorpay UPI integration replaces the mock payment step in Milestone 8.
- [ ] Mock payment succeeds instantly; real flow waits for Razorpay confirmation, then clears the cart (Milestone 8).
- [ ] Optional: fake "waiting for payment approval" screen to mirror the real UPI flow.
- [ ] Production DNS configuration at GoDaddy & Hostinger.
- [ ] SSL certificate verification, final security smoke tests, and live deployment.
- [ ] Payment countdown must start when the customer clicks Pay, and must read the server's `payment_hold_minutes` setting.
