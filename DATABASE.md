# Sarmelle — Database Schema & Migration Plan

## Database: `sarmelle_db` (MySQL / MariaDB)

### Schema status

Design draft complete across Parts A, B1, B2a and B2b, awaiting owner and supervisor approval. It has never been executed: no SQL from `db/schema_draft.sql` has run against any database. The next step, after approval, is creating `sarmelle_local` from `db/schema_draft.sql` and checking the tables, keys and constraints in that order.

### Final table index

39 table specifications, 44 physical tables: specification 4 covers six managed lists. Every table below exists in `db/schema_draft.sql`; the part column points at the section that specifies it.

| # | Table | Purpose | Part |
| --- | --- | --- | --- |
| 1 | `categories` | Product and sub-category tree with slug, visibility and display order. | A |
| 2 | `collections` | Curated collections (festive, new arrivals, best sellers). | A |
| 3 | `product_collections` | Many-to-many link between products and collections, with display order. | A |
| 4a | `fabrics` | Managed fabric list for product attributes. | A |
| 4b | `occasions` | Managed occasion list (festive, wedding, daily). | A |
| 4c | `fits` | Managed fit list (regular, relaxed, fitted). | A |
| 4d | `sleeve_types` | Managed sleeve list. | A |
| 4e | `neck_types` | Managed neckline list. | A |
| 4f | `set_types` | Managed set-type list (single piece, set, dupatta set). | A |
| 5 | `size_charts` | Named measurement charts with unit and description. | A |
| 6 | `size_chart_rows` | Size rows of a chart (S, M, L, ...). | A |
| 7 | `size_chart_columns` | Measurement column labels of a chart (bust, sleeve, ...). | A |
| 8 | `size_chart_cells` | One measurement value at a size-row and column intersection. | A |
| 9 | `products` | Product master: title, prices, attributes, publication status, return eligibility. | A |
| 10 | `product_slug_history` | Old product slugs kept for redirects. | A |
| 11 | `product_colour_variants` | Colour options per product with hex code and optional price override. | A |
| 12 | `product_images` | Gallery images per colour in display order, one primary. | A |
| 13 | `product_variant_sizes` | Sellable size row per colour with SKU and on-hand quantity. | A |
| 14 | `stock_movements` | Append-only stock audit log for every quantity change, including restocks. | A |
| 15 | `stock_holds` | Temporary checkout stock reservations keyed by order and expiry. | A |
| 16 | `customers` | Customer accounts: email, phone, password hash, active flag. | B1 |
| 17 | `customer_addresses` | Saved delivery addresses per customer, one default. | B1 |
| 18 | `customer_password_resets` | Hashed one-time password reset tokens with expiry and use stamp. | B1 |
| 19 | `admin_users` | Admin accounts (one owner at launch). | B1 |
| 20 | `admin_trusted_devices` | Trusted browsers that skip the new-device OTP. | B1 |
| 21 | `admin_otp_codes` | Hashed OTP codes for new-device login and forgot password. | B1 |
| 22 | `login_attempts` | Failed and successful logins for lockout and throttling. | B1 |
| 23 | `admin_sessions` | Admin session tokens with expiry and device details. | B1 |
| 24 | `settings` | Key/value storefront settings with a fixed key allow-list. | B1 |
| 25 | `couriers` | Courier names, tracking URL templates and the default flag. | B1 |
| 26 | `coupons` | Discount codes: percent or fixed amount, limits, minimum order, cap. | B1 |
| 27 | `activity_log` | Append-only admin audit log, kept 3 months. | B1 |
| 28 | `orders` | Order master with customer and address snapshots, totals and status. | B2a |
| 29 | `order_items` | Order-line snapshots (product, size, colour, price) used by reports. | B2a |
| 30 | `order_status_history` | Append-only order status changes with the Reject undo window. | B2a |
| 31 | `payments` | Razorpay order and payment IDs with amounts and status. | B2a |
| 32 | `payment_webhook_events` | Webhook delivery log for dedupe and diagnosis, never the raw body. | B2a |
| 33 | `refunds` | Manual refunds, `pending` or `done`, linked to the cancellation or return that caused them. | B2a |
| 34 | `coupon_redemptions` | Which order used which coupon and when the use was released. | B2a |
| 35 | `cancellation_requests` | The order's one cancellation request and the owner's accept with 10-minute undo. | B2b |
| 36 | `return_reject_reasons` | Managed reject reasons, hidden rather than deleted. | B2b |
| 37 | `return_requests` | The order's one return or exchange request: parcel ladder, refund or replacement shipment. | B2b |
| 38 | `return_request_items` | Selected lines and quantities, plus the replacement variant for an exchange. | B2b |
| 39 | `notifications` | Durable email queue and sent log for customer and owner messages. | B2b |

---

## Schema design draft - Part A: catalogue and stock

### Conventions
- **Compatibility**: MySQL 8.0+ / MariaDB 10.5+ compatible.
- **Engine**: InnoDB storage engine for ACID transactions and foreign key constraint enforcement.
- **Character Set & Collation**: `utf8mb4` charset with `utf8mb4_unicode_ci` collation.
- **Naming**: `snake_case` for all table names, column names, foreign keys, and indexes.
- **Primary Keys**: `BIGINT UNSIGNED AUTO_INCREMENT` named `id` across all primary entity tables.
- **Monetary Values**: Stored strictly as exact integers in paise (`BIGINT UNSIGNED`), avoiding floating-point precision loss (e.g., ₹2,999.00 is stored as `299900`).
- **Timestamps**: Expressed in IST (Asia/Kolkata, +05:30) using `created_at` (`DEFAULT CURRENT_TIMESTAMP`) and `updated_at` (`DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`).
- **Soft Deletes**: Managed via nullable IST timestamp `deleted_at` (`DEFAULT NULL`) where required by ADMIN_SPEC. Currently only `products`, `categories` and `collections` carry `deleted_at`; `product_colour_variants` uses an `is_active` flag instead so that a hidden colour can be reactivated rather than tombstoned.
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
  - `expires_at`: DATETIME, NOT NULL (IST instant when the hold stops counting)
  - `created_at`: TIMESTAMP, NOT NULL, DEFAULT CURRENT_TIMESTAMP
- **Primary Key**: `id`
- **Foreign Keys**:
  - `fk_stock_holds_variant_size`: `product_variant_size_id` REFERENCES `product_variant_sizes(id)` ON DELETE RESTRICT ON UPDATE CASCADE
- **Unique Constraints**:
  - `uq_stock_holds_checkout_variant`: (`checkout_ref`, `product_variant_size_id`) — one hold row per variant per checkout attempt; adding to an existing hold updates its quantity and expiry.
- **Indexes**:
  - `idx_stock_holds_variant_expiry`: (`product_variant_size_id`, `expires_at`)
- **Enum Values**: None.
- **How availability is computed**: Available stock = `product_variant_sizes.quantity` − SUM of `stock_holds.quantity` where `product_variant_size_id` matches and `expires_at > NOW()`. This read happens inside a transaction that row-locks the `product_variant_sizes` row, so two concurrent checkouts cannot both see the same remaining units.
- **Expiry**: Expired holds (`expires_at <= NOW()`) are ignored by the availability query and physically removed by a cleanup job; no cancellation path is required for correctness.
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

All Part A conventions apply unchanged (InnoDB, `utf8mb4_unicode_ci`, `snake_case`, IST timestamps, paise integers, soft deletes only where ADMIN_SPEC asks for them). Additions:

- **Hashed secrets**: passwords are stored with `password_hash()` only; OTPs, device tokens, session tokens and password-reset tokens are stored as SHA-256 hex (`CHAR(64)`), never in clear text.
- **Sessions**: customers use PHP's built-in sessions only — there is no customer session table. The session cookie is `HttpOnly`, `Secure` and `SameSite=Lax`, and the session ID is regenerated on login. Admin sessions are different: `admin_sessions` is kept so a password change or reset can end every admin session at once and the timeout is enforced on the server.
- **Two login identifiers**: a customer can log in with email **or** phone using the same password, so both columns are unique and normalised before every write.
- **`settings` exception**: the key/value table uses `setting_key` (`VARCHAR(64)`) as its natural primary key instead of a surrogate `id`, because rows are referenced by key in code and never by a numeric ID.
- **Retention**: `activity_log` keeps 3 months and is trimmed by a scheduled job.

### Table Specifications

#### 16. `customers`
- **Purpose**: Storefront customer account. One row per customer; login accepts email **or** phone with the same password. Created on first order or first account creation. An account deletion request anonymises the row instead of deleting it (Design rule 14), so order snapshots keep pointing at a real customer ID.
- **Columns**:
  - `id`: BIGINT UNSIGNED, NOT NULL, AUTO_INCREMENT
  - `name`: VARCHAR(150), NOT NULL, no default
  - `email`: VARCHAR(255), NOT NULL, no default (stored trimmed and lowercase; on deletion set to `deleted-<id>@invalid`)
  - `phone`: VARCHAR(20), NOT NULL, no default (text, digits with country code; never numeric, so leading zeros and `+` survive; on deletion set to a placeholder that cannot be a real number)
  - `password_hash`: VARCHAR(255), NOT NULL, no default (hashed password only; on deletion replaced with a value no password can match)
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

#### 18. `customer_password_resets`
- **Purpose**: Backs forgot-password for customers. The customer enters their email, receives an emailed one-time link, and sets a new password with it. Only a hash of the token is stored, so a leaked database dump cannot be used to take over accounts.
- **Columns**:
  - `id`: BIGINT UNSIGNED, NOT NULL, AUTO_INCREMENT
  - `customer_id`: BIGINT UNSIGNED, NOT NULL, no default
  - `token_hash`: CHAR(64), NOT NULL, no default (SHA-256 hex; the token itself is never stored)
  - `expires_at`: DATETIME, NOT NULL, no default (IST expiry, 30 minutes after creation)
  - `used_at`: DATETIME, NULL, DEFAULT NULL (set on success; a used token never works again)
  - `created_at`: TIMESTAMP, NOT NULL, DEFAULT CURRENT_TIMESTAMP
- **Primary Key**: `id`
- **Foreign Keys**:
  - `fk_customer_password_resets_customer`: `customer_id` REFERENCES `customers(id)` ON DELETE CASCADE ON UPDATE CASCADE
- **Unique Constraints**: `uq_customer_password_resets_token` (`token_hash`).
- **Indexes**: `idx_customer_password_resets_customer_expiry` (`customer_id`, `expires_at`), `idx_customer_password_resets_expires_at` (`expires_at`).
- **Enum Values**: None.
- **Rules**: A reset read requires `expires_at > NOW() AND used_at IS NULL`; using a token sets `used_at` and, in the same transaction, replaces `password_hash` and invalidates any other outstanding reset rows for that customer. This table cannot sign the customer out elsewhere: customer sessions are PHP sessions, so any "sign out other devices" behaviour belongs to the session store, not to this schema.

#### 19. `admin_users`
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
- **Referenced by**: `stock_movements.user_id` (Part A, `ON DELETE RESTRICT`), plus `admin_trusted_devices`, `admin_otp_codes` and `admin_sessions` below. `login_attempts` deliberately has no foreign key.

#### 20. `admin_trusted_devices`
- **Purpose**: Devices that have already passed the new-device email OTP, so the owner is not challenged on every login. Only a hash of the device token is kept. Each trust expires after 30 days, and a password change or reset deletes all trusted devices and all admin sessions.
- **Columns**:
  - `id`: BIGINT UNSIGNED, NOT NULL, AUTO_INCREMENT
  - `admin_user_id`: BIGINT UNSIGNED, NOT NULL, no default
  - `token_hash`: CHAR(64), NOT NULL, no default (SHA-256 hex; the token itself is never stored)
  - `label`: VARCHAR(100), NULL, DEFAULT NULL (human label such as "Office laptop - Chrome")
  - `last_used_at`: DATETIME, NULL, DEFAULT NULL (IST instant of the last successful use)
  - `expires_at`: DATETIME, NOT NULL, no default (IST expiry, 30 days after creation; an expired device is challenged again)
  - `created_at`: TIMESTAMP, NOT NULL, DEFAULT CURRENT_TIMESTAMP
- **Primary Key**: `id`
- **Foreign Keys**:
  - `fk_admin_trusted_devices_admin`: `admin_user_id` REFERENCES `admin_users(id)` ON DELETE CASCADE ON UPDATE CASCADE
- **Unique Constraints**: `uq_admin_trusted_devices_token` (`token_hash`).
- **Indexes**: `idx_admin_trusted_devices_admin` (`admin_user_id`).
- **Enum Values**: None.
- **Expiry**: A trusted device is valid only while `expires_at > NOW()`; after 30 days the owner is challenged with a new-device OTP and the row is replaced. A password change or reset deletes every row for the account in the same transaction that deletes its `admin_sessions` rows — that delete-all is the revocation path; there is no per-device revoke screen in the ADMIN_SPEC scope.

#### 21. `admin_otp_codes`
- **Purpose**: One-time codes for the two ADMIN_SPEC flows: new-device verification and forgot-password. Codes are hashed, single-use and time-limited.
- **Columns**:
  - `id`: BIGINT UNSIGNED, NOT NULL, AUTO_INCREMENT
  - `admin_user_id`: BIGINT UNSIGNED, NOT NULL, no default
  - `code_hash`: CHAR(64), NOT NULL, no default (SHA-256 hex; the code is never stored)
  - `purpose`: ENUM('new_device', 'forgot_password'), NOT NULL, no default
  - `expires_at`: DATETIME, NOT NULL, no default (IST expiry)
  - `attempts`: TINYINT UNSIGNED, NOT NULL, DEFAULT 0 (failed verifications for this code)
  - `used_at`: DATETIME, NULL, DEFAULT NULL (set on success; a used code never verifies again)
  - `created_at`: TIMESTAMP, NOT NULL, DEFAULT CURRENT_TIMESTAMP
- **Primary Key**: `id`
- **Foreign Keys**:
  - `fk_admin_otp_codes_admin`: `admin_user_id` REFERENCES `admin_users(id)` ON DELETE CASCADE ON UPDATE CASCADE
- **Unique Constraints**: None (several codes per purpose may exist; the newest unexpired unused one wins).
- **Indexes**: `idx_admin_otp_codes_admin_purpose` (`admin_user_id`, `purpose`, `expires_at`), `idx_admin_otp_codes_expires_at` (`expires_at`).
- **Enum Values**: `purpose` = `new_device`, `forgot_password`.

