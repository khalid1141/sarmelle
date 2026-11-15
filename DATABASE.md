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
- **Soft Deletes**: Managed via nullable UTC timestamp `deleted_at` (`DEFAULT NULL`) where required by ADMIN_SPEC. Currently only `products`, `categories` and `collections` carry `deleted_at`; `product_colour_variants` uses an `is_active` flag instead so that a hidden colour can be reactivated rather than tombstoned.
- **Constraint support**: CHECK constraints are enforced by MySQL 8.0.16+ and MariaDB 10.2+ but ignored by MySQL 5.7. Check the Hostinger database version at deployment. The guarded stock decrement protects against overselling either way.

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
- **Deletion policy**: Managed list rows are **hidden, never deleted**. Set `is_active = 0` to remove a value from the admin dropdowns and storefront filters; existing products keep their reference via `ON DELETE RESTRICT`.

---

#### 5. `size_charts`
- **Purpose**: Named master charts (e.g., "Kurti sizes") reused across products via dropdown. A chart owns its measurement columns, size rows and cell values, so it adapts to any garment type. Charts in use cannot be deleted (Section 5).
- **Columns**:
  - `id`: BIGINT UNSIGNED, NOT NULL, AUTO_INCREMENT
  - `name`: VARCHAR(100), NOT NULL (Chart title, e.g., "Kurti Regular Fit")
  - `unit`: ENUM('in', 'cm'), NOT NULL, DEFAULT 'in' (Measurement unit; set once per chart and applied to all its cells)
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
- **Storefront popup**: The product page size chart popup reads this chart, its columns (ordered by `display_order`), its rows (ordered by `display_order`) and the matching cells, and displays `unit` in the header.

---

#### 6. `size_chart_rows`
- **Purpose**: Each row is one size (e.g., S, M, L, XL, Free size) in a chart. Measurements are no longer fixed columns here; they live in `size_chart_cells`, so a chart can carry any set of measurement columns.
- **Columns**:
  - `id`: BIGINT UNSIGNED, NOT NULL, AUTO_INCREMENT
  - `size_chart_id`: BIGINT UNSIGNED, NOT NULL
  - `size_name`: VARCHAR(32), NOT NULL (Size label, e.g., 'XS', 'S', 'M', 'L', 'XL', 'Free size')
  - `display_order`: INT UNSIGNED, NOT NULL, DEFAULT 0 (Row display ordering)
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

#### 7. `size_chart_columns`
- **Purpose**: Defines the measurement columns of a chart (e.g., Bust, Waist, Hip, Shoulder, Sleeve length). The admin can add, rename, reorder or remove columns, so charts are not tied to a fixed measurement set. A brand-new chart starts with the four columns Bust, Waist, Hip and Length, which can then be edited freely.
- **Columns**:
  - `id`: BIGINT UNSIGNED, NOT NULL, AUTO_INCREMENT
  - `size_chart_id`: BIGINT UNSIGNED, NOT NULL
  - `label`: VARCHAR(50), NOT NULL (Column heading, e.g., 'Bust', 'Shoulder', 'Sleeve length')
  - `display_order`: INT UNSIGNED, NOT NULL, DEFAULT 0 (Column order left to right)
  - `created_at`: TIMESTAMP, NOT NULL, DEFAULT CURRENT_TIMESTAMP
  - `updated_at`: TIMESTAMP, NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
- **Primary Key**: `id`
- **Foreign Keys**:
  - `fk_size_chart_columns_chart`: `size_chart_id` REFERENCES `size_charts(id)` ON DELETE CASCADE ON UPDATE CASCADE
- **Unique Constraints**:
  - `uq_size_chart_columns_chart_label`: (`size_chart_id`, `label`) — a chart cannot have two columns with the same heading.
- **Indexes**:
  - `idx_size_chart_columns_order`: (`size_chart_id`, `display_order`)
- **Enum Values**: None.

---

#### 8. `size_chart_cells`
- **Purpose**: Holds the measurement value at the intersection of one size row and one measurement column. Values are stored as text so both single numbers (`36`) and ranges (`36-38`) are valid.
- **Columns**:
  - `size_chart_row_id`: BIGINT UNSIGNED, NOT NULL
  - `size_chart_column_id`: BIGINT UNSIGNED, NOT NULL
  - `value`: VARCHAR(32), NULL, DEFAULT NULL (Measurement text, e.g., '36', '36-38', '—')
- **Primary Key**: (`size_chart_row_id`, `size_chart_column_id`) — one value per row/column intersection.
- **Foreign Keys**:
  - `fk_size_chart_cells_row`: `size_chart_row_id` REFERENCES `size_chart_rows(id)` ON DELETE CASCADE ON UPDATE CASCADE
  - `fk_size_chart_cells_column`: `size_chart_column_id` REFERENCES `size_chart_columns(id)` ON DELETE CASCADE ON UPDATE CASCADE
- **Unique Constraints**: Composite primary key above.
- **Indexes**:
  - `idx_size_chart_cells_column`: (`size_chart_column_id`)
- **Enum Values**: None.
- **Same-chart rule**: A cell's row and column must belong to the same `size_chart_id`. Foreign keys can only prove that each side exists, not that they share a chart, so the application enforces this on write (and rejects cross-chart pairs).

---

#### 9. `products`
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
  - `fk_products_set_type`: `set_type_id` REFERENCES `set_types(id)` ON DELETE RESTRICT ON UPDATE CASCADE
  - `fk_products_fabric`: `fabric_id` REFERENCES `fabrics(id)` ON DELETE RESTRICT ON UPDATE CASCADE
  - `fk_products_occasion`: `occasion_id` REFERENCES `occasions(id)` ON DELETE RESTRICT ON UPDATE CASCADE
  - `fk_products_fit`: `fit_id` REFERENCES `fits(id)` ON DELETE RESTRICT ON UPDATE CASCADE
  - `fk_products_sleeve_type`: `sleeve_type_id` REFERENCES `sleeve_types(id)` ON DELETE RESTRICT ON UPDATE CASCADE
  - `fk_products_neck_type`: `neck_type_id` REFERENCES `neck_types(id)` ON DELETE RESTRICT ON UPDATE CASCADE
