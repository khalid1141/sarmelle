# Sarmelle Admin Spec (v3, final for launch scope B)

Written 14 November 2026 from the owner's decisions. This file supersedes the rough admin map and older brief sections where they conflict. Do not add features that are not listed here. If something is unclear, list it as a question instead of guessing.

Launch scope: **B = full store with Razorpay UPI payments.** No calendar date is promised. Razorpay live keys need the public site with policy pages first.

Business: a small home business registered under an individual. **No GST.** Invoices are sent inside the email body, with no tax lines.

## 1. Principles
- One owner account. Plain, functional UI. Admin lives at admin.sarmelle.com as a separate bundle.
- Every table has search, filters and sorting.
- Critical actions (reject, cancel, delete, refund done) use a confirmation popup.
- Content and stock live in MySQL and change instantly with no rebuild.
- Past orders keep their own copy (snapshot) of product name, variant, price and address, so history survives product edits and deletes.

## 2. Login and security
- Password only, at least 12 characters, strong hashing.
- Email OTP on a new device. Failed-attempt lockout. Session timeout.
- Forgot password through email OTP.
- Profile menu (profile icon): edit name, change password, logout.
- Admin actions are written to the activity log (who, what, when, old value to new value). Kept 3 months.
- Customer data is visible only behind the admin login. Payment details (UPI ID, cards) are never stored. Only Razorpay payment and refund IDs are stored.

## 3. Dashboard and Inventory (one screen)
- Labels: this month's orders, this month's sales.
- Table grouped by product. Each row opens a dropdown with colour and size and quantity, editable (for retail sales), with a reason field. Stock history is kept (who, when, old, new, reason).
- No low-stock alerts. No separate "reserved" column; only available stock is shown.

## 4. Products
- Statuses: **Draft, Published, Unpublished, Archived, Deleted.**
  - Published = live to customers. Unpublished and Archived = hidden from customers everywhere, including carts and wishlists.
  - Archived products stay in an Archived list. **Restore** moves them to Draft.
  - Delete is allowed only from Draft or Archived, with a confirmation popup. It removes the product from admin lists only. Sales history survives through order snapshots.
  - **Duplicate product** creates a Draft. No bulk price change.
- Product-level fields (entered once): name (one title, no separate SEO title), description, category, sub-category, collection, set type, fabric, occasion, fit, sleeve type, neck type (dropdowns from managed lists), length (with unit), weight in grams, MRP, sale price, return eligible, size chart (dropdown), manual "Out of stock" checkbox.
- Slug is automatic from the name (see Brief decision 8). One title; description is used for link previews.
- **Colour variants:** per colour, enter once: colour name, RGB value, images, optional price override (for example black costs more).
- **Sizes:** entered as tags (S, M, L, XL, Free size, or presets). Each colour gets a quantity per size.
- Out of stock: a colour and size with quantity 0 shows "Out of stock" automatically. The manual checkbox does the same for the whole product. Out-of-stock products stay visible with the label.
- Images: auto-resized, any upload size accepted. Hint text under the upload box: "Recommended 1200 x 1500 px (4:5), JPG or WebP" (confirm the ratio against the storefront product card).
- No sale start or end dates. The owner publishes and unpublishes by hand.

## 5. Categories, Collections, Size charts
- **Categories and sub-categories, Collections:** create, edit, hide. Chosen from dropdowns in the product form.
- **Size charts:** named charts (for example "Kurti sizes"). A small table: rows are sizes, columns are measurements (bust, waist, hip, length). Optional inch/cm unit. Reused across products through a dropdown. Editing a chart updates every product using it. A chart in use cannot be deleted. The storefront size chart popup reads this data.
- **Managed lists** for fabric, occasion, fit, sleeve and neck, so typos do not split the filters.

## 6. Orders
Statuses: **Payment pending, New, Shipped, Delivered, Rejected, Cancelled.**

Flow:
1. Customer clicks Pay. Stock is held for **5 minutes** (a setting; the server enforces it, not the browser). If payment does not arrive, the hold is released.
2. Payment verified on the server: the order becomes **New automatically** and stock is deducted. There is no "awaiting review" step.
3. Customer gets an **"Order received"** email. The owner gets a new-order email and the order appears in the Orders table.
4. Owner enters courier (default pre-selected) and tracking ID: order becomes **Shipped**, customer gets an email with the tracking link. Invoice details are in the email body.
5. Owner marks **Delivered** and enters the delivered date. The return window starts from it.

Orders table: date, order ID, customer name, phone, items (expandable), quantity, price, address, total paid, courier, tracking ID, status. Search by order ID, phone or name. Filter by status and date.
Order create is rejected by the server for logged-out users.