#### 22. `login_attempts`
- **Purpose**: Raw record of every admin and customer login attempt, successful or not, used to enforce the failed-attempt lockout. `identifier` is stored as typed so attempts on non-existent emails or phones are also rate-limited. The table has no foreign key on purpose: an attempt row must survive account anonymisation, and it must be recordable when no account exists. `account_type` keeps the two policies separate, so an admin lockout can never be triggered by customer traffic and vice versa.
- **Columns**:
  - `id`: BIGINT UNSIGNED, NOT NULL, AUTO_INCREMENT
  - `account_type`: ENUM('admin', 'customer'), NOT NULL, no default
  - `identifier`: VARCHAR(255), NOT NULL, no default (email or phone as typed, even when no account exists)
  - `ip`: VARCHAR(45), NULL, DEFAULT NULL (IPv4 or IPv6 text)
  - `is_success`: TINYINT(1), NOT NULL, DEFAULT 0 (1 = success, 0 = failure)
  - `created_at`: TIMESTAMP, NOT NULL, DEFAULT CURRENT_TIMESTAMP
- **Primary Key**: `id`
- **Foreign Keys**: None, deliberately (see Purpose).
- **Unique Constraints**: None (one row per attempt).
- **Indexes**: `idx_login_attempts_account_identifier_time` (`account_type`, `identifier`, `created_at`), `idx_login_attempts_ip_time` (`ip`, `created_at`), `idx_login_attempts_created_at` (`created_at`).
- **Enum Values**: `account_type` = `admin`, `customer`.
- **Throttling limits** (code constants, not `settings` keys, so they cannot be changed from the admin panel and need no migration):

| Limit | Value | Counted by |
| --- | --- | --- |
| Failed logins per identifier | 5 in 15 minutes → that account is locked for 15 minutes | `account_type` + `identifier` + `created_at` |
| Failed logins per IP | 20 per hour → that IP is blocked | `ip` + `created_at` |
| OTP requests per account | 3 per hour | `account_type` + `identifier` + `created_at` |
| Password-reset requests per account | 3 per hour | `account_type` + `identifier` + `created_at` |

#### 23. `admin_sessions`
- **Purpose**: Server-side admin sessions with an explicit timeout, so a session can be expired or revoked from the database instead of only on the client. Kept (unlike customer sessions) because a password change or reset must end every admin session, and because the timeout is enforced on the server. Stores a hash of the session token plus the request context.
- **Columns**:
  - `id`: BIGINT UNSIGNED, NOT NULL, AUTO_INCREMENT
  - `admin_user_id`: BIGINT UNSIGNED, NOT NULL, no default
  - `session_token_hash`: CHAR(64), NOT NULL, no default (SHA-256 hex; the token itself is never stored)
  - `expires_at`: DATETIME, NOT NULL, no default (IST session timeout)
  - `ip`: VARCHAR(45), NULL, DEFAULT NULL
  - `user_agent`: VARCHAR(255), NULL, DEFAULT NULL
  - `created_at`: TIMESTAMP, NOT NULL, DEFAULT CURRENT_TIMESTAMP
- **Primary Key**: `id`
- **Foreign Keys**:
  - `fk_admin_sessions_admin`: `admin_user_id` REFERENCES `admin_users(id)` ON DELETE CASCADE ON UPDATE CASCADE
- **Unique Constraints**: `uq_admin_sessions_token` (`session_token_hash`).
- **Indexes**: `idx_admin_sessions_admin_expiry` (`admin_user_id`, `expires_at`), `idx_admin_sessions_expires_at` (`expires_at`).
- **Enum Values**: None.
- **Revocation**: A password change or password reset deletes all of the account's `admin_sessions` rows and all of its `admin_trusted_devices` rows in the same transaction, so the old password's sessions die immediately instead of waiting for `expires_at`.

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
| `return_address` | Address the customer posts a return or exchange parcel to, shown in the request-received email and the return instructions page | text (multi-line) |

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
- **Purpose**: Discount codes created and switched on/off in ADMIN_SPEC section 10. The redemption record that links a coupon to an order is added in Part B2; at launch `used_count` tracks redemptions. By default each customer may use a code once; `allow_repeat_use = 1` lifts that per-customer limit. Only one coupon code applies per order, so codes never stack.
- **Columns**:
  - `id`: BIGINT UNSIGNED, NOT NULL, AUTO_INCREMENT
  - `code`: VARCHAR(32), NOT NULL, no default (stored uppercase)
  - `type`: ENUM('percent', 'amount'), NOT NULL, no default (`amount` = fixed rupees off, stored in paise)
  - `value`: INT UNSIGNED, NOT NULL, no default (percent 1-100, or paise when `amount`)
  - `expires_at`: DATETIME, NULL, DEFAULT NULL (IST; NULL = no expiry)
  - `min_order_paise`: BIGINT UNSIGNED, NOT NULL, DEFAULT 0
  - `max_discount_paise`: BIGINT UNSIGNED, NULL, DEFAULT NULL (cap for percent coupons; NULL = no cap)
  - `usage_limit`: INT UNSIGNED, NULL, DEFAULT NULL (total allowed redemptions; NULL = unlimited)
  - `used_count`: INT UNSIGNED, NOT NULL, DEFAULT 0 (incremented only when an order is placed; decremented again when that order is cancelled, rejected or fully refunded)
  - `allow_repeat_use`: TINYINT(1), NOT NULL, DEFAULT 0 (0 = each customer may use the code once, 1 = repeat use allowed)
  - `is_active`: TINYINT(1), NOT NULL, DEFAULT 1 (on/off switch)
  - `created_at`: TIMESTAMP, NOT NULL, DEFAULT CURRENT_TIMESTAMP
  - `updated_at`: TIMESTAMP, NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
- **Primary Key**: `id`
- **Foreign Keys**: None in Part B1 (orders link through the redemption table in Part B2).
- **Unique Constraints**: `uq_coupons_code` (`code`) — case-insensitive because of the collation, which is what the owner expects.
- **Indexes**: `idx_coupons_is_active_expiry` (`is_active`, `expires_at`).
- **Enum Values**: `type` = `percent`, `amount`.
- **CHECK constraints**: `chk_coupons_value` (`value > 0`), `chk_coupons_percent_max` (`type <> 'percent' OR value <= 100`). Both are re-checked in the application because CHECK is ignored on MySQL 5.7.
- **Rules**: One code per order — a second code is rejected rather than combined. Coupon eligibility is checked against the Part B2 redemption table: if `allow_repeat_use = 0`, an existing redemption for the same customer rejects the code; if it is `1`, repeat use is allowed. `usage_limit` remains the global cap.

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
- **Retention**: 3 months, as required by ADMIN_SPEC. A daily cleanup job deletes rows with `created_at < NOW() - INTERVAL 3 MONTH`; nothing else ever deletes from this table.

### Design rules
1. **No payment credentials, ever**: UPI IDs, card numbers, CVVs and bank details are never stored in any table. Only Razorpay payment and refund IDs are kept (Part B2), as ADMIN_SPEC section 2 requires.
2. **No plain-text secrets**: Passwords exist only as `password_hash` output. OTP codes, device tokens, session tokens and password-reset tokens exist only as SHA-256 hashes and are compared by hashing the presented value. Secrets are never written to `activity_log` either.
3. **Login identifiers are unique and normalised**: Email is trimmed and lowercased, phone is reduced to digits plus country code before insert or lookup. Without this, the same person can create two accounts that the unique indexes cannot see as duplicates.
4. **One owner account**: `admin_users` is designed for exactly one row. There is no role column because ADMIN_SPEC grants the owner full access; adding staff later needs a role column and a new migration.
5. **One default address per customer**: At most one `customer_addresses` row per customer has `is_default = 1`; setting a new default clears the previous one in the same transaction. MySQL cannot express this as a partial unique index, so it is an app rule.
6. **One default courier**: At most one `couriers` row has `is_default = 1`, set in a single transaction that clears the old default. An inactive courier cannot be the default; if the default is deactivated, the owner must pick another before the next shipment.
7. **Coupon maths lives in one place**: `percent` applies to the order subtotal, is capped by `max_discount_paise` when set, and only applies once `min_order_paise` is met. `amount` is a flat paise deduction. Discount never exceeds the subtotal.
8. **Coupon usage is atomic**: Checkout increments `used_count` with a conditional update — `UPDATE coupons SET used_count = used_count + 1 WHERE id = ? AND is_active = 1 AND (usage_limit IS NULL OR used_count < usage_limit)` — and treats zero affected rows as "coupon no longer available". This is the guard against two orders using the last redemption at once. The reverse move is just as atomic: when an order is cancelled, rejected or fully refunded, `used_count` is decremented by one in the same transaction that changes the order status, driven by that order's redemption row (Part B2).
9. **Settings are read, not trusted blindly**: Values are text, cast per key by the application, and validated against the fixed key list. Money settings are integers in paise. A change applies on the next request; nothing is cached beyond the request that reads it.
10. **Sessions, OTPs, reset links and device trusts expire by time**: Every authentication read requires `expires_at > NOW()`; OTP and password-reset reads also require `used_at IS NULL`. Expired rows are removed by the same scheduled job that prunes stock holds; correctness never depends on the cleanup having run.
11. **Activity log is append-only**: The application only inserts. Rows are never updated and are deleted only by the 3-month retention job. Old and new values are JSON text snapshots, not foreign keys, so the entry still reads correctly after the record changes or is deleted.
12. **Hashed lookups use exact indexes**: `token_hash`, `code_hash` and `session_token_hash` are fixed-length `CHAR(64)` with unique or composite indexes so every verification is a single indexed lookup, not a scan.
13. **No public admin registration**: `admin_users` is never written from a public form. There is no signup, invite or self-service registration route; the first (and only) admin is created by a one-time setup script that is run manually and then removed or disabled. Password changes happen only inside an authenticated admin session or through the email OTP reset flow.
14. **Customer account deletion means anonymisation**: The `customers` row is kept, because orders point at it and keep their own snapshots. Deleting an account blanks `name`, sets `email` to `deleted-<id>@invalid`, sets `phone` to a placeholder that cannot be a real number, replaces `password_hash` with a value no password can match, sets `is_active = 0`, and deletes the customer's `customer_addresses` rows and outstanding `customer_password_resets` rows in the same transaction. Order rows and their address/price snapshots are untouched, so invoices and history still read correctly.

### Relationship Summary
This continues the Part A summary (items 1-11).

12. **Customers and Addresses**: `customers` `1 : N` `customer_addresses` with `ON DELETE CASCADE`; at most one address per customer is the default. Account deletion anonymises the customer row and deletes its addresses, so this cascade is only used by a hard delete that the application does not expose.
13. **Customer Password Resets**: `customers` `1 : N` `customer_password_resets` with `ON DELETE CASCADE`; only token hashes are stored, and used or expired rows are pruned. There is no customer session table: customer sessions are PHP sessions and never appear in the database.
14. **Admin Account**: `admin_users` `1 : N` `admin_trusted_devices`, `1 : N` `admin_otp_codes`, `1 : N` `admin_sessions`, all `ON DELETE CASCADE` (owner-only data has no meaning without the account). A password change or reset clears trusted devices and admin sessions together.
15. **Admin and Audit**: `admin_users` `1 : N` `stock_movements` (`ON DELETE RESTRICT`, Part A) and `1 : N` `activity_log` (`ON DELETE RESTRICT`); both logs outlive any account change and are never rewritten.
16. **Settings**: standalone key/value table with no foreign keys; read by the storefront, checkout and admin screens.
17. **Couriers**: standalone in Part B1; from Part B2 `couriers` `1 : N` `orders` (the default is pre-selected on the order form, and each order keeps the tracking ID and the template used).
18. **Coupons**: standalone in Part B1; from Part B2 a redemption table links `coupons` `N : M` `orders` and is the authoritative record of which order used which code. `coupons.used_count` is the fast counter for that table. The redemption table is also what enforces "once per customer unless `allow_repeat_use = 1`" and what releases a use when an order is cancelled, rejected or fully refunded.
19. **Login Attempts to Accounts**: `login_attempts` has no foreign key. `account_type` plus `identifier` is the link, and it is applied to the raw typed value, so failed attempts on unknown emails or phones are still counted and no account can be enumerated from the table. Attempt rows survive customer anonymisation and are removed only by the retention job.

### Questions
All six are now decided. The answers below are the design of record for Part B1; Part B2 builds against them.

1. **PHP sessions or these tables?** — **Decided: PHP sessions for customers, `admin_sessions` for admin.** `customer_sessions` is dropped from the schema. Customers use PHP's built-in sessions with an `HttpOnly`, `Secure`, `SameSite=Lax` cookie, and the session ID is regenerated on login to prevent fixation. `admin_sessions` is kept because an admin password change or reset must end every admin session at once, and because the admin timeout is enforced on the server rather than trusted to the browser.
2. **Customer password reset?** — **Decided: emailed one-time link.** `customer_password_resets` stores only the SHA-256 hash of the token. The link expires 30 minutes after it is created, `used_at` makes it single-use, and used or expired tokens never work. No customer OTP table is needed, and `admin_otp_codes` stays admin-only.
3. **Lockout numbers?** — **Decided: 5 failures per identifier in 15 minutes locks that account for 15 minutes; 20 failures per IP per hour blocks that IP; OTP and password-reset requests are limited to 3 per hour per account.** All four limits are code constants, not `settings` keys: they cannot be edited from the admin panel, and changing them is a code change, not a migration. `login_attempts` stores the raw rows the checks count, keyed by `account_type`, `identifier` and `ip`.
4. **Trusted device lifetime?** — **Decided: 30 days.** `admin_trusted_devices.expires_at` is `NOT NULL` and is set to `created_at + 30 days`; an expired device is challenged with a new-device OTP. A password change or reset deletes all trusted devices and all admin sessions for the account in one transaction. That delete-all is the revocation mechanism; a per-device revoke screen is not in the ADMIN_SPEC scope.
5. **Coupon eligibility?** — **Decided: once per customer by default, with `allow_repeat_use` as the opt-out, and one code per order.** `coupons.allow_repeat_use = 0` means a customer with an existing redemption for that coupon is rejected; `1` means repeat use is allowed, still subject to `usage_limit`. Codes never stack on one order. The per-customer check reads the redemption table added in Part B2, so `coupons` does not need a per-customer list.
6. **Cancelled orders and `used_count`?** — **Decided: the use is released.** A cancelled, rejected or fully refunded order gives its coupon use back: `used_count` is decremented by one in the same transaction that changes the order status, driven by that order's redemption row from Part B2. A partial refund keeps the redemption, because the customer still got the discount.