- **Check Constraints**:
  - `chk_products_sale_price`: `sale_price_paise <= mrp_paise` (a sale price may equal MRP but never exceed it)
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

#### 10. `product_slug_history`
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

#### 11. `product_colour_variants`
- **Purpose**: Manages distinct colours per product, holding colour name, hex RGB code, display sorting order, and optional price override (e.g. black fabric surcharge per Section 4).
- **Columns**:
  - `id`: BIGINT UNSIGNED, NOT NULL, AUTO_INCREMENT
  - `product_id`: BIGINT UNSIGNED, NOT NULL
  - `colour_name`: VARCHAR(64), NOT NULL (e.g. 'Emerald Green', 'Rani Pink')
  - `colour_code`: VARCHAR(7), NOT NULL (Hex RGB string, e.g. '#004D40')
  - `price_override_paise`: BIGINT UNSIGNED, NULL, DEFAULT NULL (Optional price override in paise)
  - `display_order`: INT UNSIGNED, NOT NULL, DEFAULT 0
  - `is_active`: TINYINT(1), NOT NULL, DEFAULT 1 (1 = active, 0 = hidden)
  - `created_at`: TIMESTAMP, NOT NULL, DEFAULT CURRENT_TIMESTAMP
  - `updated_at`: TIMESTAMP, NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
- **Primary Key**: `id`
- **Foreign Keys**:
  - `fk_product_colour_variants_product`: `product_id` REFERENCES `products(id)` ON DELETE CASCADE ON UPDATE CASCADE
- **Unique Constraints**:
  - `uq_product_colour_variants_product_colour`: (`product_id`, `colour_name`)
- **Indexes**:
  - `idx_product_colour_variants_product_order`: (`product_id`, `display_order`)
- **Enum Values**: None.
- **Note**: Colours are hidden with `is_active = 0`, never soft-deleted, so that re-adding a hidden colour reactivates the existing row (matching the unique `product_id` + `colour_name` key).

---

#### 12. `product_images`
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

#### 13. `product_variant_sizes`
- **Purpose**: Defines size offerings (S, M, L, XL, Free size) per colour variant and holds the physical stock count. When available stock reaches 0, the variant automatically displays "Out of stock" (Section 3 & 4); available stock is derived from this row minus unexpired holds.
- **Columns**:
  - `id`: BIGINT UNSIGNED, NOT NULL, AUTO_INCREMENT
  - `product_id`: BIGINT UNSIGNED, NOT NULL
  - `colour_variant_id`: BIGINT UNSIGNED, NOT NULL
  - `size_name`: VARCHAR(32), NOT NULL (e.g. 'XS', 'S', 'M', 'L', 'XL', 'Free size')
  - `sku`: VARCHAR(64), NULL, DEFAULT NULL (Variant SKU identifier)
  - `quantity`: INT, NOT NULL, DEFAULT 0 (Physical stock on hand; unexpired holds are subtracted at read time)
  - `display_order`: INT UNSIGNED, NOT NULL, DEFAULT 0 (Size display ordering)
  - `is_active`: TINYINT(1), NOT NULL, DEFAULT 1 (1 = offered, 0 = hidden size)
  - `created_at`: TIMESTAMP, NOT NULL, DEFAULT CURRENT_TIMESTAMP
  - `updated_at`: TIMESTAMP, NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
- **Primary Key**: `id`
- **Foreign Keys**:
  - `fk_product_variant_sizes_product`: `product_id` REFERENCES `products(id)` ON DELETE CASCADE ON UPDATE CASCADE
  - `fk_product_variant_sizes_colour`: `colour_variant_id` REFERENCES `product_colour_variants(id)` ON DELETE CASCADE ON UPDATE CASCADE
- **Check Constraints**:
  - `chk_product_variant_sizes_quantity`: `quantity >= 0`
- **Unique Constraints**:
  - `uq_product_variant_sizes_colour_size`: (`colour_variant_id`, `size_name`)
  - `uq_product_variant_sizes_sku`: (`sku`)
- **Indexes**:
  - `idx_product_variant_sizes_product_id`: (`product_id`)
  - `idx_product_variant_sizes_quantity`: (`quantity`)
- **Enum Values**: None.
- **Available stock rule**: Available stock is **not** a stored column. It is `quantity` minus the sum of unexpired `stock_holds.quantity` for that row, computed inside a database transaction that takes a row lock on the `product_variant_sizes` row (`SELECT ... FOR UPDATE`). Holds whose `expires_at` is in the past are ignored in the calculation and deleted by a periodic cleanup job.
- **Decrement rule**: Checkout reduces stock with a guarded update:
  `UPDATE product_variant_sizes SET quantity = quantity - n WHERE id = ? AND quantity >= n;`
  Zero rows changed means the stock was taken concurrently, i.e. the item is sold out; the transaction rolls back. Because the condition is evaluated inside the database, the check and the decrement cannot be split by a race.

---

#### 14. `stock_movements`
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
  - `fk_stock_movements_product`: `product_id` REFERENCES `products(id)` ON DELETE RESTRICT ON UPDATE CASCADE (a product with stock history can never be hard-deleted)
- **Unique Constraints**: None.
- **Indexes**:
  - `idx_stock_movements_variant_time`: (`product_variant_size_id`, `created_at`)
  - `idx_stock_movements_product_time`: (`product_id`, `created_at`)
  - `idx_stock_movements_order_id`: (`order_id`)
- **Enum Values**: None.

---

