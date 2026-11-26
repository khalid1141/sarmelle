-- =============================================================================
-- Sarmelle seed data (local development)
-- Run after db/schema_draft.sql + db/migrations/001_read_api.sql
-- =============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- -----------------------------------------------------------------------------
-- Lookups
-- -----------------------------------------------------------------------------
INSERT INTO categories (id, parent_id, name, slug, is_hidden, display_order) VALUES
 (1, NULL, 'Sarees', 'sarees', 0, 1),
 (2, NULL, 'Kurtis', 'kurtis', 0, 2),
 (3, NULL, 'Lehengas', 'lehengas', 0, 3),
 (4, NULL, 'Dupattas', 'dupattas', 0, 4),
 (5, 1, 'Silk Sarees', 'silk-sarees', 0, 1),
 (6, 1, 'Organza Sarees', 'organza-sarees', 0, 2),
 (7, 2, 'Anarkali Kurtis', 'anarkali-kurtis', 0, 1),
 (8, 2, 'Chikankari Kurtis', 'chikankari-kurtis', 0, 2);

INSERT INTO collections (id, name, slug, is_hidden, display_order) VALUES
 (1, 'Diwali Festive Collection', 'diwali-festive-collection', 0, 1),
 (2, 'New Arrivals', 'new-arrivals', 0, 2),
 (3, 'Best Sellers', 'best-sellers', 0, 3),
 (4, 'Bridal Edit', 'bridal-edit', 0, 4);

INSERT INTO fabrics (id, name, slug, is_active, display_order) VALUES
 (1, 'Silk', 'silk', 1, 1),
 (2, 'Organza', 'organza', 1, 2),
 (3, 'Georgette', 'georgette', 1, 3),
 (4, 'Cotton', 'cotton', 1, 4),
 (5, 'Velvet', 'velvet', 1, 5);

INSERT INTO occasions (id, name, slug, is_active, display_order) VALUES
 (1, 'Festive', 'festive', 1, 1),
 (2, 'Wedding', 'wedding', 1, 2),
 (3, 'Party', 'party', 1, 3),
 (4, 'Daily', 'daily', 1, 4);

INSERT INTO fits (id, name, slug, is_active, display_order) VALUES
 (1, 'Regular', 'regular', 1, 1),
 (2, 'Relaxed', 'relaxed', 1, 2),
 (3, 'A-Line', 'a-line', 1, 3),
 (4, 'Straight', 'straight', 1, 4);

INSERT INTO sleeve_types (id, name, slug, is_active, display_order) VALUES
 (1, 'Sleeveless', 'sleeveless', 1, 1),
 (2, 'Short Sleeve', 'short-sleeve', 1, 2),
 (3, 'Three-Quarter', 'three-quarter', 1, 3),
 (4, 'Full Sleeve', 'full-sleeve', 1, 4);

INSERT INTO neck_types (id, name, slug, is_active, display_order) VALUES
 (1, 'Round', 'round', 1, 1),
 (2, 'V-Neck', 'v-neck', 1, 2),
 (3, 'Boat Neck', 'boat-neck', 1, 3),
 (4, 'Sweetheart', 'sweetheart', 1, 4);

INSERT INTO set_types (id, name, slug, is_active, display_order) VALUES
 (1, 'Saree', 'saree', 1, 1),
 (2, 'Kurti', 'kurti', 1, 2),
 (3, 'Lehenga', 'lehenga', 1, 3),
 (4, 'Dupatta', 'dupatta', 1, 4),
 (5, 'Kurti Set', 'kurti-set', 1, 5);

INSERT INTO size_charts (id, name, unit, description) VALUES
 (1, 'Kurti sizes', 'cm', 'Standard kurti measurement chart'),
 (2, 'Lehenga sizes', 'in', 'Standard lehenga measurement chart');

INSERT INTO size_chart_rows (id, size_chart_id, size_name, display_order) VALUES
 (1, 1, 'S', 1), (2, 1, 'M', 2), (3, 1, 'L', 3), (4, 1, 'XL', 4), (5, 1, 'XXL', 5),
 (6, 2, 'S', 1), (7, 2, 'M', 2), (8, 2, 'L', 3), (9, 2, 'XL', 4);

INSERT INTO size_chart_columns (id, size_chart_id, label, display_order) VALUES
 (1, 1, 'Bust', 1), (2, 1, 'Waist', 2), (3, 1, 'Hip', 3), (4, 1, 'Length', 4),
 (5, 2, 'Waist', 1), (6, 2, 'Length', 2);

