-- =============================================================================
-- Sarmelle Database Schema Draft
-- Part A: Catalogue and Stock
-- Part B1: Customers, Admin, Settings, Coupons
-- Part B2a: Orders and Payments
-- Part B2b: Cancellations, Returns, Notifications
-- Target Engine: MySQL 8.0+ / MariaDB 10.5+
-- Storage Engine: InnoDB
-- Character Set: utf8mb4
-- Collation: utf8mb4_unicode_ci
-- Note: Draft DDL only; never executed in this phase.
-- Time rule: all times are IST (Asia/Kolkata, +05:30), not UTC. DATETIME values are stored in IST.
-- =============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- -----------------------------------------------------------------------------
-- 1. categories (with sub-categories)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `categories` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `parent_id` BIGINT UNSIGNED NULL COMMENT 'Self-reference for sub-categories',
    `name` VARCHAR(100) NOT NULL,
    `slug` VARCHAR(120) NOT NULL,
    `description` TEXT NULL,
    `is_hidden` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '0 = visible, 1 = hidden',
    `display_order` INT UNSIGNED NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` TIMESTAMP NULL DEFAULT NULL,
    UNIQUE KEY `uq_categories_slug` (`slug`),
    INDEX `idx_categories_parent_id` (`parent_id`),
    INDEX `idx_categories_is_hidden` (`is_hidden`),
    CONSTRAINT `fk_categories_parent` FOREIGN KEY (`parent_id`) REFERENCES `categories` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 2. collections
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `collections` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(150) NOT NULL,
    `slug` VARCHAR(160) NOT NULL,
    `description` TEXT NULL,
    `is_hidden` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '0 = visible, 1 = hidden',
    `display_order` INT UNSIGNED NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` TIMESTAMP NULL DEFAULT NULL,
    UNIQUE KEY `uq_collections_slug` (`slug`),
    INDEX `idx_collections_is_hidden` (`is_hidden`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 3. Managed lists for fabric, occasion, fit, sleeve, neck and set type
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `fabrics` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL,
    `slug` VARCHAR(120) NOT NULL,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `display_order` INT UNSIGNED NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `uq_fabrics_slug` (`slug`),
    INDEX `idx_fabrics_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `occasions` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL,
    `slug` VARCHAR(120) NOT NULL,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `display_order` INT UNSIGNED NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `uq_occasions_slug` (`slug`),
    INDEX `idx_occasions_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `fits` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL,
    `slug` VARCHAR(120) NOT NULL,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `display_order` INT UNSIGNED NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `uq_fits_slug` (`slug`),
    INDEX `idx_fits_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `sleeve_types` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL,
    `slug` VARCHAR(120) NOT NULL,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `display_order` INT UNSIGNED NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `uq_sleeve_types_slug` (`slug`),
    INDEX `idx_sleeve_types_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `neck_types` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL,
    `slug` VARCHAR(120) NOT NULL,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `display_order` INT UNSIGNED NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `uq_neck_types_slug` (`slug`),
    INDEX `idx_neck_types_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `set_types` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL,
    `slug` VARCHAR(120) NOT NULL,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `display_order` INT UNSIGNED NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `uq_set_types_slug` (`slug`),
    INDEX `idx_set_types_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 4. size_charts, size_chart_rows, size_chart_columns, size_chart_cells
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `size_charts` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL,
    `unit` ENUM('in', 'cm') NOT NULL DEFAULT 'in',
    `description` TEXT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `uq_size_charts_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `size_chart_rows` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `size_chart_id` BIGINT UNSIGNED NOT NULL,
    `size_name` VARCHAR(32) NOT NULL,
    `display_order` INT UNSIGNED NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `uq_size_chart_rows_chart_size` (`size_chart_id`, `size_name`),
    INDEX `idx_size_chart_rows_order` (`size_chart_id`, `display_order`),
    CONSTRAINT `fk_size_chart_rows_chart` FOREIGN KEY (`size_chart_id`) REFERENCES `size_charts` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `size_chart_columns` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `size_chart_id` BIGINT UNSIGNED NOT NULL,
    `label` VARCHAR(50) NOT NULL COMMENT 'e.g. Bust, Shoulder, Sleeve length',
    `display_order` INT UNSIGNED NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `uq_size_chart_columns_chart_label` (`size_chart_id`, `label`),
    INDEX `idx_size_chart_columns_order` (`size_chart_id`, `display_order`),
    CONSTRAINT `fk_size_chart_columns_chart` FOREIGN KEY (`size_chart_id`) REFERENCES `size_charts` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `size_chart_cells` (
    `size_chart_row_id` BIGINT UNSIGNED NOT NULL,
    `size_chart_column_id` BIGINT UNSIGNED NOT NULL,
    `value` VARCHAR(32) NULL DEFAULT NULL COMMENT 'Text so ranges like 36-38 are valid',
    PRIMARY KEY (`size_chart_row_id`, `size_chart_column_id`),
    INDEX `idx_size_chart_cells_column` (`size_chart_column_id`),
    CONSTRAINT `fk_size_chart_cells_row` FOREIGN KEY (`size_chart_row_id`) REFERENCES `size_chart_rows` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_size_chart_cells_column` FOREIGN KEY (`size_chart_column_id`) REFERENCES `size_chart_columns` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 5. products
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `products` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `category_id` BIGINT UNSIGNED NOT NULL,
    `sub_category_id` BIGINT UNSIGNED NULL,
    `set_type_id` BIGINT UNSIGNED NULL,
    `fabric_id` BIGINT UNSIGNED NULL,
    `occasion_id` BIGINT UNSIGNED NULL,
    `fit_id` BIGINT UNSIGNED NULL,
    `sleeve_type_id` BIGINT UNSIGNED NULL,
    `neck_type_id` BIGINT UNSIGNED NULL,
    `length` DECIMAL(6, 2) NULL,
    `length_unit` ENUM('in', 'cm', 'm') NULL,
    `weight_grams` INT UNSIGNED NULL,
    `mrp_paise` BIGINT UNSIGNED NOT NULL COMMENT 'MRP stored in paise (e.g. 299900 = Rs 2999.00)',
    `sale_price_paise` BIGINT UNSIGNED NOT NULL COMMENT 'Sale price stored in paise',
    `return_eligible` TINYINT(1) NOT NULL DEFAULT 1,
    `size_chart_id` BIGINT UNSIGNED NULL,
    `is_manual_out_of_stock` TINYINT(1) NOT NULL DEFAULT 0,
    `status` ENUM('Draft', 'Published', 'Unpublished', 'Archived', 'Deleted') NOT NULL DEFAULT 'Draft',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` TIMESTAMP NULL DEFAULT NULL,
    UNIQUE KEY `uq_products_slug` (`slug`),
    INDEX `idx_products_category_id` (`category_id`),
    INDEX `idx_products_sub_category_id` (`sub_category_id`),
    INDEX `idx_products_status` (`status`),
    INDEX `idx_products_size_chart_id` (`size_chart_id`),
    INDEX `idx_products_fabric_id` (`fabric_id`),
    INDEX `idx_products_occasion_id` (`occasion_id`),
    INDEX `idx_products_fit_id` (`fit_id`),
    INDEX `idx_products_sleeve_type_id` (`sleeve_type_id`),
    INDEX `idx_products_neck_type_id` (`neck_type_id`),
    INDEX `idx_products_set_type_id` (`set_type_id`),
    INDEX `idx_products_created_at` (`created_at`),
    INDEX `idx_products_sale_price_paise` (`sale_price_paise`),
    CONSTRAINT `chk_products_sale_price` CHECK (`sale_price_paise` <= `mrp_paise`),
    CONSTRAINT `fk_products_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `fk_products_sub_category` FOREIGN KEY (`sub_category_id`) REFERENCES `categories` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `fk_products_size_chart` FOREIGN KEY (`size_chart_id`) REFERENCES `size_charts` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `fk_products_set_type` FOREIGN KEY (`set_type_id`) REFERENCES `set_types` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `fk_products_fabric` FOREIGN KEY (`fabric_id`) REFERENCES `fabrics` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `fk_products_occasion` FOREIGN KEY (`occasion_id`) REFERENCES `occasions` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `fk_products_fit` FOREIGN KEY (`fit_id`) REFERENCES `fits` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `fk_products_sleeve_type` FOREIGN KEY (`sleeve_type_id`) REFERENCES `sleeve_types` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `fk_products_neck_type` FOREIGN KEY (`neck_type_id`) REFERENCES `neck_types` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 2b. product_collections (product-collection link)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `product_collections` (
    `product_id` BIGINT UNSIGNED NOT NULL,
    `collection_id` BIGINT UNSIGNED NOT NULL,
    `display_order` INT UNSIGNED NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`product_id`, `collection_id`),
    INDEX `idx_product_collections_collection` (`collection_id`, `product_id`),
    CONSTRAINT `fk_product_collections_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_product_collections_collection` FOREIGN KEY (`collection_id`) REFERENCES `collections` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 6. product_slug_history (for redirects)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `product_slug_history` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `product_id` BIGINT UNSIGNED NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `uq_product_slug_history_slug` (`slug`),
    INDEX `idx_product_slug_history_product_id` (`product_id`),
    CONSTRAINT `fk_product_slug_history_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 7. product_colour_variants (name, RGB, optional price override)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `product_colour_variants` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `product_id` BIGINT UNSIGNED NOT NULL,
    `colour_name` VARCHAR(64) NOT NULL,
    `colour_code` VARCHAR(7) NOT NULL COMMENT 'Hex format #RRGGBB',
    `price_override_paise` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT 'Optional price override in paise',
    `display_order` INT UNSIGNED NOT NULL DEFAULT 0,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '1 = active, 0 = hidden (re-adding reactivates)',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `uq_product_colour_variants_product_colour` (`product_id`, `colour_name`),
    INDEX `idx_product_colour_variants_product_order` (`product_id`, `display_order`),
    CONSTRAINT `fk_product_colour_variants_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 8. product_images
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `product_images` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `product_id` BIGINT UNSIGNED NOT NULL,
    `colour_variant_id` BIGINT UNSIGNED NOT NULL,
    `image_url` VARCHAR(512) NOT NULL,
    `alt_text` VARCHAR(255) NULL,
    `display_order` INT UNSIGNED NOT NULL DEFAULT 0,
    `is_primary` TINYINT(1) NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_product_images_colour_order` (`colour_variant_id`, `display_order`),
    INDEX `idx_product_images_product_id` (`product_id`),
    CONSTRAINT `fk_product_images_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_product_images_colour` FOREIGN KEY (`colour_variant_id`) REFERENCES `product_colour_variants` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 9. product_variant_sizes (size and stock per colour and size)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `product_variant_sizes` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `product_id` BIGINT UNSIGNED NOT NULL,
    `colour_variant_id` BIGINT UNSIGNED NOT NULL,
    `size_name` VARCHAR(32) NOT NULL COMMENT 'e.g. XS, S, M, L, XL, Free size',
    `sku` VARCHAR(64) NULL,
    `quantity` INT NOT NULL DEFAULT 0 COMMENT 'Physical stock on hand',
    `display_order` INT UNSIGNED NOT NULL DEFAULT 0,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `uq_product_variant_sizes_colour_size` (`colour_variant_id`, `size_name`),
    UNIQUE KEY `uq_product_variant_sizes_sku` (`sku`),
    INDEX `idx_product_variant_sizes_product_id` (`product_id`),
    INDEX `idx_product_variant_sizes_quantity` (`quantity`),
    CONSTRAINT `chk_product_variant_sizes_quantity` CHECK (`quantity` >= 0),
    CONSTRAINT `fk_product_variant_sizes_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_product_variant_sizes_colour` FOREIGN KEY (`colour_variant_id`) REFERENCES `product_colour_variants` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 10. stock_movements (stock movement history)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `stock_movements` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `product_variant_size_id` BIGINT UNSIGNED NOT NULL,
    `product_id` BIGINT UNSIGNED NOT NULL,
    `user_id` BIGINT UNSIGNED NULL COMMENT 'Admin user ID if authenticated',
    `performed_by` VARCHAR(100) NOT NULL COMMENT 'Actor snapshot name or email (who)',
    `old_quantity` INT NOT NULL,
    `new_quantity` INT NOT NULL,
    `quantity_change` INT NOT NULL COMMENT 'Delta: new_quantity - old_quantity',
    `reason` VARCHAR(255) NOT NULL COMMENT 'e.g. Retail sale, Stock arrival, Audit correction',
    `order_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT 'Sale that caused the movement; NULL for arrivals and corrections',
    `cancellation_request_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT 'Cancellation restock or its reversal; NULL for other movements',
    `return_request_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT 'Return restock or exchange replacement movement; NULL for other movements',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'When movement occurred',
    INDEX `idx_stock_movements_variant_time` (`product_variant_size_id`, `created_at`),
    INDEX `idx_stock_movements_product_time` (`product_id`, `created_at`),
    INDEX `idx_stock_movements_order_id` (`order_id`),
    INDEX `idx_stock_movements_cancellation_request_id` (`cancellation_request_id`),
    INDEX `idx_stock_movements_return_request_id` (`return_request_id`),
    CONSTRAINT `fk_stock_movements_variant_size` FOREIGN KEY (`product_variant_size_id`) REFERENCES `product_variant_sizes` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `fk_stock_movements_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `fk_stock_movements_user` FOREIGN KEY (`user_id`) REFERENCES `admin_users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `fk_stock_movements_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `fk_stock_movements_cancellation_request` FOREIGN KEY (`cancellation_request_id`) REFERENCES `cancellation_requests` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `fk_stock_movements_return_request` FOREIGN KEY (`return_request_id`) REFERENCES `return_requests` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 11. stock_holds (temporary checkout reservations, keyed by order)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `stock_holds` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `order_id` BIGINT UNSIGNED NOT NULL COMMENT 'Order created when the customer clicked Pay',
    `product_variant_size_id` BIGINT UNSIGNED NOT NULL,
    `quantity` INT UNSIGNED NOT NULL,
    `expires_at` DATETIME NOT NULL COMMENT 'IST expiry of the hold',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `uq_stock_holds_order_variant` (`order_id`, `product_variant_size_id`),
    INDEX `idx_stock_holds_variant_expiry` (`product_variant_size_id`, `expires_at`),
    INDEX `idx_stock_holds_expires_at` (`expires_at`),
    CONSTRAINT `fk_stock_holds_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_stock_holds_variant_size` FOREIGN KEY (`product_variant_size_id`) REFERENCES `product_variant_sizes` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- PART B1: CUSTOMERS, ADMIN, SETTINGS, COUPONS
-- -----------------------------------------------------------------------------

-- -----------------------------------------------------------------------------
-- 16. customers
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `customers` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(150) NOT NULL,
    `email` VARCHAR(255) NOT NULL COMMENT 'Login identifier; stored trimmed and lowercase',
    `phone` VARCHAR(20) NOT NULL COMMENT 'Login identifier; digits only with country code',
    `password_hash` VARCHAR(255) NOT NULL COMMENT 'Hashed password only; never plain text',
    `is_active` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '0 = blocked, cannot log in',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `uq_customers_email` (`email`),
    UNIQUE KEY `uq_customers_phone` (`phone`),
    INDEX `idx_customers_is_active` (`is_active`),
    INDEX `idx_customers_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 17. customer_addresses
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `customer_addresses` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `customer_id` BIGINT UNSIGNED NOT NULL,
    `recipient_name` VARCHAR(150) NOT NULL,
    `phone` VARCHAR(20) NOT NULL COMMENT 'Contact phone for delivery, digits only with country code',
    `address_line1` VARCHAR(255) NOT NULL,
    `address_line2` VARCHAR(255) NULL DEFAULT NULL,
    `city` VARCHAR(100) NOT NULL,
    `state` VARCHAR(100) NOT NULL,
    `pincode` VARCHAR(10) NOT NULL COMMENT 'Text to keep leading zeros',
    `is_default` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'At most one default per customer (app rule)',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_customer_addresses_customer` (`customer_id`, `is_default`),
    CONSTRAINT `fk_customer_addresses_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 18. customer_password_resets (emailed one-time reset link)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `customer_password_resets` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `customer_id` BIGINT UNSIGNED NOT NULL,
    `token_hash` CHAR(64) NOT NULL COMMENT 'SHA-256 hex of the reset token; the token itself is never stored',
    `expires_at` DATETIME NOT NULL COMMENT 'IST expiry, 30 minutes after creation',
    `used_at` DATETIME NULL DEFAULT NULL COMMENT 'Set on successful use; a used token never works again',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `uq_customer_password_resets_token` (`token_hash`),
    INDEX `idx_customer_password_resets_customer_expiry` (`customer_id`, `expires_at`),
    INDEX `idx_customer_password_resets_expires_at` (`expires_at`),
    CONSTRAINT `fk_customer_password_resets_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 19. admin_users (single owner account)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `admin_users` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(150) NOT NULL,
    `email` VARCHAR(255) NOT NULL COMMENT 'Stored trimmed and lowercase',
    `password_hash` VARCHAR(255) NOT NULL COMMENT 'Hashed password only; never plain text',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `uq_admin_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 20. admin_trusted_devices (devices that skip the new-device OTP)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `admin_trusted_devices` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `admin_user_id` BIGINT UNSIGNED NOT NULL,
    `token_hash` CHAR(64) NOT NULL COMMENT 'SHA-256 hex of the device token; the token itself is never stored',
    `label` VARCHAR(100) NULL DEFAULT NULL COMMENT 'Human label, e.g. Office laptop - Chrome',
    `last_used_at` DATETIME NULL DEFAULT NULL COMMENT 'IST instant of the last successful use',
    `expires_at` DATETIME NOT NULL COMMENT 'IST expiry, 30 days after creation; an expired device is challenged again',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `uq_admin_trusted_devices_token` (`token_hash`),
    INDEX `idx_admin_trusted_devices_admin` (`admin_user_id`),
    CONSTRAINT `fk_admin_trusted_devices_admin` FOREIGN KEY (`admin_user_id`) REFERENCES `admin_users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 21. admin_otp_codes (new device and forgot password)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `admin_otp_codes` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `admin_user_id` BIGINT UNSIGNED NOT NULL,
    `code_hash` CHAR(64) NOT NULL COMMENT 'SHA-256 hex of the OTP; the code itself is never stored',
    `purpose` ENUM('new_device', 'forgot_password') NOT NULL,
    `expires_at` DATETIME NOT NULL COMMENT 'IST expiry',
    `attempts` TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Failed verification attempts for this code',
    `used_at` DATETIME NULL DEFAULT NULL COMMENT 'Set on successful use; a used code never works again',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_admin_otp_codes_admin_purpose` (`admin_user_id`, `purpose`, `expires_at`),
    INDEX `idx_admin_otp_codes_expires_at` (`expires_at`),
    CONSTRAINT `fk_admin_otp_codes_admin` FOREIGN KEY (`admin_user_id`) REFERENCES `admin_users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 22. login_attempts (failed-attempt lockout and request throttling)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `login_attempts` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `account_type` ENUM('admin', 'customer') NOT NULL,
    `identifier` VARCHAR(255) NOT NULL COMMENT 'Email or phone as typed, even when no account exists',
    `ip` VARCHAR(45) NULL DEFAULT NULL COMMENT 'IPv4 or IPv6 text',
    `is_success` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '1 = successful attempt, 0 = failed',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_login_attempts_account_identifier_time` (`account_type`, `identifier`, `created_at`),
    INDEX `idx_login_attempts_ip_time` (`ip`, `created_at`),
    INDEX `idx_login_attempts_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 23. admin_sessions
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `admin_sessions` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `admin_user_id` BIGINT UNSIGNED NOT NULL,
    `session_token_hash` CHAR(64) NOT NULL COMMENT 'SHA-256 hex of the session token; the token itself is never stored',
    `expires_at` DATETIME NOT NULL COMMENT 'IST session timeout',
    `ip` VARCHAR(45) NULL DEFAULT NULL,
    `user_agent` VARCHAR(255) NULL DEFAULT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `uq_admin_sessions_token` (`session_token_hash`),
    INDEX `idx_admin_sessions_admin_expiry` (`admin_user_id`, `expires_at`),
    INDEX `idx_admin_sessions_expires_at` (`expires_at`),
    CONSTRAINT `fk_admin_sessions_admin` FOREIGN KEY (`admin_user_id`) REFERENCES `admin_users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 24. settings (key/value, one row per setting)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `settings` (
    `setting_key` VARCHAR(64) NOT NULL COMMENT 'Natural primary key; the exact key list is fixed in DATABASE.md',
    `setting_value` TEXT NULL DEFAULT NULL COMMENT 'Always text; the application casts to int/bool per key',
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 25. couriers
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `couriers` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL,
    `tracking_url_template` VARCHAR(255) NOT NULL COMMENT 'Contains a {tracking_id} placeholder',
    `is_default` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Only one default at a time (app rule)',
    `is_active` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '0 = hidden from the order form',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `uq_couriers_name` (`name`),
    INDEX `idx_couriers_is_default` (`is_default`),
    INDEX `idx_couriers_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 26. coupons
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `coupons` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `code` VARCHAR(32) NOT NULL COMMENT 'Stored uppercase',
    `type` ENUM('percent', 'amount') NOT NULL COMMENT 'amount = fixed rupees off, stored in paise',
    `value` INT UNSIGNED NOT NULL COMMENT 'Percent (1-100) or paise, depending on type',
    `expires_at` DATETIME NULL DEFAULT NULL COMMENT 'IST expiry; NULL = no expiry',
    `min_order_paise` BIGINT UNSIGNED NOT NULL DEFAULT 0,
    `max_discount_paise` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT 'Cap for percent coupons; NULL = no cap',
    `usage_limit` INT UNSIGNED NULL DEFAULT NULL COMMENT 'Total redemptions allowed; NULL = unlimited',
    `used_count` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Redemptions so far; only orders count, and a cancelled, rejected or fully refunded order releases its use',
    `allow_repeat_use` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '0 = each customer may use the code once, 1 = repeat use allowed',
    `is_active` TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'On/off switch',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `uq_coupons_code` (`code`),
    INDEX `idx_coupons_is_active_expiry` (`is_active`, `expires_at`),
    CONSTRAINT `chk_coupons_value` CHECK (`value` > 0),
    CONSTRAINT `chk_coupons_percent_max` CHECK (`type` <> 'percent' OR `value` <= 100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 27. activity_log (append-only admin audit log, 3-month retention)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `activity_log` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `admin_user_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT 'NULL only for system-generated entries',
    `action` VARCHAR(50) NOT NULL COMMENT 'e.g. product.update, order.cancel, refund.done',
    `entity_type` VARCHAR(50) NOT NULL COMMENT 'e.g. product, order, coupon',
    `entity_id` BIGINT UNSIGNED NULL DEFAULT NULL,
    `old_value` TEXT NULL DEFAULT NULL COMMENT 'JSON-encoded snapshot before the change',
    `new_value` TEXT NULL DEFAULT NULL COMMENT 'JSON-encoded snapshot after the change',
    `ip` VARCHAR(45) NULL DEFAULT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_activity_log_entity` (`entity_type`, `entity_id`),
    INDEX `idx_activity_log_admin_time` (`admin_user_id`, `created_at`),
    INDEX `idx_activity_log_created_at` (`created_at`),
    CONSTRAINT `fk_activity_log_admin` FOREIGN KEY (`admin_user_id`) REFERENCES `admin_users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- PART B2a: ORDERS AND PAYMENTS
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 28. orders (never hard-deleted; one row per checkout attempt)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `orders` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `order_number` VARCHAR(16) NOT NULL COMMENT 'Public ID, e.g. SRM-7K2Q9M; random from 23456789ABCDEFGHJKMNPQRSTUVWXYZ, never sequential',
    `customer_id` BIGINT UNSIGNED NOT NULL,
    `customer_name` VARCHAR(150) NOT NULL COMMENT 'Snapshot at checkout',
    `customer_email` VARCHAR(255) NOT NULL COMMENT 'Snapshot at checkout',
    `customer_phone` VARCHAR(20) NOT NULL COMMENT 'Snapshot at checkout',
    `ship_recipient_name` VARCHAR(150) NOT NULL,
    `ship_phone` VARCHAR(20) NOT NULL,
    `ship_address_line1` VARCHAR(255) NOT NULL,
    `ship_address_line2` VARCHAR(255) NULL DEFAULT NULL,
    `ship_city` VARCHAR(100) NOT NULL,
    `ship_state` VARCHAR(100) NOT NULL,
    `ship_pincode` VARCHAR(10) NOT NULL COMMENT 'Text to keep leading zeros',
    `subtotal_paise` BIGINT UNSIGNED NOT NULL COMMENT 'Sum of order_items.line_total_paise before discount',
    `discount_paise` BIGINT UNSIGNED NOT NULL DEFAULT 0,
    `shipping_paise` BIGINT UNSIGNED NOT NULL DEFAULT 0,
    `total_paise` BIGINT UNSIGNED NOT NULL COMMENT 'subtotal - discount + shipping',
    `coupon_code` VARCHAR(32) NULL DEFAULT NULL COMMENT 'Snapshot of coupons.code, stored uppercase; NULL = no code',
    `status` ENUM('payment_pending', 'new', 'shipped', 'delivered', 'rejected', 'cancelled') NOT NULL DEFAULT 'payment_pending',
    `courier_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT 'Set when shipped',
    `courier_name` VARCHAR(100) NULL DEFAULT NULL COMMENT 'Snapshot of couriers.name at ship time',
    `tracking_id` VARCHAR(100) NULL DEFAULT NULL,
    `hold_expires_at` DATETIME NULL DEFAULT NULL COMMENT 'IST instant when the payment hold ends (set at creation to now + settings.payment_hold_minutes); read by payment verification and the cleanup job',
    `paid_at` DATETIME NULL DEFAULT NULL COMMENT 'IST capture instant',
    `shipped_at` DATETIME NULL DEFAULT NULL,
    `delivered_at` DATETIME NULL DEFAULT NULL COMMENT 'Owner-entered delivered date, stored at 00:00:00 IST',
    `rejected_at` DATETIME NULL DEFAULT NULL,
    `cancelled_at` DATETIME NULL DEFAULT NULL,
    `cancel_reason` ENUM('payment_expired', 'customer_request', 'admin_cancel', 'stock_unavailable') NULL DEFAULT NULL COMMENT 'NULL unless status = cancelled',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `uq_orders_order_number` (`order_number`),
    INDEX `idx_orders_status_created_at` (`status`, `created_at`),
    INDEX `idx_orders_status_hold_expires_at` (`status`, `hold_expires_at`),
    INDEX `idx_orders_created_at` (`created_at`),
    INDEX `idx_orders_customer_phone` (`customer_phone`),
    INDEX `idx_orders_customer_name` (`customer_name`),
    INDEX `idx_orders_customer_id` (`customer_id`, `created_at`),
    CONSTRAINT `chk_orders_total` CHECK (`total_paise` + `discount_paise` = `subtotal_paise` + `shipping_paise`),
    CONSTRAINT `chk_orders_discount` CHECK (`discount_paise` <= `subtotal_paise`),
    CONSTRAINT `fk_orders_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `fk_orders_courier` FOREIGN KEY (`courier_id`) REFERENCES `couriers` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 29. order_items (sales-report snapshots, one row per line)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `order_items` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `order_id` BIGINT UNSIGNED NOT NULL,
    `product_id` BIGINT UNSIGNED NOT NULL,
    `product_variant_size_id` BIGINT UNSIGNED NOT NULL,
    `product_name` VARCHAR(255) NOT NULL COMMENT 'Snapshot at order time',
    `category_name` VARCHAR(100) NOT NULL COMMENT 'Snapshot at order time',
    `sub_category_name` VARCHAR(100) NULL DEFAULT NULL COMMENT 'Snapshot at order time',
    `description` TEXT NULL DEFAULT NULL COMMENT 'Snapshot at order time',
    `size_name` VARCHAR(32) NOT NULL COMMENT 'Snapshot at order time',
    `set_type_name` VARCHAR(100) NULL DEFAULT NULL COMMENT 'Snapshot at order time',
    `colour_name` VARCHAR(64) NOT NULL COMMENT 'Snapshot at order time',
    `fabric_name` VARCHAR(100) NULL DEFAULT NULL COMMENT 'Snapshot at order time',
    `mrp_paise` BIGINT UNSIGNED NOT NULL COMMENT 'MRP at order time (report column Price)',
    `price_paise` BIGINT UNSIGNED NOT NULL COMMENT 'Price charged per unit (report column Sale price)',
    `quantity` INT UNSIGNED NOT NULL,
    `line_total_paise` BIGINT UNSIGNED NOT NULL COMMENT 'price_paise * quantity',
    `image_path` VARCHAR(512) NULL DEFAULT NULL COMMENT 'Snapshot of the primary image path for that colour',
    INDEX `idx_order_items_order_id` (`order_id`),
    INDEX `idx_order_items_product_id` (`product_id`),
    INDEX `idx_order_items_variant_size_id` (`product_variant_size_id`),
    CONSTRAINT `chk_order_items_quantity` CHECK (`quantity` > 0),
    CONSTRAINT `chk_order_items_line_total` CHECK (`line_total_paise` = `price_paise` * `quantity`),
    CONSTRAINT `fk_order_items_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `fk_order_items_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `fk_order_items_variant_size` FOREIGN KEY (`product_variant_size_id`) REFERENCES `product_variant_sizes` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 30. order_status_history (append-only; 10-minute reject undo)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `order_status_history` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `order_id` BIGINT UNSIGNED NOT NULL,
    `from_status` ENUM('payment_pending', 'new', 'shipped', 'delivered', 'rejected', 'cancelled') NULL DEFAULT NULL COMMENT 'NULL only on the row created with the order',
    `to_status` ENUM('payment_pending', 'new', 'shipped', 'delivered', 'rejected', 'cancelled') NOT NULL,
    `admin_user_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT 'NULL = system job, webhook or customer action',
    `note` VARCHAR(255) NULL DEFAULT NULL COMMENT 'Short human note; never payment payloads or payer data',
    `undo_until` DATETIME NULL DEFAULT NULL COMMENT 'Set on Reject: created_at + 10 minutes',
    `undone_at` DATETIME NULL DEFAULT NULL COMMENT 'Stamped when undo is used; the row is never deleted',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_order_status_history_order_time` (`order_id`, `created_at`),
    INDEX `idx_order_status_history_undo_until` (`undo_until`),
    CONSTRAINT `fk_order_status_history_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `fk_order_status_history_admin` FOREIGN KEY (`admin_user_id`) REFERENCES `admin_users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 31. payments (Razorpay IDs and amounts only; no payer details, ever)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `payments` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `order_id` BIGINT UNSIGNED NOT NULL,
    `razorpay_order_id` VARCHAR(64) NOT NULL,
    `razorpay_payment_id` VARCHAR(64) NULL DEFAULT NULL COMMENT 'Set when Razorpay confirms the payment',
    `amount_paise` BIGINT UNSIGNED NOT NULL COMMENT 'Must equal orders.total_paise',
    `status` ENUM('created', 'captured', 'failed') NOT NULL DEFAULT 'created',
    `failure_code` VARCHAR(64) NULL DEFAULT NULL COMMENT 'Razorpay failure code, or hold_expired when the hold ran out',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `captured_at` DATETIME NULL DEFAULT NULL,
    UNIQUE KEY `uq_payments_razorpay_order` (`razorpay_order_id`),
    UNIQUE KEY `uq_payments_razorpay_payment` (`razorpay_payment_id`),
    INDEX `idx_payments_order_id` (`order_id`),
    INDEX `idx_payments_status_created_at` (`status`, `created_at`),
    CONSTRAINT `fk_payments_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 32. payment_webhook_events (dedupe and diagnosis; never the raw body)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `payment_webhook_events` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `razorpay_event_id` VARCHAR(64) NOT NULL COMMENT 'Unique per delivery; duplicate insert = already processed',
    `event_type` VARCHAR(64) NOT NULL COMMENT 'e.g. payment.captured, payment.failed, refund.processed',
    `razorpay_payment_id` VARCHAR(64) NULL DEFAULT NULL COMMENT 'Loose link, not a FK, so unknown payments are still recorded',
    `received_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `processed_at` DATETIME NULL DEFAULT NULL COMMENT 'NULL = not yet handled, including failed handling',
    `outcome` VARCHAR(32) NULL DEFAULT NULL COMMENT 'applied, ignored, unmatched, failed',
    UNIQUE KEY `uq_payment_webhook_events_event` (`razorpay_event_id`),
    INDEX `idx_payment_webhook_events_payment` (`razorpay_payment_id`),
    INDEX `idx_payment_webhook_events_pending` (`processed_at`, `received_at`),
    INDEX `idx_payment_webhook_events_received_at` (`received_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 33. refunds (manual Razorpay refunds; drives the Refund pending list)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `refunds` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `order_id` BIGINT UNSIGNED NOT NULL,
    `payment_id` BIGINT UNSIGNED NOT NULL COMMENT 'Captured payment attempt being refunded',
    `kind` ENUM('reject', 'cancellation', 'return', 'unfulfilled_payment') NOT NULL,
    `amount_paise` BIGINT UNSIGNED NOT NULL,
    `includes_shipping` TINYINT(1) NOT NULL DEFAULT 0,
    `status` ENUM('pending', 'done') NOT NULL DEFAULT 'pending',
    `razorpay_refund_id` VARCHAR(64) NULL DEFAULT NULL COMMENT 'Pasted by the owner; optional',
    `requested_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `done_at` DATETIME NULL DEFAULT NULL,
    `done_by` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT 'Admin who ticked Refund done',
    `cancellation_request_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT 'Cancellation request that caused this refund; NULL for other kinds',
    `return_request_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT 'Return request that caused this refund; NULL for other kinds',
    UNIQUE KEY `uq_refunds_razorpay_refund` (`razorpay_refund_id`),
    INDEX `idx_refunds_status_requested` (`status`, `requested_at`),
    INDEX `idx_refunds_order_id` (`order_id`),
    INDEX `idx_refunds_payment_id` (`payment_id`),
    INDEX `idx_refunds_cancellation_request_id` (`cancellation_request_id`),
    INDEX `idx_refunds_return_request_id` (`return_request_id`),
    CONSTRAINT `chk_refunds_done` CHECK ((`status` = 'pending' AND `done_at` IS NULL) OR (`status` = 'done' AND `done_at` IS NOT NULL)),
    CONSTRAINT `fk_refunds_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `fk_refunds_payment` FOREIGN KEY (`payment_id`) REFERENCES `payments` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `fk_refunds_done_by` FOREIGN KEY (`done_by`) REFERENCES `admin_users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `fk_refunds_cancellation_request` FOREIGN KEY (`cancellation_request_id`) REFERENCES `cancellation_requests` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `fk_refunds_return_request` FOREIGN KEY (`return_request_id`) REFERENCES `return_requests` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 34. coupon_redemptions (which order used which code; releases used_count)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `coupon_redemptions` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `coupon_id` BIGINT UNSIGNED NOT NULL,
    `order_id` BIGINT UNSIGNED NOT NULL,
    `customer_id` BIGINT UNSIGNED NOT NULL,
    `discount_paise` BIGINT UNSIGNED NOT NULL COMMENT 'Discount actually applied to this order',
    `released_at` DATETIME NULL DEFAULT NULL COMMENT 'Set when the order is rejected, cancelled or fully refunded',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `uq_coupon_redemptions_order` (`order_id`),
    INDEX `idx_coupon_redemptions_customer_coupon` (`customer_id`, `coupon_id`),
    INDEX `idx_coupon_redemptions_coupon_released` (`coupon_id`, `released_at`),
    CONSTRAINT `fk_coupon_redemptions_coupon` FOREIGN KEY (`coupon_id`) REFERENCES `coupons` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `fk_coupon_redemptions_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `fk_coupon_redemptions_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- PART B2b: CANCELLATIONS, RETURNS, EXCHANGES, NOTIFICATIONS
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 35. cancellation_requests (customer request; owner accepts with 10-minute undo)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `cancellation_requests` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `order_id` BIGINT UNSIGNED NOT NULL,
    `status` ENUM('requested', 'accepted') NOT NULL DEFAULT 'requested',
    `requested_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `decided_at` DATETIME NULL DEFAULT NULL,
    `decided_by` BIGINT UNSIGNED NULL DEFAULT NULL,
    `courier_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT 'Entered at accept only when the order was already shipped',
    `courier_name` VARCHAR(100) NULL DEFAULT NULL COMMENT 'Snapshot of couriers.name when entered at accept',
    `tracking_id` VARCHAR(100) NULL DEFAULT NULL COMMENT 'Entered at accept when the order was already shipped',
    `restocked_at` DATETIME NULL DEFAULT NULL COMMENT 'Restock tick; may be set later, independently of the accept undo window',
    `undo_until` DATETIME NULL DEFAULT NULL COMMENT 'decided_at + 10 minutes on accept',
    `undone_at` DATETIME NULL DEFAULT NULL COMMENT 'Stamped when the accept is undone; the row is never deleted',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_cancellation_requests_order` (`order_id`, `requested_at`),
    INDEX `idx_cancellation_requests_status_requested` (`status`, `requested_at`),
    INDEX `idx_cancellation_requests_decided_by` (`decided_by`),
    INDEX `idx_cancellation_requests_courier` (`courier_id`),
    INDEX `idx_cancellation_requests_undo_until` (`undo_until`),
    CONSTRAINT `fk_cancellation_requests_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `fk_cancellation_requests_decided_by` FOREIGN KEY (`decided_by`) REFERENCES `admin_users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `fk_cancellation_requests_courier` FOREIGN KEY (`courier_id`) REFERENCES `couriers` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 36. return_reject_reasons (managed list; hidden with is_active, never deleted)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `return_reject_reasons` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `label` VARCHAR(150) NOT NULL,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '0 = hidden from the reject dropdown; never deleted',
    `display_order` INT UNSIGNED NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `uq_return_reject_reasons_label` (`label`),
    INDEX `idx_return_reject_reasons_active_order` (`is_active`, `display_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO `return_reject_reasons` (`label`, `display_order`) VALUES
    ('Item used, washed or altered', 1),
    ('Tags or original packaging missing', 2),
    ('Product not eligible for return', 3),
    ('Reason not covered by the return policy', 4),
    ('Item received does not match the returned order', 5),
    ('Other', 6);

-- -----------------------------------------------------------------------------
-- 37. return_requests (one return or exchange request per order)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `return_requests` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `order_id` BIGINT UNSIGNED NOT NULL,
    `type` ENUM('return', 'exchange') NOT NULL,
    `status` ENUM('requested', 'accepted', 'rejected', 'received', 'completed') NOT NULL DEFAULT 'requested',
    `reason` VARCHAR(255) NOT NULL COMMENT 'Customer reason from the request form',
    `note` TEXT NULL DEFAULT NULL COMMENT 'Optional customer note',
    `requested_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `decided_at` DATETIME NULL DEFAULT NULL,
    `decided_by` BIGINT UNSIGNED NULL DEFAULT NULL,
    `reject_reason_id` BIGINT UNSIGNED NULL DEFAULT NULL,
    `reject_note` VARCHAR(255) NULL DEFAULT NULL,
    `undo_until` DATETIME NULL DEFAULT NULL COMMENT 'decided_at + 10 minutes',
    `undone_at` DATETIME NULL DEFAULT NULL COMMENT 'Stamped when the decision is undone; the row is never deleted',
    `received_at` DATETIME NULL DEFAULT NULL COMMENT 'Item received tick; reversible',
    `restocked_at` DATETIME NULL DEFAULT NULL COMMENT 'Restock tick; only after received_at, reversible',
    `refund_amount_paise` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT 'Editable before refunding; NULL for exchanges',
    `refund_includes_shipping` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '1 only when we sent a wrong or damaged item',
    `courier_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT 'Replacement courier for an exchange',
    `courier_name` VARCHAR(100) NULL DEFAULT NULL COMMENT 'Snapshot of couriers.name for an exchange',
    `tracking_id` VARCHAR(100) NULL DEFAULT NULL COMMENT 'Replacement tracking for an exchange',
    `shipped_at` DATETIME NULL DEFAULT NULL COMMENT 'Replacement shipped at; exchange only',
    `extra_payment_note` VARCHAR(255) NULL DEFAULT NULL COMMENT 'Optional note such as extra Rs collected',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `uq_return_requests_order` (`order_id`),
    INDEX `idx_return_requests_status_requested` (`status`, `requested_at`),
    INDEX `idx_return_requests_decided_by` (`decided_by`),
    INDEX `idx_return_requests_reject_reason` (`reject_reason_id`),
    INDEX `idx_return_requests_courier` (`courier_id`),
    INDEX `idx_return_requests_undo_until` (`undo_until`),
    CONSTRAINT `fk_return_requests_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `fk_return_requests_decided_by` FOREIGN KEY (`decided_by`) REFERENCES `admin_users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `fk_return_requests_reject_reason` FOREIGN KEY (`reject_reason_id`) REFERENCES `return_reject_reasons` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `fk_return_requests_courier` FOREIGN KEY (`courier_id`) REFERENCES `couriers` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 38. return_request_items (selected lines and exchange replacement variants)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `return_request_items` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `return_request_id` BIGINT UNSIGNED NOT NULL,
    `order_item_id` BIGINT UNSIGNED NOT NULL,
    `quantity` INT UNSIGNED NOT NULL,
    `replacement_variant_size_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT 'Exchange only: same product, different size or colour, or the same variant if damaged',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `uq_return_request_items_request_item` (`return_request_id`, `order_item_id`),
    INDEX `idx_return_request_items_order_item` (`order_item_id`),
    INDEX `idx_return_request_items_replacement` (`replacement_variant_size_id`),
    CONSTRAINT `chk_return_request_items_quantity` CHECK (`quantity` > 0),
    CONSTRAINT `fk_return_request_items_request` FOREIGN KEY (`return_request_id`) REFERENCES `return_requests` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `fk_return_request_items_order_item` FOREIGN KEY (`order_item_id`) REFERENCES `order_items` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `fk_return_request_items_replacement` FOREIGN KEY (`replacement_variant_size_id`) REFERENCES `product_variant_sizes` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 39. notifications (durable email queue and sent log; never OTP or reset mail)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `notifications` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `channel` ENUM('email', 'whatsapp') NOT NULL DEFAULT 'email',
    `recipient_type` ENUM('customer', 'owner') NOT NULL,
    `recipient_email` VARCHAR(255) NOT NULL,
    `template_key` ENUM('order_received', 'order_shipped', 'order_rejected', 'cancellation_accepted', 'return_accepted', 'return_rejected', 'refund_done', 'payment_unfulfilled', 'owner_new_order', 'owner_cancellation_request', 'owner_return_request') NOT NULL,
    `order_id` BIGINT UNSIGNED NULL DEFAULT NULL,
    `related_type` VARCHAR(32) NULL DEFAULT NULL COMMENT 'e.g. cancellation_request, return_request',
    `related_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT 'Loose link; no FK because related_type selects the table',
    `payload` TEXT NULL DEFAULT NULL COMMENT 'JSON of non-sensitive template values only',
    `send_after` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Delayed sends wait for this IST instant',
    `sent_at` DATETIME NULL DEFAULT NULL,
    `cancelled_at` DATETIME NULL DEFAULT NULL COMMENT 'Set by Undo; a cancelled row is never sent',
    `attempts` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `last_error` VARCHAR(255) NULL DEFAULT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_notifications_send` (`sent_at`, `cancelled_at`, `send_after`),
    INDEX `idx_notifications_created_at` (`created_at`),
    INDEX `idx_notifications_order_id` (`order_id`),
    INDEX `idx_notifications_related` (`related_type`, `related_id`),
    CONSTRAINT `fk_notifications_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
