-- -----------------------------------------------------------------------------
-- Migration 001: read API support
-- Adds product flags/offer type used by the storefront filters and badge logic,
-- plus content tables that back the homepage campaign and product reviews.
-- -----------------------------------------------------------------------------

SET NAMES utf8mb4;

ALTER TABLE `products`
    ADD COLUMN `offer_type` VARCHAR(64) NULL AFTER `description`,
    ADD COLUMN `is_best_seller` TINYINT(1) NOT NULL DEFAULT 0 AFTER `is_manual_out_of_stock`,
    ADD COLUMN `is_new_arrival` TINYINT(1) NOT NULL DEFAULT 0 AFTER `is_best_seller`,
    ADD INDEX `idx_products_offer_type` (`offer_type`),
    ADD INDEX `idx_products_is_best_seller` (`is_best_seller`),
    ADD INDEX `idx_products_is_new_arrival` (`is_new_arrival`);

CREATE TABLE IF NOT EXISTS `product_reviews` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `product_id` BIGINT UNSIGNED NOT NULL,
    `author` VARCHAR(150) NOT NULL,
    `rating` TINYINT UNSIGNED NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `comment` TEXT NOT NULL,
    `location` VARCHAR(100) NULL,
    `is_verified` TINYINT(1) NOT NULL DEFAULT 1,
    `is_visible` TINYINT(1) NOT NULL DEFAULT 1,
    `review_date` DATE NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_product_reviews_product` (`product_id`, `review_date`),
    CONSTRAINT `chk_product_reviews_rating` CHECK (`rating` BETWEEN 1 AND 5),
    CONSTRAINT `fk_product_reviews_product`
        FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `campaign_hero_slides` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `badge` VARCHAR(120) NULL,
    `title_part1` VARCHAR(120) NOT NULL,
    `title_part2` VARCHAR(120) NOT NULL,
    `subtitle` VARCHAR(255) NOT NULL,
    `offer_tag` VARCHAR(64) NULL,
    `cta_text_desktop` VARCHAR(80) NOT NULL,
    `cta_text_mobile` VARCHAR(80) NOT NULL,
    `category_target` VARCHAR(64) NULL,
    `offer_target` VARCHAR(64) NULL,
    `desktop_image` VARCHAR(512) NOT NULL,
    `mobile_image` VARCHAR(512) NOT NULL,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `display_order` INT UNSIGNED NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_campaign_hero_slides_active_order` (`is_active`, `display_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `campaign_promo_banners` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `badge` VARCHAR(80) NOT NULL,
    `title` VARCHAR(120) NOT NULL,
    `subtitle` VARCHAR(120) NOT NULL,
    `cta_text` VARCHAR(80) NOT NULL,
    `image` VARCHAR(512) NOT NULL,
    `target_category` VARCHAR(64) NULL,
    `target_offer` VARCHAR(64) NULL,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `display_order` INT UNSIGNED NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_campaign_promo_banners_active_order` (`is_active`, `display_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `campaign_featured_blocks` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `title` VARCHAR(120) NOT NULL,
    `cta_text` VARCHAR(80) NOT NULL,
    `image` VARCHAR(512) NOT NULL,
    `category` VARCHAR(64) NOT NULL,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `display_order` INT UNSIGNED NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_campaign_featured_blocks_active_order` (`is_active`, `display_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `campaign_lookbook` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `title` VARCHAR(120) NOT NULL,
    `subtitle` VARCHAR(255) NOT NULL,
    `cta_text` VARCHAR(80) NOT NULL,
    `image` VARCHAR(512) NOT NULL,
    `offer_target` VARCHAR(64) NULL,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
