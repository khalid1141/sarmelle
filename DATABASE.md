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
6. **One primary image per colour**: Each `product_colour_variants` row has exactly one `product_images` row with `is_primary = 1`. Setting a new primary unsets the previous one in the same transaction.
7. **Sub-category belongs to category**: When `products.sub_category_id` is set, `categories.parent_id` of that sub-category must equal `products.category_id`. The database cannot express this with a simple FK, so it is enforced in the application (and can be backstopped by a trigger later if desired).
8. **Never hard-delete a product with stock history**: `stock_movements.product_id` is `ON DELETE RESTRICT`, so a product that has ever moved stock cannot be hard-deleted. Deletion is always the soft `status = 'Deleted'` path; order snapshots preserve sales history.
9. **Maximum two category levels**: Categories are either top-level (`parent_id IS NULL`) or sub-categories (one level deep). A row whose parent already has a parent is invalid; depth is capped at two so the product form's Category/Sub-category dropdowns stay unambiguous.
10. **Holds never touch physical stock**: `stock_holds` only reduces *available* stock at read time. `product_variant_sizes.quantity` changes solely through the guarded decrement at order placement or through an admin stock edit, and every such change writes a `stock_movements` row.
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
2. **Admin User Reference on Stock Movements**: In `stock_movements`, `user_id` is currently nullable alongside an immutable `performed_by` string snapshot. When user accounts are finalized in a later part, should `user_id` strictly foreign-key to the `users` table, allowing null only for automated system operations?
3. **Stock Hold Cleanup Cadence**: Expired holds are ignored by the availability query, so correctness does not depend on cleanup. Is a periodic delete job sufficient, or should `stock_holds` be pruned opportunistically on each checkout attempt for the same variant?

