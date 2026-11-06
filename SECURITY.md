# Sarmelle — Security Requirements & Review Plan

## Security Controls & Policies

### 1. Payments & Financial Integrity (Razorpay UPI ONLY)
- **UPI Exclusivity:** Payments are strictly restricted to **Razorpay UPI**. No credit/debit card numbers, CVVs, expiry dates, or NetBanking bank credentials are ever captured or processed, reducing PCI-DSS scope to zero.
- **No Cash on Delivery (COD):** COD is eliminated, removing risks of fake orders, return-to-origin (RTO) shipping losses, and fraudulent deliveries.
- **Server-Side Financial Authority:** Order subtotals, coupon percentage/flat discounts (`DIWALI30`, `WELCOME10`, `FESTIVE500`), shipping thresholds, and payable amounts must be strictly calculated and enforced on the PHP backend. Client-submitted prices are rejected.
- **Webhook Signature Verification:** Razorpay webhook payloads (`payment.captured`, `order.paid`) are cryptographically verified using `HMAC-SHA256` with the server secret before advancing order fulfillment status.

### 2. Authentication & Access Control
- **Password Security:** Secure password hashing using Argon2id / bcrypt via PHP's native `password_hash()`.
- **Session Management:** Secure, HttpOnly, and SameSite session cookies. Session IDs regenerated upon login to prevent session fixation.
- **Role-Based Access Control (RBAC):** Strict separation between customer accounts and administrative management. The administrative panel bundle will be decoupled and protected by IP/access restrictions and separate session validation.

### 3. Data Protection & Input Sanitization
- **SQL Injection Prevention:** 100% of database interactions are executed via PDO prepared statements with parameterized inputs. No raw SQL concatenation.
- **XSS Prevention:** Context-aware output escaping (e.g. `htmlspecialchars()`) on all user-supplied text rendered into HTML, including dynamically injected SEO meta tags.
- **CSRF Tokens:** Synchronizer token pattern (or SameSite cookies) enforced on all state-changing POST requests.
- **URL & Slug Security:** Product slugs are strictly validated (`^[a-z0-9-]+$`). The slug redirect table sanitizes incoming parameters to prevent open redirect vulnerabilities.

### 4. Environment & Secrets Management
- Database passwords, Razorpay API Key ID, Key Secret, and Webhook Secrets reside exclusively in a server-side `.env` file located outside the web document root, excluded from Git.

### 5. Dependency & Supply Chain Hygiene
- `package-lock.json` pins exact dependency trees.
- Superfluous development and runtime dependencies (`esbuild`, `@google/genai`, `express`, `tsx`, `dotenv`) are audited and removed to minimize attack surface.
- Zero high or critical vulnerabilities policy.

### 6. Security Review Gate
- Independent code and security review before staging and production deployments.