#### 15. `stock_holds`
- **Purpose**: Temporary reservations created when a customer starts checkout, so the same last units are not sold twice during the payment window. Holds are bookkeeping only: `product_variant_sizes.quantity` always remains the physical stock and is only decremented when an order is actually placed.
- **Columns**:
  - `id`: BIGINT UNSIGNED, NOT NULL, AUTO_INCREMENT
  - `product_variant_size_id`: BIGINT UNSIGNED, NOT NULL (Variant size being held)
  - `quantity`: INT UNSIGNED, NOT NULL (Units held for this checkout attempt)
  - `checkout_ref`: VARCHAR(64), NOT NULL (Opaque checkout attempt reference; the order link is added in Part B)
  - `expires_at`: DATETIME, NOT NULL (UTC instant when the hold stops counting)
  - `created_at`: TIMESTAMP, NOT NULL, DEFAULT CURRENT_TIMESTAMP
- **Primary Key**: `id`
- **Foreign Keys**:
  - `fk_stock_holds_variant_size`: `product_variant_size_id` REFERENCES `product_variant_sizes(id)` ON DELETE RESTRICT ON UPDATE CASCADE
- **Unique Constraints**:
  - `uq_stock_holds_checkout_variant`: (`checkout_ref`, `product_variant_size_id`) — one hold row per variant per checkout attempt; adding to an existing hold updates its quantity and expiry.
- **Indexes**:
  - `idx_stock_holds_variant_expiry`: (`product_variant_size_id`, `expires_at`)
- **Enum Values**: None.
- **How availability is computed**: Available stock = `product_variant_sizes.quantity` − SUM of `stock_holds.quantity` where `product_variant_size_id` matches and `expires_at > UTC_NOW()`. This read happens inside a transaction that row-locks the `product_variant_sizes` row, so two concurrent checkouts cannot both see the same remaining units.
- **Expiry**: Expired holds (`expires_at <= UTC_NOW()`) are ignored by the availability query and physically removed by a cleanup job; no cancellation path is required for correctness.
- **Converting a hold to a sale**: The order transaction re-checks availability with the lock held, then runs the guarded decrement described under `product_variant_sizes`, writes a `stock_movements` row, and deletes the hold.

---

### Design rules
1. **At least one colour**: Every product has a minimum of one `product_colour_variants` row. There is no colourless product, so images, sizes and stock always hang off a colour.
2. **Price override scope**: `product_colour_variants.price_override_paise`, when set, replaces `products.sale_price_paise` for that colour only. The MRP (`products.mrp_paise`) is never overridden, so the displayed discount stays consistent across colours.
3. **Slug uniqueness and lookup**: Before a slug is used for a new or renamed product, the application checks **both** `products.slug` and `product_slug_history.slug`. A hit in either table means the slug is taken (current product or a redirect) and a numeric suffix is added.
4. **Deleted status and timestamp**: `products.deleted_at` is set exactly when `status` becomes `Deleted`, and is cleared only if the row is restored. The two must never disagree; treat `deleted_at IS NOT NULL` as equivalent to `status = 'Deleted'`.
5. **Delete renames the slug**: On delete, the product slug is renamed to `<slug>-deleted-<id>`. This frees the original slug for reuse while keeping the unique index satisfied. All `product_slug_history` rows for that product are deleted at the same time so no redirect resurrects a deleted product.
6. **One primary image per colour**: At most one primary image per colour; the first image uploaded becomes primary by default; a product cannot be Published unless every active colour has at least one image (app rule).
7. **Sub-category belongs to category**: When `products.sub_category_id` is set, `categories.parent_id` of that sub-category must equal `products.category_id`. The database cannot express this with a simple FK, so it is enforced in the application (and can be backstopped by a trigger later if desired).
8. **Never hard-delete a product with stock history**: `stock_movements.product_id` is `ON DELETE RESTRICT`, so a product that has ever moved stock cannot be hard-deleted. Deletion is always the soft `status = 'Deleted'` path; order snapshots preserve sales history.
9. **Maximum two category levels**: Categories are either top-level (`parent_id IS NULL`) or sub-categories (one level deep). A row whose parent already has a parent is invalid; depth is capped at two so the product form's Category/Sub-category dropdowns stay unambiguous.
10. **Holds never touch physical stock**: `stock_holds` only reduces *available* stock at read time. `product_variant_sizes.quantity` changes solely through the guarded decrement when payment is verified or through an admin stock edit, and every such change writes a `stock_movements` row. The hold starts when the customer clicks Pay, before the payment screen opens, so stock cannot be oversold while payment is pending.
11. **Size charts are column-flexible**: A chart is a set of ordered measurement columns, ordered size rows, and one cell per row/column intersection. A new chart starts with the columns Bust, Waist, Hip and Length; the admin may add, rename, reorder or remove columns afterwards without a schema change. Removing a column removes its cells, and renaming a column keeps its cells.
12. **Cells stay inside one chart**: Every cell's `size_chart_row_id` and `size_chart_column_id` must belong to the same chart. Foreign keys only prove each side exists, so the application checks that both sides share one `size_chart_id` before writing a cell.
13. **Unit is per chart**: `size_charts.unit` (`in` or `cm`) applies to every cell in that chart. Values are stored as entered and are not converted between charts; a product using a chart inherits that chart's unit for display.
14. **Size chart edits propagate**: Because products reference a chart rather than copying it, editing a chart's columns, rows or cells immediately updates every product using it, including the storefront popup. A chart referenced by any product cannot be deleted (`products.size_chart_id` is `ON DELETE RESTRICT`).

---