**Reject** (until Shipped):
- No reason box. A default email is sent ("unable to fulfil your order, refund coming, 5 to 7 working days").
- Refund is **full, including shipping**. The order goes to the Refund pending list.
- **Restock** checkbox before saving, **unticked by default** (tick only if the item is physically available).
- **Undo for 10 minutes.** The customer email is sent only after those 10 minutes. Undoing restores the previous state and re-checks stock if stock had been returned.

## 7. Cancellations (customer, before delivery)
- A customer can request cancellation until the order is marked Shipped. The owner gets an email for every request.
- Cancellations list (tab) with Accept action:
  - **Not shipped yet (no tracking ID):** accept, refund **in full including shipping**.
  - **Already shipped:** owner enters courier and tracking ID (optional fields), accepts, refunds **product price only**. The customer sees the tracking number in the cancellation email, so the shipping fee stays with the owner.
- Restock checkbox on the form, unticked by default. It can be ticked later on the order once the parcel is physically back.
- Undo for 10 minutes, with the customer email delayed, as for Reject.

## 8. Returns and Exchanges
- Window: a setting (days) from the delivered date. Orders inside the window are highlighted; others are empty.
- **One request per order** (return or exchange), then the option disables. The customer can pick which items (partial returns).
- Owner **Accept or Reject** with 10-minute undo and delayed customer email. Reject: reason from a dropdown plus an optional text note. Default reasons:
  - Item used, washed or altered
  - Tags or original packaging missing
  - Product not eligible for return
  - Reason not covered by the return policy
  - Item received does not match the returned order
  - Other
- After Accept: tick **Item received** (undo), then **Restock** (undo) when the item is back in stock.
- **Return:** refund is the product price only (shipping excluded). If we sent a wrong or damaged item, the refund includes shipping. The refund amount is editable by the owner before refunding (handles coupon splits).
- **Exchange:** same product, different size or colour, or the same variant if the item was damaged. Stock for the replacement reduces by 1 automatically. The owner enters courier and tracking ID, as for normal orders. If the new variant costs more, the customer pays extra outside the app. An optional note field records "extra Rs collected".
- Return/exchange email notifications go to the owner for every request.

## 9. Refunds (manual at launch)
- Rejected orders, accepted cancellations, accepted returns and late payments (arriving after the hold expired) all create entries in a **Refund pending** list.
- Each entry shows order ID, refund amount and the Razorpay payment ID.
- The owner refunds in the Razorpay dashboard, then ticks **Refund done** (optionally pasting the refund ID).
- Refunds go back to the same UPI ID. Normal refunds take about 2 to 7 days. Customer emails say "5 to 7 working days".
- Automatic refunds through the API are not in scope.

## 10. Coupons
- List of coupons. Per coupon: code, percent or rupee amount, value, expiry date, minimum order amount, maximum discount (for percent), usage limit, on/off switch.

## 11. Couriers and Settings
- **Couriers:** add many courier names, each with a tracking-link template. One is the default and is pre-selected on orders. Admin only types the tracking ID.
- **Settings:** shipping charge, free-shipping threshold, return window (days), payment hold minutes (5), store details.

## 12. Customers (view only)
- Name, phone (as text), email, addresses, order count. Stored securely. No payment details.

## 13. Reports (CSV export, opens in Excel)
- Filters: date presets (this week, this month, last month, this year), custom date range, and filter by individual fields.
- **Sales report** (one row per product in an order): Order ID, order date, product name, category, sub-category, description, size, set type, colour, fabric, sale price, price, place, delivered date.
- **Returns report:** the same product fields plus return initiated date, reason, confirmed date.

## 14. Notifications
- Email now (customer and owner). WhatsApp Business later (provider not chosen). No SMS.
- Customer emails: order received, shipped (with tracking), rejected, cancellation accepted, return accepted or rejected, refund done.
- Owner emails: new order, cancellation request, return or exchange request.

## 15. Not in launch scope (later)
- Banners and Campaigns screen (festive banner texts and visuals without a rebuild).
- Review moderation (storefront reviews stay mock), customer photos on returns, Google reviews in the app.
- Packing slip, delivered-reminder list, contact-form inbox, newsletter list, editable email templates, pincode serviceability, automatic refunds.

## 16. Open items for the owner
- Policy decisions: return and exchange window, refund timeline, who pays return shipping, shipping time and charges, free-shipping threshold.
- Registered business name, address, phone, email, grievance contact.
- Razorpay: confirm a 5-minute payment window and UPI-only configuration.
- Check the image ratio against the storefront cards.
- Policy text, including the shipping-fee rules in sections 6 to 8, should be reviewed by a lawyer. A quick CA check on invoices without GST is advised.
