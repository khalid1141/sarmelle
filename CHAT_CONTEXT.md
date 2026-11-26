# Sarmelle — Chat Context Summary

> Generated from the OpenCode session. Covers project details, current state, and the next implementation plan.

## 1. Project

- **Name:** Sarmelle — Premium Women's Ethnic Wear E-Commerce Platform (`sarmelle.com`)
- **Type:** Luxury ethnic wear storefront + admin (sarees, kurtis, lehengas, dupattas, festive).
- **Owner:** solo / small home business, no GST, individual registration.
- **Repo:** `git@github.com:khalid1141/sarmelle.git`
- **Current working branch:** `feat/realdb-readonly` (created from `origin/refactor/split-app`)

## 2. Technology Stack

### Storefront frontend (`src/`)
- React 19 + TypeScript (declared 7.0.2)
- Vite 8, Tailwind CSS v4 (`@tailwindcss/vite`)
- lucide-react, motion
- No router library yet (view switching is state)
- Unused deps scheduled for removal: `@google/genai`, `express`, `dotenv`, `tsx`

### Admin frontend (`admin/`, on `feature/admin-ui`)
- Separate package `store-admin-pilot`, Vite 6 + React 19 + Tailwind 4
- `apiClient.ts` toggles mock vs real backend via `VITE_USE_MOCK`
- Currently only auth + inventory screens (mock API)

### Backend (`server/`)
- PHP 8.3 (CLI) / PHP 8.2+ target
- Modular monolith, no framework; hand-written autoloader, config, router, JSON envelope, CSRF, validation, throttle, security headers, error handler, activity log
- PDO prepared statements, strict `sql_mode`, utf8mb4, IST `+05:30` enforced on every connection
- Composer only for PHPMailer (mail transports: log + SMTP)
- Argon2id/bcrypt password hashing; admin auth with OTP-on-new-device, lockout, trusted devices

### Database
- MySQL 8.4 (Docker, host port 3307) / MariaDB 10.11 target for Hostinger
- `sarmelle_db`, 44 existing tables + 5 to be added for read API
- Money in paise, all times IST
- Settings are key/value (`settings` table)

### Hosting (target)
- Hostinger Premium Shared Hosting (Apache/LiteSpeed, no Node in prod)
- Storefront: `sarmelle.com` → `public_html/` (built `dist/`) + `public_html/api/index.php`
- Admin: `admin.sarmelle.com` → separate `public_html`
- Staging: `stag.sarmelle.com`
- Private PHP tree outside web root (`/home/u…/sarmelle-private`)
- DB on Hostinger MySQL/MariaDB
- DNS via GoDaddy → Hostinger
- No CI/CD; manual upload deployment

### Local dev environment (this machine)
- Ubuntu 24.04.5 LTS
- Docker 29.1.3 (daemon uses `vfs` storage driver + HTTP proxy `127.0.0.1:3128`)
- MySQL 8.4 container on `127.0.0.1:3307` (host network mode, because the Docker bridge is down in this sandbox)
- PHP 8.3.6 CLI with pdo_mysql
- Node 24.21.0, npm 11.19.0
- `sudo` available without password; apt uses local mirror

## 3. Branches

| Branch | State |
|---|---|
| `main` | Stale baseline (2 commits): monolithic 5,770-line `App.tsx`, 100% mock data, no PHP/DB |
| `refactor/split-app` | Active dev head (+71): split components + PHP backend foundation + 44-table schema + docs |
| `wip/slice7-partial` | Duplicate of `refactor/split-app` (same commit) — safe to ignore |
| `feature/admin-ui` | `refactor/split-app` + 1 commit: standalone admin SPA (mock API, checkpoint 1) |
| **`feat/realdb-readonly`** | Current branch, based on `refactor/split-app` |

## 4. What is already done (this session)

- Installed Docker + PHP 8.3 + MySQL client via apt
- Configured Docker daemon for proxy + `vfs` storage driver
- Created `compose.yaml` (MySQL 8.4, host network, port 3307, healthcheck)
- Started MySQL container; healthcheck passes
- Created `server/private/Config/.env` (local) with generated `APP_KEY`, DB creds, corrected paths
- Created `server/web-storefront/bootstrap-path.php` → `/home/user/sarmelle/server/private`
- Applied `db/schema_draft.sql` → **44 tables** in `sarmelle_db`
- Verified `php server/bin/health.php` → **PASS** (charset/collation/timezone/clock/44 tables)
- Updated `compose.yaml` to host networking after the sandbox bridge was unavailable

## 5. Next implementation plan (read-only DB display)