INSERT INTO size_chart_cells (size_chart_row_id, size_chart_column_id, value) VALUES
 (1,1,'34'),(1,2,'28'),(1,3,'36'),(1,4,'42'),
 (2,1,'36'),(2,2,'30'),(2,3,'38'),(2,4,'43'),
 (3,1,'38'),(3,2,'32'),(3,3,'40'),(3,4,'44'),
 (4,1,'40'),(4,2,'34'),(4,3,'42'),(4,4,'45'),
 (5,1,'42'),(5,2,'36'),(5,3,'44'),(5,4,'46'),
 (6,5,'26'),(6,6,'42'),
 (7,5,'28'),(7,6,'43'),
 (8,5,'30'),(8,6,'44'),
 (9,5,'32'),(9,6,'45');

INSERT INTO couriers (id, name, tracking_url_template, is_default, is_active) VALUES
 (1, 'Delhivery Express', 'https://www.delhivery.com/track/package/{tracking_id}', 1, 1),
 (2, 'Blue Dart Luxury Logistics', 'https://www.bluedart.com/tracking/{tracking_id}', 0, 1),
 (3, 'Ekart Logistics', 'https://ekartlogistics.com/track/{tracking_id}', 0, 1),
 (4, 'India Post', 'https://www.indiapost.gov.in/_layouts/15/dop.portal.tracking/trackconsignment.aspx?consignmentnumber={tracking_id}', 0, 1);

INSERT INTO coupons (id, code, type, value, expires_at, min_order_paise, max_discount_paise, usage_limit, used_count, allow_repeat_use, is_active) VALUES
 (1, 'DIWALI30', 'percent', 30, '2026-12-31 23:59:59', 0, NULL, NULL, 0, 1, 1),
 (2, 'WELCOME10', 'percent', 10, NULL, 0, NULL, NULL, 0, 1, 1),
 (3, 'FESTIVE500', 'amount', 500, NULL, 199900, 50000, NULL, 0, 1, 1);

INSERT INTO settings (setting_key, setting_value) VALUES
 ('shipping_charge_paise', '5000'),
 ('free_shipping_threshold_paise', '199900'),
 ('return_window_days', '7'),
 ('payment_hold_minutes', '5'),
 ('store_name', 'Sarmelle'),
 ('store_email', 'care@sarmelle.com'),
 ('store_phone', '+91 98765 43210'),
 ('store_address', 'Sarmelle Atelier, Bengaluru, Karnataka, India'),
 ('return_address', 'Sarmelle Returns, 12 Lotus Lane, Bengaluru 560001, Karnataka, India');

-- return_reject_reasons already seeded by db/schema_draft.sql (6 default labels)

-- -----------------------------------------------------------------------------
-- Products (16)
-- -----------------------------------------------------------------------------
INSERT INTO products
 (id, name, slug, description, category_id, sub_category_id, fabric_id, occasion_id, fit_id, sleeve_type_id, neck_type_id, length, length_unit, weight_grams, mrp_paise, sale_price_paise, return_eligible, size_chart_id, is_manual_out_of_stock, status, offer_type, is_best_seller, is_new_arrival)
