# Sarmelle — Database Schema & Migration Plan

## Database: `sarmelle_db` (MySQL / MariaDB)

### Key Tables (Planned for Milestone 2/3)
1. `users` — Customer and admin accounts, password hashes, roles, status.
2. `addresses` — Customer shipping and billing addresses.
3. `categories` — Product categories (Sarees, Kurtis, Lehengas, Dupattas, etc.).
4. `collections` — Curated collections (Diwali Festive Collection, New Arrivals, Best Sellers).
5. `products` — Product master (title, description, base price, sale price, SKU, publication status default Draft, fabric, care instructions).
6. `product_variants` — Variants (size, color, stock qty, variant SKU).
7. `product_images` — Image gallery paths and sort orders.
8. `cart_items` — Persistent shopping cart items.
9. `orders` — Order master (customer id, status, payment status, shipping status, total amount, discount, snapshot data).
10. `order_items` — Snapshot of product name, SKU, variant, quantity, and price at purchase time.
11. `inventory_movements` — Stock audit log and adjustments.
12. `payments` — Gateway transaction logs, status, and webhook payloads.
13. `coupons` & `campaigns` — Discount rules and seasonal festive promotions.
14. `audit_logs` — Admin action tracking (actor, action, timestamp, record reference).

---

## Schema design draft - Part A: catalogue and stock

### Conventions
- **Compatibility**: MySQL 8.0+ / MariaDB 10.5+ compatible.
- **Engine**: InnoDB storage engine for ACID transactions and foreign key constraint enforcement.
- **Character Set & Collation**: `utf8mb4` charset with `utf8mb4_unicode_ci` collation.
- **Naming**: `snake_case` for all table names, column names, foreign keys, and indexes.
- **Primary Keys**: `BIGINT UNSIGNED AUTO_INCREMENT` named `id` across all primary entity tables.
- **Monetary Values**: Stored strictly as exact integers in paise (`BIGINT UNSIGNED`), avoiding floating-point precision loss (e.g., ₹2,999.00 is stored as `299900`).
- **Timestamps**: Expressed in UTC using `created_at` (`DEFAULT CURRENT_TIMESTAMP`) and `updated_at` (`DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`).
- **Soft Deletes**: Managed via nullable UTC timestamp `deleted_at` (`DEFAULT NULL`) where required by ADMIN_SPEC (products: delete is allowed only from Draft or Archived and removes products from admin lists while preserving sales history and order snapshots; categories and collections also provide `deleted_at`).

---

### Table Specifications

#### 1. `categories`
- **Purpose**: Stores top-level product categories (e.g. Sarees, Kurtis) and sub-categories via a self-referential `parent_id`. Supports creation, editing, and visibility toggling (`is_hidden`).
- **Columns**:
  - `id`: BIGINT UNSIGNED, NOT NULL, AUTO_INCREMENT
  - `parent_id`: BIGINT UNSIGNED, NULL, DEFAULT NULL (Self-reference to parent category for sub-categories)
  - `name`: VARCHAR(100), NOT NULL (Category title)
  - `slug`: VARCHAR(120), NOT NULL (URL slug)
  - `description`: TEXT, NULL, DEFAULT NULL
  - `is_hidden`: TINYINT(1), NOT NULL, DEFAULT 0 (0 = visible, 1 = hidden per Section 5)
  - `display_order`: INT UNSIGNED, NOT NULL, DEFAULT 0 (Admin custom sort ordering)
  - `created_at`: TIMESTAMP, NOT NULL, DEFAULT CURRENT_TIMESTAMP
  - `updated_at`: TIMESTAMP, NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  - `deleted_at`: TIMESTAMP, NULL, DEFAULT NULL (Soft delete timestamp)
- **Primary Key**: `id`
- **Foreign Keys**:
  - `fk_categories_parent`: `parent_id` REFERENCES `categories(id)` ON DELETE RESTRICT ON UPDATE CASCADE
- **Unique Constraints**:
  - `uq_categories_slug`: (`slug`)
