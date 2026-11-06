# Sarmelle — Architecture Documentation & Pre-Backend Audit

## 1. System Architecture Overview (Option B Confirmed)
Sarmelle is engineered using **Option B: Decoupled Static Frontend + PHP/MySQL Backend**, purpose-built for fast performance and native deployment on **Hostinger Premium Shared Hosting**:

1. **Client-Side Presentation Layer (Frontend):**
   - Built with **React 19**, **TypeScript**, and **Tailwind CSS v4** (bundled via **Vite 8**).
   - Compiled to static assets (`/dist`) comprising pure HTML5, optimized CSS, and minified JavaScript.
   - Vite `base` is locked to `'/'` because the application is served at the domain root (`sarmelle.com`). Do **not** use relative paths (`'./'`).
   - Hosted directly via Hostinger's LiteSpeed/Apache web server with global browser caching and CDN edge distribution.
2. **Server-Side Business Logic Layer (Backend API):**
   - Built with **PHP 8.2+** organized into modular REST controllers and service adapters.
   - Operates in `/public_html/api/` responding to JSON requests from the frontend.
   - **No Node.js runtime** runs on the server in production.
3. **Database Layer:**
   - **MySQL 10.4+ / MariaDB** (`sarmelle_db`) managed via PDO prepared statements and row-level locking transactions.

---

## 2. Key Architecture & Business Decisions

### 2.1 Payments Architecture: Razorpay UPI ONLY
- Payment gateway is **Razorpay**, restricted strictly to **UPI ONLY** (Google Pay, PhonePe, Paytm, BHIM, and custom UPI VPA).
- **Excluded Payment Methods:** Credit/Debit Cards, NetBanking, and Cash on Delivery (COD) are completely omitted.
- **Benefits:**
  - Zero PCI-DSS cardholder data scope.
  - Zero chargeback/RTO fraud risk associated with COD orders.
  - Instant digital settlement verification via Razorpay webhook signatures.

### 2.2 Product URLs, Slugs & SEO Injection
- **Slug Generation:** Product slugs are automatically generated from the product name (e.g., `maroon-banarasi-silk-saree`).
- **Slug Immutability & Redirects:** Once a product is published, its primary slug is locked. If an administrator edits the product name, the old slug is preserved in a slug redirection table, triggering automatic 301 HTTP redirects to the new canonical URL.
- **Server-Side SEO Injection:** Product URLs point to lightweight PHP bootstrap handlers that inject dynamic `<title>`, `<meta name="description">`, Open Graph (`og:title`, `og:image`, `og:description`), and Twitter Card metadata into the HTML template before serving it, enabling high-fidelity indexing and social media preview cards.
- **Sitemap & Robots:** Automatic background generation of `sitemap.xml` and standard `robots.txt`.

### 2.3 Dependency Resolution & Build Hygiene
- The explicit `esbuild` entry in `devDependencies` was removed to resolve an npm `ERESOLVE` peer dependency conflict with Vite 8.3+.
- A reproducible `package-lock.json` has been generated and committed to version control.
- Superfluous packages (`@google/genai`, `express`, `tsx`, `dotenv`) are scheduled for removal once frontend decoupled routes are verified.

---

## 3. Project Structure