VALUES
 (1, 'Maroon Banarasi Silk Saree', 'maroon-banarasi-silk-saree', 'Handwoven Banarasi silk saree with rich zari border.', 1, 5, 1, 1, 1, 1, 1, 5.50, 'm', 650, 699900, 489900, 1, NULL, 0, 'Published', 'Diwali Sale', 1, 0),
 (2, 'Green Organza Saree', 'green-organza-saree', 'Lightweight organza saree with subtle sheen.', 1, 6, 2, 1, 1, 1, 1, 5.50, 'm', 420, 439900, 329900, 1, NULL, 0, 'Published', 'New Festive Collection', 0, 1),
 (3, 'Floral Anarkali Kurti', 'floral-anarkali-kurti', 'Flowy Anarkali kurti in printed georgette.', 2, 7, 3, 1, 3, 4, 2, NULL, NULL, 320, 249900, 179900, 1, 1, 0, 'Published', 'Diwali Sale', 0, 1),
 (4, 'Royal Purple Silk Saree', 'royal-purple-silk-saree', 'Royal purple silk saree with gold zari.', 1, 5, 1, 2, 1, 1, 1, 5.50, 'm', 680, 799900, 519900, 1, NULL, 0, 'Published', 'Best Sellers', 1, 0),
 (5, 'Red Bridal Lehenga', 'red-bridal-lehenga', 'Bridal velvet lehenga with heavy zari.', 3, NULL, 5, 2, 1, 4, 4, NULL, NULL, 1200, 1499900, 899900, 1, 2, 0, 'Published', 'Diwali Sale', 1, 0),
 (6, 'Mustard Embroidered Kurti Set', 'mustard-embroidered-kurti-set', 'Mustard cotton kurti set with embroidery.', 2, NULL, 4, 1, 2, 2, 1, NULL, NULL, 360, 249900, 199900, 1, 1, 0, 'Published', 'New Festive Collection', 1, 0),
 (7, 'Lavender Organza Saree', 'lavender-organza-saree', 'Lavender organza saree with floral weave.', 1, 6, 2, 1, 1, 1, 1, 5.50, 'm', 400, 399900, 319900, 1, NULL, 0, 'Published', 'Diwali Sale', 1, 0),
 (8, 'White Chikankari Kurti', 'white-chikankari-kurti', 'White cotton chikankari kurti.', 2, 8, 4, 4, 2, 3, 1, NULL, NULL, 280, 269900, 209900, 1, 1, 0, 'Published', 'New Festive Collection', 1, 0),
 (9, 'Crimson Zari Kanjivaram Saree', 'crimson-zari-kanjivaram-saree', 'Crimson Kanjivaram silk with gold zari.', 1, 5, 1, 1, 1, 1, 1, 5.50, 'm', 720, 899900, 649900, 1, NULL, 0, 'Published', 'Diwali Sale', 1, 0),
 (10, 'Royal Emerald Velvet Lehenga', 'royal-emerald-velvet-lehenga', 'Emerald velvet lehenga for festive nights.', 3, NULL, 5, 1, 1, 4, 4, NULL, NULL, 1100, 1099900, 799900, 1, 2, 0, 'Published', 'New Festive Collection', 0, 1),
 (11, 'Mustard Mirror Work Kurti', 'mustard-mirror-work-kurti', 'Mustard kurti with mirror work.', 2, NULL, 4, 1, 2, 2, 1, NULL, NULL, 300, 249900, 189900, 1, 1, 0, 'Published', 'Diwali Sale', 0, 0),
 (12, 'Golden Zari Brocade Dupatta', 'golden-zari-brocade-dupatta', 'Gold brocade dupatta with zari.', 4, NULL, 1, 1, 1, 1, 1, 2.30, 'm', 220, 219900, 159900, 1, NULL, 0, 'Published', 'New Festive Collection', 1, 0),
 (13, 'Royal Purple Festive Anarkali Set', 'royal-purple-festive-anarkali-set', 'Purple Anarkali set in georgette.', 2, 7, 3, 1, 3, 4, 2, NULL, NULL, 400, 489900, 369900, 1, 1, 0, 'Published', 'Diwali Sale', 0, 1),
 (14, 'Peach Organza Floral Embroidered Saree', 'peach-organza-floral-embroidered-saree', 'Peach organza saree with floral embroidery.', 1, 6, 2, 1, 1, 1, 1, 5.50, 'm', 430, 449900, 349900, 1, NULL, 0, 'Published', 'New Festive Collection', 1, 0),
 (15, 'Ruby Red Bridal Velvet Lehenga', 'ruby-red-bridal-velvet-lehenga', 'Ruby red bridal velvet lehenga.', 3, NULL, 5, 2, 1, 4, 4, NULL, NULL, 1250, 1199900, 849900, 1, 2, 0, 'Published', 'Diwali Sale', 1, 0),
 (16, 'Banarasi Tissue Silk Festive Dupatta', 'banarasi-tissue-silk-festive-dupatta', 'Banarasi tissue silk festive dupatta.', 4, NULL, 1, 1, 1, 1, 1, 2.30, 'm', 210, 239900, 179900, 1, NULL, 0, 'Published', 'New Festive Collection', 0, 1);