- **Indexes**:
  - `idx_categories_parent_id`: (`parent_id`)
  - `idx_categories_is_hidden`: (`is_hidden`)
- **Enum Values**: None.

---

#### 2. `collections`
- **Purpose**: Curated product groupings (e.g., Diwali Festive Collection, Best Sellers, New Arrivals) with admin creation, editing, and visibility toggling (`is_hidden`).
- **Columns**:
  - `id`: BIGINT UNSIGNED, NOT NULL, AUTO_INCREMENT
  - `name`: VARCHAR(150), NOT NULL (Collection title)
  - `slug`: VARCHAR(160), NOT NULL (URL slug)
  - `description`: TEXT, NULL, DEFAULT NULL
  - `is_hidden`: TINYINT(1), NOT NULL, DEFAULT 0 (0 = visible, 1 = hidden per Section 5)
  - `display_order`: INT UNSIGNED, NOT NULL, DEFAULT 0 (Sort priority)
  - `created_at`: TIMESTAMP, NOT NULL, DEFAULT CURRENT_TIMESTAMP
  - `updated_at`: TIMESTAMP, NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  - `deleted_at`: TIMESTAMP, NULL, DEFAULT NULL
- **Primary Key**: `id`
- **Foreign Keys**: None.
- **Unique Constraints**:
  - `uq_collections_slug`: (`slug`)
- **Indexes**:
  - `idx_collections_is_hidden`: (`is_hidden`)
- **Enum Values**: None.

---

#### 3. `product_collections` (product-collection link)
- **Purpose**: Many-to-many relationship linking products into curated collections with individual display sorting.
- **Columns**:
  - `product_id`: BIGINT UNSIGNED, NOT NULL
  - `collection_id`: BIGINT UNSIGNED, NOT NULL
  - `display_order`: INT UNSIGNED, NOT NULL, DEFAULT 0 (Product position within collection)
  - `created_at`: TIMESTAMP, NOT NULL, DEFAULT CURRENT_TIMESTAMP
- **Primary Key**: (`product_id`, `collection_id`)
- **Foreign Keys**:
  - `fk_product_collections_product`: `product_id` REFERENCES `products(id)` ON DELETE CASCADE ON UPDATE CASCADE
  - `fk_product_collections_collection`: `collection_id` REFERENCES `collections(id)` ON DELETE CASCADE ON UPDATE CASCADE
- **Unique Constraints**: Composite Primary Key (`product_id`, `collection_id`).
- **Indexes**:
  - `idx_product_collections_collection`: (`collection_id`, `product_id`)
- **Enum Values**: None.

---

#### 4. Managed Lists: `fabrics`, `occasions`, `fits`, `sleeve_types`, `neck_types`, `set_types`
- **Purpose**: Normalized lookup tables providing managed dropdown values for product attributes. Standardizes terminology to avoid customer filter fragmentation caused by typos (Section 5).
- **Tables**:
  - `fabrics` (e.g., Silk, Chanderi, Cotton, Georgette)
  - `occasions` (e.g., Festive, Wedding, Casual, Party)
  - `fits` (e.g., Regular, Slim, Relaxed, Anarkali, Straight)
  - `sleeve_types` (e.g., Sleeveless, 3/4th Sleeve, Full Sleeve, Cap Sleeve)
  - `neck_types` (e.g., Round Neck, V-Neck, Sweetheart, Boat Neck, Collar)
  - `set_types` (e.g., Kurti with Pant, Kurti with Dupatta, 3-Piece Set, Single Kurti)
- **Columns** (identical across each of the 6 managed list tables):
  - `id`: BIGINT UNSIGNED, NOT NULL, AUTO_INCREMENT
  - `name`: VARCHAR(100), NOT NULL (Display label)
  - `slug`: VARCHAR(120), NOT NULL (Filter slug)
  - `is_active`: TINYINT(1), NOT NULL, DEFAULT 1 (Active in dropdowns)
  - `display_order`: INT UNSIGNED, NOT NULL, DEFAULT 0
  - `created_at`: TIMESTAMP, NOT NULL, DEFAULT CURRENT_TIMESTAMP
  - `updated_at`: TIMESTAMP, NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
