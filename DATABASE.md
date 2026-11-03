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