### Relationship Summary
1. **Category Hierarchy**: `categories` (parent) `1 : N` `categories` (sub-categories) via `parent_id`, capped at two levels.
2. **Product Categorization**: `categories` `1 : N` `products` (assigned both a primary `category_id` and an optional `sub_category_id`); the sub-category's parent must equal the product's category.
3. **Collections**: `products` `N : M` `collections` via the join table `product_collections`.
4. **Managed Lists**: Each managed list table (`fabrics`, `occasions`, `fits`, `sleeve_types`, `neck_types`, `set_types`) has a `1 : N` relationship to `products` with `ON DELETE RESTRICT`; values are hidden with `is_active`, never deleted.
5. **Size Charts**: `size_charts` `1 : N` `size_chart_columns` (ordered measurement headings), `1 : N` `size_chart_rows` (ordered sizes), and `1 : N` `size_chart_cells` via those rows and columns. A cell joins one row and one column of the same chart. In addition, `size_charts` `1 : N` `products` with `ON DELETE RESTRICT`, ensuring in-use charts cannot be removed.
6. **Slug History**: `products` `1 : N` `product_slug_history` for URL redirect preservation; rows are removed when a product is deleted, and slug uniqueness spans both tables.
7. **Colour Variants**: `products` `1 : N` `product_colour_variants`; every product has at least one colour, colours are hidden via `is_active`, and an optional per-colour price override replaces only the sale price.
8. **Product Images**: `product_colour_variants` `1 : N` `product_images` (each image belongs to a specific colour variant, exactly one flagged primary per colour).
9. **Sizes and Inventory**: `product_colour_variants` `1 : N` `product_variant_sizes` (one row per colour + size combination holding physical `quantity`).
10. **Stock Holds**: `product_variant_sizes` `1 : N` `stock_holds`; unexpired holds are subtracted from `quantity` to give available stock at read time, and expired holds are cleaned up.
11. **Inventory Movement Audit**: `product_variant_sizes` `1 : N` `stock_movements`, and `products` `1 : N` `stock_movements` with `ON DELETE RESTRICT` (full immutable log of stock adjustments).

---

### Questions
1. **Order-Related Links**: `stock_movements.order_id` and the order reference on `stock_holds` are intentionally loose (`BIGINT UNSIGNED NULL` / `checkout_ref`) in Part A. Their foreign keys and delete rules will be added in Part B alongside the `orders` table.
2. **Admin User Reference on Stock Movements (answered)**: `stock_movements.user_id` links to `admin_users(id)` with `ON DELETE RESTRICT ON UPDATE CASCADE`. It is `NULL` only for system actions (scheduled jobs, automated cleanup), where `performed_by` records the system name. The constraint is declared in `db/schema_draft.sql` ahead of the `admin_users` table, which is created in Part B1; `FOREIGN_KEY_CHECKS` is off at the top of the draft file.
3. **Stock Hold Cleanup Cadence (answered)**: Expired holds are removed both by a cron job every few minutes and by pruning that variant's expired holds inside the checkout transaction.

---

## Schema design draft - Part B1: customers, admin, settings, coupons

### Scope and what is deliberately not stored

**Cart and wishlist are not tables.** At launch both live in the browser (localStorage) and are never written to the database. Only order lines are persisted, as snapshots, from Part B2 onward.

- The browser stores only product, colour, size and quantity, never the price.
- Price and stock are read live from the server.
- The cart shows a "Price updated" notice when a price changed.
- Sold-out items cannot be checked out.
- Quantity above available stock is reduced with a notice.
- The server re-checks everything and uses its own prices at checkout.
- Unpublished or archived products disappear from carts and wishlists.
- **Later feature (not in launch scope)**: server-side cart sync across devices. That would need a `cart_items` table and customer login on every device, so it is deliberately deferred.

Nothing else in this part is stored either: no UPI IDs, no card numbers, no payment credentials, no plain-text passwords, OTPs or tokens.

### Conventions (Part B1 additions)

All Part A conventions apply unchanged (InnoDB, `utf8mb4_unicode_ci`, `snake_case`, UTC timestamps, paise integers, soft deletes only where ADMIN_SPEC asks for them). Additions:

- **Hashed secrets**: passwords are stored with `password_hash()` only; OTPs, device tokens and session tokens are stored as SHA-256 hex (`CHAR(64)`), never in clear text.
- **Two login identifiers**: a customer can log in with email **or** phone using the same password, so both columns are unique and normalised before every write.
- **`settings` exception**: the key/value table uses `setting_key` (`VARCHAR(64)`) as its natural primary key instead of a surrogate `id`, because rows are referenced by key in code and never by a numeric ID.
- **Retention**: `activity_log` keeps 3 months and is trimmed by a scheduled job.

### Table Specifications

#### 16. `customers`
- **Purpose**: Storefront customer account. One row per customer; login accepts email **or** phone with the same password. Created on first order or first account creation.
- **Columns**:
  - `id`: BIGINT UNSIGNED, NOT NULL, AUTO_INCREMENT
  - `name`: VARCHAR(150), NOT NULL, no default
  - `email`: VARCHAR(255), NOT NULL, no default (stored trimmed and lowercase)
  - `phone`: VARCHAR(20), NOT NULL, no default (text, digits with country code; never numeric, so leading zeros and `+` survive)
  - `password_hash`: VARCHAR(255), NOT NULL, no default (hashed password only)
  - `is_active`: TINYINT(1), NOT NULL, DEFAULT 1 (0 = blocked, cannot log in)
  - `created_at`: TIMESTAMP, NOT NULL, DEFAULT CURRENT_TIMESTAMP
  - `updated_at`: TIMESTAMP, NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
- **Primary Key**: `id`
- **Foreign Keys**: None.
- **Unique Constraints**: `uq_customers_email` (`email`), `uq_customers_phone` (`phone`).
- **Indexes**: `idx_customers_is_active` (`is_active`), `idx_customers_created_at` (`created_at`).
- **Enum Values**: None.

#### 17. `customer_addresses`
- **Purpose**: Saved delivery addresses for a customer, used to prefill checkout. Orders keep their own address snapshot from Part B2, so editing or deleting an address never rewrites history.
- **Columns**:
  - `id`: BIGINT UNSIGNED, NOT NULL, AUTO_INCREMENT
  - `customer_id`: BIGINT UNSIGNED, NOT NULL, no default
  - `recipient_name`: VARCHAR(150), NOT NULL, no default
  - `phone`: VARCHAR(20), NOT NULL, no default (delivery contact, digits with country code)
  - `address_line1`: VARCHAR(255), NOT NULL, no default
  - `address_line2`: VARCHAR(255), NULL, DEFAULT NULL
  - `city`: VARCHAR(100), NOT NULL, no default
  - `state`: VARCHAR(100), NOT NULL, no default
  - `pincode`: VARCHAR(10), NOT NULL, no default (text to keep leading zeros)
  - `is_default`: TINYINT(1), NOT NULL, DEFAULT 0
  - `created_at`: TIMESTAMP, NOT NULL, DEFAULT CURRENT_TIMESTAMP
  - `updated_at`: TIMESTAMP, NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