-- -----------------------------------------------------------------------------
-- Colour variants
-- -----------------------------------------------------------------------------
INSERT INTO product_colour_variants (id, product_id, colour_name, colour_code, display_order, is_active) VALUES
 (1,1,'Maroon','#7A1C28',0,1),(2,1,'Gold','#D4AF37',1,1),(3,1,'Royal Purple','#5C2D91',2,1),(4,1,'Crimson Red','#C2185B',3,1),
 (5,2,'Emerald Green','#1B4D3E',0,1),(6,2,'Gold','#D4AF37',1,1),
 (7,3,'Rose Pink','#E8A3B2',0,1),(8,3,'Cream','#FDF5E6',1,1),
 (9,4,'Purple','#6A1B9A',0,1),
 (10,5,'Bridal Red','#D32F2F',0,1),
 (11,6,'Mustard','#FBC02D',0,1),
 (12,7,'Lavender','#B39DDB',0,1),
 (13,8,'Ivory White','#FAFAFA',0,1),
 (14,9,'Crimson Red','#C2185B',0,1),(15,9,'Gold','#D4AF37',1,1),
 (16,10,'Emerald Green','#1B4D3E',0,1),(17,10,'Gold','#D4AF37',1,1),
 (18,11,'Mustard','#FBC02D',0,1),(19,11,'Ivory White','#FAFAFA',1,1),
 (20,12,'Gold','#D4AF37',0,1),(21,12,'Maroon','#7A1C28',1,1),
 (22,13,'Purple','#5C2D91',0,1),(23,13,'Rose Pink','#E8A3B2',1,1),
 (24,14,'Pink','#E8A3B2',0,1),(25,14,'Gold','#D4AF37',1,1),
 (26,15,'Maroon','#7A1C28',0,1),(27,15,'Gold','#D4AF37',1,1),
 (28,16,'Gold','#D4AF37',0,1),(29,16,'Crimson Red','#C2185B',1,1);

-- -----------------------------------------------------------------------------
-- Product images (all images attached to the first colour variant of each product)
-- -----------------------------------------------------------------------------
INSERT INTO product_images (product_id, colour_variant_id, image_url, alt_text, display_order, is_primary) VALUES
 (1,1,'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80','Maroon Banarasi Silk Saree',0,1),
 (1,1,'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80','Maroon Banarasi Silk Saree',1,0),
 (1,1,'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=80','Maroon Banarasi Silk Saree',2,0),
 (2,5,'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80','Green Organza Saree',0,1),
 (2,5,'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80','Green Organza Saree',1,0),
 (2,5,'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=80','Green Organza Saree',2,0),
 (3,7,'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80','Floral Anarkali Kurti',0,1),
 (3,7,'https://images.unsplash.com/photo-1609357602309-408fb180a6b7?auto=format&fit=crop&w=800&q=80','Floral Anarkali Kurti',1,0),
 (3,7,'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80','Floral Anarkali Kurti',2,0),
 (4,9,'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=80','Royal Purple Silk Saree',0,1),
 (4,9,'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80','Royal Purple Silk Saree',1,0),
 (4,9,'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80','Royal Purple Silk Saree',2,0),
 (5,10,'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=800&q=80','Red Bridal Lehenga',0,1),
 (5,10,'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80','Red Bridal Lehenga',1,0),
 (5,10,'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80','Red Bridal Lehenga',2,0),
 (6,11,'https://images.unsplash.com/photo-1609357602309-408fb180a6b7?auto=format&fit=crop&w=800&q=80','Mustard Embroidered Kurti Set',0,1),
 (7,12,'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80','Lavender Organza Saree',0,1),
 (8,13,'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80','White Chikankari Kurti',0,1),
 (9,14,'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80','Crimson Zari Kanjivaram Saree',0,1),
 (10,16,'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=800&q=80','Royal Emerald Velvet Lehenga',0,1),
 (11,18,'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=80','Mustard Mirror Work Kurti',0,1),
 (12,20,'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80','Golden Zari Brocade Dupatta',0,1),
 (13,22,'https://images.unsplash.com/photo-1609357602309-408fb180a6b7?auto=format&fit=crop&w=800&q=80','Royal Purple Festive Anarkali Set',0,1),
 (14,24,'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80','Peach Organza Floral Embroidered Saree',0,1),
 (15,26,'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=800&q=80','Ruby Red Bridal Velvet Lehenga',0,1),
 (16,28,'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80','Banarasi Tissue Silk Festive Dupatta',0,1);

