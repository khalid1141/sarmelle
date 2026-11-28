# Read-Only Plan for Splitting `App.tsx` (Milestone 2, Step 1)

---

## 1. Build Check

### Build Status & Dependencies
* **`node_modules` Status:** Missing. The directory `node_modules` does not exist in the project repository.
* **`npm run build` Execution:** Not executed. Following the strict instruction (*"Do NOT run npm install without asking me first. If node_modules is missing, stop and ask. You MAY run npm run build if dependencies are already installed"*), `npm install` was **not** run. Because dependencies (`vite`, `react`, `@tailwindcss/vite`, etc.) are not yet installed locally, `npm run build` cannot run without first installing packages.
* **Stop & Question for You:** Would you like permission granted to run `npm install` (or `npm ci`) so dependencies can be installed and an initial production baseline build can be produced?

### Lockfile Status
* **`package-lock.json`:** **Not present and not committed.** There is no `package-lock.json` or `bun.lock`/`bun.lockb` anywhere in the repository or git history.

### Output Folder & Git-Ignore
* Default output folder configured by Vite is `dist/`.
* `.gitignore` (line 3) explicitly contains `dist/`, so all build artifacts will remain properly git-ignored.

### `vite.config.ts` Analysis for Plain Apache Hosting
* **Base Path:** `base` is not explicitly declared in `vite.config.ts`, which causes Vite to default to absolute root (`/`). If hosted inside an Apache subdirectory (e.g. `http://localhost/sarmelle/` or `/var/www/html/sarmelle/`), script and stylesheet assets linked as `/assets/...` will fail with 404 HTTP errors. When we configure the build for Apache, setting `base: './'` or `base: '/sarmelle/'` will be necessary.
* **Path Aliases:** Lines 10–12 configure `'@': path.resolve(__dirname, '.')` (repo root), **not** `./src`. Any relative import refactoring must respect this or adjust it intentionally.
* **AI Studio Settings:** Lines 14–20 specify dev-server HMR switches based on `process.env.DISABLE_HMR`. This is dev-server specific and does not block production static file builds.
* **Unused Dependencies in `package.json`:**
  * `@google/genai` (^2.4.0) is declared in `package.json`, but searching all files in `src/` confirms **it is never imported or used**.
  * `express`, `tsx`, and `dotenv` are declared in `package.json`, but are not referenced in the frontend bundle.

### Secrets and API Keys Audit
* **Client Code (`src/`):** **No API keys, access tokens, or hardcoded secrets exist** anywhere in `src/App.tsx`, `src/main.tsx`, or `index.html`. The payment modes are purely simulated UI mock states with placeholder test IDs (`pooja@okhdfcbank`, `4532 •••• •••• 8821`).
* **`.env.example`:** Contains only non-sensitive local development placeholders (`rzp_test_placeholder`, `test_secret_placeholder`, `root`, `sarmelle_db`). No production credentials exist.

---

## 2. `App.tsx` Map

`src/App.tsx` has 5,770 lines containing the entire frontend application in a single file.

### Major Sections & Line Ranges