- **Primary Key**: `id`
- **Foreign Keys**:
  - `fk_customer_addresses_customer`: `customer_id` REFERENCES `customers(id)` ON DELETE CASCADE ON UPDATE CASCADE
- **Unique Constraints**: None (the one-default rule is an application rule, because MySQL has no partial unique index).
- **Indexes**: `idx_customer_addresses_customer` (`customer_id`, `is_default`).
- **Enum Values**: None.

#### 18. `admin_users`
- **Purpose**: The single owner account for `admin.sarmelle.com`. ADMIN_SPEC defines one owner, so the table is expected to hold exactly one row; there is no role column.
- **Columns**:
  - `id`: BIGINT UNSIGNED, NOT NULL, AUTO_INCREMENT
  - `name`: VARCHAR(150), NOT NULL, no default
  - `email`: VARCHAR(255), NOT NULL, no default (stored trimmed and lowercase; used for OTP delivery)
  - `password_hash`: VARCHAR(255), NOT NULL, no default (hashed password only; minimum 12 characters enforced by the app)
  - `created_at`: TIMESTAMP, NOT NULL, DEFAULT CURRENT_TIMESTAMP
  - `updated_at`: TIMESTAMP, NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
- **Primary Key**: `id`
- **Foreign Keys**: None.
- **Unique Constraints**: `uq_admin_users_email` (`email`).
- **Indexes**: None beyond the unique key.
- **Enum Values**: None.
- **Referenced by**: `stock_movements.user_id` (Part A, `ON DELETE RESTRICT`), plus every table below.

#### 19. `admin_trusted_devices`
- **Purpose**: Devices that have already passed the new-device email OTP, so the owner is not challenged on every login. Only a hash of the device token is kept.
- **Columns**:
  - `id`: BIGINT UNSIGNED, NOT NULL, AUTO_INCREMENT
  - `admin_user_id`: BIGINT UNSIGNED, NOT NULL, no default
  - `token_hash`: CHAR(64), NOT NULL, no default (SHA-256 hex; the token itself is never stored)
  - `label`: VARCHAR(100), NULL, DEFAULT NULL (human label such as "Office laptop - Chrome")
  - `last_used_at`: DATETIME, NULL, DEFAULT NULL (UTC instant of the last successful use)
  - `created_at`: TIMESTAMP, NOT NULL, DEFAULT CURRENT_TIMESTAMP
- **Primary Key**: `id`
- **Foreign Keys**:
  - `fk_admin_trusted_devices_admin`: `admin_user_id` REFERENCES `admin_users(id)` ON DELETE CASCADE ON UPDATE CASCADE
- **Unique Constraints**: `uq_admin_trusted_devices_token` (`token_hash`).
- **Indexes**: `idx_admin_trusted_devices_admin` (`admin_user_id`).
- **Enum Values**: None.

#### 20. `admin_otp_codes`
- **Purpose**: One-time codes for the two ADMIN_SPEC flows: new-device verification and forgot-password. Codes are hashed, single-use and time-limited.
- **Columns**:
  - `id`: BIGINT UNSIGNED, NOT NULL, AUTO_INCREMENT
  - `admin_user_id`: BIGINT UNSIGNED, NOT NULL, no default
  - `code_hash`: CHAR(64), NOT NULL, no default (SHA-256 hex; the code is never stored)
  - `purpose`: ENUM('new_device', 'forgot_password'), NOT NULL, no default
  - `expires_at`: DATETIME, NOT NULL, no default (UTC expiry)
  - `attempts`: TINYINT UNSIGNED, NOT NULL, DEFAULT 0 (failed verifications for this code)
  - `used_at`: DATETIME, NULL, DEFAULT NULL (set on success; a used code never verifies again)
  - `created_at`: TIMESTAMP, NOT NULL, DEFAULT CURRENT_TIMESTAMP
- **Primary Key**: `id`
- **Foreign Keys**:
  - `fk_admin_otp_codes_admin`: `admin_user_id` REFERENCES `admin_users(id)` ON DELETE CASCADE ON UPDATE CASCADE
- **Unique Constraints**: None (several codes per purpose may exist; the newest unexpired unused one wins).
- **Indexes**: `idx_admin_otp_codes_admin_purpose` (`admin_user_id`, `purpose`, `expires_at`), `idx_admin_otp_codes_expires_at` (`expires_at`).
- **Enum Values**: `purpose` = `new_device`, `forgot_password`.

#### 21. `admin_login_attempts`
- **Purpose**: Raw record of every admin login attempt, successful or not, used to enforce the failed-attempt lockout in ADMIN_SPEC. `identifier` is stored as typed so attempts on non-existent emails are also rate-limited.
- **Columns**:
  - `id`: BIGINT UNSIGNED, NOT NULL, AUTO_INCREMENT
  - `admin_user_id`: BIGINT UNSIGNED, NULL, DEFAULT NULL (filled when the identifier matched an account)
  - `identifier`: VARCHAR(255), NOT NULL, no default (email as typed, even when no account exists)
  - `ip`: VARCHAR(45), NULL, DEFAULT NULL (IPv4 or IPv6 text)
  - `is_success`: TINYINT(1), NOT NULL, DEFAULT 0 (1 = success, 0 = failure)
  - `created_at`: TIMESTAMP, NOT NULL, DEFAULT CURRENT_TIMESTAMP