- **Primary Key**: `id`
- **Foreign Keys**: None.
- **Unique Constraints**:
  - `uq_<table>_slug`: (`slug`)
- **Indexes**:
  - `idx_<table>_is_active`: (`is_active`)
- **Enum Values**: None.

---

#### 5. `size_charts`
- **Purpose**: Named master charts (e.g., "Kurti sizes") reused across products via dropdown. Charts in use cannot be deleted (Section 5).
- **Columns**:
  - `id`: BIGINT UNSIGNED, NOT NULL, AUTO_INCREMENT
  - `name`: VARCHAR(100), NOT NULL (Chart title, e.g., "Kurti Regular Fit")
  - `unit`: ENUM('in', 'cm'), NOT NULL, DEFAULT 'in' (Measurement unit)
  - `description`: TEXT, NULL, DEFAULT NULL (Optional notes or fit advice)
  - `created_at`: TIMESTAMP, NOT NULL, DEFAULT CURRENT_TIMESTAMP
  - `updated_at`: TIMESTAMP, NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
- **Primary Key**: `id`
- **Foreign Keys**: None.
- **Unique Constraints**:
  - `uq_size_charts_name`: (`name`)
- **Indexes**: None.
- **Enum Values**:
  - `unit`: `'in'`, `'cm'`

---

#### 6. `size_chart_rows`
- **Purpose**: Defines measurement rows for a size chart. Rows represent sizes (e.g., S, M, L, XL), while columns store bust, waist, hip, and length measurements (Section 5).
- **Columns**:
  - `id`: BIGINT UNSIGNED, NOT NULL, AUTO_INCREMENT
  - `size_chart_id`: BIGINT UNSIGNED, NOT NULL
  - `size_name`: VARCHAR(32), NOT NULL (Size label, e.g., 'XS', 'S', 'M', 'L', 'XL', 'Free size')
  - `bust`: VARCHAR(32), NULL, DEFAULT NULL (Measurement value or range, e.g., '36' or '34-36')
  - `waist`: VARCHAR(32), NULL, DEFAULT NULL
  - `hip`: VARCHAR(32), NULL, DEFAULT NULL
  - `length`: VARCHAR(32), NULL, DEFAULT NULL
  - `display_order`: INT UNSIGNED, NOT NULL, DEFAULT 0 (Display sorting order)
  - `created_at`: TIMESTAMP, NOT NULL, DEFAULT CURRENT_TIMESTAMP
  - `updated_at`: TIMESTAMP, NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
- **Primary Key**: `id`
- **Foreign Keys**:
  - `fk_size_chart_rows_chart`: `size_chart_id` REFERENCES `size_charts(id)` ON DELETE CASCADE ON UPDATE CASCADE
- **Unique Constraints**:
  - `uq_size_chart_rows_chart_size`: (`size_chart_id`, `size_name`)
- **Indexes**:
  - `idx_size_chart_rows_order`: (`size_chart_id`, `display_order`)
- **Enum Values**: None.

---