| Line Range | Section / Feature | Description |
| :--- | :--- | :--- |
| **L1 – L15** | Imports | React core hooks (`useState`, `useEffect`, `useRef`) and 43 icons from `lucide-react`. |
| **L16 – L35** | `Product` Interface | Core product type definition. |
| **L36 – L374** | `SAMPLE_PRODUCTS` | 12 mock ethnic products (Sarees, Kurtis, Lehengas) with colors, sizes, prices, and images. |
| **L375 – L429** | TypeScript Interfaces | `HeroSlide`, `PromoBanner`, `FeaturedBlock`, `LookbookConfig`, `ProductReview`. |
| **L430 – L512** | `SAMPLE_REVIEWS` | 6 mock customer reviews. |
| **L513 – L557** | `SAMPLE_HERO_SLIDES` | 3 banner slides with headings, subtitles, and CTA routes. |
| **L558 – L587** | `SAMPLE_PROMO_BANNERS` | 2 promotional callout cards. |
| **L588 – L618** | `SAMPLE_FEATURED_BLOCKS`| 3 category showcase blocks (Silk Sarees, Festive Kurtis, Royal Lehengas). |
| **L619 – L626** | `DEFAULT_LOOKBOOK` | Lookbook banner configuration object. |
| **L627 – L668** | User Order & Return Interfaces | `UserOrderItem`, `UserOrder`, `UserReturn`. |
| **L669 – L742** | `SAMPLE_USER_ORDERS` | 3 realistic user orders with milestone tracking data and items. |
| **L743 – L780** | `SAMPLE_USER_RETURNS` | 2 return/exchange requests with refund notes and ARN tracking numbers. |
| **L781 – L1168** | `App()` State & Handlers | Top-level state declarations (~45 `useState` hooks), swipe/scroll refs, cart math, filter logic, and coupon handlers. |
| **L1169 – L1415** | Header & Navigation | Top announcement bar, logo, desktop search, category navigation links, account/wishlist/bag icons. |
| **L1416 – L1551** | Mobile Navigation Drawer | Slide-out drawer menu with categorized navigation for mobile screens. |
| **L1552 – L2103** | **View 1: Homepage** | Hero slider with swipe/autoplay, promo banners, featured category blocks, tabbed festive shelf, lookbook banner, trust guarantees. |
| **L2104 – L2628** | **View 2: Collection Catalog** | Filter sidebar (Category, Offer, Fabric, Color, Price slider), mobile filter sheet, sort menu, product grid, load-more observer. |
| **L2629 – L2987** | **View 3: Product Detail (PDP)** | Breadcrumb, image zoom/swipe gallery, color swatches, size picker, bag actions, collapsible accordions, reviews teaser. |
| **L2988 – L3516** | **View 4: Account Dashboard** | Profile tab (editable data, password trigger), Orders tab (order cards, tracking trigger, invoice export), Returns tab. |
| **L3517 – L4010** | **View 5: Admin CMS Dashboard** | Admin subtabs: Campaign management (hero/banner/lookbook editor), Product inventory management, Orders manager. |
| **L4012 – L4207** | **Cart Drawer** | Slide-out bag drawer, item quantity increment/decrement, coupon input with quick-pills, subtotal calculation. |
| **L4208 – L4813** | **Checkout Stepper Modal** | 4-step checkout: Step 1 (Address), Step 2 (Shipping method), Step 3 (Payment selection), Step 4 (Order receipt & printable invoice). |
| **L4814 – L4847** | **Wishlist Drawer** | Slide-out drawer listing saved items with "Move to Bag" actions. |
| **L4848 – L5108** | **Auth Modal** | Popup with tabbed Login, Register, and Forgot Password forms. |
| **L5109 – L5183** | **Customer Reviews Modal** | Scrollable modal displaying detailed ratings and customer feedback. |
| **L5184 – L5302** | **Size Chart Modal** | Size conversion tables for sarees, kurtis, and measuring instructions. |
| **L5303 – L5399** | **Live Order Tracking Modal** | Visual milestone tracker (Ordered -> Packed -> Shipped -> Out for Delivery -> Delivered). |
| **L5400 – L5520** | **Change Password Modal** | Modal with old password, new password, validation rules, and error prompts. |
| **L5521 – L5677** | **Return / Exchange Modal** | Dialog allowing user to select Exchange vs Refund, reason dropdown, and warehouse shipping address. |
| **L5678 – L5770** | **Footer** | Brand story, quick links, customer care, newsletter, and copyright. |

---

### Mixed Elements in `App.tsx`
1. **Types & Interfaces:** `Product`, `HeroSlide`, `PromoBanner`, `FeaturedBlock`, `LookbookConfig`, `ProductReview`, `UserOrderItem`, `UserOrder`, `UserReturn` (all declared between L16 and L668).
2. **Constants & Mock Data:** `SAMPLE_PRODUCTS`, `SAMPLE_REVIEWS`, `SAMPLE_HERO_SLIDES`, `SAMPLE_PROMO_BANNERS`, `SAMPLE_FEATURED_BLOCKS`, `DEFAULT_LOOKBOOK`, `SAMPLE_USER_ORDERS`, `SAMPLE_USER_RETURNS`.
3. **Hardcoded Coupon Rules:** Handled in `handleApplyCoupon` (L981–L995) for `DIWALI30`, `WELCOME10`, and `FESTIVE500`.
4. **Helper Functions & Handlers:**
   - Touch/swipe listeners: `handleProductTouchStart/Move/End` (L877), `handleHeroTouchStart/Move/End` (L912).
   - Horizontal shelf scroller: `scrollProducts` (L939).
   - Cart actions: `addToCart` (L1098), `updateCartQuantity` (L954), `removeCartItem` (L966).
   - Coupon handling: `handleApplyCoupon` (L978), `handleRemoveCoupon` (L998).
   - Wishlist toggle: `toggleWishlist` (L1109).
   - Filter handling: `resetAllFilters` (L1089), `activeFilterCount` (L1133).