- **Primary Key**: `id`
- **Foreign Keys**:
  - `fk_admin_login_attempts_admin`: `admin_user_id` REFERENCES `admin_users(id)` ON DELETE CASCADE ON UPDATE CASCADE
- **Unique Constraints**: None (one row per attempt).
- **Indexes**: `idx_admin_login_attempts_identifier_time` (`identifier`, `created_at`), `idx_admin_login_attempts_ip_time` (`ip`, `created_at`), `idx_admin_login_attempts_created_at` (`created_at`).
- **Enum Values**: None.

#### 22. `admin_sessions`
- **Purpose**: Server-side admin sessions with an explicit timeout, so a session can be expired or revoked from the database instead of only on the client. Stores a hash of the session token plus the request context.
- **Columns**:
  - `id`: BIGINT UNSIGNED, NOT NULL, AUTO_INCREMENT
  - `admin_user_id`: BIGINT UNSIGNED, NOT NULL, no default
  - `session_token_hash`: CHAR(64), NOT NULL, no default (SHA-256 hex; the token itself is never stored)
  - `expires_at`: DATETIME, NOT NULL, no default (UTC session timeout)
  - `ip`: VARCHAR(45), NULL, DEFAULT NULL
  - `user_agent`: VARCHAR(255), NULL, DEFAULT NULL
  - `created_at`: TIMESTAMP, NOT NULL, DEFAULT CURRENT_TIMESTAMP
- **Primary Key**: `id`
- **Foreign Keys**:
  - `fk_admin_sessions_admin`: `admin_user_id` REFERENCES `admin_users(id)` ON DELETE CASCADE ON UPDATE CASCADE
- **Unique Constraints**: `uq_admin_sessions_token` (`session_token_hash`).
- **Indexes**: `idx_admin_sessions_admin_expiry` (`admin_user_id`, `expires_at`), `idx_admin_sessions_expires_at` (`expires_at`).
- **Enum Values**: None.

#### 23. `customer_sessions`
- **Purpose**: The customer-side equivalent of `admin_sessions`, so a customer can stay logged in across visits and can be logged out server-side. See the session question below: PHP's native session handling may make this table unnecessary.
- **Columns**:
  - `id`: BIGINT UNSIGNED, NOT NULL, AUTO_INCREMENT
  - `customer_id`: BIGINT UNSIGNED, NOT NULL, no default
  - `session_token_hash`: CHAR(64), NOT NULL, no default (SHA-256 hex; the token itself is never stored)
  - `expires_at`: DATETIME, NOT NULL, no default (UTC session timeout)
  - `ip`: VARCHAR(45), NULL, DEFAULT NULL
  - `user_agent`: VARCHAR(255), NULL, DEFAULT NULL
  - `created_at`: TIMESTAMP, NOT NULL, DEFAULT CURRENT_TIMESTAMP
- **Primary Key**: `id`
- **Foreign Keys**:
  - `fk_customer_sessions_customer`: `customer_id` REFERENCES `customers(id)` ON DELETE CASCADE ON UPDATE CASCADE
- **Unique Constraints**: `uq_customer_sessions_token` (`session_token_hash`).
- **Indexes**: `idx_customer_sessions_customer_expiry` (`customer_id`, `expires_at`), `idx_customer_sessions_expires_at` (`expires_at`).
- **Enum Values**: None.

#### 24. `settings`
- **Purpose**: Single-row-per-key storefront and checkout settings edited in ADMIN_SPEC section 11, so the owner can change them without a rebuild. Values are always text and cast by the application.
- **Columns**:
  - `setting_key`: VARCHAR(64), NOT NULL, no default (natural primary key)
  - `setting_value`: TEXT, NULL, DEFAULT NULL (text; money values in paise)
  - `updated_at`: TIMESTAMP, NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
- **Primary Key**: `setting_key`
- **Foreign Keys**: None.
- **Unique Constraints**: Implied by the primary key.
- **Indexes**: None.
- **Enum Values**: None.
- **Exact key list** (the app validates against this allow-list; an unknown key is a bug, not a new setting):

| Key | Meaning | Stored as |
| --- | --- | --- |
| `shipping_charge_paise` | Flat shipping charge | paise integer |
| `free_shipping_threshold_paise` | Order subtotal at or above this ships free; `0` disables free shipping | paise integer |
| `return_window_days` | Days after delivery in which a return can be requested | integer |
| `payment_hold_minutes` | Lifetime of a stock hold, default `5` | integer |
| `store_name` | Store name used on pages, emails and invoices | text |
| `store_email` | Owner/store contact email | text |
| `store_phone` | Store contact phone | text |
| `store_address` | Store address shown in the footer and on emails | text |

#### 25. `couriers`
- **Purpose**: Courier companies the owner ships with, each with a tracking-link template. The default courier is pre-selected on the order form and the admin only types the tracking ID.
- **Columns**:
  - `id`: BIGINT UNSIGNED, NOT NULL, AUTO_INCREMENT
  - `name`: VARCHAR(100), NOT NULL, no default
  - `tracking_url_template`: VARCHAR(255), NOT NULL, no default (contains a `{tracking_id}` placeholder)
  - `is_default`: TINYINT(1), NOT NULL, DEFAULT 0
  - `is_active`: TINYINT(1), NOT NULL, DEFAULT 1 (0 = hidden from the order form, history keeps the name)
  - `created_at`: TIMESTAMP, NOT NULL, DEFAULT CURRENT_TIMESTAMP
  - `updated_at`: TIMESTAMP, NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
- **Primary Key**: `id`
- **Foreign Keys**: None in Part B1. Orders will reference the courier in Part B2.
- **Unique Constraints**: `uq_couriers_name` (`name`).
- **Indexes**: `idx_couriers_is_default` (`is_default`), `idx_couriers_is_active` (`is_active`).
- **Enum Values**: None.

