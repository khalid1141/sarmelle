# Sarmelle — Architecture Documentation & Pre-Backend Audit

## 1. System Architecture Overview
Sarmelle is designed as a **Decoupled E-Commerce Architecture** tailored for high-speed presentation and seamless deployment on **Hostinger Premium Shared Hosting** without requiring a persistent Node.js production runtime:

1. **Client-Side Presentation Layer (Frontend):**
   - Built with **React 19**, **TypeScript**, and **Tailwind CSS v4** (bundled via **Vite**).
   - Can be built into static assets (`/dist`) comprising pure HTML5, optimized CSS, and minified JavaScript.
   - Hosted directly via Hostinger's LiteSpeed/Apache web server with global browser caching and CDN distribution.
2. **Server-Side Business Logic Layer (Backend API):**
   - Built with **PHP 8.2+** organized into modular REST controllers and service adapters.
   - Operates in `/public_html/api/` (or dedicated backend directory) responding to JSON requests from the frontend.
3. **Database Layer:**
   - **MySQL 10.4+ / MariaDB** (`sarmelle_db`) managed via PDO prepared statements and row-level locking transactions.

---

## 2. Pre-Backend Milestone Audit Results

### Audit Item 1: Actual Technologies Used in Repository
- **Current Runtime & Build:** Node.js / Vite 8 development environment (`port 3000`).
- **Frontend Framework:** React 19 (`react`, `react-dom`).
- **Language:** TypeScript 7.0 (`tsc`).
- **Styling:** Tailwind CSS v4 (`@tailwindcss/vite`, modern `@import "tailwindcss";` syntax).
- **Icons:** Lucide React (100% SVG, strictly zero emojis).
- **Animation:** Motion (`motion`).
- **PHP & MySQL Status:** Currently **0% PHP code** and **no active MySQL database connections** in the repository. All data in `src/App.tsx` is held in React client state.

### Audit Item 2: Complete Project Structure
```text
/
├── .env.example              # Template for DB and payment credentials
├── ARCHITECTURE.md          # Architecture and audit documentation
├── DATABASE.md              # Planned MySQL schema and migration specs
├── HANDOVER.md              # Milestone handover and sprint history
├── OPERATIONS.md            # Hostinger deployment and operational manual
├── README.md                # Project introduction
├── SECURITY.md              # Security controls and checklist
├── TODO.md                  # Milestone roadmap and status
├── index.html               # Main HTML entry point
├── package.json             # NPM dependencies & scripts (Vite, React, Tailwind)
├── tsconfig.json            # TypeScript compiler configuration
├── vite.config.ts           # Vite build and plugin setup
├── public/
│   └── assets/              # Static media, campaign mockups & reference images
└── src/
    ├── App.tsx              # Main monolithic React frontend component (5,770+ lines)
    ├── index.css            # Tailwind CSS root stylesheet
    └── main.tsx             # React root DOM mount
```

### Audit Item 3: Hostinger Premium Execution Compatibility
- **Direct Source Execution:** Hostinger shared hosting **cannot** execute `.tsx` source files directly without a build step.
- **Production Execution (100% Supported):**
  - The React frontend is compiled locally or via CI using `npm run build`, producing standard static files (`dist/index.html`, `dist/assets/*`).
  - These static files are placed in Hostinger's `/public_html/`.
  - PHP scripts handle all dynamic database operations under `/public_html/api/`.
  - **Result:** No Node.js process needs to run on Hostinger in production.

### Audit Item 4: UI Completion & Mock Data Status
- **Complete & Fully Interactive UI:**
  - Homepage (Hero banner carousel, touch swipe on mobile, category circles, promo strips, featured blocks, lookbook banner, customer feedback preview, footer).
  - Collection / Catalog (Multi-faceted filter sidebar, mobile drawer, price budget slider, 6 sorting modes, active filter chips, infinite scroll sentinel).
  - Product Details View (Multi-angle gallery, swatches, accordions, size chart modal, review submission modal, recommended items).
  - Cart Drawer & 4-Step Checkout Stepper (Free shipping meter, coupon discount engine, address form, flat ₹50 shipping, payment method selector, order confirmation).
  - Customer Account & Profile Dashboard (Profile details editor, simple change password dialog, saved addresses, shipping & return policy card, single-line order status headers, self-ship return modal).
  - Admin Store Manager Prototype (Campaign banner text/image editor, product price editor, order queue prototype).
- **Features Currently Using Mock Data:**
  - Catalog products (`SAMPLE_PRODUCTS`).
  - User orders (`SAMPLE_USER_ORDERS`).
  - Returns (`SAMPLE_USER_RETURNS`).
  - Customer reviews (`SAMPLE_REVIEWS`).
  - Authentication (simulated state `isLoggedIn: true/false`).
  - Payment processing (simulated client step, no live gateway tokenization).

### Audit Item 5: Database Dependencies & Backend Assumptions
- **Current Database Dependencies:** None. No active SQL drivers, queries, or database calls exist in the frontend code.
- **Environment Variables:** Defined in `.env.example`, but not currently consumed by any active runtime script.
- **Backend Assumptions:** The frontend assumes standard REST/JSON responses for authentication, order placement, and catalog queries.

### Audit Item 6: Preserving the Existing Storefront with PHP Backend
- **Preservation Guarantee:** 100% of the existing storefront design, responsive layouts, color schemes, animations, and typography will be preserved.
- **Integration Mechanism:**
  - Storefront mock arrays will be replaced with asynchronous `fetch('/api/products.php')` calls.
  - Checkout form submission will POST order payloads to `/api/checkout.php`.
  - Customer login/register will POST credentials to `/api/auth.php`.
  - The UI logic remains completely intact while receiving real database data.

### Audit Item 7: Architectural Analysis (Security, Performance & Scalability)
1. **Security:**
   - *Current Risk:* In the frontend prototype, cart subtotals, coupon deductions (`DIWALI30`), and flat ₹50 shipping are calculated client-side.
   - *Remediation:* The PHP backend must strictly recalculate all order financials server-side before initiating payment or writing to `orders` table.
   - *Authentication:* Replace client `isLoggedIn` flag with HttpOnly secure session cookies and CSRF tokens.
2. **Maintainability:**
   - *Current State:* `src/App.tsx` contains 5,770+ lines uniting all storefront views.
   - *Remediation:* Progressively decouple into modular component files and a clean `services/api.ts` module when connecting PHP backend endpoints.
3. **Performance:**
   - Static distribution on Hostinger delivers instant time-to-first-byte (TTFB).
   - Product images currently referencing external URLs will be moved to local/CDN assets with WebP compression.
