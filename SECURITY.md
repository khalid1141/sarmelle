# Sarmelle — Security Requirements & Review Plan

## Security Controls
- **Authentication:** Secure password hashing (Argon2 / bcrypt via PHP `password_hash`), HttpOnly secure session cookies, session regeneration on login, and device verification OTP.
- **Authorization:** Server-side role-based access control (RBAC) preventing unauthorized customer data access or admin privilege escalation.
- **Data Protection:** PDO prepared statements for all SQL queries to prevent SQL injection. Output escaping to prevent XSS. CSRF tokens on all state-changing forms.
- **Payments:** Server-side price calculation and Razorpay/Cashfree webhook signature verification. No raw card or UPI PIN storage.
- **Environment & Secrets:** Database credentials and API keys stored strictly in `.env` outside the public web root and Git repository.
- **Audit Trails:** Comprehensive logging of administrative actions, stock adjustments, and payment events.
- **Code Reviews:** Independent security review by Claude at key milestone gates before staging and production release.