#### 26. `coupons`
- **Purpose**: Discount codes created and switched on/off in ADMIN_SPEC section 10. The redemption record that links a coupon to an order is added in Part B2; at launch `used_count` tracks redemptions.
- **Columns**:
  - `id`: BIGINT UNSIGNED, NOT NULL, AUTO_INCREMENT
  - `code`: VARCHAR(32), NOT NULL, no default (stored uppercase)
  - `type`: ENUM('percent', 'amount'), NOT NULL, no default (`amount` = fixed rupees off, stored in paise)
  - `value`: INT UNSIGNED, NOT NULL, no default (percent 1-100, or paise when `amount`)
  - `expires_at`: DATETIME, NULL, DEFAULT NULL (UTC; NULL = no expiry)
  - `min_order_paise`: BIGINT UNSIGNED, NOT NULL, DEFAULT 0
  - `max_discount_paise`: BIGINT UNSIGNED, NULL, DEFAULT NULL (cap for percent coupons; NULL = no cap)
  - `usage_limit`: INT UNSIGNED, NULL, DEFAULT NULL (total allowed redemptions; NULL = unlimited)
  - `used_count`: INT UNSIGNED, NOT NULL, DEFAULT 0 (incremented only when an order is placed)
  - `is_active`: TINYINT(1), NOT NULL, DEFAULT 1 (on/off switch)
  - `created_at`: TIMESTAMP, NOT NULL, DEFAULT CURRENT_TIMESTAMP
  - `updated_at`: TIMESTAMP, NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
- **Primary Key**: `id`
- **Foreign Keys**: None in Part B1 (orders link through the redemption table in Part B2).
- **Unique Constraints**: `uq_coupons_code` (`code`) — case-insensitive because of the collation, which is what the owner expects.
- **Indexes**: `idx_coupons_is_active_expiry` (`is_active`, `expires_at`).
- **Enum Values**: `type` = `percent`, `amount`.
- **CHECK constraints**: `chk_coupons_value` (`value > 0`), `chk_coupons_percent_max` (`type <> 'percent' OR value <= 100`). Both are re-checked in the application because CHECK is ignored on MySQL 5.7.

#### 27. `activity_log`
- **Purpose**: Append-only admin audit trail required by ADMIN_SPEC section 2 (who, what, when, old value to new value). Every critical admin action writes one row; rows are never edited.
- **Columns**:
  - `id`: BIGINT UNSIGNED, NOT NULL, AUTO_INCREMENT
  - `admin_user_id`: BIGINT UNSIGNED, NULL, DEFAULT NULL (NULL only for system-generated entries such as the cleanup job)
  - `action`: VARCHAR(50), NOT NULL, no default (e.g. `product.update`, `order.cancel`, `refund.done`)
  - `entity_type`: VARCHAR(50), NOT NULL, no default (e.g. `product`, `order`, `coupon`)
  - `entity_id`: BIGINT UNSIGNED, NULL, DEFAULT NULL
  - `old_value`: TEXT, NULL, DEFAULT NULL (JSON-encoded snapshot before the change)
  - `new_value`: TEXT, NULL, DEFAULT NULL (JSON-encoded snapshot after the change)
  - `ip`: VARCHAR(45), NULL, DEFAULT NULL
  - `created_at`: TIMESTAMP, NOT NULL, DEFAULT CURRENT_TIMESTAMP
- **Primary Key**: `id`
- **Foreign Keys**:
  - `fk_activity_log_admin`: `admin_user_id` REFERENCES `admin_users(id)` ON DELETE RESTRICT ON UPDATE CASCADE
- **Unique Constraints**: None.
- **Indexes**: `idx_activity_log_entity` (`entity_type`, `entity_id`), `idx_activity_log_admin_time` (`admin_user_id`, `created_at`), `idx_activity_log_created_at` (`created_at`).
- **Enum Values**: None.
- **Retention**: 3 months, as required by ADMIN_SPEC. A daily cleanup job deletes rows with `created_at < UTC_NOW() - INTERVAL 3 MONTH`; nothing else ever deletes from this table.

### Design rules
1. **No payment credentials, ever**: UPI IDs, card numbers, CVVs and bank details are never stored in any table. Only Razorpay payment and refund IDs are kept (Part B2), as ADMIN_SPEC section 2 requires.
2. **No plain-text secrets**: Passwords exist only as `password_hash` output. OTP codes, device tokens and session tokens exist only as SHA-256 hashes and are compared by hashing the presented value. Secrets are never written to `activity_log` either.
3. **Login identifiers are unique and normalised**: Email is trimmed and lowercased, phone is reduced to digits plus country code before insert or lookup. Without this, the same person can create two accounts that the unique indexes cannot see as duplicates.
4. **One owner account**: `admin_users` is designed for exactly one row. There is no role column because ADMIN_SPEC grants the owner full access; adding staff later needs a role column and a new migration.
5. **One default address per customer**: At most one `customer_addresses` row per customer has `is_default = 1`; setting a new default clears the previous one in the same transaction. MySQL cannot express this as a partial unique index, so it is an app rule.
6. **One default courier**: At most one `couriers` row has `is_default = 1`, set in a single transaction that clears the old default. An inactive courier cannot be the default; if the default is deactivated, the owner must pick another before the next shipment.
7. **Coupon maths lives in one place**: `percent` applies to the order subtotal, is capped by `max_discount_paise` when set, and only applies once `min_order_paise` is met. `amount` is a flat paise deduction. Discount never exceeds the subtotal.
8. **Coupon usage is atomic**: Checkout increments `used_count` with a conditional update — `UPDATE coupons SET used_count = used_count + 1 WHERE id = ? AND is_active = 1 AND (usage_limit IS NULL OR used_count < usage_limit)` — and treats zero affected rows as "coupon no longer available". This is the guard against two orders using the last redemption at once.
9. **Settings are read, not trusted blindly**: Values are text, cast per key by the application, and validated against the fixed key list. Money settings are integers in paise. A change applies on the next request; nothing is cached beyond the request that reads it.
10. **Sessions and OTPs expire by time**: Every authentication read requires `expires_at > UTC_NOW()`, and OTP reads also require `used_at IS NULL`. Expired rows are removed by the same scheduled job that prunes stock holds; correctness never depends on the cleanup having run.
11. **Activity log is append-only**: The application only inserts. Rows are never updated and are deleted only by the 3-month retention job. Old and new values are JSON text snapshots, not foreign keys, so the entry still reads correctly after the record changes or is deleted.
12. **Hashed lookups use exact indexes**: `token_hash`, `code_hash` and `session_token_hash` are fixed-length `CHAR(64)` with unique or composite indexes so every verification is a single indexed lookup, not a scan.