-- -----------------------------------------------------------------------------
-- Variant sizes (stock) - one row per size on the first colour variant
-- -----------------------------------------------------------------------------
INSERT INTO product_variant_sizes (product_id, colour_variant_id, size_name, sku, quantity, display_order, is_active) VALUES
 (1,1,'Free Size','SRM-001-FS',12,0,1),
 (2,5,'Free Size','SRM-002-FS',10,0,1),
 (3,7,'S','SRM-003-S',8,0,1),(3,7,'M','SRM-003-M',12,1,1),(3,7,'L','SRM-003-L',9,2,1),(3,7,'XL','SRM-003-XL',6,3,1),(3,7,'XXL','SRM-003-XXL',4,4,1),
 (4,9,'Free Size','SRM-004-FS',7,0,1),
 (5,10,'S','SRM-005-S',5,0,1),(5,10,'M','SRM-005-M',7,1,1),(5,10,'L','SRM-005-L',4,2,1),
 (6,11,'S','SRM-006-S',10,0,1),(6,11,'M','SRM-006-M',14,1,1),(6,11,'L','SRM-006-L',9,2,1),(6,11,'XL','SRM-006-XL',6,3,1),
 (7,12,'Free Size','SRM-007-FS',11,0,1),
 (8,13,'S','SRM-008-S',15,0,1),(8,13,'M','SRM-008-M',18,1,1),(8,13,'L','SRM-008-L',12,2,1),(8,13,'XL','SRM-008-XL',8,3,1),
 (9,14,'Free Size','SRM-009-FS',6,0,1),
 (10,16,'S','SRM-010-S',7,0,1),(10,16,'M','SRM-010-M',9,1,1),(10,16,'L','SRM-010-L',5,2,1),(10,16,'XL','SRM-010-XL',3,3,1),
 (11,18,'S','SRM-011-S',12,0,1),(11,18,'M','SRM-011-M',16,1,1),(11,18,'L','SRM-011-L',10,2,1),(11,18,'XL','SRM-011-XL',7,3,1),(11,18,'XXL','SRM-011-XXL',4,4,1),
 (12,20,'Free Size','SRM-012-FS',20,0,1),
 (13,22,'S','SRM-013-S',9,0,1),(13,22,'M','SRM-013-M',12,1,1),(13,22,'L','SRM-013-L',7,2,1),(13,22,'XL','SRM-013-XL',5,3,1),
 (14,24,'Free Size','SRM-014-FS',13,0,1),
 (15,26,'S','SRM-015-S',4,0,1),(15,26,'M','SRM-015-M',6,1,1),(15,26,'L','SRM-015-L',3,2,1),(15,26,'XL','SRM-015-XL',2,3,1),
 (16,28,'Free Size','SRM-016-FS',18,0,1);

-- -----------------------------------------------------------------------------
-- Product collections
-- -----------------------------------------------------------------------------
INSERT INTO product_collections (product_id, collection_id, display_order) VALUES
 (1,1,1),(3,1,2),(5,1,3),(7,1,4),(9,1,5),(11,1,6),(13,1,7),(15,1,8),
 (2,2,1),(3,2,2),(10,2,3),(13,2,4),(16,2,5),
 (1,3,1),(4,3,2),(5,3,3),(6,3,4),(7,3,5),(8,3,6),(9,3,7),(12,3,8),(14,3,9),(15,3,10),
 (5,4,1),(10,4,2),(15,4,3);

-- -----------------------------------------------------------------------------
-- Reviews
-- -----------------------------------------------------------------------------
INSERT INTO product_reviews (id, product_id, author, rating, title, comment, location, is_verified, is_visible, review_date) VALUES
 (1, 1, 'Ananya Roy', 5, 'Elegance redefined - Perfect for Diwali Puja', 'The zari weave and silk drape are breathtaking! Truly exceeded my expectations.', 'Kolkata', 1, 1, '2026-10-30'),
 (2, 1, 'Priyadarshini Rao', 5, 'Royal festive look! Exquisite quality', 'Fabric is rich and heavyweight without being stiff.', 'Hyderabad', 1, 1, '2026-10-28'),
 (3, 1, 'Sneha Mehta', 5, 'Loved the rich color and gold border', 'The maroon and gold shade is deep and opulent, exactly as photographed.', 'Mumbai', 1, 1, '2026-10-26'),
 (4, 1, 'Kavita Sharma', 4, 'Authentic craftsmanship and fine zari', 'Authentic handloom style finish. Feels soft against the skin.', 'Jaipur', 1, 1, '2026-10-23'),
 (5, 2, 'Meera Iyer', 5, 'Must buy festive collection piece', 'High luxury ethnic wear feel. Attention to detail on the pallu is unmatched.', 'Chennai', 1, 1, '2026-10-19'),
 (6, 4, 'Divya Patel', 5, 'Stunning finish and featherlight drape', 'Pure perfection! The subtle metallic thread adds grace.', 'Ahmedabad', 1, 1, '2026-10-15'),
 (7, 9, 'Ritu Singhania', 5, 'Exceptional quality fabric', 'Banarasi border is neat and sparkling. Delivered right before the festival.', 'Delhi NCR', 1, 1, '2026-10-12'),
 (8, 3, 'Nandini Sen', 5, 'Timeless traditional heritage piece', 'A classic heirloom piece. Beautiful sheen, vibrant dye.', 'Bengaluru', 1, 1, '2026-10-08');