#### 7. `products`
- **Purpose**: Central catalogue record capturing common product-level metadata, categorization, managed attribute references, base pricing in paise, lifecycle statuses, size chart association, and manual stock override.
- **Columns**:
  - `id`: BIGINT UNSIGNED, NOT NULL, AUTO_INCREMENT
  - `name`: VARCHAR(255), NOT NULL (Product title; no separate SEO title per Section 4)
  - `slug`: VARCHAR(255), NOT NULL (Automatic from name; unique canonical slug)
  - `description`: TEXT, NULL, DEFAULT NULL (Product description used for storefront & link previews)
  - `category_id`: BIGINT UNSIGNED, NOT NULL (Primary category dropdown)
  - `sub_category_id`: BIGINT UNSIGNED, NULL, DEFAULT NULL (Sub-category dropdown)
  - `set_type_id`: BIGINT UNSIGNED, NULL, DEFAULT NULL (Dropdown from set_types)
  - `fabric_id`: BIGINT UNSIGNED, NULL, DEFAULT NULL (Dropdown from fabrics)
  - `occasion_id`: BIGINT UNSIGNED, NULL, DEFAULT NULL (Dropdown from occasions)
  - `fit_id`: BIGINT UNSIGNED, NULL, DEFAULT NULL (Dropdown from fits)
  - `sleeve_type_id`: BIGINT UNSIGNED, NULL, DEFAULT NULL (Dropdown from sleeve_types)
  - `neck_type_id`: BIGINT UNSIGNED, NULL, DEFAULT NULL (Dropdown from neck_types)
  - `length`: DECIMAL(6, 2), NULL, DEFAULT NULL (Garment length)
  - `length_unit`: ENUM('in', 'cm', 'm'), NULL, DEFAULT NULL (Length unit)
  - `weight_grams`: INT UNSIGNED, NULL, DEFAULT NULL (Weight in grams for shipping calculations)
  - `mrp_paise`: BIGINT UNSIGNED, NOT NULL (Maximum Retail Price in paise, e.g. 299900 = ₹2,999.00)
  - `sale_price_paise`: BIGINT UNSIGNED, NOT NULL (Selling price in paise)
  - `return_eligible`: TINYINT(1), NOT NULL, DEFAULT 1 (Return eligibility boolean flag)
  - `size_chart_id`: BIGINT UNSIGNED, NULL, DEFAULT NULL (Reused size chart dropdown)
  - `is_manual_out_of_stock`: TINYINT(1), NOT NULL, DEFAULT 0 (Manual out of stock checkbox for entire product)
  - `status`: ENUM('Draft', 'Published', 'Unpublished', 'Archived', 'Deleted'), NOT NULL, DEFAULT 'Draft'
  - `created_at`: TIMESTAMP, NOT NULL, DEFAULT CURRENT_TIMESTAMP
  - `updated_at`: TIMESTAMP, NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  - `deleted_at`: TIMESTAMP, NULL, DEFAULT NULL (Soft delete timestamp)
- **Primary Key**: `id`
- **Foreign Keys**:
  - `fk_products_category`: `category_id` REFERENCES `categories(id)` ON DELETE RESTRICT ON UPDATE CASCADE
  - `fk_products_sub_category`: `sub_category_id` REFERENCES `categories(id)` ON DELETE RESTRICT ON UPDATE CASCADE
  - `fk_products_size_chart`: `size_chart_id` REFERENCES `size_charts(id)` ON DELETE RESTRICT ON UPDATE CASCADE (prevents deleting charts in use)
  - `fk_products_set_type`: `set_type_id` REFERENCES `set_types(id)` ON DELETE SET NULL ON UPDATE CASCADE
  - `fk_products_fabric`: `fabric_id` REFERENCES `fabrics(id)` ON DELETE SET NULL ON UPDATE CASCADE
  - `fk_products_occasion`: `occasion_id` REFERENCES `occasions(id)` ON DELETE SET NULL ON UPDATE CASCADE
  - `fk_products_fit`: `fit_id` REFERENCES `fits(id)` ON DELETE SET NULL ON UPDATE CASCADE
  - `fk_products_sleeve_type`: `sleeve_type_id` REFERENCES `sleeve_types(id)` ON DELETE SET NULL ON UPDATE CASCADE
  - `fk_products_neck_type`: `neck_type_id` REFERENCES `neck_types(id)` ON DELETE SET NULL ON UPDATE CASCADE
- **Unique Constraints**:
  - `uq_products_slug`: (`slug`)