### Relationship Summary
This continues the Part A summary (items 1-11).

12. **Customers and Addresses**: `customers` `1 : N` `customer_addresses` with `ON DELETE CASCADE`; at most one address per customer is the default.
13. **Customer Sessions**: `customers` `1 : N` `customer_sessions` with `ON DELETE CASCADE`; only hashes are stored and expired rows are pruned.
14. **Admin Account**: `admin_users` `1 : N` `admin_trusted_devices`, `1 : N` `admin_otp_codes`, `1 : N` `admin_login_attempts`, `1 : N` `admin_sessions`, all `ON DELETE CASCADE` (owner-only data has no meaning without the account).
15. **Admin and Audit**: `admin_users` `1 : N` `stock_movements` (`ON DELETE RESTRICT`, Part A) and `1 : N` `activity_log` (`ON DELETE RESTRICT`); both logs outlive any account change and are never rewritten.
16. **Settings**: standalone key/value table with no foreign keys; read by the storefront, checkout and admin screens.
17. **Couriers**: standalone in Part B1; from Part B2 `couriers` `1 : N` `orders` (the default is pre-selected on the order form, and each order keeps the tracking ID and the template used).
18. **Coupons**: standalone in Part B1; from Part B2 a redemption table links `coupons` `N : M` `orders` and is the authoritative record of which order used which code. `coupons.used_count` is the fast counter for that table.
19. **Login Attempts to Accounts**: `admin_login_attempts.admin_user_id` is `NULL` for unknown identifiers and set when the typed email matched the owner account; the lockout query reads by `identifier` and `ip`, not only by account.

### Questions
1. **PHP sessions or these tables?** Both `admin_sessions` and `customer_sessions` are specified above, but I think PHP's own session handling is the better fit at launch: `session_start()` already issues and validates the cookie, rotates the ID and can store data server-side, so we would not be hand-rolling token generation. The two tables only earn their keep if we want to list and revoke active sessions, or force a logout from the database. My recommendation: use PHP sessions, drop `customer_sessions`, and keep `admin_sessions` only if the owner wants a "signed-in devices" screen. Your call before Part B2.
2. **Customer password reset**: ADMIN_SPEC defines forgot-password by email OTP for the admin only. Customers have no stated reset path. An emailed one-time link keeps `admin_otp_codes` untouched; a customer OTP would need its own table or a nullable owner column. Decide before customer login is built.
3. **Lockout numbers**: ADMIN_SPEC requires failed-attempt lockout but gives no threshold. `admin_login_attempts` stores raw attempts, so any policy (count, window, lockout length, per-IP as well as per-account) can be applied later without a migration.
4. **Trusted device lifetime**: The tables support an unlimited number of devices with `last_used_at`, but not how long a device stays trusted or whether the owner can revoke one. Need a number (for example 30 or 90 days) and whether a revoke screen is in scope.
5. **Coupon eligibility**: ADMIN_SPEC lists a total usage limit only. Should a code be usable once per customer, and can it combine with other codes? The Part B2 redemption table records the customer, so a per-customer rule can be added without changing `coupons`.
6. **Cancelled orders and `used_count`**: If an order is cancelled or fully refunded, does the redemption still count against `usage_limit`? The redemption table will record the order, so the answer changes a query, not the schema.

### Risks
- **CHECK is not enforced on MySQL 5.7**: `chk_coupons_value` and `chk_coupons_percent_max` (and the Part A checks) are silently ignored there. The application must validate coupon value and percent range regardless of the Hostinger database version.
- **Phone uniqueness depends on normalisation**: `+91 98765 43210`, `09876543210` and `9876543210` are three different strings. Without one canonical format before every write, duplicate accounts leak through the unique index.
- **Case- and accent-insensitive email matching**: `utf8mb4_unicode_ci` makes `A@x.com` and `a@x.com` the same account (intended), but it also treats some accented variants as equal. Emails are ASCII in practice, so this is acceptable, but it is a property of the collation, not of the code.
- **`used_count` can drift**: It is a counter, not a derived value. If a redemption is reversed or an order deleted outside the normal path, the counter must be corrected explicitly, or Part B2 should recompute it from the redemption table when in doubt.
- **Activity log holds personal data**: Snapshots can contain customer names, phones and addresses. The 3-month retention is therefore a privacy control as well as a storage control, and the cleanup job must actually run.
- **Growth of auth tables**: `admin_login_attempts`, `admin_otp_codes`, `admin_trusted_devices` and both session tables grow with every login. If the scheduled cleanup stops, the tables and their indexes grow without bound; monitor row counts.
- **Single admin account is a single point of failure**: No roles, no second admin, no recovery path except the email OTP flow. If the owner's mailbox is lost, access to the admin panel is lost with it.
- **Settings typos fail silently**: A misspelled key reads as "not set". The app must validate keys against the fixed list and fail loudly rather than falling back to a wrong default.
- **Cart data is client-side and untrusted**: Quantities and any stored price hint can be edited in the browser. This is safe only because checkout re-reads price and stock on the server; any code path that trusts a browser price is a discount bug.
- **Coupon extremes are owner-controlled**: A 100% coupon with no cap and no minimum, or a large `max_discount_paise`, is a one-click loss. Validation should warn, and the activity log records every coupon edit.
- **`free_shipping_threshold_paise = 0`**: The "disabled" meaning must be implemented the same way in cart, checkout and order totals, or the storefront and the server will disagree about shipping.