-- -----------------------------------------------------------------------------
-- Campaign content
-- -----------------------------------------------------------------------------
INSERT INTO campaign_hero_slides (id, badge, title_part1, title_part2, subtitle, offer_tag, cta_text_desktop, cta_text_mobile, offer_target, desktop_image, mobile_image, is_active, display_order) VALUES
 (1, 'Diwali Special Campaign', 'Diwali', 'Festive Collection', 'Brighten Your Wardrobe with Timeless Elegance', 'Upto 40% OFF', 'Shop the Collection', 'Shop the Collection', 'Diwali Sale', 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1600&q=85', 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=85', 1, 1),
 (2, 'Category Spotlight', 'Elegant Sarees', 'for Every Occasion', 'Handcrafted Banarasi silks, luxurious organzas, and regal drapes.', 'New Collection', 'Shop Sarees', 'Shop Sarees', NULL, 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1600&q=85', 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=85', 1, 2),
 (3, 'Season''s Choice', 'New Arrivals', 'Fresh Styles for This Season', 'Elevate your wardrobe with newly dropped festive ensembles.', 'Trending Now', 'Explore Now', 'Explore Now', 'New Festive Collection', 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=1600&q=85', 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=85', 1, 3);
-- category_target for slide 2
UPDATE campaign_hero_slides SET category_target = 'Sarees' WHERE id = 2;