- **Indexes**:
  - `idx_products_category_id`: (`category_id`)
  - `idx_products_sub_category_id`: (`sub_category_id`)
  - `idx_products_status`: (`status`)
  - `idx_products_size_chart_id`: (`size_chart_id`)
  - `idx_products_fabric_id`: (`fabric_id`)
  - `idx_products_occasion_id`: (`occasion_id`)
  - `idx_products_fit_id`: (`fit_id`)
  - `idx_products_sleeve_type_id`: (`sleeve_type_id`)
  - `idx_products_neck_type_id`: (`neck_type_id`)
  - `idx_products_set_type_id`: (`set_type_id`)
  - `idx_products_created_at`: (`created_at`)
  - `idx_products_sale_price_paise`: (`sale_price_paise`)
- **Enum Values**:
  - `length_unit`: `'in'`, `'cm'`, `'m'`
  - `status`: `'Draft'`, `'Published'`, `'Unpublished'`, `'Archived'`, `'Deleted'`

---

#### 8. `product_slug_history`
- **Purpose**: Preserves historical product slugs when a product name/slug is modified so legacy URLs can issue an HTTP 301 Permanent Redirect to the current canonical URL.
- **Columns**:
  - `id`: BIGINT UNSIGNED, NOT NULL, AUTO_INCREMENT
  - `product_id`: BIGINT UNSIGNED, NOT NULL
  - `slug`: VARCHAR(255), NOT NULL (Historical slug)
  - `created_at`: TIMESTAMP, NOT NULL, DEFAULT CURRENT_TIMESTAMP
- **Primary Key**: `id`
- **Foreign Keys**:
  - `fk_product_slug_history_product`: `product_id` REFERENCES `products(id)` ON DELETE CASCADE ON UPDATE CASCADE
- **Unique Constraints**:
  - `uq_product_slug_history_slug`: (`slug`)
- **Indexes**:
  - `idx_product_slug_history_product_id`: (`product_id`)
- **Enum Values**: None.

---

#### 9. `product_colour_variants`
- **Purpose**: Manages distinct colours per product, holding colour name, hex RGB code, display sorting order, and optional price override (e.g. black fabric surcharge per Section 4).
- **Columns**:
  - `id`: BIGINT UNSIGNED, NOT NULL, AUTO_INCREMENT
  - `product_id`: BIGINT UNSIGNED, NOT NULL
  - `colour_name`: VARCHAR(64), NOT NULL (e.g. 'Emerald Green', 'Rani Pink')
  - `colour_code`: VARCHAR(7), NOT NULL (Hex RGB string, e.g. '#004D40')
  - `price_override_paise`: BIGINT UNSIGNED, NULL, DEFAULT NULL (Optional price override in paise)
  - `display_order`: INT UNSIGNED, NOT NULL, DEFAULT 0
  - `created_at`: TIMESTAMP, NOT NULL, DEFAULT CURRENT_TIMESTAMP
  - `updated_at`: TIMESTAMP, NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  - `deleted_at`: TIMESTAMP, NULL, DEFAULT NULL
- **Primary Key**: `id`
- **Foreign Keys**:
  - `fk_product_colour_variants_product`: `product_id` REFERENCES `products(id)` ON DELETE CASCADE ON UPDATE CASCADE
- **Unique Constraints**:
  - `uq_product_colour_variants_product_colour`: (`product_id`, `colour_name`)
- **Indexes**:
  - `idx_product_colour_variants_product_order`: (`product_id`, `display_order`)
- **Enum Values**: None.

---

#### 10. `product_images`
- **Purpose**: Holds product gallery images linked to a specific colour variant. Supports display sorting and primary image indicator (Section 4).
- **Columns**:
  - `id`: BIGINT UNSIGNED, NOT NULL, AUTO_INCREMENT
  - `product_id`: BIGINT UNSIGNED, NOT NULL
  - `colour_variant_id`: BIGINT UNSIGNED, NOT NULL
  - `image_url`: VARCHAR(512), NOT NULL (CDN or storage URL path)
  - `alt_text`: VARCHAR(255), NULL, DEFAULT NULL (Accessibility / SEO alt description)
  - `display_order`: INT UNSIGNED, NOT NULL, DEFAULT 0
  - `is_primary`: TINYINT(1), NOT NULL, DEFAULT 0 (Primary thumbnail flag)
  - `created_at`: TIMESTAMP, NOT NULL, DEFAULT CURRENT_TIMESTAMP
  - `updated_at`: TIMESTAMP, NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