---

### Application State Inventory

| State Name | Initial / Default Value | Persistence | Purpose / Where Used |
| :--- | :--- | :--- | :--- |
| `currentView` | `'home'` | `sessionStorage` (`sarmelle_current_view`) | Top-level active page view (`home`, `collection`, `product`, `admin`, `account`). |
| `accountTab` | `'profile'` | `sessionStorage` (`sarmelle_account_tab`) | Active tab inside the user account dashboard. |
| `isLoggedIn` | `false` | `sessionStorage` (`sarmelle_logged_in`) | Authentication status simulation. |
| `cart` | `[]` | Memory | Array of cart items (product, qty, size, color). |
| `cartOpen` | `false` | Memory | Controls the right slide-out bag drawer. |
| `wishlist` | `[SAMPLE_PRODUCTS[1], SAMPLE_PRODUCTS[4]]` | Memory | Array of favorited products. |
| `wishlistOpen` | `false` | Memory | Controls the right slide-out wishlist drawer. |
| `couponInput`, `appliedCoupon`, `couponError` | `''`, `null`, `''` | Memory | Coupon code application and discount calculations. |
| `isCheckoutOpen`, `checkoutStep` | `false`, `1` | Memory | 4-step checkout wizard visibility and step index. |
| `deliveryAddress`, `shippingMethod`, `paymentMethod`, `cardDetails` | Default mock values | Memory | Form inputs across checkout steps 1–3. |
| `selectedCategory`, `selectedOfferType`, `selectedFabric`, `selectedColorFilter`, `maxPrice`, `sortBy` | `'All'`, `'All'`, `'All'`, `'All'`, `10000`, `'Featured'` | Memory | Collection catalog filtering and sorting parameters. |
| `selectedProduct`, `selectedProductColor`, `selectedProductSize`, `activeProductImageIdx` | `SAMPLE_PRODUCTS[0]`, `'Maroon'`, `'Free Size'`, `0` | Memory | PDP detail display state. |
| `userProfile`, `isEditingProfile`, `editProfileForm` | Default Pooja Sharma profile | Memory | User profile info and inline edit form. |
| `userOrders`, `userReturns`, `activeTrackingOrder`, `returnModalItem` | Sample orders & returns | Memory | Orders history, live order tracking modal, exchange/refund dialog. |
| `adminTab`, `productsList`, `heroSlides`, `promoBanners`, `featuredBlocks`, `lookbookBanner` | Sample configs & products | Memory | Admin dashboard CMS modifications. |
| `authModalOpen`, `authMode` | `false`, `'login'` | Memory | Login/register modal visibility. |
| `isReviewsModalOpen`, `isSizeChartModalOpen`, `isChangePasswordOpen` | `false` | Memory | Global informational & utility dialogs. |

### How Page Navigation Is Done Today
* **Mechanism:** Single Page Application (SPA) conditional rendering via React state (`currentView`).
* **Routing:** There is **no React Router, no URL pathname routing, and no window hash (`#`) routing**.
* **Persistence:** A single key `sarmelle_current_view` in `sessionStorage` restores the last opened screen on page refresh.

---

## 3. Proposed Split Plan

To keep the application modular, maintainable, and prepared for future PHP/MySQL API integration without altering styling or behavior, we will organize the codebase cleanly into distinct folders:

### Proposed Folder Structure
```
src/
├── types/                     # TypeScript interfaces and shared types
│   ├── product.ts
│   ├── order.ts
│   └── campaign.ts
├── data/                      # Mock data (ready to be swapped for API endpoints)
│   ├── products.ts
│   ├── reviews.ts
│   ├── campaign.ts
│   ├── orders.ts
│   └── coupons.ts
├── context/                   # Shared global application states
│   ├── NavigationContext.tsx  # currentView, accountTab, modals
│   ├── CartContext.tsx        # cart, wishlist, coupon, price math
│   └── AuthContext.tsx        # userProfile, isLoggedIn, orders, returns
├── components/
│   ├── common/                # Reusable UI elements (Header, Footer, Announcements)
│   │   ├── Header.tsx
│   │   ├── MobileNav.tsx
│   │   └── Footer.tsx
│   ├── modals/                # Overlays and dialogs
│   │   ├── CartDrawer.tsx
│   │   ├── WishlistDrawer.tsx
│   │   ├── CheckoutModal.tsx
│   │   ├── AuthModal.tsx
│   │   ├── ReviewsModal.tsx
│   │   ├── SizeChartModal.tsx
│   │   ├── OrderTrackingModal.tsx
│   │   ├── ChangePasswordModal.tsx
│   │   └── ReturnModal.tsx
│   └── views/                 # Full screen page views
│       ├── HomeView.tsx
│       ├── CollectionView.tsx
│       ├── ProductDetailView.tsx
│       ├── AccountView.tsx
│       └── AdminView.tsx
├── App.tsx                    # Clean orchestrator rendering Header, active View, Modals, Footer
├── main.tsx
└── index.css
```