INSERT INTO campaign_promo_banners (id, badge, title, subtitle, cta_text, image, target_offer, target_category, is_active, display_order) VALUES
 (1, 'Upto 40% OFF', 'Upto\n40% OFF', 'Festive Collection', 'Shop Now', 'https://images.unsplash.com/photo-1606293926075-69a00dbfde81?auto=format&fit=crop&w=800&q=80', 'Diwali Sale', NULL, 1, 1),
 (2, 'New Season', 'New\nArrivals', 'Fresh Styles for This Season', 'Explore Now', 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80', 'New Festive Collection', NULL, 1, 2),
 (3, 'Exclusive', 'Exclusive\nFestive Sets', 'Complete Your Look', 'Shop Sets', 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=80', NULL, 'Kurtis', 1, 3);

INSERT INTO campaign_featured_blocks (id, title, cta_text, image, category, is_active, display_order) VALUES
 (1, 'Silk Sarees', 'Shop Now', 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80', 'Sarees', 1, 1),
 (2, 'Designer Kurtis', 'Shop Now', 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80', 'Kurtis', 1, 2),
 (3, 'Bridal Lehengas', 'Shop Now', 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=800&q=80', 'Lehengas', 1, 3),
 (4, 'Festive Sets', 'Shop Now', 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=80', 'Kurtis', 1, 4);

INSERT INTO campaign_lookbook (id, title, subtitle, cta_text, image, offer_target, is_active) VALUES
 (1, 'Diwali\nLookbook', 'Styles for Every Celebration', 'View Lookbook', 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=85', 'Diwali Sale', 1);

-- -----------------------------------------------------------------------------
-- Customers / admin / auth
-- -----------------------------------------------------------------------------
INSERT INTO customers (id, name, email, phone, password_hash, is_active) VALUES
 (1, 'Priya Sharma', 'priya.sharma@example.com', '+919876543210', '$2y$12$jkMnz0OWd8R0eAyYEo8cVONQhnHqLo/aHxDZM1Clun14nn333UZ1K', 1);

INSERT INTO customer_addresses (id, customer_id, recipient_name, phone, address_line1, address_line2, city, state, pincode, is_default) VALUES
 (1, 1, 'Priya Sharma', '+919876543210', '12 Lotus Lane', 'Apt 4B', 'Bengaluru', 'Karnataka', '560001', 1),
 (2, 1, 'Priya Sharma', '+919876543210', '45 MG Road', NULL, 'Mumbai', 'Maharashtra', '400001', 0);

INSERT INTO admin_users (id, name, email, password_hash) VALUES
 (1, 'Sarmelle Owner', 'owner@sarmelle.com', '$2y$12$8rOc6//yWQg4Q6coGrPjc.aF7Sf9e0qfjPA9eBrC05wf91zbPbyde');

INSERT INTO product_slug_history (id, product_id, slug) VALUES
 (1, 1, 'maroon-banarasi-silk-saree-old');

-- -----------------------------------------------------------------------------
-- Orders (4) + items + payments + status history + stock movements
-- -----------------------------------------------------------------------------
INSERT INTO orders
 (id, order_number, customer_id, customer_name, customer_email, customer_phone, ship_recipient_name, ship_phone, ship_address_line1, ship_address_line2, ship_city, ship_state, ship_pincode, subtotal_paise, discount_paise, shipping_paise, total_paise, coupon_code, status, courier_id, courier_name, tracking_id, hold_expires_at, paid_at, shipped_at, delivered_at, created_at)
VALUES
 (1, 'SAR-2026-98421', 1, 'Priya Sharma', 'priya.sharma@example.com', '+919876543210', 'Priya Sharma', '+919876543210', '12 Lotus Lane', 'Apt 4B', 'Bengaluru', 'Karnataka', '560001', 489900, 0, 0, 489900, NULL, 'shipped', 1, 'Delhivery Express', 'DELHIVERY-77291034', NULL, '2026-10-29 10:15:00', '2026-10-29 18:00:00', NULL, '2026-10-29 10:00:00'),
 (2, 'SAR-2026-87102', 1, 'Priya Sharma', 'priya.sharma@example.com', '+919876543210', 'Priya Sharma', '+919876543210', '45 MG Road', NULL, 'Mumbai', 'Maharashtra', '400001', 389800, 0, 0, 389800, NULL, 'delivered', 2, 'Blue Dart Luxury Logistics', 'BLUEDART-88931201', NULL, '2026-10-14 09:30:00', '2026-10-14 17:00:00', '2026-10-18 00:00:00', '2026-10-14 09:00:00'),
 (3, 'SAR-2026-65490', 1, 'Priya Sharma', 'priya.sharma@example.com', '+919876543210', 'Priya Sharma', '+919876543210', '12 Lotus Lane', 'Apt 4B', 'Bengaluru', 'Karnataka', '560001', 649900, 0, 0, 649900, NULL, 'delivered', 3, 'Ekart Logistics', 'EKART-33920194', NULL, '2026-09-22 11:00:00', '2026-09-22 19:00:00', '2026-09-26 00:00:00', '2026-09-22 10:30:00'),
 (4, 'SAR-2026-55109', 1, 'Priya Sharma', 'priya.sharma@example.com', '+919876543210', 'Priya Sharma', '+919876543210', '12 Lotus Lane', 'Apt 4B', 'Bengaluru', 'Karnataka', '560001', 899900, 0, 0, 899900, NULL, 'payment_pending', NULL, NULL, NULL, '2026-11-01 10:05:00', NULL, NULL, NULL, '2026-11-01 10:00:00');

INSERT INTO order_items
 (id, order_id, product_id, product_variant_size_id, product_name, category_name, sub_category_name, description, size_name, set_type_name, colour_name, fabric_name, mrp_paise, price_paise, quantity, line_total_paise, image_path)
VALUES
 (1, 1, 1, 1, 'Maroon Banarasi Silk Saree', 'Sarees', 'Silk Sarees', 'Handwoven Banarasi silk saree with rich zari border.', 'Free Size', 'Saree', 'Maroon', 'Silk', 699900, 489900, 1, 489900, 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80'),
 (2, 2, 3, 7, 'Floral Anarkali Kurti', 'Kurtis', 'Anarkali Kurtis', 'Flowy Anarkali kurti in printed georgette.', 'M', 'Kurti', 'Rose Pink', 'Georgette', 249900, 179900, 1, 179900, 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80'),
 (3, 2, 8, 13, 'White Chikankari Kurti', 'Kurtis', 'Chikankari Kurtis', 'White cotton chikankari kurti.', 'M', 'Kurti', 'Ivory White', 'Cotton', 269900, 209900, 1, 209900, 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80'),
 (4, 3, 9, 14, 'Crimson Zari Kanjivaram Saree', 'Sarees', 'Silk Sarees', 'Crimson Kanjivaram silk with gold zari.', 'Free Size', 'Saree', 'Crimson Red', 'Silk', 899900, 649900, 1, 649900, 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80'),
 (5, 4, 5, 10, 'Red Bridal Lehenga', 'Lehengas', NULL, 'Bridal velvet lehenga with heavy zari.', 'S', 'Lehenga', 'Bridal Red', 'Velvet', 1499900, 899900, 1, 899900, 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=800&q=80');

INSERT INTO payments (id, order_id, razorpay_order_id, razorpay_payment_id, amount_paise, status, captured_at) VALUES
 (1, 1, 'order_mock_1', 'pay_mock_1', 489900, 'captured', '2026-10-29 10:15:00'),
 (2, 2, 'order_mock_2', 'pay_mock_2', 389800, 'captured', '2026-10-14 09:30:00'),
 (3, 3, 'order_mock_3', 'pay_mock_3', 649900, 'captured', '2026-09-22 11:00:00'),
 (4, 4, 'order_mock_4', NULL, 899900, 'created', NULL);

INSERT INTO order_status_history (id, order_id, from_status, to_status, admin_user_id, note, created_at) VALUES
 (1, 1, 'payment_pending', 'new', NULL, 'Payment captured', '2026-10-29 10:15:00'),
 (2, 1, 'new', 'shipped', 1, 'Shipped via Delhivery', '2026-10-29 18:00:00'),
 (3, 2, 'payment_pending', 'new', NULL, 'Payment captured', '2026-10-14 09:30:00'),
 (4, 2, 'new', 'shipped', 1, 'Shipped via Blue Dart', '2026-10-14 17:00:00'),
 (5, 2, 'shipped', 'delivered', 1, 'Delivered', '2026-10-18 12:00:00'),
 (6, 3, 'payment_pending', 'new', NULL, 'Payment captured', '2026-09-22 11:00:00'),
 (7, 3, 'new', 'shipped', 1, 'Shipped via Ekart', '2026-09-22 19:00:00'),
 (8, 3, 'shipped', 'delivered', 1, 'Delivered', '2026-09-26 12:00:00');

INSERT INTO stock_movements (id, product_variant_size_id, product_id, performed_by, old_quantity, new_quantity, quantity_change, reason, order_id) VALUES
 (1, 1, 1, 'system', 13, 12, -1, 'Order placement hold', 1),
 (2, 7, 3, 'system', 13, 12, -1, 'Order placement hold', 2),
 (3, 13, 8, 'system', 19, 18, -1, 'Order placement hold', 2),
 (4, 14, 9, 'system', 7, 6, -1, 'Order placement hold', 3),
 (5, 10, 5, 'system', 6, 5, -1, 'Order placement hold', 4);

INSERT INTO stock_holds (id, order_id, product_variant_size_id, quantity, expires_at) VALUES
 (1, 4, 10, 1, '2026-11-01 10:05:00');

-- -----------------------------------------------------------------------------
-- Returns / cancellations / notifications
-- -----------------------------------------------------------------------------
INSERT INTO return_requests (id, order_id, type, status, reason, note, requested_at, received_at, refund_amount_paise, refund_includes_shipping, customer_return_courier, customer_return_tracking) VALUES
 (1, 2, 'return', 'requested', 'Color tone mismatch with festive celebration theme', 'Please securely package the ensemble with tags attached.', '2026-10-20 14:00:00', NULL, 209900, 0, 'Delhivery', 'RET-TRACK-001');

INSERT INTO return_request_items (id, return_request_id, order_item_id, quantity) VALUES
 (1, 1, 3, 1);

INSERT INTO cancellation_requests (id, order_id, status, requested_at) VALUES
 (1, 4, 'requested', '2026-11-01 10:30:00');

INSERT INTO notifications (id, channel, recipient_type, recipient_email, template_key, order_id, related_type, related_id, payload, send_after, sent_at) VALUES
 (1, 'email', 'customer', 'priya.sharma@example.com', 'order_received', 1, NULL, NULL, '{"order_number":"SAR-2026-98421"}', '2026-10-29 10:15:00', '2026-10-29 10:15:30'),
 (2, 'email', 'owner', 'owner@sarmelle.com', 'owner_new_order', 1, NULL, NULL, '{"order_number":"SAR-2026-98421"}', '2026-10-29 10:15:00', '2026-10-29 10:15:30'),
 (3, 'email', 'customer', 'priya.sharma@example.com', 'order_shipped', 1, NULL, NULL, '{"order_number":"SAR-2026-98421","tracking_id":"DELHIVERY-77291034"}', '2026-10-29 18:00:00', '2026-10-29 18:00:10');

INSERT INTO activity_log (id, admin_user_id, action, entity_type, entity_id, old_value, new_value, ip) VALUES
 (1, 1, 'seed', 'system', NULL, NULL, 'Initial seed data loaded', '127.0.0.1');

SET FOREIGN_KEY_CHECKS = 1;