Goal: every piece of dynamic data shown in the storefront comes from MySQL; no `SAMPLE_*` mock arrays remain.

### Phase 1 — Schema migration + content tables
- `db/migrations/001_read_api.sql`:
  - `ALTER TABLE products` add `offer_type`, `is_best_seller`, `is_new_arrival`
  - Create `product_reviews`
  - Create `campaign_hero_slides`, `campaign_promo_banners`, `campaign_featured_blocks`, `campaign_lookbook`
- `db/seed.sql` with all lookup tables, 16 products + variants/images/stock, reviews, campaign content, demo customer + addresses, orders + items/payments/status history, returns, notifications, stock movements/holds, refunds, coupon redemption, activity log, admin user, settings, couriers, return-reject reasons, slug history
- Leave session/OTP/login-attempts/password-resets/webhook tables empty by design
- `db/reset.sh` → drop + migrate + seed deterministically

### Phase 2 — Backend read API
- Add `Request::query()` (router has no path params)
- Repositories: `ProductRepository`, `CampaignRepository`, `OrderRepository`
- Map paise→rupees, discount %, aggregated images/colours/sizes, `inStock`, rating/review count
- Routes on storefront front controller:
  - `GET /api/products` (category, fabric, offer, sort, q)
  - `GET /api/product?slug=...`
  - `GET /api/campaign`
  - `GET /api/reviews?product_id=...`
  - `GET /api/account/orders?customer_id=1` — **only when `APP_ENV=local`**, marked TODO for real auth
- Keep existing `/api/health`

### Phase 3 — Frontend de-mock
- Add `src/services/api.ts` + loading/error/empty states
- `App.tsx`: fetch products/campaign/orders on mount; empty initial state; cart/wishlist from `localStorage` IDs resolved against loaded products
- `CollectionView`: `productsList` prop, no `SAMPLE_PRODUCTS`
- `ProductDetailView` / `ReviewsModal`: reviews from API
- `AccountView`: order snapshots from DB, no `SAMPLE_PRODUCTS` fallback
- Delete `src/data/products.ts`, `reviews.ts`, `campaign.ts`, `orders.ts`; remove all `SAMPLE_*` exports
- `AdminView`: read-only this round

### Phase 4 — Verification
- `SHOW TABLES` = 44 + 5 new; seeded row counts non-zero
- `php server/bin/health.php` passes
- All endpoints return real JSON
- Live proof: `UPDATE products SET sale_price_paise=...` → browser refresh shows new price
- `npm run lint` and `npm run build` succeed
- `grep -R "SAMPLE_" src/` returns nothing
- Manual click-through: home tabs, collection filters/sort, product detail, cart, account orders

### Out of scope this round
Writes/admin CRUD, customer auth, checkout order creation, Razorpay, wiring the separate `admin/` app.

## 6. Key decisions (locked)
- Base branch: `refactor/split-app` → `feat/realdb-readonly`
- Account/orders: temporary local-only demo customer endpoint (no auth yet)
- DB fallback: native MariaDB if Docker fails (not needed — Docker works)
- Scope: read-only display only
- MySQL image: 8.4 (host network mode)
- No mock data anywhere in backend or frontend after this round
- Static UI copy (nav, footer, policy) stays in code — only dynamic data moves to DB

## 7. Important files / locations
- `compose.yaml` — MySQL 8.4 container definition
- `server/private/Config/.env` — local config (git-ignored)
- `server/web-storefront/bootstrap-path.php` — private tree path (git-ignored)
- `server/bin/health.php` — DB health check
- `db/schema_draft.sql` — 44-table schema
- `db/migrations/001_read_api.sql` — (to be created) content tables + product flags
- `db/seed.sql` — (to be created) sample data for all migrated tables
- `db/reset.sh` — (to be created) deterministic rebuild
- `src/services/api.ts` — (to be created) frontend data layer
- `src/data/*.ts` — mock data files to be deleted

## 8. Known risks / notes
- Docker bridge is down in this sandbox → host networking is used; on a normal machine, switch compose back to bridge + port mapping
- `SESSION_SAVE_PATH` and `LOG_DIR` in `.env` use relative `var/...` (resolved against private root), not the example's `server/private/var/...`
- `reviewsCount` will drop from 42/36/etc. to actual seeded review counts (truthful data)
- `AdminView` in the storefront bundle edits local state only; real admin writes belong to the separate `admin/` app later
- `Request` has no query accessor yet — needs a small addition for `/api/product?slug=...`
- The `refund_amount_paise` and return/exchange seed rows are optional; account page currently only shows orders/returns, so minimal seeding is acceptable