---

### What Moves Where

#### 1. `src/types/`
* `product.ts`: `Product`, `ProductReview`.
* `campaign.ts`: `HeroSlide`, `PromoBanner`, `FeaturedBlock`, `LookbookConfig`.
* `order.ts`: `UserOrderItem`, `UserOrder`, `UserReturn`.

#### 2. `src/data/`
* `products.ts`: `SAMPLE_PRODUCTS`.
* `reviews.ts`: `SAMPLE_REVIEWS`.
* `campaign.ts`: `SAMPLE_HERO_SLIDES`, `SAMPLE_PROMO_BANNERS`, `SAMPLE_FEATURED_BLOCKS`, `DEFAULT_LOOKBOOK`.
* `orders.ts`: `SAMPLE_USER_ORDERS`, `SAMPLE_USER_RETURNS`.
* `coupons.ts`: Available promo coupon definitions (`DIWALI30`, `WELCOME10`, `FESTIVE500`).

#### 3. State Strategy: Context vs Local
* **Shared in Context:**
  * `CartContext`: `cart`, `cartOpen`, `wishlist`, `wishlistOpen`, `coupon`, cart calculations (`subtotal`, `discount`, `shipping`, `total`), cart mutation handlers (`addToCart`, `updateCartQuantity`, `removeCartItem`, `toggleWishlist`).
  * `AuthContext`: `isLoggedIn`, `userProfile`, `userOrders`, `userReturns`, active order tracking, return modal state.
  * `NavigationContext`: `currentView`, `setCurrentView`, `selectedProduct` (active PDP item), navigation filters.
* **Kept Local to Components:**
  * Homepage: `currentHeroSlide`, `isHeroHovered`, carousel swipe refs, `activeProductTab`.
  * Collection: Catalog filter inputs (`selectedFabric`, `selectedColorFilter`, `maxPrice`, `sortBy`, `visibleProductsCount`).
  * Product Detail: `selectedProductColor`, `selectedProductSize`, `activeProductImageIdx`, accordion open/close.
  * Checkout Modal: `checkoutStep`, `deliveryAddress`, `paymentMethod`, form validation states.
  * Admin View: Admin tabs and local CMS form buffers.

---

### Safe Order of Extraction (Incremental Small Steps)

Each step is self-contained and allows running `npm run build` immediately to guarantee zero syntax or typing regressions before moving to the next.

1. **Step 1 — Types Extraction:** Create `src/types/` and extract all interfaces from lines 16–429 & 627–668. Import them back into `App.tsx`.
2. **Step 2 — Mock Data Extraction:** Create `src/data/` and extract static sample arrays/objects from lines 36–780. Import them into `App.tsx`.
3. **Step 3 — Global Modals Extraction:** Extract standalone modals that have minimal coupling into `src/components/modals/`:
   * `SizeChartModal.tsx`
   * `ReviewsModal.tsx`
   * `ChangePasswordModal.tsx`
4. **Step 4 — Context Setup:** Introduce `CartContext.tsx` and `AuthContext.tsx` to cleanly wrap the app, eliminating prop-drilling.
5. **Step 5 — Heavy Modals & Drawers Extraction:**
   * `CartDrawer.tsx`
   * `WishlistDrawer.tsx`
   * `AuthModal.tsx`
   * `OrderTrackingModal.tsx`
   * `ReturnModal.tsx`
   * `CheckoutModal.tsx`