### Risks
- **CHECK is not enforced on MySQL 5.7**: `chk_coupons_value` and `chk_coupons_percent_max` (and the Part A checks) are silently ignored there. The application must validate coupon value and percent range regardless of the Hostinger database version.
- **Phone uniqueness depends on normalisation**: `+91 98765 43210`, `09876543210` and `9876543210` are three different strings. Without one canonical format before every write, duplicate accounts leak through the unique index.
- **Case- and accent-insensitive email matching**: `utf8mb4_unicode_ci` makes `A@x.com` and `a@x.com` the same account (intended), but it also treats some accented variants as equal. Emails are ASCII in practice, so this is acceptable, but it is a property of the collation, not of the code.
- **`used_count` can drift**: It is a counter, not a derived value. The increment and the release (on cancel, rejection or full refund) both go through explicit updates in the order transaction, and any path that reverses a redemption outside that flow must correct the counter. Part B2 should recompute it from the redemption table when in doubt, and a periodic check comparing the two is cheap insurance.
- **Activity log holds personal data**: Snapshots can contain customer names, phones and addresses. The 3-month retention is therefore a privacy control as well as a storage control, and the cleanup job must actually run.
- **Growth of auth tables**: `login_attempts`, `admin_otp_codes`, `admin_trusted_devices`, `admin_sessions` and `customer_password_resets` grow with every login, OTP and reset request. If the scheduled cleanup stops, the tables and their indexes grow without bound; monitor row counts and prune `login_attempts` oldest-first.
- **Per-IP lockout can catch innocents**: The 20-failures-per-hour rule blocks by IP, and many customers share one IP behind carrier NAT or an office router. The per-identifier limit is the primary control; the IP rule is a backstop, and the block must expire by itself (no manual unblock) so a shared address is never locked out permanently.
- **Customer sessions cannot be revoked from the database**: Because customer sessions are PHP sessions, there is no row to delete when a customer changes their password or asks to be signed out everywhere. A stolen customer cookie stays valid until the PHP session expires, unless the app stores a password fingerprint in the session and compares it on each request. This is an accepted launch trade-off; the admin side does not have it.
- **Anonymisation is irreversible**: Deleting a customer account destroys the name, email, phone and addresses permanently. There is no undo, so the confirmation step must be explicit, and the operation must run as one transaction with the address and reset-row deletes, or a half-anonymised row can keep working credentials.
- **The one-time admin setup script is a one-off secret**: If it is left on the server or left runnable after the first admin exists, it becomes a public registration hole. It must be run manually, refuse to run when `admin_users` is non-empty, and be deleted or disabled immediately afterwards.
- **Single admin account is a single point of failure**: No roles, no second admin, no recovery path except the email OTP flow. If the owner's mailbox is lost, access to the admin panel is lost with it.
- **Settings typos fail silently**: A misspelled key reads as "not set". The app must validate keys against the fixed list and fail loudly rather than falling back to a wrong default.
- **Cart data is client-side and untrusted**: Quantities and any stored price hint can be edited in the browser. This is safe only because checkout re-reads price and stock on the server; any code path that trusts a browser price is a discount bug.
- **Coupon extremes are owner-controlled**: A 100% coupon with no cap and no minimum, or a large `max_discount_paise`, is a one-click loss. Validation should warn, and the activity log records every coupon edit.
- **`free_shipping_threshold_paise = 0`**: The "disabled" meaning must be implemented the same way in cart, checkout and order totals, or the storefront and the server will disagree about shipping.

## Schema design draft - Part B2a: orders and payments

### Scope

This part adds the order, order-item, status-history, payment, webhook, refund and coupon-redemption tables, and converts the two loose Part A order links into real foreign keys. It is design only: no SQL is executed.

- **Cart is still not a table.** Orders are written only when the customer clicks Pay, from data the server has just re-read.
- **Orders are never hard-deleted.** There is no `deleted_at` on `orders` and every child table uses `ON DELETE RESTRICT`; status is the only lifecycle. (The single exception is `stock_holds`, which is disposable by design.)
- **Cancellations, returns and exchanges are Part B2b.** This part provides the status values, the refund rows and the two nullable request columns (`refunds.cancellation_request_id`, `refunds.return_request_id`); Part B2b defines the request tables and turns those columns into real foreign keys.
- **No payer details, ever.** No UPI IDs, card numbers, payment methods, bank references or raw webhook bodies are stored anywhere in this part.

### How checkout works (plain words)

1. The customer clicks **Pay**. The server re-reads every price and the live stock from the database (never from the browser), recomputes subtotal, coupon discount, shipping and total, and generates the order number.
2. The server then asks Razorpay for an order, using the generated order number as the receipt, and writes **one transaction**: the `orders` row with status `payment_pending`, one `order_items` row per line with all report snapshots, one `stock_holds` row per variant, the `coupon_redemptions` row plus the guarded `coupons.used_count` increment, and a `payments` row with status `created` and that `razorpay_order_id`. Availability is re-checked with the variant rows locked inside this transaction, and the hold expiry is now + `settings.payment_hold_minutes`, stored in `orders.hold_expires_at` and in each `stock_holds.expires_at`. No network call happens inside the transaction; if the write fails, the unused Razorpay order is harmless and the customer sees an error.
3. The browser opens the Razorpay payment screen with its timeout option set to `payment_hold_minutes * 60` seconds, so the screen closes when the hold ends. Nothing is deducted from physical stock yet. This only closes the screen: the server still enforces expiry because Razorpay orders do not expire by themselves. A payment completed exactly at the boundary follows the unfulfilled-payment path below. Behaviour with UPI apps on phones is to be verified in Milestone 8.
4. When Razorpay reports the payment, the server verifies the signature first, then loads the payment row by `razorpay_order_id` and acts only if the order is still `payment_pending` and its `hold_expires_at` is still in the future. In **one transaction** it sets the order to `new` and stamps `paid_at`, marks the payment `captured` with `captured_at`, runs the guarded stock decrement (`quantity >= ?`) for each line, writes one `stock_movements` row per line, and deletes the order's `stock_holds` rows. Then the "Order received" email to the customer and the new-order email to the owner go out.
5. If the guarded stock decrement fails (or the holds are gone), the server rolls back the decrement, sets the order to `cancelled` with `cancel_reason = 'stock_unavailable'`, keeps `paid_at` and the captured payment, creates an `unfulfilled_payment` refund (`status = 'pending'`, full amount including shipping) and queues a customer email with the `payment_unfulfilled` template (see Part B2b). If the hold has already expired, the cleanup job's `payment_expired` cancellation stands and the payment follows the same unfulfilled-payment path.

Because the order already exists before payment, a failed or abandoned payment leaves audit rows behind, and the same webhook arriving twice cannot create two sales: the status guard and the unique Razorpay IDs make the whole step idempotent.

### Hold expiry (plain words)

Holds are bookkeeping only; `product_variant_sizes.quantity` is untouched until payment is verified. A scheduled job (and the availability query itself) treats any hold with `expires_at <= NOW()` as gone. The cleanup job also reads `orders.hold_expires_at` (via `idx_orders_status_hold_expires_at`) to find pending orders whose window has ended, and payment verification reads the same column before accepting a capture.

When a pending order's holds have expired, the cleanup job marks the order `cancelled` with `cancel_reason = 'payment_expired'`, stamps `cancelled_at`, deletes its `stock_holds` rows, releases its coupon use, and closes the payment attempt (`status = 'failed'`, `failure_code = 'hold_expired'`). No email is sent to the customer for an abandoned payment.

**The Orders table hides these by default.** Its default predicate is:

```sql
status <> 'payment_pending'
AND (status <> 'cancelled' OR paid_at IS NOT NULL)
```

So pending checkouts and expired unpaid orders never clutter the list, while a real cancellation (money was taken) still shows. That includes the paid-but-stock-gone case (`cancel_reason = 'stock_unavailable'`), which has `paid_at` set and therefore stays visible. The admin can still find an expired order by searching its order number if support ever needs it.

### A payment that cannot be fulfilled (plain words)

Razorpay can confirm a payment after the 5-minute hold has already expired, or verification can succeed just as another checkout takes the last unit. In both cases the money is real, but the order cannot be fulfilled.

The server records the capture on the existing `payments` row (status back to `captured`, `razorpay_payment_id` filled, `captured_at` set) and stamps `orders.paid_at`. The order **stays or becomes cancelled** — it is not resurrected and stock is not re-held or taken. A payment that arrives after expiry keeps `cancel_reason = 'payment_expired'`; a payment verified while the order is still `payment_pending` but whose guarded stock decrement fails is set to `cancelled` with `cancel_reason = 'stock_unavailable'`. In both cases a `refunds` row is written with `kind = 'unfulfilled_payment'`, the full captured amount including shipping, `status = 'pending'`, and a customer email is queued with the `payment_unfulfilled` template (see Part B2b). That row appears in the admin's **Refund pending** list with the Razorpay payment ID, exactly like ADMIN_SPEC section 9 requires, and the owner refunds it manually.

If the customer still wants the goods they place a new order. Nothing links the two automatically.

### Reject (plain words)

Reject is the owner's "we cannot fulfil this" action. It is available once payment is verified (`new`), up to the moment of shipping. An unpaid `payment_pending` order has no money to refund and is cleared with `admin_cancel` instead (see Questions 6).

1. Status becomes `rejected`, `rejected_at` is stamped, and a `refunds` row of `kind = 'reject'` is created for the **full order total including shipping** with `status = 'pending'`. It appears in Refund pending immediately.
2. A **Restock** checkbox is shown, **unticked by default**. Ticking it returns each line's quantity to `product_variant_sizes.quantity` and writes a `stock_movements` row per line, in the same transaction.
3. A `order_status_history` row records `new -> rejected` with `undo_until = now + 10 minutes`. **The customer email is not sent yet.** A scheduled job sends the "unable to fulfil your order, refund coming, 5 to 7 working days" email once `undo_until` has passed and `undone_at` is still `NULL`.
4. **Undo within 10 minutes** restores the previous status, stamps `undone_at` on the reject history row (the row itself is kept), deletes the still-pending refund row (nothing was refunded in Razorpay yet), reverses the coupon release, and — if stock had been restocked — takes it back out again. The take-back is a guarded decrement; **if the units are no longer available the undo is refused** and the admin is told why, so the count can never go negative.
5. After 10 minutes the undo window is closed in the application. Refunds are manual and never automatic, so nothing is refunded before the window ends.

### Shipped and Delivered (plain words)

- **Shipped requires both a courier and a tracking ID.** The server refuses the transition if either is missing; the default courier is only a pre-selection, not a value. On success it copies `couriers.name` into `orders.courier_name`, stores `courier_id`, `tracking_id` and `shipped_at`, and sends the tracking email.
- **Delivered** requires an owner-entered delivered date. It is stored in `delivered_at` as `00:00:00` IST of that date (the storefront and admin only ever show a date), and the return window starts from it. `delivered_at` can never be earlier than `shipped_at`.

### Allowed status changes

| From | To | Trigger | Notes |
| --- | --- | --- | --- |
| — | `payment_pending` | Customer clicks Pay | Order + items + holds + coupon + payment row in one transaction |
| `payment_pending` | `new` | Server verifies payment | Stocks deducted, holds deleted, emails sent |
| `payment_pending` | `cancelled` | Hold expired / owner clears an unpaid attempt | `cancel_reason` = `payment_expired` or `admin_cancel`; no refund, no email |
| `payment_pending` | `cancelled` | Payment verified but the guarded stock decrement fails | `cancel_reason = 'stock_unavailable'`, `paid_at` set, `unfulfilled_payment` refund pending, customer email queued |
| `new` | `shipped` | Owner saves courier + tracking | Both mandatory |
| `new` | `rejected` | Owner rejects | Full refund incl. shipping, restock optional, 10-minute undo |
| `new` | `cancelled` | Accepted customer cancellation | `cancel_reason = 'customer_request'`; refund kind `cancellation` |
| `shipped` | `delivered` | Owner marks delivered + date | Date cannot precede `shipped_at`; starts return window |
| `shipped` | `cancelled` | Accepted customer cancellation before delivery | Refund kind `cancellation` |
| `rejected` | previous status | Undo within 10 minutes | Only reversal ever allowed; `undone_at` stamped on the history row |

Everything else is refused: no `new -> delivered`, no going back to `payment_pending`, no status change out of `delivered` (returns are B2b), and `rejected` / `cancelled` are terminal apart from the reject undo. `cancel_reason` must match the path: `payment_expired` only from `payment_pending`, `admin_cancel` only when `paid_at IS NULL`, `customer_request` only when `paid_at IS NOT NULL`, and `stock_unavailable` only from `payment_pending` when `paid_at IS NOT NULL` and an `unfulfilled_payment` refund is pending.

### Table Specifications

#### 28. `orders`

- **Purpose**: One row per checkout attempt and its full lifecycle. Created when the customer clicks Pay, before any money moves. Carries every snapshot the admin screens, invoices and support need, so later product or customer edits never rewrite history.
- **Columns**:
  - `id`: BIGINT UNSIGNED, NOT NULL, AUTO_INCREMENT
  - `order_number`: VARCHAR(16), NOT NULL, no default (public ID shown as `SRM-xxxxxx`; six random characters from the alphabet `23456789ABCDEFGHJKMNPQRSTUVWXYZ`, so it is not sequential and leaks no volume)
  - `customer_id`: BIGINT UNSIGNED, NOT NULL (account that placed the order; never changes)
  - `customer_name`: VARCHAR(150), NOT NULL (snapshot at checkout)
  - `customer_email`: VARCHAR(255), NOT NULL (snapshot at checkout)
  - `customer_phone`: VARCHAR(20), NOT NULL (snapshot at checkout)
  - `ship_recipient_name`: VARCHAR(150), NOT NULL
  - `ship_phone`: VARCHAR(20), NOT NULL
  - `ship_address_line1`: VARCHAR(255), NOT NULL
  - `ship_address_line2`: VARCHAR(255), NULL, DEFAULT NULL
  - `ship_city`: VARCHAR(100), NOT NULL
  - `ship_state`: VARCHAR(100), NOT NULL
  - `ship_pincode`: VARCHAR(10), NOT NULL (text, keeps leading zeros)
  - `subtotal_paise`: BIGINT UNSIGNED, NOT NULL (sum of `order_items.line_total_paise` before discount)
  - `discount_paise`: BIGINT UNSIGNED, NOT NULL, DEFAULT 0
  - `shipping_paise`: BIGINT UNSIGNED, NOT NULL, DEFAULT 0
  - `total_paise`: BIGINT UNSIGNED, NOT NULL (`subtotal - discount + shipping`)
  - `coupon_code`: VARCHAR(32), NULL, DEFAULT NULL (uppercase snapshot of `coupons.code`; NULL = no coupon)
  - `status`: ENUM, NOT NULL, DEFAULT `payment_pending`
  - `courier_id`: BIGINT UNSIGNED, NULL, DEFAULT NULL (set at ship time)
  - `courier_name`: VARCHAR(100), NULL, DEFAULT NULL (snapshot of `couriers.name` at ship time)
  - `tracking_id`: VARCHAR(100), NULL, DEFAULT NULL
  - `hold_expires_at`: DATETIME, NULL, DEFAULT NULL (IST instant when the payment hold ends; set at creation to now + `settings.payment_hold_minutes`. Payment verification and the cleanup job both read this column; `stock_holds.expires_at` remains the per-variant expiry.)
  - `paid_at`: DATETIME, NULL, DEFAULT NULL (IST capture instant)
  - `shipped_at`: DATETIME, NULL, DEFAULT NULL
  - `delivered_at`: DATETIME, NULL, DEFAULT NULL (owner-entered delivered date, stored at `00:00:00` IST)
  - `rejected_at`: DATETIME, NULL, DEFAULT NULL
  - `cancelled_at`: DATETIME, NULL, DEFAULT NULL
  - `cancel_reason`: ENUM, NULL, DEFAULT NULL (`NULL` unless the order is cancelled)
  - `created_at`: TIMESTAMP, NOT NULL, DEFAULT CURRENT_TIMESTAMP
  - `updated_at`: TIMESTAMP, NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