```text
/
├── .env.example              # Template for DB and payment credentials
├── ARCHITECTURE.md          # Architecture decisions and audit documentation
├── DATABASE.md              # Planned MySQL schema and migration specs
├── HANDOVER.md              # Milestone handover and sprint history
├── OPERATIONS.md            # Hostinger deployment and operational manual
├── README.md                # Project introduction
├── SECURITY.md              # Security controls and checklist
├── TODO.md                  # Milestone roadmap and status
├── index.html               # Main HTML entry point
├── package.json             # NPM dependencies & scripts (Vite, React, Tailwind)
├── package-lock.json        # Pinned dependency lockfile
├── tsconfig.json            # TypeScript compiler configuration
├── vite.config.ts           # Vite build and plugin setup (base: '/')
├── public/
│   └── assets/              # Static media, campaign mockups & reference images
└── src/
    ├── types/               # Extracted TypeScript type definitions
    │   ├── product.ts       # Product, ProductReview
    │   ├── campaign.ts      # HeroSlide, PromoBanner, FeaturedBlock, LookbookConfig
    │   └── order.ts         # UserOrderItem, UserOrder, UserReturn
    ├── data/                # Extracted mock data (to be replaced by API calls)
    │   ├── products.ts      # SAMPLE_PRODUCTS
    │   ├── reviews.ts       # SAMPLE_REVIEWS
    │   ├── campaign.ts      # SAMPLE_HERO_SLIDES, PROMO_BANNERS, FEATURED_BLOCKS
    │   └── orders.ts        # SAMPLE_USER_ORDERS, SAMPLE_USER_RETURNS
    ├── App.tsx              # Main React orchestrator component (actively refactoring)
    ├── index.css            # Tailwind CSS root stylesheet
    └── main.tsx             # React root DOM mount
```

---

## 4. Pre-Backend Milestone Audit Results

### Audit Item 1: Actual Technologies Used in Repository
- **Current Runtime & Build:** Node.js / Vite 8 development environment (`port 3000`).
- **Frontend Framework:** React 19 (`react`, `react-dom`).
- **Language:** TypeScript 7.0 (`tsc`).
- **Styling:** Tailwind CSS v4 (`@tailwindcss/vite`, modern `@import "tailwindcss";` syntax).
- **Icons:** Lucide React (100% SVG, strictly zero emojis).
- **Animation:** Motion (`motion`).
- **PHP & MySQL Status:** Currently **0% PHP code** and **no active MySQL database connections** in the repository. Data has been cleanly modularized into `src/data/` as a precursor to PHP endpoint integration.

### Audit Item 2: Hostinger Execution Compatibility
- **Direct Source Execution:** Hostinger shared hosting **cannot** execute `.tsx` source files directly without a build step.
- **Production Execution (100% Supported):**
  - The React frontend is compiled locally or via CI using `npm run build`, producing standard static files (`dist/index.html`, `dist/assets/*`).
  - These static files are placed in Hostinger's `/public_html/`.
  - PHP scripts handle all dynamic database operations under `/public_html/api/`.
  - **Result:** No Node.js process runs on Hostinger in production.

### Audit Item 3: Preserving the Existing Storefront with PHP Backend
- **Preservation Guarantee:** 100% of the existing storefront design, responsive layouts, color schemes, animations, and typography will be preserved.
- **Integration Mechanism:**
  - Storefront mock data imports will be replaced with asynchronous `fetch('/api/products.php')` calls.
  - Checkout form submission will POST UPI order payloads to `/api/checkout.php`.
  - Customer login/register will POST credentials to `/api/auth.php`.
  - The UI logic remains completely intact while receiving real database data.

### Audit Item 4: Architectural Analysis (Security, Performance & Scalability)
1. **Security:**
   - *Current Risk:* In the frontend prototype, cart subtotals and coupon deductions (`DIWALI30`, `WELCOME10`, `FESTIVE500`) are calculated client-side.
   - *Remediation:* The PHP backend must strictly recalculate all order financials server-side before creating Razorpay UPI orders or writing to the database.
   - *Authentication:* Replace client `isLoggedIn` flag with HttpOnly secure session cookies and CSRF tokens.
2. **Maintainability:**
   - *Current State:* `src/App.tsx` has been reduced from 5,770 lines to ~5,019 lines by extracting `src/types/` and `src/data/`. Steps 3 to 8 will extract modals, navigation, and view components.
3. **Performance:**
   - Static distribution on Hostinger delivers instant time-to-first-byte (TTFB).
   - Product images currently referencing external URLs will be moved to local/CDN assets with WebP compression.