- **Primary Key**: `id`
- **Foreign Keys**:
  - `fk_product_images_product`: `product_id` REFERENCES `products(id)` ON DELETE CASCADE ON UPDATE CASCADE
  - `fk_product_images_colour`: `colour_variant_id` REFERENCES `product_colour_variants(id)` ON DELETE CASCADE ON UPDATE CASCADE
- **Unique Constraints**: None.
- **Indexes**:
  - `idx_product_images_colour_order`: (`colour_variant_id`, `display_order`)
  - `idx_product_images_product_id`: (`product_id`)
- **Enum Values**: None.

---

#### 11. `product_variant_sizes`
- **Purpose**: Defines size offerings (S, M, L, XL, Free size) per colour variant and holds available physical stock quantity. When quantity is 0, variant automatically displays "Out of stock" (Section 3 & 4).
- **Columns**:
  - `id`: BIGINT UNSIGNED, NOT NULL, AUTO_INCREMENT
  - `product_id`: BIGINT UNSIGNED, NOT NULL
  - `colour_variant_id`: BIGINT UNSIGNED, NOT NULL
  - `size_name`: VARCHAR(32), NOT NULL (e.g. 'XS', 'S', 'M', 'L', 'XL', 'Free size')
  - `sku`: VARCHAR(64), NULL, DEFAULT NULL (Variant SKU identifier)
  - `quantity`: INT, NOT NULL, DEFAULT 0 (Available physical stock)
  - `created_at`: TIMESTAMP, NOT NULL, DEFAULT CURRENT_TIMESTAMP
  - `updated_at`: TIMESTAMP, NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
- **Primary Key**: `id`
- **Foreign Keys**:
  - `fk_product_variant_sizes_product`: `product_id` REFERENCES `products(id)` ON DELETE CASCADE ON UPDATE CASCADE
  - `fk_product_variant_sizes_colour`: `colour_variant_id` REFERENCES `product_colour_variants(id)` ON DELETE CASCADE ON UPDATE CASCADE
- **Unique Constraints**:
  - `uq_product_variant_sizes_colour_size`: (`colour_variant_id`, `size_name`)
  - `uq_product_variant_sizes_sku`: (`sku`)
- **Indexes**:
  - `idx_product_variant_sizes_product_id`: (`product_id`)
  - `idx_product_variant_sizes_quantity`: (`quantity`)
- **Enum Values**: None.

---

#### 12. `stock_movements`
- **Purpose**: Comprehensive audit log recording every inventory quantity change (who, when, old quantity, new quantity, reason per Section 3).
- **Columns**:
  - `id`: BIGINT UNSIGNED, NOT NULL, AUTO_INCREMENT
  - `product_variant_size_id`: BIGINT UNSIGNED, NOT NULL
  - `product_id`: BIGINT UNSIGNED, NOT NULL
  - `user_id`: BIGINT UNSIGNED, NULL, DEFAULT NULL (User ID if performed by authenticated admin/user)
  - `performed_by`: VARCHAR(100), NOT NULL (Actor snapshot: admin name, email, or 'System')
  - `old_quantity`: INT, NOT NULL (Previous quantity balance)
  - `new_quantity`: INT, NOT NULL (Updated quantity balance)
  - `quantity_change`: INT, NOT NULL (Signed delta: new_quantity - old_quantity)
  - `reason`: VARCHAR(255), NOT NULL (Reason text: e.g. "Retail sale", "Stock intake", "Damaged inventory")
  - `order_id`: BIGINT UNSIGNED, NULL, DEFAULT NULL (Order-related link; foreign key to be added in Part B)
  - `created_at`: TIMESTAMP, NOT NULL, DEFAULT CURRENT_TIMESTAMP (Timestamp when movement occurred)