- **Primary Key**: `id`
- **Foreign Keys**:
  - `fk_orders_customer`: `customer_id` REFERENCES `customers(id)` ON DELETE RESTRICT ON UPDATE CASCADE (orders outlive account anonymisation)
  - `fk_orders_courier`: `courier_id` REFERENCES `couriers(id)` ON DELETE RESTRICT ON UPDATE CASCADE (a courier that has ever shipped cannot be deleted; deactivate it instead)
- **Unique Constraints**:
  - `uq_orders_order_number`: (`order_number`) — the public identifier used in emails, URLs and support.
- **Indexes**:
  - `idx_orders_status_created_at`: (`status`, `created_at`) — the default Orders list and the status filter.
  - `idx_orders_status_hold_expires_at`: (`status`, `hold_expires_at`) — payment verification and the hold-expiry cleanup job find due pending orders without scanning every order.
  - `idx_orders_created_at`: (`created_at`) — date-range filter and Sales report range.
  - `idx_orders_customer_phone`: (`customer_phone`) — search by phone (exact or prefix).
  - `idx_orders_customer_name`: (`customer_name`) — search by name (prefix).
  - `idx_orders_customer_id`: (`customer_id`, `created_at`) — one customer's order history, and the FK.
- **CHECK constraints**: `chk_orders_total` (`total_paise + discount_paise = subtotal_paise + shipping_paise`), `chk_orders_discount` (`discount_paise <= subtotal_paise`). Written as additions only, because subtraction on UNSIGNED columns raises errors on some configurations.
- **Enum Values**:
  - `status`: `payment_pending`, `new`, `shipped`, `delivered`, `rejected`, `cancelled` (displayed as Payment pending, New, Shipped, Delivered, Rejected, Cancelled).
  - `cancel_reason`: `payment_expired`, `customer_request`, `admin_cancel`, `stock_unavailable`.
- **Order number generation**: generate with a CSPRNG, attempt the insert, and retry on duplicate-key (a handful of retries is plenty at ~887 million combinations). It is never derived from `id` and never reused, including after cancellation. `utf8mb4_unicode_ci` makes lookups case-insensitive, so `srm-7k2q9m` finds `SRM-7K2Q9M`; always display and email the uppercase form.

#### 29. `order_items`

- **Purpose**: Immutable price and description snapshots, one row per line, written at order creation. This table is the whole Sales report: every field ADMIN_SPEC section 13 needs is copied here, so editing or deleting a product can never change an old order or a past report.
- **Columns**:
  - `id`: BIGINT UNSIGNED, NOT NULL, AUTO_INCREMENT
  - `order_id`: BIGINT UNSIGNED, NOT NULL
  - `product_id`: BIGINT UNSIGNED, NOT NULL
  - `product_variant_size_id`: BIGINT UNSIGNED, NOT NULL
  - `product_name`: VARCHAR(255), NOT NULL (snapshot)
  - `category_name`: VARCHAR(100), NOT NULL (snapshot of the parent category)
  - `sub_category_name`: VARCHAR(100), NULL, DEFAULT NULL (snapshot)
  - `description`: TEXT, NULL, DEFAULT NULL (snapshot at order time)
  - `size_name`: VARCHAR(32), NOT NULL (snapshot)
  - `set_type_name`: VARCHAR(100), NULL, DEFAULT NULL (snapshot)
  - `colour_name`: VARCHAR(64), NOT NULL (snapshot)
  - `fabric_name`: VARCHAR(100), NULL, DEFAULT NULL (snapshot)
  - `mrp_paise`: BIGINT UNSIGNED, NOT NULL (MRP at order time, report column Price)
  - `price_paise`: BIGINT UNSIGNED, NOT NULL (price charged per unit, report column Sale price)
  - `quantity`: INT UNSIGNED, NOT NULL
  - `line_total_paise`: BIGINT UNSIGNED, NOT NULL (`price_paise * quantity`)
  - `image_path`: VARCHAR(512), NULL, DEFAULT NULL (snapshot of the primary image path for that colour)
- **Primary Key**: `id`
- **Foreign Keys**:
  - `fk_order_items_order`: `order_id` REFERENCES `orders(id)` ON DELETE RESTRICT ON UPDATE CASCADE
  - `fk_order_items_product`: `product_id` REFERENCES `products(id)` ON DELETE RESTRICT ON UPDATE CASCADE
  - `fk_order_items_variant_size`: `product_variant_size_id` REFERENCES `product_variant_sizes(id)` ON DELETE RESTRICT ON UPDATE CASCADE
- **Unique Constraints**: None. Two lines for the same variant in one order are prevented by the cart merging them before checkout, not by the schema.
- **Indexes**: `idx_order_items_order_id` (`order_id`) — report join and order detail screen; `idx_order_items_product_id` (`product_id`) — per-product sales lookup and FK; `idx_order_items_variant_size_id` (`product_variant_size_id`) — FK and stock investigation.
- **CHECK constraints**: `chk_order_items_quantity` (`quantity > 0`), `chk_order_items_line_total` (`line_total_paise = price_paise * quantity`).
- **Enum Values**: None.
- **Snapshot note**: `product_id` and `product_variant_size_id` exist for traceability and stock movements only. Prices, names and report fields always come from the snapshot columns, never from a join.

#### 30. `order_status_history`

- **Purpose**: Append-only record of every status change, who made it, and the 10-minute undo window used by Reject. It is also the audit trail behind "who cancelled what and why".
- **Columns**:
  - `id`: BIGINT UNSIGNED, NOT NULL, AUTO_INCREMENT
  - `order_id`: BIGINT UNSIGNED, NOT NULL
  - `from_status`: ENUM, NULL, DEFAULT NULL (`NULL` only on the row created with the order)
  - `to_status`: ENUM, NOT NULL
  - `admin_user_id`: BIGINT UNSIGNED, NULL, DEFAULT NULL (`NULL` = system job, payment webhook, hold expiry, or a customer action)
  - `note`: VARCHAR(255), NULL, DEFAULT NULL (short human note; never a payment payload or personal data)
  - `undo_until`: DATETIME, NULL, DEFAULT NULL (set on a Reject: `created_at + 10 minutes`)
  - `undone_at`: DATETIME, NULL, DEFAULT NULL (stamped when the undo is used; the row is never deleted)
  - `created_at`: TIMESTAMP, NOT NULL, DEFAULT CURRENT_TIMESTAMP
- **Primary Key**: `id`
- **Foreign Keys**:
  - `fk_order_status_history_order`: `order_id` REFERENCES `orders(id)` ON DELETE RESTRICT ON UPDATE CASCADE
  - `fk_order_status_history_admin`: `admin_user_id` REFERENCES `admin_users(id)` ON DELETE RESTRICT ON UPDATE CASCADE
- **Unique Constraints**: None.
- **Indexes**: `idx_order_status_history_order_time` (`order_id`, `created_at`) — order timeline and "the latest undoable reject"; `idx_order_status_history_undo_until` (`undo_until`) — the delayed-email job scans only rows with a live window.
- **Enum Values**: `from_status` and `to_status` use the six `orders.status` values.
- **Undo lookup**: the undo action reads the most recent row for that order where `undone_at IS NULL AND undo_until > NOW()` and `to_status = 'rejected'`, then verifies it is still the newest row. A second reject, a shipment or a cancellation therefore cannot be undone by a stale window.

#### 31. `payments`