6. **Step 6 — Layout Components:** Extract `Header.tsx`, `MobileNav.tsx`, and `Footer.tsx` into `src/components/common/`.
7. **Step 7 — Page Views Extraction:**
   * `HomeView.tsx` (L1552–L2103)
   * `CollectionView.tsx` (L2104–L2628)
   * `ProductDetailView.tsx` (L2629–L2987)
   * `AccountView.tsx` (L2988–L3516)
   * `AdminView.tsx` (L3517–L4010)
8. **Step 8 — Final App Assembly:** Reduce `App.tsx` down to a clean ~60-line top-level provider & view router.

---

## 4. Regression Safety

### Screen & Feature Testing Checklist
Before and after each extraction step, verify every user path:
* [ ] **Homepage:**
  * Hero auto-slides every 5.5s; manual next/previous arrows and swipe work.
  * Promo banner clicks properly route to the collection with corresponding filters.
  * Category tabs ("New Arrivals", "Best Sellers", "Festive Collection") toggle products.
  * Horizontal scroll arrows move product shelf left/right.
* [ ] **Collection & Filters:**
  * Category filters (Sarees, Kurtis, Lehengas, Dupattas) update the product grid count.
  * Price slider filters products dynamically.
  * Color and Fabric checkboxes filter correctly.
  * "Clear All" restores full catalog list.
  * Sort dropdown (Price Low to High, Customer Rating, etc.) reorders items.
* [ ] **Product Detail Page (PDP):**
  * Clicking any product card opens the correct product details.
  * Thumbnail clicks and mobile swipe switch the main picture.
  * Color swatches and Size buttons reflect active selection.
  * "Size Chart" modal opens and displays measurement table.
  * "Add to Bag" updates bag item counter badge in header and opens bag drawer.
* [ ] **Cart & Coupons:**
  * Quantity increment (`+`) and decrement (`-`) recalculate subtotals.
  * Item removal removes item from bag.
  * Quick-apply coupon pill or typing `DIWALI30` applies 30% discount; `FESTIVE500` applies ₹500 flat discount.
  * Free shipping threshold banner updates accurately.
* [ ] **Checkout Wizard:**
  * Stepper transitions: Step 1 (Address) -> Step 2 (Delivery speed) -> Step 3 (Payment mode) -> Step 4 (Confirmation).
  * Payment mode selector (UPI, Card, NetBanking, COD) reveals respective inputs.
  * Completing order generates order ID and downloadable text invoice.
* [ ] **Account Dashboard:**
  * Switch between Profile, Orders, and Returns tabs.
  * "Edit Profile" saves updated details in state.
  * "Track Order" opens timeline modal.
  * "Initiate Return / Exchange" opens modal with reason selector.
* [ ] **Admin Dashboard:**
  * Access admin via footer/header admin link.
  * Edit hero slide title or product stock toggle; changes reflect in frontend state.

### Visual Comparison Method
1. Take baseline full-page screenshots of each screen (`home`, `collection`, `product`, `account`, `admin`, plus cart drawer and checkout modal) using browser devtools or standard screenshot capture.
2. After file extractions, take screenshots under identical viewport widths (1440px desktop and 390px mobile).
3. Compare side-by-side or overlay to confirm 0-pixel layout shifts.

---

## 5. Risks and Unknowns

1. **Missing Lockfile (`package-lock.json`):**
   * *Risk:* Running `npm install` without a lockfile could install newer patch/minor releases of packages (e.g. Tailwind v4 or React 19 sub-dependencies) that could introduce unintended deprecations.
   * *Mitigation:* We should run `npm install`, verify package versions, and commit the generated `package-lock.json` once approved.
2. **Vite Base Path for Apache Hosting:**
   * *Risk:* The default `base: '/'` in `vite.config.ts` will break asset loading if hosted under a subdirectory in Apache.
   * *Mitigation:* Add `base: './'` to `vite.config.ts` during the build configuration step.
3. **SessionStorage Desynchronization:**
   * *Risk:* If navigation state is split across multiple contexts without keeping the `sessionStorage` synchronization listeners, browser page reloads could revert to the homepage unexpectedly.
   * *Mitigation:* Centralize `sessionStorage` persistence in `NavigationContext`.
4. **Tailwind v4 CSS Scanning:**
   * *Risk:* Tailwind v4 uses dynamic file scanning. Moving JSX components to newly created subfolders (`src/components/`, `src/pages/`) must ensure that Tailwind still scans all files inside `src/**/*.{ts,tsx}`.
   * *Mitigation:* Verify styles remain active after extracting the first component.