- **Primary Key**: `id`
- **Foreign Keys**:
  - `fk_stock_movements_variant_size`: `product_variant_size_id` REFERENCES `product_variant_sizes(id)` ON DELETE RESTRICT ON UPDATE CASCADE
  - `fk_stock_movements_product`: `product_id` REFERENCES `products(id)` ON DELETE CASCADE ON UPDATE CASCADE
- **Unique Constraints**: None.
- **Indexes**:
  - `idx_stock_movements_variant_time`: (`product_variant_size_id`, `created_at`)
  - `idx_stock_movements_product_time`: (`product_id`, `created_at`)
  - `idx_stock_movements_order_id`: (`order_id`)
- **Enum Values**: None.

---

### Relationship Summary
1. **Category Hierarchy**: `categories` (parent) `1 : N` `categories` (sub-categories) via `parent_id`.
2. **Product Categorization**: `categories` `1 : N` `products` (assigned both a primary `category_id` and an optional `sub_category_id`).
3. **Collections**: `products` `N : M` `collections` via the join table `product_collections`.
4. **Managed Lists**: Each managed list table (`fabrics`, `occasions`, `fits`, `sleeve_types`, `neck_types`, `set_types`) has a `1 : N` relationship to `products`.
5. **Size Charts**: `size_charts` `1 : N` `size_chart_rows`. In addition, `size_charts` `1 : N` `products` with `ON DELETE RESTRICT` ensuring in-use charts cannot be accidentally removed.
6. **Slug History**: `products` `1 : N` `product_slug_history` for URL redirect preservation.
7. **Colour Variants**: `products` `1 : N` `product_colour_variants` (each colour defines RGB and optional price override).
8. **Product Images**: `product_colour_variants` `1 : N` `product_images` (each image belongs to a specific colour variant).
9. **Sizes and Inventory**: `product_colour_variants` `1 : N` `product_variant_sizes` (one row per colour + size combination tracking quantity).
10. **Inventory Movement Audit**: `product_variant_sizes` `1 : N` `stock_movements` (full immutable log of stock adjustments).

---

### Questions
1. **5-Minute Payment Stock Hold**: ADMIN_SPEC states that on the inventory screen "only available stock is shown" and there is "no separate 'reserved' column", yet during checkout payment initiation, items must be held for 5 minutes. How should this temporary stock hold be stored and enforced?
   - *Option A*: Transient storage via Redis cache with a 5-minute TTL (`stock_hold:{variant_size_id}:{cart_id}`).
   - *Option B*: A lightweight SQL table `stock_reservations` (`variant_size_id`, `quantity`, `expires_at`, `cart_or_checkout_id`) with expired entries filtered or culled periodically.
   - *Option C*: Storing an explicit `reserved_quantity` column in `product_variant_sizes` with a scheduled worker releasing holds past 5 minutes.
2. **Order-Related Stock Movement Link**: `stock_movements.order_id` is defined as a loose `BIGINT UNSIGNED NULL` column in Part A without a foreign key constraint. The foreign key constraint and cascade/restrict rules will be added in Part B when the `orders` table is introduced.
3. **Admin User Reference on Stock Movements**: In `stock_movements`, `user_id` is currently nullable alongside an immutable `performed_by` string snapshot. When user accounts are finalized in subsequent design parts, should `user_id` strictly foreign-key to the `users` table, allowing null only for automated system operations?
4. **Size Chart Range Formats**: `size_chart_rows` stores measurement values (`bust`, `waist`, `hip`, `length`) as `VARCHAR(32)` to allow either single numbers (e.g. `36`) or ranges (e.g. `36-38` or unstitched ranges). Is this acceptable, or are purely numeric `DECIMAL(5,2)` values required for client-side conversions?
5. **Maximum Category Hierarchy Depth**: The self-referencing `categories` table allows arbitrary nesting, but ADMIN_SPEC specifies dropdowns for Category and Sub-category. Should nesting beyond 2 levels be strictly prevented in application business logic?

