# Sarmelle E-Commerce Platform — Project Roadmap & TODO

## Milestone 0 — Environment and Git setup [COMPLETED]
- [x] Resolve XAMPP MySQL port 3306 conflict and verify XAMPP Apache/MySQL startup.
- [x] Initialize Git repository structure and documentation framework.
- [ ] Create private GitHub repository and link local workspace.

## Milestone 1 — UI First (Frontend Storefront Prototype) [COMPLETED]
- [x] Build responsive Homepage based on Sarmelle Diwali Festive Collection reference (`/public/assets/aistudio/Sarmelle_Festive_Fashion_Homepage_edb12098.png`).
- [x] Build Cart drawer with free shipping progress bar, quantity counters, coupon code engine (`DIWALI30`, `WELCOME10`, `FESTIVE500`), and full 4-step Checkout Stepper (Address -> Flat ₹50 Shipping -> UPI/Card/NetBanking/COD Payment -> Order Confirmation & Invoice).
- [x] Build Category & Collection pages with multi-faceted filters (Fabric, Color palette, Category, Offer, Price budget slider), active filter chips, mobile filter drawer, and 6 sorting modes.
- [x] Build Customer login/registration/account UI with Profile management, simple Password Change dialog, single-line Order status cards, and self-ship Return/Exchange initiation flow.
- [x] Build Admin Dashboard UI prototype for campaign banners and product catalogue editing.
- [x] Complete comprehensive pre-backend audit on tech stack, Hostinger compatibility, mock data boundaries, and architectural security.
- [x] **Audit Checkpoint:** Awaiting user approval on audit findings before beginning Milestone 2.

## Milestone 2 — Architecture and Database Design [AWAITING USER APPROVAL]
- [ ] Define modular PHP backend structure and security boundaries under `/api/`.
- [ ] Design complete MySQL schema (`sarmelle_db` tables: products, variants, categories, customers, addresses, orders, order items, inventory movements, payments, coupons, campaigns, audit logs).
- [ ] Document database relationships, indexes, and test seeding strategy in `DATABASE.md`.
- [ ] **Review checkpoint:** Request user approval before code implementation.

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
- [ ] Payment gateway integration (Razorpay/Cashfree sandbox mode, webhook verification, idempotency).
- [ ] Order acceptance, rejection, and refund workflows.
- [ ] Courier shipping tracking and notification adapters.

## Milestone 5 — Advanced Features & Campaigns
- [ ] Admin-managed discount coupons, seasonal campaigns (Diwali special pricing).
- [ ] Sales reports, revenue dashboards, stock movement reports, and CSV/PDF data exports.
- [ ] Email & WhatsApp Business integration (adapters).
- [ ] SEO metadata management, sitemaps, and Google Analytics / Search Console hooks.

## Milestone 6 — Quality, Security & Claude Review
- [ ] Functional, responsive, accessibility, and concurrency testing.
- [ ] Independent Claude security review and documented fixes.

## Milestone 7 — Staging Deployment (`stag.sarmelle.com`)
- [ ] Configure Hostinger staging subdomain, separate staging database, and deployment script.
- [ ] Test backups, restoration, and rollback procedures.

## Milestone 8 — Production Launch (`sarmelle.com`)
- [ ] Production DNS configuration at GoDaddy & Hostinger.
- [ ] SSL certificate verification, final security smoke tests, and live deployment.