- **Purpose**: One row per Razorpay payment attempt, holding only the IDs and amounts needed to reconcile, refund and answer support. It never contains payer details.
- **Columns**:
  - `id`: BIGINT UNSIGNED, NOT NULL, AUTO_INCREMENT
  - `order_id`: BIGINT UNSIGNED, NOT NULL
  - `razorpay_order_id`: VARCHAR(64), NOT NULL (created server-side at Pay)
  - `razorpay_payment_id`: VARCHAR(64), NULL, DEFAULT NULL (filled when Razorpay confirms)
  - `amount_paise`: BIGINT UNSIGNED, NOT NULL (must equal `orders.total_paise`)
  - `status`: ENUM, NOT NULL, DEFAULT `created`
  - `failure_code`: VARCHAR(64), NULL, DEFAULT NULL (Razorpay's code, or `hold_expired` when the hold ran out and nothing was charged)
  - `created_at`: TIMESTAMP, NOT NULL, DEFAULT CURRENT_TIMESTAMP
  - `captured_at`: DATETIME, NULL, DEFAULT NULL
- **Primary Key**: `id`
- **Foreign Keys**:
  - `fk_payments_order`: `order_id` REFERENCES `orders(id)` ON DELETE RESTRICT ON UPDATE CASCADE
- **Unique Constraints**:
  - `uq_payments_razorpay_order`: (`razorpay_order_id`) — one local row per Razorpay order, so a webhook resolves to exactly one attempt.
  - `uq_payments_razorpay_payment`: (`razorpay_payment_id`) — duplicate capture webhooks cannot create a second row; MySQL allows several NULLs, so unpaid attempts still coexist.
- **Indexes**: `idx_payments_order_id` (`order_id`) — all attempts for an order; `idx_payments_status_created_at` (`status`, `created_at`) — reconciliation and stale-attempt checks.
- **Enum Values**: `status`: `created`, `captured`, `failed`.
- **One order, several attempts**: `order_id` is not unique. A failed attempt followed by a retry inside the hold window produces two rows with different `razorpay_order_id`s. The sale is always booked against the row that was captured.

#### 32. `payment_webhook_events`

- **Purpose**: Deduplication and diagnosis for Razorpay webhooks, without storing the payload. Razorpay retries deliveries, so the event ID is recorded first; a duplicate insert fails on the unique key and is acknowledged without reprocessing.
- **Columns**:
  - `id`: BIGINT UNSIGNED, NOT NULL, AUTO_INCREMENT
  - `razorpay_event_id`: VARCHAR(64), NOT NULL (unique per delivery, per Razorpay)
  - `event_type`: VARCHAR(64), NOT NULL (e.g. `payment.captured`, `payment.failed`, `refund.processed`)
  - `razorpay_payment_id`: VARCHAR(64), NULL, DEFAULT NULL (a loose link, not a foreign key, so events for unknown payments are still recorded)
  - `received_at`: TIMESTAMP, NOT NULL, DEFAULT CURRENT_TIMESTAMP
  - `processed_at`: DATETIME, NULL, DEFAULT NULL (NULL = not yet handled, including failed handling)
  - `outcome`: VARCHAR(32), NULL, DEFAULT NULL (free text: `applied`, `ignored`, `unmatched`, `failed`)
- **Primary Key**: `id`
- **Foreign Keys**: None. The payment ID is intentionally not a foreign key; the event must be storable even before the local payment row exists or after it was matched to a different attempt.
- **Unique Constraints**: `uq_payment_webhook_events_event` (`razorpay_event_id`) — the duplicate guard.
- **Indexes**: `idx_payment_webhook_events_payment` (`razorpay_payment_id`) — trace one payment; `idx_payment_webhook_events_pending` (`processed_at`, `received_at`) — the retry queue for unprocessed events; `idx_payment_webhook_events_received_at` (`received_at`) — retention pruning and monitoring.
- **Enum Values**: None (`outcome` is free text so new Razorpay event types need no migration).
- **Deliberately absent**: no request body, no headers, no signature, no payer details. UPI IDs appear inside webhook payloads, so the body is parsed in memory and never written.

#### 33. `refunds`

- **Purpose**: The **Refund pending** list and the permanent record of every refund the owner performs manually in the Razorpay dashboard. One row per refund event, whether it was caused by a reject, a cancellation, a return or an unfulfilled payment.
- **Columns**:
  - `id`: BIGINT UNSIGNED, NOT NULL, AUTO_INCREMENT
  - `order_id`: BIGINT UNSIGNED, NOT NULL
  - `payment_id`: BIGINT UNSIGNED, NOT NULL (which captured attempt is refunded)
  - `kind`: ENUM, NOT NULL
  - `amount_paise`: BIGINT UNSIGNED, NOT NULL
  - `includes_shipping`: TINYINT(1), NOT NULL, DEFAULT 0
  - `status`: ENUM, NOT NULL, DEFAULT `pending`
  - `razorpay_refund_id`: VARCHAR(64), NULL, DEFAULT NULL (pasted by the owner, optional)
  - `requested_at`: DATETIME, NOT NULL, DEFAULT CURRENT_TIMESTAMP
  - `done_at`: DATETIME, NULL, DEFAULT NULL
  - `done_by`: BIGINT UNSIGNED, NULL, DEFAULT NULL (admin who ticked Refund done)
  - `cancellation_request_id`: BIGINT UNSIGNED, NULL, DEFAULT NULL (the accepted cancellation that created this refund; NULL for other kinds)
  - `return_request_id`: BIGINT UNSIGNED, NULL, DEFAULT NULL (the accepted return that created this refund; NULL for other kinds)
- **Primary Key**: `id`
- **Foreign Keys**:
  - `fk_refunds_order`: `order_id` REFERENCES `orders(id)` ON DELETE RESTRICT ON UPDATE CASCADE
  - `fk_refunds_payment`: `payment_id` REFERENCES `payments(id)` ON DELETE RESTRICT ON UPDATE CASCADE
  - `fk_refunds_done_by`: `done_by` REFERENCES `admin_users(id)` ON DELETE RESTRICT ON UPDATE CASCADE
  - `fk_refunds_cancellation_request`: `cancellation_request_id` REFERENCES `cancellation_requests(id)` ON DELETE RESTRICT ON UPDATE CASCADE
  - `fk_refunds_return_request`: `return_request_id` REFERENCES `return_requests(id)` ON DELETE RESTRICT ON UPDATE CASCADE
- **Unique Constraints**: `uq_refunds_razorpay_refund` (`razorpay_refund_id`) — the same Razorpay refund cannot be recorded twice (several NULLs are allowed while pending).
- **Indexes**: `idx_refunds_status_requested` (`status`, `requested_at`) — the Refund pending list (`status = 'pending'`, oldest first); `idx_refunds_order_id` (`order_id`) — refunds on one order; `idx_refunds_payment_id` (`payment_id`) — refunds against one payment and FK; `idx_refunds_cancellation_request_id` (`cancellation_request_id`) and `idx_refunds_return_request_id` (`return_request_id`) — the request that caused the refund and its FK.
- **CHECK constraints**: `chk_refunds_done` (`(status = 'pending' AND done_at IS NULL) OR (status = 'done' AND done_at IS NOT NULL)`). `done_by` is app-required when `status = 'done'`.
- **Enum Values**:
  - `kind`: `reject`, `cancellation`, `return`, `unfulfilled_payment`.
  - `status`: `pending`, `done`.
- **Amounts**: `reject`, `cancellation` and `unfulfilled_payment` always store the full amount the customer paid with `includes_shipping = 1` (reject is explicitly "full, including shipping"). `unfulfilled_payment` covers both a payment captured after hold expiry and a payment verified when the guarded stock decrement fails. `return` amounts are the editable product price, with shipping included only when we sent a wrong or damaged item (`includes_shipping = 1`). Rows are never deleted once `done`; a pending row created by a reject is removed only if that reject is undone inside its window.

#### 34. `coupon_redemptions`

- **Purpose**: The authoritative record of which order used which coupon, at what discount. `coupons.used_count` is only a cached counter of the un-released rows here. The table also enforces one code per order and the per-customer repeat-use rule, and it is the row that drives releasing a use.
- **Columns**:
  - `id`: BIGINT UNSIGNED, NOT NULL, AUTO_INCREMENT
  - `coupon_id`: BIGINT UNSIGNED, NOT NULL
  - `order_id`: BIGINT UNSIGNED, NOT NULL
  - `customer_id`: BIGINT UNSIGNED, NOT NULL
  - `discount_paise`: BIGINT UNSIGNED, NOT NULL (what was actually taken off this order)
  - `released_at`: DATETIME, NULL, DEFAULT NULL (set when the order is rejected, cancelled or fully refunded)
  - `created_at`: TIMESTAMP, NOT NULL, DEFAULT CURRENT_TIMESTAMP
- **Primary Key**: `id`
- **Foreign Keys**:
  - `fk_coupon_redemptions_coupon`: `coupon_id` REFERENCES `coupons(id)` ON DELETE RESTRICT ON UPDATE CASCADE
  - `fk_coupon_redemptions_order`: `order_id` REFERENCES `orders(id)` ON DELETE RESTRICT ON UPDATE CASCADE
  - `fk_coupon_redemptions_customer`: `customer_id` REFERENCES `customers(id)` ON DELETE RESTRICT ON UPDATE CASCADE
- **Unique Constraints**: `uq_coupon_redemptions_order` (`order_id`) — at most one redemption per order, which is how "one code per order" is enforced.
- **Indexes**: `idx_coupon_redemptions_customer_coupon` (`customer_id`, `coupon_id`) — the "already used by this customer" check when `allow_repeat_use = 0`; `idx_coupon_redemptions_coupon_released` (`coupon_id`, `released_at`) — live redemptions per coupon and reconciliation against `used_count`.
- **Enum Values**: None.

### Changes to the Part A tables

#### `stock_holds` (revised)

`checkout_ref` is replaced by a real order link. The hold is written in the same transaction as the order, so the order exists first and is always known.

- **Columns now**: `id`; `order_id` BIGINT UNSIGNED NOT NULL (the order created when the customer clicked Pay); `product_variant_size_id`; `quantity`; `expires_at`; `created_at`.
- **FK added**: `fk_stock_holds_order`: `order_id` REFERENCES `orders(id)` ON DELETE CASCADE ON UPDATE CASCADE. Holds are the one disposable part of the order graph, so they are the one place a cascade is correct: deleting the order removes its reservations.
- **Unique constraint replaced**: `uq_stock_holds_order_variant` (`order_id`, `product_variant_size_id`) replaces `uq_stock_holds_checkout_variant`. Adding the same variant twice updates quantity and expiry instead of creating a second row.
- **Index additions**: `idx_stock_holds_expires_at` (`expires_at`) so the cleanup job can find expired holds without scanning by variant first.

Availability is unchanged: physical `quantity` minus the sum of unexpired holds.

#### `stock_movements` (revised)

`order_id` becomes a real foreign key instead of a loose column:

- **FK added**: `fk_stock_movements_order`: `order_id` REFERENCES `orders(id)` ON DELETE RESTRICT ON UPDATE CASCADE.
- The column stays `NULL` for movements that are not order-related (stock arrival, audit correction). Because orders are never deleted, `RESTRICT` costs nothing and guarantees a movement can never point at a vanished sale.
- The existing `idx_stock_movements_order_id` still serves "every movement for this order".

Both foreign keys are declared ahead of the `orders` table in `db/schema_draft.sql`; the draft runs with `FOREIGN_KEY_CHECKS = 0`, exactly as `stock_movements.user_id` already does for `admin_users`.

### Design rules

1. **The order number is random, not sequential**: `SRM-` plus six characters from `23456789ABCDEFGHJKMNPQRSTUVWXYZ` (31 symbols, about 887 million combinations, no lookalike 0/O/1/I/L). It is generated server-side, retried on duplicate key, never reused and never derived from `id`. Random avoids leaking daily order volume through the public site.
2. **The order is created at Pay, not at payment**: `orders`, `order_items`, `stock_holds`, `coupon_redemptions` and `payments` are written in one transaction before Razorpay opens. A failed payment therefore leaves a complete, auditable record instead of orphans, and stock is protected by time-limited holds rather than by a cart table.
3. **Money is frozen at creation**: `orders` and `order_items` money columns are integers in paise and are never recalculated. `total_paise = subtotal_paise - discount_paise + shipping_paise`, `line_total_paise = price_paise * quantity`, and `subtotal_paise` is the sum of the lines. Coupon edits, product price edits and shipping-setting edits never touch an existing order.
4. **Snapshots are never updated**: customer name/email/phone, address, product name, category, sub-category, description, size, set type, colour, fabric, MRP, price paid, image path, courier name and coupon code are copies. Reports and invoices read only these copies, so they stay correct after anonymisation, renaming, re-categorising or price changes.
5. **Orders are never hard-deleted**: there is no `deleted_at` and no delete route. Child tables use `ON DELETE RESTRICT` (except `stock_holds`, whose rows are disposable), so the history cannot be broken accidentally. Cancelled and rejected orders remain visible and searchable.
6. **`used_count` is driven by `coupon_redemptions`**: at order creation, increment with the guarded update from Part B1 — `UPDATE coupons SET used_count = used_count + 1 WHERE id = ? AND is_active = 1 AND (usage_limit IS NULL OR used_count < usage_limit)` — and treat zero affected rows as "coupon no longer available", aborting the checkout. When an order is rejected, cancelled or fully refunded, do it in the same transaction as the status change: first claim the release with `UPDATE coupon_redemptions SET released_at = NOW() WHERE order_id = ? AND released_at IS NULL`, and only if that affected one row decrement with `UPDATE coupons SET used_count = used_count - 1 WHERE id = ? AND used_count > 0`. Claiming before decrementing means a second cancel path cannot decrement twice. Undo of a reject reverses both (clear `released_at`, guarded increment); if the increment fails because the limit is now reached, the undo is refused and the transaction rolls back.
7. **Coupon use is released on full money-back only**: reject and cancellation always release; a delivered order releases when its refunds add up to the full order total (the return refund path is defined in B2b). A partial refund keeps the redemption, because the customer kept the discount on what they kept.
8. **Payment verification is server-side and idempotent**: verify the Razorpay signature before reading or writing anything, resolve the attempt by unique `razorpay_order_id`, and only act when the order is still `payment_pending`. The same webhook delivered twice changes nothing the second time, and the stock decrement, movement rows, hold deletion, payment update and status change are one transaction.
9. **No payer data is stored**: no UPI IDs, card numbers, CVVs, bank references, payment methods or raw webhook bodies. Only `razorpay_order_id`, `razorpay_payment_id`, `razorpay_refund_id`, `event_type`, amounts and outcome are kept. Webhook bodies routinely contain UPI IDs, so they are parsed in memory and discarded.
10. **Holds expire by time, not by a job**: availability ignores any hold with `expires_at <= NOW()` even if the cleanup job has not run. The job only tidies rows, closes abandoned orders and releases coupons; correctness never depends on its timing.
11. **Unfulfilled money is refunded, never resurrected**: a capture that arrives after expiry, or a payment verified when the guarded stock decrement fails, leaves the order `cancelled` (`cancel_reason = 'payment_expired'` or `'stock_unavailable'`), records `paid_at`, reopens the payment row to `captured`, and creates one `refunds` row of `kind = 'unfulfilled_payment'`, `status = 'pending'`, full amount including shipping. The order is never moved back to `new` and stock is never re-taken; the customer email is queued.
12. **Reject is reversible for exactly 10 minutes**: reject writes one history row with `undo_until = created_at + 10 minutes`, creates the full pending refund, optionally restocks, and suppresses the customer email. Undo restores the previous status, stamps `undone_at` (the history row is never deleted), deletes the still-pending refund, reverses the coupon release and takes back restocked units with a guarded decrement. If the refund was already marked done or the stock is gone, the undo is refused.
13. **Shipped requires courier and tracking**: `courier_id` and `tracking_id` are both `NOT NULL` for the transition (they stay nullable in the table because pending orders have neither). `shipped_at` is stamped on success and `couriers.name` is copied into `courier_name`. Delivered requires `delivered_at`, which cannot precede `shipped_at`.
14. **Status history is append-only**: every transition writes one row, including the creation row (`from_status IS NULL`), webhook-driven and job-driven changes (`admin_user_id IS NULL`) and undo. Rows are never edited or deleted; only `undone_at` is ever set on an existing row, once.
15. **Refunds are manual**: nothing in the application calls the Razorpay refund API. A refund exists as `pending` until the owner performs it in the dashboard and ticks Refund done, which stamps `done_at` and `done_by` and stores the optional `razorpay_refund_id`. The Refund pending list is exactly `status = 'pending'` ordered by `requested_at`.
16. **One order row per checkout**: the cart itself is not stored. Duplicate submissions of the same checkout are prevented by the browser disabling the Pay button plus the holds and coupon guards, not by a cart table.
17. **All times are IST**: every database connection runs `SET time_zone = '+05:30'` right after connecting, and PHP calls `date_default_timezone_set('Asia/Kolkata')`. DATETIME values are stored in IST; Razorpay epoch timestamps are converted to IST on write. Screens, emails, reports, the delivered date, the return window and holds are all IST. India has no daylight saving.
18. **Refunds never exceed the captured amount**: the application checks that the sum of `refunds.amount_paise` for an order never exceeds the captured `payments.amount_paise` before writing another refund. There is no database constraint across rows, so this check is mandatory on every reject, cancellation, return and unfulfilled-payment path.
19. **Payment amount matches the order at creation**: `payments.amount_paise` equals `orders.total_paise` when the payment row is created. This is an application check, repeated at verification; Razorpay's captured amount must match it before the capture is accepted.
20. **Inventory shows checkout traffic instead of refusing edits**: the Inventory screen shows a "Checkout in progress" badge with the product name and held units next to every product that has unexpired `stock_holds`, refreshed every 30 seconds. An admin stock edit below the held units shows a warning but is allowed, because holds are reservations, not physical stock.

### Relationship Summary

This continues items 1-19 of the Part A and Part B1 summaries.

20. **Customers and Orders**: `customers` `1 : N` `orders` with `ON DELETE RESTRICT`. The order keeps its own name, email and phone snapshots, so anonymising a customer never damages an invoice or a report.
21. **Orders and Items**: `orders` `1 : N` `order_items`, `ON DELETE RESTRICT`; each item also points at `products` and `product_variant_sizes` with `ON DELETE RESTRICT`. Snapshots in the item row are what reports read.
22. **Orders and Status History**: `orders` `1 : N` `order_status_history`, `ON DELETE RESTRICT`; `admin_users` `1 : N` the same table via `admin_user_id` (`NULL` for system or customer actions). This is where the 10-minute reject undo lives.
23. **Orders and Payments**: `orders` `1 : N` `payments` (retries are separate rows, one unique Razorpay order each), `ON DELETE RESTRICT`. Payment rows are financial evidence and are never deleted.
24. **Webhook Events**: `payment_webhook_events` is standalone, linked to `payments` only loosely by `razorpay_payment_id`. It exists for deduplication, retry and diagnosis, not for reporting.
25. **Orders, Payments and Refunds**: `orders` `1 : N` `refunds` and `payments` `1 : N` `refunds`, both `ON DELETE RESTRICT`; `admin_users` `1 : N` `refunds.done_by`. `refunds.cancellation_request_id` and `refunds.return_request_id` are nullable `ON DELETE RESTRICT` foreign keys to the request that caused the refund (wired in B2b).
26. **Coupons and Orders**: `coupons` `N : M` `orders` via `coupon_redemptions`, which is unique on `order_id` (one code per order) and also records `customer_id` for the repeat-use rule. `coupons.used_count` is the cached count of unreleased redemptions.
27. **Stock and Orders**: `orders` `1 : N` `stock_holds` with `ON DELETE CASCADE` (holds are disposable reservations) and `orders` `1 : N` `stock_movements` with `ON DELETE RESTRICT` (the immutable movement log now points at the sale that caused it). This supersedes item 10, which described holds as keyed by a checkout reference.

### Questions

1. **Delivered date: day or timestamp?** — **Decided: a date, stored as `00:00:00` IST in `orders.delivered_at`.** ADMIN_SPEC only asks the owner to "enter the delivered date", and the return window is counted in days, so storing a time would suggest a precision the UI never collects. `DATE(delivered_at)` is what the report and return window use.
2. **What happens after a failed payment inside the hold window?** — **Decided: a new `payments` row per attempt, same order.** The customer retries against a fresh Razorpay order; the previous attempt stays `failed` with its code. The order keeps `payment_pending` and the original hold until it is paid or expires.
3. **Does a late-paid, cancelled order show in the Orders table?** — **Decided: yes, as Cancelled.** `paid_at` is set because money actually arrived, and the default predicate is `status <> 'payment_pending' AND (status <> 'cancelled' OR paid_at IS NOT NULL)`. The refund is tracked in Refund pending, so hiding the order would hide the money.
4. **How is the delayed reject email made idempotent?** — **Decided: no `email_sent_at` column.** Delayed customer emails use a notification queue with a `send_after` time, designed in B2b. Reject queues the email for `undo_until` and Undo cancels it.
5. **Webhook event retention?** — **Decided: prune `payment_webhook_events` after 180 days.** That is long enough to investigate chargebacks, and `payments`/`refunds` are kept forever because they explain money.
6. **`admin_cancel` versus `rejected`?** — **Decided: `admin_cancel` is only for an unpaid order the owner clears (duplicate or stuck checkout); anything with money taken and goods not shipped is a Reject.** This keeps "refund required" and "no refund required" distinguishable from `orders` alone.

### Risks

- **Order number collisions**: random six-character IDs can collide, and the unique index will reject the insert. Checkout must retry a few times and fail with a clear message rather than showing a raw duplicate-key error. If the alphabet is ever shortened, recheck the collision maths.
- **`paid_at` is set in several different stories**: on normal verification, on a late payment, and on a paid-but-stock-gone order. Anything that treats `paid_at IS NOT NULL` as "this is a live sale" will be wrong for the last two; the status and `cancel_reason` are the truth, `paid_at` only records money movement.
- **Delayed email job is a single point of failure**: if it stops, customers never learn their order was rejected or that their payment could not be fulfilled even though the refund is pending. Alerts on the age of the oldest unsent queue item are needed, and the job must be restart-safe (see Questions 4). Undo must cancel the queued reject email, not just the refund row.
- **A guarded decrement can fail after the money is captured**: if another checkout takes the last unit between verification and the decrement, the sale cannot be booked. The order must still be cancelled as `stock_unavailable` with `paid_at` kept and an `unfulfilled_payment` refund created in the same handling path; forgetting either leaves money taken with no visible refund.
- **Undo racing a manual refund**: the owner could refund in Razorpay and mark it done inside the 10-minute window. The undo must refuse when the refund row is already `done`; otherwise the order returns to `new` while the money is gone.
- **Undo and restocked stock**: undo re-checks availability with a guarded decrement. If the units sold in between, the undo fails and the admin is stuck with a rejected order that still has stock returned. The message must offer the alternative (leave rejected, refund continues) instead of silently succeeding.
- **`used_count` drift**: the counter is now driven by two paths (claim/increment, release/decrement) and one reversal (undo). Any code path that changes `released_at` without touching `used_count`, or the reverse, breaks the guard. Recompute from `coupon_redemptions` when in doubt, as flagged in B1.
- **Coupon release on full return refunds depends on the B2b sum check**: a delivered order releases only when its refunds add up to the full order total. If the application forgets to run that check after a return refund, the redemption row stays live, which under-counts availability but never allows overuse.
- **Webhook ordering**: a capture can arrive before the local payment row is visible, or be retried after a partial failure. Events are therefore stored first with `processed_at IS NULL` and retried; an event with no matching payment gets `outcome = 'unmatched'` and must be investigated, not dropped.
- **`payments` rows are updated in place**: there is no history of status changes per row, only `created_at`, `captured_at` and `failure_code`. If reconciliation ever needs every intermediate state, `payment_webhook_events` is the only record — another reason to keep it long enough.
- **Reports depend on snapshots being written completely**: a missing `image_path` or `set_type_name` at checkout cannot be backfilled from the product later, because the product may have changed. The checkout write path must copy every report field in the same transaction.
- **`description` is copied per line**: a long description repeated across items grows the order tables. It is the price of a stable report; if size becomes a problem, truncate at write time, not at report time.
- **Case-insensitive order number lookups**: `utf8mb4_unicode_ci` means `SRM-7K2Q9M` and `srm-7k2q9m` are the same order. This is convenient for customers but means the displayed form is a formatting convention, not a separate identifier.
- **No delete path at all**: a genuinely bogus test order can only be cancelled, never removed, and its `payments`/`refunds` rows stay. Development and staging must not share a database with production, or test noise will live forever.

## Schema design draft - Part B2b: cancellations, returns, notifications

### Scope

Part B2a created orders, payments, refunds and the 10-minute Reject undo. This part adds the customer-facing request tables for cancellation, return and exchange, the managed return-reject reasons, and one durable notification queue/log. It also replaces the two loose refund pointers from B2a with real foreign keys and adds two request pointers to `stock_movements`.

It is design only: no SQL is executed.

- **A cancellation is a request, not an instant cancellation.** The order changes only when the owner accepts. A request may be accepted after the order has shipped, which changes the refund from "full including shipping" to "product price only".
- **One return or exchange per order.** The `order_id` unique key enforces it; the customer chooses one type per request, return or exchange, and which lines and quantities are coming back.
- **The return ladder follows the parcel, not the click.** The customer posts the parcel back at their own cost and the owner does nothing until it arrives. The request waits as **Awaiting parcel** (`requested`); Item received moves it to `received`, and only then can the owner accept or reject.
- **Refunds are still manual.** Accepting a cancellation or return creates a pending `refunds` row in the same transaction. The owner performs the refund in Razorpay and ticks Refund done, exactly as in B2a.
- **Exchanges move stock only when the replacement is actually shipped.** Saving the replacement courier and tracking is the moment the guarded decrement and `stock_movements` row happen.
- **Notifications are rows, not fire-and-forget calls.** The same table is the queue and the sent log, so delayed emails survive a restart and Undo can cancel a queued email.
- **The cart is still not stored.** Nothing in this part adds a cart, a customer session table or a payment method.

### Cancellations (plain words)

A customer can create a cancellation request while the order is `new`. Once the owner has marked the order `shipped`, the customer can no longer create a new request, but a request that already exists can still be accepted.

1. **Request.** The customer submits a reason-free request (the request itself is the signal). A `cancellation_requests` row is written with `status = 'requested'`, and an `owner_cancellation_request` email is queued to the owner. There is one request row per order: an existing row is reused if an earlier accept was undone. The order, stock and coupon are untouched.
2. **Accept, not shipped yet (no tracking ID).** The owner accepts. `decided_at` and `decided_by` are stamped, `undo_until = decided_at + 10 minutes`, the order becomes `cancelled` with `cancel_reason = 'customer_request'`, `cancelled_at` is set, the coupon use is released, and a pending `refunds` row is written with `kind = 'cancellation'`, `includes_shipping = 1`, and the **full order total including shipping**. A `cancellation_accepted` email is queued with `send_after = undo_until`.
3. **Accept, already shipped (tracking ID entered).** The owner enters the courier and tracking ID on the accept form (optional fields, but supplying them changes the money). The same accept transaction copies `courier_id`, `courier_name` and `tracking_id` onto the cancellation request, cancels the order the same way, and writes the pending refund with `includes_shipping = 0` and the **product price only**: `orders.total_paise - orders.shipping_paise`. The shipping fee stays with the owner. The delayed `cancellation_accepted` email can show the tracking number.
4. **Restock is a separate tick.** The Restock checkbox is unticked by default. Ticking it at accept, or later once the parcel is physically back, increments each affected `product_variant_sizes.quantity`, writes one `stock_movements` row per line with `cancellation_request_id` set, and stamps `restocked_at`. A second tick does nothing.
5. **Undo within 10 minutes.** The accept is reversed only while the refund is still `pending`: the order returns to its previous status (`new` or `shipped`), the request row goes back to `status = 'requested'` with `undone_at` stamped, the pending refund row is deleted, the coupon release is reversed, the queued customer email is cancelled with `cancelled_at`, and any restock is taken back out with a guarded decrement and a reversal movement. The same row can then be accepted again. If the refund is already `done`, the undo is refused.
6. **After 10 minutes** the undo window is closed in the application. The cancellation stands and Restock may still be ticked later.

### Returns (plain words)

A return is available only after the order is `delivered`, only inside the return window, and only for products with `return_eligible = 1`. The customer chooses Return or Exchange on the order, picks the lines and quantities (one request per order, one type per request), gives a reason and submits. The customer sends the parcel back at their own cost, and the owner decides only after it arrives; nothing is asked of the owner before that.

1. **Request.** The customer chooses `type = 'return'`, selects the `order_items` and quantities, gives a reason and an optional note, and may enter the courier and tracking ID of the parcel being sent back in `customer_return_courier` and `customer_return_tracking`. A `return_requests` row is written with `status = 'requested'`, shown to the admin as **Awaiting parcel**, and the selected lines go into `return_request_items`. Two emails are queued: `return_request_received` to the customer, immediately, confirming the request and showing the return address from `settings.return_address` with the packaging instructions; and `owner_return_request` to the owner, immediately. The order, stock and coupon are untouched.
2. **Item received.** When the parcel actually arrives, the owner ticks **Item received**: `received_at` is stamped and `status = 'received'`, and a `return_parcel_received` email is queued to the customer immediately. This tick can be undone only while no decision exists (`decided_at IS NULL`); undo returns the request to `requested` and clears `received_at`.
3. **Accept or Reject.** The decision is made on a received parcel. Either decision stamps `decided_at`, `decided_by` and `undo_until = decided_at + 10 minutes`, and queues the customer email (`return_accepted` or `return_rejected`) with `send_after = undo_until`.
4. **Reject.** `status = 'rejected'`, `reject_reason_id` comes from the managed `return_reject_reasons` list, and `reject_note` holds the note. Nothing is refunded, stock does not move, and the parcel stays with the owner: sending it back to the customer is arranged manually outside the app. Undo inside 10 minutes returns the request to `received`, stamps `undone_at`, and cancels the queued email.
5. **Accept.** `status = 'accepted'`. In the same transaction a pending `refunds` row is written with `kind = 'return'`, `return_request_id` set, and the current `refund_amount_paise`. The amount defaults to the selected lines' product value and is **editable by the owner before refunding**, so a coupon split can be handled by hand. Shipping is included only when the fault was ours (wrong or damaged item), which sets `refund_includes_shipping = 1`. The refund can never take the order's total refunds above the captured payment.
6. **Undo an accept.** Only while the refund is still `pending`: the request returns to `received`, `undone_at` is stamped, the pending refund row is deleted, and the queued customer email is cancelled. If the refund is already `done`, the undo is refused.
7. **Coupon release.** When the sum of that order's refunds reaches `orders.total_paise`, the coupon use is released. A partial return keeps the redemption, because the customer kept the discount on what they kept.
8. **Restock.** Ticking **Restock** increments the returned quantities, writes `stock_movements` rows with `return_request_id`, and stamps `restocked_at`. It is available only after Accept. Undo takes the units back out with a guarded decrement; if they have sold, the undo is refused.
9. **Completed.** When the owner ticks Refund done in the Refund pending list, the refund is finished and the application marks the request `completed`. Undo is no longer possible once the refund is done.

### Exchanges (plain words)

An exchange uses the same request, Item received and decision ladder, but `type = 'exchange'`, no refund row is created on accept, and every selected line names a **replacement variant**.

- The same customer flow applies: one request per order, the parcel is posted back at the customer's own cost, and the owner acts only after it arrives. Item received, then Accept or Reject, both reversible exactly as for a return.
- The replacement must be the **same product**, either a different size or colour, or the same variant when the item was damaged.
- On accept, `status = 'accepted'` and the delayed `return_accepted` email is queued. No stock moves and no refund is created.
- Until the replacement ships, the owner may change the replacement variant on the request; every change is recorded in the activity log.
- If the chosen replacement is unavailable when the owner is ready to ship, the owner either picks another variant or chooses **Refund instead**. That changes `type` to `return` and creates the pending `refunds` row for the product price in the same transaction, so the request then finishes through the return path.
- When the owner saves the replacement courier and tracking ID, the server runs the guarded stock decrement for each replacement line, writes a `stock_movements` row with `return_request_id`, copies `courier_name`, stores `courier_id`, `tracking_id` and `shipped_at`, and queues the `exchange_shipped` email to the customer immediately, which may show the tracking number. If the guarded decrement fails, the save is refused and the owner picks another variant or chooses Refund instead.
- The old item follows the same **Item received** and **Restock** ticks as a return: the old item's arrival is already recorded before the decision, and it can be restocked once the request is accepted.
- The exchange is `completed` when the replacement has shipped, that is when `shipped_at` is set.
- Any price difference is paid outside the app. `extra_payment_note` is the only record, for example "extra Rs 200 collected". No payment or refund row is created for the difference.

### Return window (plain words)

The window is the existing `settings.return_window_days` value, counted from `orders.delivered_at`.

- The last moment to request is **23:59:59 IST on the delivered date plus `return_window_days`**. For example, delivered on 1 November with a 7-day window means requests are accepted through the end of 8 November IST.
- The application refuses a request outside the window, even if the customer can still see the order.
- Orders inside the window are highlighted in the admin; orders outside it have the return option empty.
- One request per order, return or exchange, is enforced by `uq_return_requests_order`; once a request exists, the storefront disables the option for that order. The customer picks the type on the request, never both.
- The customer pays the return postage. The optional `customer_return_courier` and `customer_return_tracking` are the only record of that parcel until it reaches the owner.
- A product with `return_eligible = 0` cannot be selected, even inside the window.

### Reports (plain words)

**Sales report** (one row per product in an order) reads `order_items` joined to `orders`:

- Order ID: `orders.order_number`
- order date: `orders.created_at`
- product name, category, sub-category, description, size, set type, colour, fabric: the matching `order_items` snapshot columns
- sale price: `order_items.price_paise` (the price actually charged per unit)
- price: `order_items.mrp_paise` (the MRP at order time)
- place: `orders.ship_city` (`ship_state` is available if the owner needs it)
- delivered date: `orders.delivered_at`

**Returns report** reuses the same product snapshots through `return_request_items` → `order_items` → `orders`, and adds:

- return initiated date: `return_requests.requested_at`
- reason: `return_requests.reason`, with `return_reject_reasons.label` shown when rejected
- confirmed date: `return_requests.decided_at`

The report covers both return and exchange requests; `return_requests.type` and `status` are available as filters. Quantities come from `return_request_items.quantity`.

### Notifications (plain words)

`notifications` is the durable email queue and the sent log. OTP and password-reset emails are sent immediately and **never stored in this table**; they contain secrets and have no place in a 90-day log.

Emails are queued with `send_after` set to the intended sending time. The sending job picks rows where `sent_at IS NULL`, `cancelled_at IS NULL` and `send_after <= NOW()`, sends them, then sets `sent_at`. A failure increments `attempts` and stores `last_error` so the next run retries. Undo sets `cancelled_at` on the queued row, so a cancelled decision never reaches the customer.

| Template key | Recipient | Queued when | Delay |
| --- | --- | --- | --- |
| `order_received` | customer | Payment verified and order becomes `new` | immediate |
| `order_shipped` | customer | Owner ships, with tracking | immediate |
| `order_rejected` | customer | Owner rejects | `undo_until` |
| `cancellation_accepted` | customer | Owner accepts a cancellation | `undo_until` |
| `return_request_received` | customer | Customer submits a return or exchange; confirms the request, shows the return address from `settings.return_address` and the packing instructions | immediate |
| `return_parcel_received` | customer | Owner ticks Item received | immediate |
| `exchange_shipped` | customer | Owner saves the replacement courier and tracking for an exchange; may show the tracking number | immediate |
| `return_accepted` | customer | Owner accepts a return or exchange | `undo_until` |
| `return_rejected` | customer | Owner rejects a return or exchange | `undo_until` |
| `refund_done` | customer | Owner ticks Refund done | immediate |
| `payment_unfulfilled` | customer | B2a writes an `unfulfilled_payment` refund for a paid-but-cancelled order | immediate |
| `owner_new_order` | owner | Payment verified and order becomes `new` | immediate |
| `owner_cancellation_request` | owner | Customer creates a cancellation request | immediate |
| `owner_return_request` | owner | Customer creates a return or exchange request | immediate |

`template_key` is a `VARCHAR(40)`, not a database ENUM. The allowed list is exactly the fourteen keys in the table above and is validated in application code; an unknown key is a bug, not a new template. Adding a template means adding it to that list and its sender in the same release.

`channel` defaults to `email`. `whatsapp` is reserved for the later provider; nothing in this part sends it. `recipient_type` separates customer and owner rows. `order_id` is the order, while `related_type` and `related_id` point loosely at the cancellation or return request that caused the email.

The new setting `return_address` holds the store address the customer posts the parcel to. It is shown in `return_request_received` and on the return instructions page, so it is text the owner edits in Settings, not a code constant.

Sent and cancelled rows are pruned after 90 days; unsent rows are never removed by that cleanup. The payload is JSON text and may contain only non-sensitive template values, such as names, amounts, order number and dates. It must never contain UPI IDs, card data, passwords, OTPs or reset tokens.

### Table Specifications

#### 35. `cancellation_requests`

- **Purpose**: The order's one cancellation request and the owner's decision. It records whether tracking was supplied at accept, which changes the refund, and the independent Restock tick. An undone accept keeps the row and returns it to `requested`.
- **Columns**:
  - `id`: BIGINT UNSIGNED, NOT NULL, AUTO_INCREMENT
  - `order_id`: BIGINT UNSIGNED, NOT NULL
  - `status`: ENUM, NOT NULL, DEFAULT `requested` (an undone accept returns the row to `requested`)
  - `requested_at`: DATETIME, NOT NULL, DEFAULT CURRENT_TIMESTAMP
  - `decided_at`: DATETIME, NULL, DEFAULT NULL (set on accept)
  - `decided_by`: BIGINT UNSIGNED, NULL, DEFAULT NULL (admin who accepted; the owner)
  - `courier_id`: BIGINT UNSIGNED, NULL, DEFAULT NULL (entered at accept only when the order was already shipped)
  - `courier_name`: VARCHAR(100), NULL, DEFAULT NULL (snapshot of `couriers.name` at accept)
  - `tracking_id`: VARCHAR(100), NULL, DEFAULT NULL (entered at accept when already shipped)
  - `restocked_at`: DATETIME, NULL, DEFAULT NULL (Restock tick; may be set later than accept)
  - `undo_until`: DATETIME, NULL, DEFAULT NULL (`decided_at + 10 minutes`)
  - `undone_at`: DATETIME, NULL, DEFAULT NULL (stamped when the accept is undone; status returns to `requested` and the row is kept)
  - `created_at`: TIMESTAMP, NOT NULL, DEFAULT CURRENT_TIMESTAMP
  - `updated_at`: TIMESTAMP, NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
- **Primary Key**: `id`
- **Foreign Keys**:
  - `fk_cancellation_requests_order`: `order_id` REFERENCES `orders(id)` ON DELETE RESTRICT ON UPDATE CASCADE
  - `fk_cancellation_requests_decided_by`: `decided_by` REFERENCES `admin_users(id)` ON DELETE RESTRICT ON UPDATE CASCADE
  - `fk_cancellation_requests_courier`: `courier_id` REFERENCES `couriers(id)` ON DELETE RESTRICT ON UPDATE CASCADE
- **Unique Constraints**: `uq_cancellation_requests_order` (`order_id`) — one request per order. An undone accept keeps the same row at `requested`, so the customer does not create a second request; the owner accepts the same row again.
- **Indexes**: `idx_cancellation_requests_status_requested` (`status`, `requested_at`) — the Cancellations list; `idx_cancellation_requests_decided_by` and `idx_cancellation_requests_courier` — FK lookups; `idx_cancellation_requests_undo_until` (`undo_until`) — finding live undo windows.
- **Enum Values**: `status`: `requested`, `accepted`.
- **App checks**: `decided_at` and `decided_by` are set together; `courier_id`/`courier_name` and `tracking_id` are set together; `restocked_at` is only set after accept; the refund amount follows the tracking rule. Undo sets `status = 'requested'` and stamps `undone_at`; the same row can then be accepted again, with a new `decided_at`, `decided_by` and `undo_until`.

#### 36. `return_reject_reasons`

- **Purpose**: The managed dropdown used when the owner rejects a return or exchange. Hidden rows stay in history; rows are never deleted.
- **Columns**:
  - `id`: BIGINT UNSIGNED, NOT NULL, AUTO_INCREMENT
  - `label`: VARCHAR(150), NOT NULL
  - `is_active`: TINYINT(1), NOT NULL, DEFAULT 1 (`0` = hidden from the dropdown)
  - `display_order`: INT UNSIGNED, NOT NULL, DEFAULT 0
  - `created_at`: TIMESTAMP, NOT NULL, DEFAULT CURRENT_TIMESTAMP
  - `updated_at`: TIMESTAMP, NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
- **Primary Key**: `id`
- **Foreign Keys**: None.
- **Unique Constraints**: `uq_return_reject_reasons_label` (`label`) — no duplicate labels.
- **Indexes**: `idx_return_reject_reasons_active_order` (`is_active`, `display_order`) — the dropdown query.
- **Enum Values**: None.
- **Seed values**: Item used, washed or altered; Tags or original packaging missing; Product not eligible for return; Reason not covered by the return policy; Item received does not match the returned order; Other.

#### 37. `return_requests`

- **Purpose**: The order's one return or exchange request: the parcel ladder (`requested` → `received` → `accepted` or `rejected` → `completed`), the two reversible ticks, the optional customer return parcel, and the return refund or exchange replacement shipment fields.
- **Columns**:
  - `id`: BIGINT UNSIGNED, NOT NULL, AUTO_INCREMENT
  - `order_id`: BIGINT UNSIGNED, NOT NULL
  - `type`: ENUM, NOT NULL (`return` or `exchange`; one type per request)
  - `status`: ENUM, NOT NULL, DEFAULT `requested` (shown to the admin as **Awaiting parcel**)
  - `reason`: VARCHAR(255), NOT NULL (customer reason from the request form)
  - `note`: TEXT, NULL, DEFAULT NULL (optional customer note)
  - `requested_at`: DATETIME, NOT NULL, DEFAULT CURRENT_TIMESTAMP
  - `received_at`: DATETIME, NULL, DEFAULT NULL (Item received tick, stamped before the decision; undo allowed only while no decision exists)
  - `decided_at`: DATETIME, NULL, DEFAULT NULL (set on accept or reject; always after `received_at`)
  - `decided_by`: BIGINT UNSIGNED, NULL, DEFAULT NULL
  - `reject_reason_id`: BIGINT UNSIGNED, NULL, DEFAULT NULL (required when rejected; from the managed list)
  - `reject_note`: VARCHAR(255), NULL, DEFAULT NULL (free note when rejected; the parcel goes back to the customer manually, outside the app)
  - `undo_until`: DATETIME, NULL, DEFAULT NULL (`decided_at + 10 minutes`)
  - `undone_at`: DATETIME, NULL, DEFAULT NULL (stamped when the decision is undone; status returns to `received` and the row is kept)
  - `restocked_at`: DATETIME, NULL, DEFAULT NULL (Restock tick; only after accepted, reversible by a guarded decrement)
  - `refund_amount_paise`: BIGINT UNSIGNED, NULL, DEFAULT NULL (editable before refunding; NULL for exchanges)
  - `refund_includes_shipping`: TINYINT(1), NOT NULL, DEFAULT 0 (1 only when we sent a wrong or damaged item)
  - `customer_return_courier`: VARCHAR(100), NULL, DEFAULT NULL (optional: courier the customer used to send the parcel back)
  - `customer_return_tracking`: VARCHAR(100), NULL, DEFAULT NULL (optional: tracking ID of the parcel the customer sends back)
  - `courier_id`: BIGINT UNSIGNED, NULL, DEFAULT NULL (replacement courier for an exchange)
  - `courier_name`: VARCHAR(100), NULL, DEFAULT NULL (snapshot for an exchange)
  - `tracking_id`: VARCHAR(100), NULL, DEFAULT NULL (replacement tracking for an exchange)
  - `shipped_at`: DATETIME, NULL, DEFAULT NULL (replacement shipped at; exchange only; set means the exchange is completed)
  - `extra_payment_note`: VARCHAR(255), NULL, DEFAULT NULL (optional note such as "extra Rs collected")
  - `created_at`: TIMESTAMP, NOT NULL, DEFAULT CURRENT_TIMESTAMP
  - `updated_at`: TIMESTAMP, NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
- **Primary Key**: `id`
- **Foreign Keys**:
  - `fk_return_requests_order`: `order_id` REFERENCES `orders(id)` ON DELETE RESTRICT ON UPDATE CASCADE
  - `fk_return_requests_decided_by`: `decided_by` REFERENCES `admin_users(id)` ON DELETE RESTRICT ON UPDATE CASCADE
  - `fk_return_requests_reject_reason`: `reject_reason_id` REFERENCES `return_reject_reasons(id)` ON DELETE RESTRICT ON UPDATE CASCADE
  - `fk_return_requests_courier`: `courier_id` REFERENCES `couriers(id)` ON DELETE RESTRICT ON UPDATE CASCADE
- **Unique Constraints**: `uq_return_requests_order` (`order_id`) — one return or exchange request per order, forever.
- **Indexes**: `idx_return_requests_status_requested` (`status`, `requested_at`) — Returns list; `idx_return_requests_decided_by`, `idx_return_requests_reject_reason` and `idx_return_requests_courier` — FK lookups; `idx_return_requests_undo_until` (`undo_until`) — live undo windows.
- **Enum Values**:
  - `type`: `return`, `exchange`.
  - `status`: `requested`, `accepted`, `rejected`, `received`, `completed`. The ladder is `requested` → `received` → `accepted` or `rejected` → `completed`; `requested` is shown as **Awaiting parcel**.
- **App checks**: `received_at` is set by the Item received tick before any decision, and its undo is allowed only while `decided_at IS NULL`; `decided_at` and `decided_by` are set together and never before `received_at`; `reject_reason_id` is set only when rejected; `refund_amount_paise` is set only for returns; an exchange must have a replacement variant on every item; `restocked_at` is not set before `accepted`; undoing a decision returns `status` to `received` and stamps `undone_at`; `completed` is set by the application after the finishing condition (refund done for a return, `shipped_at` for an exchange).

#### 38. `return_request_items`

- **Purpose**: The selected lines of one return or exchange request, with the quantity coming back and the replacement variant for an exchange.
- **Columns**:
  - `id`: BIGINT UNSIGNED, NOT NULL, AUTO_INCREMENT
  - `return_request_id`: BIGINT UNSIGNED, NOT NULL
  - `order_item_id`: BIGINT UNSIGNED, NOT NULL
  - `quantity`: INT UNSIGNED, NOT NULL
  - `replacement_variant_size_id`: BIGINT UNSIGNED, NULL, DEFAULT NULL (exchange only; same product, different size/colour, or same variant if damaged)
  - `created_at`: TIMESTAMP, NOT NULL, DEFAULT CURRENT_TIMESTAMP
- **Primary Key**: `id`
- **Foreign Keys**:
  - `fk_return_request_items_request`: `return_request_id` REFERENCES `return_requests(id)` ON DELETE RESTRICT ON UPDATE CASCADE
  - `fk_return_request_items_order_item`: `order_item_id` REFERENCES `order_items(id)` ON DELETE RESTRICT ON UPDATE CASCADE
  - `fk_return_request_items_replacement`: `replacement_variant_size_id` REFERENCES `product_variant_sizes(id)` ON DELETE RESTRICT ON UPDATE CASCADE
- **Unique Constraints**: `uq_return_request_items_request_item` (`return_request_id`, `order_item_id`) — one row per selected order line.
- **Indexes**: `idx_return_request_items_order_item` (`order_item_id`) — an order line's return history and FK; `idx_return_request_items_replacement` (`replacement_variant_size_id`) — FK and replacement stock lookup.
- **CHECK constraints**: `chk_return_request_items_quantity` (`quantity > 0`).
- **Enum Values**: None.
- **App checks**: `quantity` must not exceed the matching `order_items.quantity`; for an exchange the replacement's `product_id` must equal the ordered product's `product_id`.

#### 39. `notifications`

- **Purpose**: The single durable queue and log for customer and owner emails: what to send, to whom, when, whether it was sent, and whether Undo cancelled it. OTP and password-reset emails are never stored here.
- **Columns**:
  - `id`: BIGINT UNSIGNED, NOT NULL, AUTO_INCREMENT
  - `channel`: ENUM, NOT NULL, DEFAULT `email`
  - `recipient_type`: ENUM, NOT NULL
  - `recipient_email`: VARCHAR(255), NOT NULL
  - `template_key`: VARCHAR(40), NOT NULL (validated in application code against the fixed fourteen-key list in the template table above; not a database ENUM)
  - `order_id`: BIGINT UNSIGNED, NULL, DEFAULT NULL
  - `related_type`: VARCHAR(32), NULL, DEFAULT NULL (for example `cancellation_request` or `return_request`)
  - `related_id`: BIGINT UNSIGNED, NULL, DEFAULT NULL (loose link; the type selects the table)
  - `payload`: TEXT, NULL, DEFAULT NULL (JSON of non-sensitive template values only)
  - `send_after`: DATETIME, NOT NULL, DEFAULT CURRENT_TIMESTAMP (delayed sends wait for this IST instant)
  - `sent_at`: DATETIME, NULL, DEFAULT NULL
  - `cancelled_at`: DATETIME, NULL, DEFAULT NULL (set by Undo; a cancelled row is never sent)
  - `attempts`: TINYINT UNSIGNED, NOT NULL, DEFAULT 0
  - `last_error`: VARCHAR(255), NULL, DEFAULT NULL
  - `created_at`: TIMESTAMP, NOT NULL, DEFAULT CURRENT_TIMESTAMP
  - `updated_at`: TIMESTAMP, NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
- **Primary Key**: `id`
- **Foreign Keys**:
  - `fk_notifications_order`: `order_id` REFERENCES `orders(id)` ON DELETE RESTRICT ON UPDATE CASCADE
- **Unique Constraints**: None. A repeated event is prevented by the order/request status guards, not by a unique email key.
- **Indexes**: `idx_notifications_send` (`sent_at`, `cancelled_at`, `send_after`) — the sending job; `idx_notifications_created_at` (`created_at`) — 90-day cleanup; `idx_notifications_order_id` (`order_id`) — one order's messages and FK; `idx_notifications_related` (`related_type`, `related_id`) — request-specific messages.
- **Enum Values**:
  - `channel`: `email`, `whatsapp`.
  - `recipient_type`: `customer`, `owner`.
  - `template_key`: none at database level; it is a `VARCHAR(40)` validated in application code against the fixed list: `order_received`, `order_shipped`, `order_rejected`, `cancellation_accepted`, `return_request_received`, `return_parcel_received`, `exchange_shipped`, `return_accepted`, `return_rejected`, `refund_done`, `payment_unfulfilled`, `owner_new_order`, `owner_cancellation_request`, `owner_return_request`.
- **Retention**: sent or cancelled rows older than 90 days are deleted by the cleanup job. Rows still waiting to send are never deleted by it.

### Changes to the earlier tables

#### `refunds` (B2a pointers become real)

`refunds.cancellation_request_id` and `refunds.return_request_id` stop being loose columns:

- **FKs added**: `fk_refunds_cancellation_request` and `fk_refunds_return_request`, both `ON DELETE RESTRICT ON UPDATE CASCADE`.
- **Indexes added**: `idx_refunds_cancellation_request_id` and `idx_refunds_return_request_id`.
- The columns stay `NULL` for rejects, unfulfilled payments and other refunds. A refund created by an accepted cancellation or return always points at its request, so the money and the request can never drift apart.

#### `stock_movements` (request traceability)

Two nullable request columns are added:

- `cancellation_request_id`: BIGINT UNSIGNED, NULL, DEFAULT NULL — a cancellation restock or its reversal.
- `return_request_id`: BIGINT UNSIGNED, NULL, DEFAULT NULL — a return restock or an exchange replacement movement.
- **FKs added**: `fk_stock_movements_cancellation_request` and `fk_stock_movements_return_request`, both `ON DELETE RESTRICT ON UPDATE CASCADE`.
- **Indexes added**: `idx_stock_movements_cancellation_request_id` and `idx_stock_movements_return_request_id`.
- Both stay `NULL` for ordinary sales, stock arrivals and audit corrections. The existing `order_id` stays for the sale that caused the movement.

These foreign keys are declared ahead of the B2b tables in `db/schema_draft.sql`; the draft runs with `FOREIGN_KEY_CHECKS = 0`, exactly as earlier parts do.

### Design rules

1. **Cancellation is a request, accepted by the owner, never automatic**: a customer request changes nothing until the owner accepts it, and there is exactly one request row per order (`uq_cancellation_requests_order`). The order can be accepted before shipping (full refund including shipping) or after shipping (product price only, with tracking entered at accept). Both paths set `cancelled`, `cancel_reason = 'customer_request'`, release the coupon and write one pending `cancellation` refund.
2. **Tracking decides the cancellation refund**: with no tracking ID, the refund is `orders.total_paise` and `includes_shipping = 1`; with a tracking ID, it is `orders.total_paise - orders.shipping_paise` and `includes_shipping = 0`. The order is cancelled either way.
3. **Cancellation undo is the same 10-minute contract as Reject**: `undo_until = decided_at + 10 minutes`; Undo is allowed only while the refund is pending. It restores the previous order status, sets the request back to `status = 'requested'`, stamps `undone_at`, deletes the refund row, reverses the coupon release, cancels the queued email and reverses any restock with a guarded decrement. The same row can then be accepted again. A done refund blocks Undo.
4. **Restock ticks are idempotent and traceable**: `restocked_at` is set once; a second tick does nothing. Every restock writes a `stock_movements` row with the matching `cancellation_request_id` or `return_request_id`. Undo writes a reversal movement and never deletes history. A cancellation restock may happen long after accept; it is independent of the 10-minute window.
5. **One return or exchange request per order, one type per request**: `return_requests.order_id` is unique, forever. The customer chooses return or exchange, then the lines and quantities; `quantity` never exceeds the ordered quantity, checked in the application. A product with `return_eligible = 0` cannot be selected, and an existing request disables the option on the storefront.
6. **The return ladder follows the parcel, not the click**: `requested` (shown as Awaiting parcel) → `received` → `accepted` or `rejected` → `completed`. The customer posts the parcel back at their own cost and the owner decides only after it arrives. Item received stamps `received_at` and can be undone only while no decision exists (`decided_at IS NULL`), returning the row to `requested`. A return is `completed` when its refund is marked done; an exchange is `completed` when the replacement's `shipped_at` is set.
7. **A return or exchange decision is reversible for 10 minutes**: accept and reject both stamp `decided_at`, `decided_by` and `undo_until = decided_at + 10 minutes`, and both queue the customer email for `undo_until`. Undo returns the request to `received` (never `requested`), stamps `undone_at`, deletes the still-pending return refund (accept only), and cancels the queued email. A done refund blocks Undo. Undoing the Item received tick is a separate action and only possible before any decision.
8. **Accepting a return creates the refund in the same transaction**: one pending `refunds` row with `kind = 'return'`, `return_request_id` set, and `refund_amount_paise` defaulting to the selected lines' product value. The amount is **editable by the owner before refunding**, so a coupon split can be handled by hand. `refund_includes_shipping = 1` only for a wrong or damaged item; otherwise the refund is product price only. Accepting an exchange creates no refund. Undoing an accept deletes the refund only while it is `pending`; a done refund refuses the undo.
9. **Coupon release on a return is driven by the full money-back test**: when an order's refunds add up to `orders.total_paise`, release the coupon use in the same transaction. Partial refunds keep the redemption. The B2a rule that refunds never exceed the captured amount still applies to every return refund.
10. **Restock is a post-accept reversible tick; exchange stock moves only on the shipment save**: Item received never moves stock. Restock is available only after `accepted`, increments the returned quantities, writes `stock_movements` rows with `return_request_id`, and stamps `restocked_at` once; its undo uses a guarded decrement and a reversal movement. For an exchange, the replacement is taken from stock with the guarded decrement and a movement only when the owner saves the replacement courier and tracking; the replacement must be the same product, in a different size or colour, or the same variant when damaged. Until that save the owner may change the replacement variant, recorded in `activity_log`, or choose **Refund instead**, which changes the type to `return` and creates the product-price refund in the same transaction. A failed guard refuses the save. Any price difference is paid outside the app and only `extra_payment_note` records it.
11. **Notifications are durable and idempotent at the row level**: one row per intended email, `send_after` for delays, `sent_at` for success, `cancelled_at` for Undo, `attempts` and `last_error` for retries. The sending job must claim a row before sending and mark it sent afterwards; Undo always cancels the queued row rather than editing the email. `template_key` is a `VARCHAR(40)` validated in application code against the fixed fourteen-key list, so a new template is a code change and a release, not a migration.
12. **OTP and password-reset email is never queued here**: those messages carry secrets and are sent immediately. `notifications` holds only order, cancellation, return, exchange and refund messages with non-sensitive payloads.
13. **Request rows are never hard-deleted**: `cancellation_requests`, `return_requests` and `return_request_items` are audit rows. Undo uses `undone_at`; it does not delete the request. All incoming foreign keys are `RESTRICT`.
14. **All B2b times are IST**: request windows, `decided_at`, `received_at`, `restocked_at`, `shipped_at` and `send_after` follow the same IST rule as the rest of the schema.

### Relationship Summary

This continues items 1-27 of the Part A, Part B1 and Part B2a summaries.

28. **Orders and Cancellation Requests**: `orders` `1 : 1` `cancellation_requests` (enforced by the unique `order_id`), `ON DELETE RESTRICT`. A request may be accepted after the order has shipped; the ordering row keeps the tracking and refund decision. Undo of an accept leaves the same row at `requested`, so the same row is accepted again rather than a second request being created.
29. **Orders and Return Requests**: `orders` `1 : 1` `return_requests` (enforced by the unique `order_id`), `ON DELETE RESTRICT`. One return or exchange per order, ever, and one type per request; the parcel ladder runs on that single row.
30. **Return Requests and Items**: `return_requests` `1 : N` `return_request_items`, `ON DELETE RESTRICT`; each item also points at one `order_items` row and, for an exchange, one replacement `product_variant_sizes` row.
31. **Reject Reasons and Returns**: `return_reject_reasons` `1 : N` `return_requests` via `reject_reason_id`, `ON DELETE RESTRICT`. Hidden reasons remain readable on old requests.
32. **Refunds and Requests**: `cancellation_requests` `1 : N` `refunds` and `return_requests` `1 : N` `refunds`, both `ON DELETE RESTRICT`. In practice an accepted return has at most one live refund row, because Undo deletes a still-pending refund; this replaces the loose B2a pointers.
33. **Stock Movements and Requests**: `cancellation_requests` `1 : N` `stock_movements` and `return_requests` `1 : N` `stock_movements`, both `ON DELETE RESTRICT`, so a restock or replacement always names its request.
34. **Notifications and Orders**: `orders` `1 : N` `notifications` via `order_id`, `ON DELETE RESTRICT`; `related_type`/`related_id` are a loose polymorphic link to the cancellation or return request.
35. **Settings and the Return Window**: `settings.return_window_days` supplies the window length; the window itself is computed from `orders.delivered_at`, so no extra table is needed.

### Questions

1. **Can the owner decline a cancellation request?** — **Decided: no separate decline state.** `cancellation_requests.status` is only `requested` or `accepted`; a request is accepted (possibly after shipping, with tracking) or left pending. If declining becomes a real need, add a `rejected` status and a reason column in a later part.
2. **When is an exchange `completed`?** — **Decided: when the replacement has shipped**, that is `shipped_at IS NOT NULL`. The old item's arrival is already recorded by Item received before the decision, so no second condition is needed. A return is `completed` when its refund is marked done.
3. **Is the return-window boundary inclusive?** — **Decided: yes, through 23:59:59 IST on `delivered_at` date + `return_window_days`.** A request created after that instant is refused. The boundary is evaluated in IST, like every other time in the schema.
4. **How is the default return refund split when a coupon was used?** — **Open, recommendation: pre-fill the selected lines' paid value and let the owner edit it before refunding.** The order-level discount cannot be split perfectly per line, so the application should suggest a proportional share, show the captured total, and enforce the B2a cap. The owner's edited amount is what is stored.
5. **What recipient field does WhatsApp use?** — **Open, recommendation: keep `channel = 'email'` until the provider is chosen.** The table stores `recipient_email` only; a WhatsApp implementation will need a recipient phone or provider address, added when that feature leaves scope B.
6. **Can a customer create more than one cancellation request?** — **Decided: no. One request per order**, enforced by the unique `cancellation_requests.order_id`. Undoing an accept sets the same row back to `requested` and stamps `undone_at`, and the owner accepts that same row again instead of a new one being created.

### Risks

- **Cancellation or return Undo racing a manual refund**: the owner could refund in Razorpay and tick Refund done inside the 10-minute window. Undo must refuse when the refund row is already `done`; otherwise the request is reversed while the money is gone.
- **Item received can be ticked before the parcel is really back**: the decision is then made on a parcel that is still in transit. Undo of the tick is allowed only while no decision exists, so the owner must be sure before deciding; after a decision, the only reversal is Undo of the decision.
- **Rejecting a received parcel leaves a manual send-back**: nothing is refunded, no stock moves, and the item sits with the owner. The app records only `reject_note`, so the cost, courier and proof of sending it back to the customer are outside the system. The owner must keep that record elsewhere.
- **Exchange replacement can sell out before shipping**: the chosen variant may be gone by the time the owner ships. Changing the variant is allowed until `shipped_at` and is recorded in `activity_log`, and "Refund instead" turns the request into a return with a product-price refund; both must be refused once the replacement has shipped.
- **`template_key` is free text at the database level**: an invalid key is no longer rejected by an ENUM. The application must validate it against the fixed fourteen-key list on every insert, and the sending job must refuse an unknown key, otherwise a typo silently becomes an unsendable row.
- **Notification delivery is at-least-once**: a crash after the provider accepts an email but before `sent_at` is written causes a retry and a duplicate email. `attempts` and `last_error` make this visible, but there is no provider message ID yet. The job must be restart-safe and must not send a row whose `cancelled_at` is set.
- **Delayed emails depend on the queue**: if the job stops, rejected, cancellation and return emails never arrive even though the refund is pending. Alert on the age of the oldest due unsent row, not just on job liveness.
- **One request per order is a hard stop**: a customer who submits a return for one line cannot add another line later without the owner intervening. The storefront must make the type and the selection clear before submitting, because the unique key will reject a second request.
- **Restock and exchange stock can be double-counted**: ticking Restock and later undoing it, or saving an exchange replacement twice, must use the guarded decrement and set the timestamp once. Without that, quantity drifts and the movement log disagrees with the variant row.
- **Exchange price differences live outside the app**: `extra_payment_note` records "extra Rs collected", but there is no payment row, no reconciliation and no automatic check that the money was collected. The owner must treat it as a manual note.
- **A cancellation accepted after shipping may have incomplete tracking**: the courier and tracking fields are optional on accept, so the "already shipped" variant can still refund product price only without giving the customer a tracking number. The form should require both when the product-price-only path is chosen.
- **Return-window boundaries are time-sensitive**: a request at 23:59:59 IST on the last day is valid, one second later is not. Store `delivered_at` as the IST date at `00:00:00` and compare against the end of the computed day, not a UTC timestamp.
- **Refund totals can still be entered wrongly**: `refund_amount_paise` is editable, so the B2a cap check (sum of refunds never above the captured amount) must run on every edit and every new refund row, not only on the first accept.
- **`related_id` is polymorphic**: it cannot be a foreign key. The application must delete or ignore nothing here because requests are never deleted, but a bad `related_type` would make the link meaningless; validate it against the fixed set.
- **Notification payload privacy**: the JSON payload is convenient and easy to overfill. It must be built from a fixed template allow-list, never by dumping an order, customer or webhook object.
- **WhatsApp is only a schema value**: the channel exists but has no recipient phone column or provider integration. Enabling it without a migration would send nothing or send to an email field, so it must stay unused until the provider decision.

