-- =============================================================================
-- Sarmelle Database Schema Draft - Part A: Catalogue and Stock
-- Target Engine: MySQL 8.0+ / MariaDB 10.5+
-- Storage Engine: InnoDB
-- Character Set: utf8mb4
-- Collation: utf8mb4_unicode_ci
-- Note: Draft DDL only; never executed in this phase.
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
-- 4. size_charts and size_chart_rows
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
    `bust` VARCHAR(32) NULL,
    `waist` VARCHAR(32) NULL,
    `hip` VARCHAR(32) NULL,
    `length` VARCHAR(32) NULL,
    `display_order` INT UNSIGNED NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `uq_size_chart_rows_chart_size` (`size_chart_id`, `size_name`),
    INDEX `idx_size_chart_rows_order` (`size_chart_id`, `display_order`),
    CONSTRAINT `fk_size_chart_rows_chart` FOREIGN KEY (`size_chart_id`) REFERENCES `size_charts` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
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
    `order_id` BIGINT UNSIGNED NULL COMMENT 'Order-related link to be added in Part B',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'When movement occurred',
    INDEX `idx_stock_movements_variant_time` (`product_variant_size_id`, `created_at`),
    INDEX `idx_stock_movements_product_time` (`product_id`, `created_at`),
    INDEX `idx_stock_movements_order_id` (`order_id`),
    CONSTRAINT `fk_stock_movements_variant_size` FOREIGN KEY (`product_variant_size_id`) REFERENCES `product_variant_sizes` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `fk_stock_movements_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 11. stock_holds (temporary checkout reservations)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `stock_holds` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `product_variant_size_id` BIGINT UNSIGNED NOT NULL,
    `quantity` INT UNSIGNED NOT NULL,
    `checkout_ref` VARCHAR(64) NOT NULL COMMENT 'Checkout attempt reference; order link added in Part B',
    `expires_at` DATETIME NOT NULL COMMENT 'UTC expiry of the hold',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_stock_holds_variant_expiry` (`product_variant_size_id`, `expires_at`),
    UNIQUE KEY `uq_stock_holds_checkout_variant` (`checkout_ref`, `product_variant_size_id`),
    CONSTRAINT `fk_stock_holds_variant_size` FOREIGN KEY (`product_variant_size_id`) REFERENCES `product_variant_sizes` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
