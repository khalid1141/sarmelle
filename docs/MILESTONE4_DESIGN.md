# Milestone 4 — PHP Foundation and Secure Auth (Design)

Status: design only. No application code, schema change or dependency is added by this document.

Scope: the PHP foundation (config, database, routing, JSON, sessions, CSRF, validation,
login throttling, mail, activity log) and the admin authentication flows from `ADMIN_SPEC.md`
sections 1, 2 and 11. Customer registration/login is listed as endpoints only and is a
later slice.

Sources read for this design: `HANDOVER.md`, `TODO.md`, `ADMIN_SPEC.md` (1, 2, 11),
`DATABASE.md` (`customers`, `admin_users`, `admin_trusted_devices`, `admin_otp_codes`,
`login_attempts`, `admin_sessions`, `settings`, `notifications`), `db/schema_draft.sql`
for those tables.

Naming: the backend foundation is called **Milestone 4**. `TODO.md` carries a note at the top
saying so; nothing else in the roadmap is renumbered.

---

## 1. Folder layout

Two trees: a **private** tree that no URL can reach, and **web roots** that contain only
entry points and built front-end assets. The rename from `private/`, `public/` and
`admin-public/` to `server/private/`, `server/web-storefront/` and `server/web-admin/` exists
because Vite copies the repository-root `public/` folder into every build, which would have
dragged PHP entry points and junk into `dist/`.

```
sarmelle/                          # repository (source of truth)
  src/                             # existing React frontend (unchanged here)
  public/                          # Vite static assets, copied into builds (unchanged)
  index.html, vite.config.ts
  server/                          # PHP backend
    private/                       # NEVER inside a web root
      bootstrap.php                # timezone, autoloader, error handler
      Config/                      # .env loader, typed config object
      Core/                        # router, request, response, clock, ids, logging, client IP
      Http/                        # middleware: json, auth, csrf, validate, error handler
      Auth/                        # policy, passwords, sessions, devices, OTP, lockout
      Repositories/                # one class per table used in this milestone
      Mail/                        # Mailer interface, SmtpTransport, LogTransport, templates
      Support/                     # validator, normaliser, hash helpers, activity log
      var/                         # logs, sent-mail copies, PHP sessions
      vendor/                      # Composer output (absent until slice 5)
      Config/.env                  # per-deployment secrets, never committed
    web-storefront/                # storefront web root (sarmelle.com)
      index.php                    # serves the React build / SEO-injected pages
      api/index.php                # the only API entry point for the storefront
      bootstrap-path.php           # untracked; returns the absolute private path
      .htaccess                    # rewrite, deny dotfiles, security headers
      assets/                      # built storefront output
    web-admin/                     # admin web root (admin.sarmelle.com), separate bundle
      index.html, assets/          # built admin SPA, no storefront code
      api/index.php                # the only API entry point for admin
      bootstrap-path.php           # untracked; same private tree
      .htaccess
    bin/                           # CLI only, plus the local dev router
      app.php                      # shared CLI bootstrap (loads .env, PDO, clock)
      dev-router.php               # router script for `php -S`
      health.php                   # detailed health checks, CLI only
      create-admin.php
      reset-admin-password.php
  db/                              # existing schema draft (unchanged here)
  docs/
```

### What is public and what is private

- Public: `server/web-storefront/*` and `server/web-admin/*` only. `api/index.php` is a front
  controller; there is no `login.php`, `products.php` or similar directly requestable file.
- Private: everything in `server/private/`. It holds credentials, SQL, mail code, logs and
  sessions.
- The two API entries both load the same private tree but register **different route sets**.
  `web-storefront/api/index.php` registers storefront routes only;
  `web-admin/api/index.php` registers admin routes only. A request for
  `/api/admin/auth/login` on `sarmelle.com` therefore returns 404, and a customer route on
  `admin.sarmelle.com` likewise.

### How the private path is found

No absolute path is committed. `bootstrap-path.php` lives next to each entry point, is
created once per deployment and is git-ignored:

```php
<?php return 'C:/projects/sarmelle/server/private';       // local
<?php return '/home/u123456789/sarmelle-private';         // Hostinger
```

`api/index.php` does `require __DIR__ . '/bootstrap-path.php'` and hands the value to
`server/private/bootstrap.php`. This avoids symlinks (disabled on some shared hosts) and
avoids requiring a custom document root (Hostinger normally fixes it at `public_html`).

### Local development

No XAMPP Apache, no vhosts. XAMPP is used only for MySQL/MariaDB and its PHP binary.

- Storefront: `php -S localhost:8080 -t server/web-storefront server/bin/dev-router.php`
- Admin: `php -S localhost:8081 -t server/web-admin server/bin/dev-router.php`
- Frontend dev server: Vite on `localhost:3000`, with `/api` proxied to
  `http://localhost:8080` (and the admin SPA's own dev server proxying to `8081` when it
  exists). Because the browser only ever talks to `localhost:3000`, there is **no CORS** in
  local dev either.
- The dev router does two things: requests under `/api/` are handed to
  `api/index.php`; everything else falls through to the built-in server, which serves static
  files and `index.php`/`index.html` normally.
- MariaDB stays on `127.0.0.1:3307` (the XAMPP port conflict fix from Milestone 0).

### Deployment mapping

| Environment | Web root | Private tree |
| --- | --- | --- |
| Local storefront | `php -S localhost:8080` with `-t server/web-storefront` | `C:\projects\sarmelle\server\private` |
| Local admin | `php -S localhost:8081` with `-t server/web-admin` | same tree |
| Staging `stag.sarmelle.com` | its own `public_html` = contents of `server/web-storefront/` | `/home/u.../sarmelle-private-stag` |
| Staging admin | `admin.stag.sarmelle.com` `public_html` = contents of `server/web-admin/` | same staging private tree |
| Production `sarmelle.com` | `public_html` = contents of `server/web-storefront/` | `/home/u.../sarmelle-private` |
| Production admin | `admin.sarmelle.com` `public_html` = contents of `server/web-admin/` | same production private tree |

Rules that keep this portable: forward slashes in paths, Linux-case-sensitive filenames,
no absolute paths in code, `var/` writable by PHP, config files `0600`, directories `0755`,
and no `?>` closing tags in PHP-only files.

---

## 2. Config loading

- One `.env` file per deployment at `server/private/Config/.env` (capital `C`, matching
  the directory on disk). It is never committed.
- `.env.example` is committed at the repository root with placeholder names and no secrets.
- The loader is hand-written (no dotenv package): `KEY=value`, `#` comments, optional single
  or double quotes, no variable interpolation, no `export`, no `${}` expansion.
- All values arrive as strings. Each setting is cast once into a typed config object;
  a missing required key or an unparsable boolean stops the request with a server error
  before any output. There is no silent default for secrets.
- `.env` is authoritative for the deployment. Process environment variables are not merged,
  so a stray shell variable cannot change behaviour between web and CLI.
- The loader refuses to serve if `.env` is present in a web root (checked by path) or if
  `APP_DEBUG=1` while `APP_ENV=production`.
- The autoloader is hand-written with `spl_autoload_register`, so slices 1 to 4 need no
  Composer.

### Every setting

Secrets are marked **S**.

| Key | Example | Notes |
| --- | --- | --- |
| `APP_ENV` | `local` / `staging` / `production` | drives debug, cookie flags, health detail |
| `APP_DEBUG` | `1` local, `0` elsewhere | never `1` in production |
| `APP_URL` | `https://sarmelle.com` | storefront origin; local value is the Vite origin |
| `ADMIN_URL` | `https://admin.sarmelle.com` | admin origin |
| **`APP_KEY`** | 32 random bytes, base64 | **S**; HMAC for pending-login cookies and OTP codes |
| `APP_TIMEZONE` | `Asia/Kolkata` | asserted, not trusted blindly |
| `APP_TRUSTED_PROXIES` | empty, or proxy IPs | empty locally; see client IP in §4 |
| `DB_HOST` | `127.0.0.1` | Hostinger uses `localhost` |
| `DB_PORT` | `3307` | local MariaDB port; Hostinger uses `3306` |
| `DB_NAME` | `sarmelle_db` | staging uses its own database |
| `DB_USER` | `sarmelle_user` | |
| **`DB_PASSWORD`** | — | **S** |
| `DB_CHARSET` | `utf8mb4` | |
| `DB_TIMEZONE` | `+05:30` | applied on every connection |
| `DB_SSL` / `DB_SSL_CA` | `0`, empty | only if the host requires TLS |
| `SESSION_NAME_CUSTOMER` | `SARM_SESS` | distinct from admin cookies |
| `SESSION_LIFETIME_CUSTOMER_DAYS` | `30` | idle window |
| `SESSION_SAVE_PATH` | `server/private/var/sessions` | avoids shared `/tmp` |
| `ADMIN_SESSION_COOKIE` | `SARM_ADMIN_SESSION` | |
| `ADMIN_DEVICE_COOKIE` | `SARM_ADMIN_DEVICE` | trusted device |
| `ADMIN_PENDING_COOKIE` | `SARM_ADMIN_PENDING` | signed pending-login cookie |
| `ADMIN_CSRF_COOKIE` | `SARM_ADMIN_CSRF` | double-submit token |
| `ADMIN_SESSION_IDLE_MINUTES` | `30` | sliding, see §5 |
| `ADMIN_SESSION_ABSOLUTE_HOURS` | `12` | cap from `created_at` |
| `ADMIN_TRUSTED_DEVICE_DAYS` | `30` | matches `DATABASE.md` |
| `COOKIE_SECURE` | `1` in staging/production | `0` only for local HTTP |
| `COOKIE_SAMESITE` | `Lax` | |
| `PASSWORD_ALGO` | `auto` | `auto` = Argon2id when available, else bcrypt cost 12 |
| `PASSWORD_BCRYPT_COST` | `12` | fallback only |
| `MAIL_TRANSPORT` | `log` / `smtp` | `log` in local dev and before Composer exists |
| `MAIL_HOST` | Hostinger mailbox host | set at deployment |
| `MAIL_PORT` | `465` | |
| `MAIL_USERNAME` | `no-reply@sarmelle.com` | |
| **`MAIL_PASSWORD`** | — | **S** |
| `MAIL_ENCRYPTION` | `ssl` / `tls` | |
| `MAIL_FROM_ADDRESS` | `no-reply@sarmelle.com` | |
| `MAIL_FROM_NAME` | `Sarmelle` | |
| `MAIL_REPLY_TO` | `care@sarmelle.com` | |
| `MAIL_LOG_DIR` | `server/private/var/mail` | log transport only, private |
| `MAIL_TIMEOUT_SECONDS` | `10` | |
| `MAX_JSON_BYTES` | `65536` | request body cap |
| `LOG_DIR` | `server/private/var/log` | app + security logs |
| `LOG_LEVEL` | `debug` local, `warning` elsewhere | |
| `SETUP_ALLOWED` | `1` only until setup runs | CLI guard, then `0` |
| `RECOVERY_ALLOWED` | `0` | CLI guard, turned on only for a recovery |
| **`RAZORPAY_KEY_ID`** | — | **S**, reserved, not read before Milestone 8 |
| **`RAZORPAY_KEY_SECRET`** | — | **S**, reserved |
| **`RAZORPAY_WEBHOOK_SECRET`** | — | **S**, reserved |

There is deliberately no `CORS_ALLOWED_ORIGINS` and no `RATE_LIMIT_DIR`.

### Fixed security constants (code, not `.env`)

`DATABASE.md` requires the lockout numbers to be code constants so they cannot be changed
from the admin panel: 5 failed logins per identifier in 15 minutes → 15-minute lockout;
20 failed logins per hour per IP → IP blocked; 3 OTP requests and 3 password-reset requests
per account per hour. OTP length (6), OTP lifetime and pending-cookie lifetime (10 minutes),
OTP attempt cap (5) and the minimum password length (12) are constants in
`server/private/Auth/Policy.php`, so there is one place to read them. Changing them is a code
change, not a config edit.

---

## 3. Database connection

- One `Connection` factory, one PDO per request/CLI run, no persistent connections.
- DSN: `mysql:host=...;port=...;dbname=...;charset=utf8mb4`.
- Attributes: `ERRMODE_EXCEPTION`, `EMULATE_PREPARES=false`, `STRINGIFY_FETCHES=false`,
  `FETCH_ASSOC`, `ATTR_TIMEOUT` short.
- On every connection, immediately: `SET time_zone = '+05:30'` and
  `SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci`.
- In `server/private/bootstrap.php`, before anything reads a clock:
  `date_default_timezone_set('Asia/Kolkata')`.
- `server/private/Core/Clock.php` is the only source of "now"; it returns
  `DateTimeImmutable` in Asia/Kolkata and also a MySQL-ready `Y-m-d H:i:s` string. No code
  calls `date()` ad hoc.
- Queries use prepared statements with bound values only. No string concatenation of user
  input, no `query()` for anything that contains a variable. Identifiers that must vary
  (sort column, table) come from a fixed allow-list.
- Errors are converted to a generic JSON error; the SQL message goes to the private log with
  the request ID.

Why the time-zone line matters: `TIMESTAMP` columns are converted by MySQL using the session
time zone, and `DATETIME DEFAULT CURRENT_TIMESTAMP` values follow it too. A CLI script or a
second connection that forgets `SET time_zone` writes rows 5 hours 30 minutes off. The
detailed health check (slice 2) asserts `SELECT @@session.time_zone` returns `+05:30`.

### Health endpoint

`GET /api/health` is public and returns exactly `{"ok":true}` — nothing about the database,
PHP version or filesystem. Detailed checks (charset, session time zone, `NOW()` comparison)
run only in two places:

- `php server/bin/health.php` — always, on any environment; prints a readable report and
  exits non-zero on failure.
- `GET /api/health` when `APP_ENV=local` — adds a `checks` object for developer convenience.

---

## 4. Router, JSON format and client IP

Single front controller, explicit route table:

```
POST /api/admin/auth/login
POST /api/admin/auth/otp/verify
...
```

- Match on method + path; `{param}` placeholders; exact trailing-slash rule; no
  `.php` in URLs; no routing by query string.
- 404 for unknown path, 405 for known path with wrong method (with `Allow` header).
- Middleware runs in order: request ID → JSON → size and content-type check →
  session/auth → Origin and CSRF check (unsafe methods) → auth-endpoint throttling →
  validation → handler.
- Body parsed once; only `application/json` accepted for write methods; body limit from
  config. Form posts are rejected on API routes.
- Handlers return a `Response` object; nothing echoes directly.

Success envelope:

```json
{ "ok": true, "data": { ... } }
```

Error envelope:

```json
{
  "ok": false,
  "error": {
    "code": "validation_failed",
    "message": "Check the highlighted fields.",
    "fields": { "email": "Enter a valid email address." },
    "request_id": "req_8f2c1a"
  }
}
```

Codes in use: `validation_failed`, `invalid_credentials`, `otp_required`, `otp_invalid`,
`otp_expired`, `otp_locked`, `account_locked`, `ip_blocked`, `unauthenticated`,
`session_expired`, `csrf_failed`, `forbidden`, `not_found`, `method_not_allowed`,
`payload_too_large`, `rate_limited`, `server_error`.

Rules: HTTP status matches the code; no stack traces, SQL or file paths in responses; 429
carries `Retry-After`; every error is logged once with the request ID; `fields` is present
only for validation errors. Responses set `Cache-Control: no-store` on all auth routes.

### Same origin, no CORS

The storefront SPA and API share `https://sarmelle.com`; the admin SPA and API share
`https://admin.sarmelle.com`; the storefront never calls the admin API; and locally Vite
proxies `/api`, so the browser still sees one origin. No response ever carries
`Access-Control-Allow-Origin`, `Cors.php` does not exist, and there is no preflight handling.
A request that arrives from another origin is simply rejected by the Origin check.

The Origin check is kept for unsafe methods: on POST/PATCH/PUT/DELETE, if an `Origin` header
is present it must equal the app's configured origin (`APP_URL` for storefront routes,
`ADMIN_URL` for admin routes). When `APP_ENV=local` the loopback dev origins
`http://localhost:3000`, `http://localhost:8080` and `http://localhost:8081` are also
accepted. A mismatch returns `csrf_failed`, even when the CSRF token is valid.

### Client IP (staging proxy check)

The real visitor IP is needed for the per-IP lockout and for the activity log. Default rule:
use `REMOTE_ADDR` and nothing else. If `APP_TRUSTED_PROXIES` lists one or more proxy IPs and
the immediate peer is one of them, read `X-Forwarded-For` right to left and take the first
address that is not a trusted proxy; ignore the header entirely for any other peer. Never
trust `X-Forwarded-For` on a direct connection. Slice 7 verifies on staging, from a phone on
mobile data, that the stored IP matches the phone's public address; if Hostinger terminates
behind a proxy, its IP is added to `APP_TRUSTED_PROXIES`.

---

## 5. Sessions

### Customer sessions — PHP built-in

`session_name(SARM_SESS)`, save path `server/private/var/sessions`, cookie `HttpOnly`,
`Secure` outside local, `SameSite=Lax`, `Path=/`, `Domain` empty (host-only).
Lifetime 30 days idle via `gc_maxlifetime`; the cookie is a session cookie and the server
window is the real limit. `session_regenerate_id(true)` immediately after login and after any
privilege change. Session data holds only `customer_id`, `csrf_token`, `logged_in_at` and
`last_seen`; no password, email or address. No customer session table exists (per
`DATABASE.md`), so logout destroys the session and clears the cookie.

### Admin sessions — database-backed

- Random 32-byte token in cookie `SARM_ADMIN_SESSION` (`HttpOnly`, `Secure`, `SameSite=Lax`,
  `Path=/`, no `Max-Age` → ends when the browser closes).
- Only `SHA-256(token)` is stored in `admin_sessions.session_token_hash`. Lookup is one
  indexed query; a stolen database dump cannot be replayed as a cookie.
- On login: new token, new row, old row for the same browser not reused. On any privilege
  change: new token, row replaced.
- Idle timeout: `expires_at` slides to `now + ADMIN_SESSION_IDLE_MINUTES`, refreshed at most
  once every 5 minutes to avoid a write per request.
- Absolute timeout: enforced from `created_at + ADMIN_SESSION_ABSOLUTE_HOURS`; sliding cannot
  extend past it. Both checks happen on the server before the handler runs.
- Invalid, expired or revoked token → delete the row if expired, clear the cookie, return
  `session_expired` (401). The SPA sends the user to the login screen.
- Password change, password reset or CLI recovery deletes every `admin_sessions` row and
  every `admin_trusted_devices` row for the account in one transaction.

### Separate cookies

Storefront and admin never share a cookie name. On a real deployment this is also enforced by
the host (`sarmelle.com` vs `admin.sarmelle.com`), but locally both run on `localhost` on
different ports and cookies ignore ports — without distinct names the admin token and the
customer session would overwrite each other. Names are therefore fixed and distinct, and each
app's PHP session uses its own save path subdirectory.

---

## 6. CSRF, validation and login throttling

### CSRF

- Customer: a random token in the PHP session, issued by `GET /api/auth/csrf`, required in
  `X-CSRF-Token` on POST/PATCH/PUT/DELETE and compared with `hash_equals`.
- Admin: double-submit. A random token is set in the readable `SARM_ADMIN_CSRF` cookie when
  the session is created and also returned in the response; the SPA echoes it in
  `X-CSRF-Token`; the server requires cookie and header to match (timing-safe) on unsafe
  methods.
- Pre-authentication POSTs (`login`, `otp/verify`, `otp/resend`, `forgot-password`,
  `reset-password`) have no session yet, so they carry no CSRF token; they rely on the Origin
  check, `SameSite=Lax` and their throttles. CSRF tokens begin once a session exists.
- Unsafe requests with a mismatched or foreign `Origin` are rejected with `csrf_failed` even
  if the token matches. `SameSite=Lax` is the third layer.
- CSRF tokens rotate at login and logout. Safe methods never change state.

### Input validation

One validator with a per-route rule set: required/optional, type, min/max length, regex,
enum, trim/collapse spaces. Unknown JSON keys are rejected. Normalisers: email trimmed and
lowercased (`filter_var`); phone reduced to `+` plus 10–13 digits; OTP exactly 6 digits;
names 1–150 characters. Validation failures never echo the submitted password or OTP.

Password rules when setting or changing a password: at least 12 characters, and a maximum
that depends on the hash algorithm — **bcrypt: 72 bytes** (it ignores anything beyond 72),
**Argon2id: 128 characters**. The validator counts bytes for the bcrypt cap and characters
for the minimum, so a 12-character multi-byte password is accepted. The same rule is applied
by the setup and recovery CLI scripts. Login accepts any input length (bounded by the body
limit) and simply fails, so an old long password can never lock the owner out of the form.

### Login throttling

| Concern | Store | Rule |
| --- | --- | --- |
| Failed logins per account | `login_attempts` (`account_type` + `identifier`) | 5 in 15 min → lock 15 min |
| Failed logins per IP | `login_attempts.ip` | 20 in 1 hour → block |
| Admin OTP requests | `admin_otp_codes` rows per admin + purpose | 3 per hour |
| Customer reset requests | `customer_password_resets` rows per customer | 3 per hour |

Counting OTP requests from the `admin_otp_codes` / `customer_password_resets` rows avoids a
new column or table and matches "3 per hour per account". Every login attempt, success or
failure, inserts one `login_attempts` row with the identifier **as typed** (so unknown emails
are counted too) and the IP. Only failures count toward lockouts; the window makes old rows
expire on their own.

General, non-auth request throttling (for example a cap on product-list traffic) is **out of
scope for this milestone and deferred**. It is not replaced by a file bucket, and no new
rate-limit table is added.

---

## 7. Admin authentication flow

### Password

Minimum 12 characters; maximum 72 bytes on bcrypt, 128 characters on Argon2id. Hash with
`PASSWORD_ARGON2ID` when the extension is available on the target PHP build, otherwise bcrypt
cost 12; the algorithm is recorded in the hash and `password_needs_rehash()` upgrades on next
login. Verification always runs `password_verify`, including for unknown emails (against a
fixed dummy hash), so response time does not reveal whether the account exists. Passwords
never appear in logs, activity log, emails or error messages. No password is ever emailed.

### Login (`POST /api/admin/auth/login`)

1. Normalise email, validate, resolve the client IP, check the per-IP block and the
   per-identifier lock.
2. If locked, return `account_locked`/`ip_blocked` with `Retry-After` — the same shape for a
   real and a non-existent email.
3. Verify password. On failure: insert `login_attempts`, return generic `invalid_credentials`.
4. On success: record the successful attempt, then look for a trusted-device cookie for this
   admin that is unexpired. Valid → create the admin session and return 200. Any stale
   pending cookie is cleared.
5. No valid device → create a 6-digit OTP (crypto-random), store only
   `HMAC-SHA256(code, APP_KEY)` with `purpose='new_device'`, expiry `now + 10 min`, mark older
   unused codes for that purpose used, email the code, and return
   `202 {"otp_required": true, "expires_in": 600}`.
6. The 202 also sets `SARM_ADMIN_PENDING`, a short-lived `HttpOnly` cookie signed with
   `APP_KEY`. Its value is `v1.<adminId>.<otpRowId>.<expiresUnix>.<mac>`, where the MAC is
   HMAC-SHA256 over `v1|adminId|otpRowId|expires` using a key derived from `APP_KEY` and a
   fixed context string. It is never readable by JavaScript, expires with the OTP (10
   minutes), and carries no email, code or password.

The OTP hash column is `CHAR(64)`: HMAC-SHA256 rendered as lowercase hex is exactly 64
characters, so it fits without any schema change. Hashing with a server-side key also means a
stolen database dump alone cannot be brute-forced offline without `APP_KEY`.

Because the OTP step is only reached after a correct password, the 202/200 difference leaks
nothing to an attacker who does not already have the password.

### OTP verification (`POST /api/admin/auth/otp/verify`)

- Body: `{"code":"123456"}` only. There is no email and no account id in the body; both come
  from the signed pending cookie. A missing, tampered, cross-purpose or expired cookie is
  rejected with `otp_expired` (401) before any code is checked.
- The cookie's `otpRowId` must belong to the cookie's `adminId`, have `purpose='new_device'`,
  `used_at IS NULL` and `expires_at > now`; otherwise `otp_expired`.
- Increment `attempts`; above 5, set `used_at` (burn the code) and return `otp_locked`.
- Compare `hash_equals(expected_hmac, code_hash)`. On success set `used_at`, create a trusted
  device row, create the admin session, set the session and CSRF cookies, clear the pending
  cookie, write the activity log, return 200.

### OTP resend (`POST /api/admin/auth/otp/resend`)

- Requires the same pending cookie; body is empty. No valid pending cookie → `otp_expired`.
- Creates a fresh code, marks the previous unused code for that purpose used, replaces the
  pending cookie with one pointing at the new row, and emails the new code.
- Limited to 3 per hour per account, counted from `admin_otp_codes` rows.

### Trusted device

Random 32-byte token in `SARM_ADMIN_DEVICE` (`HttpOnly`, `Secure`, `SameSite=Lax`, expiry
30 days); only `SHA-256(token)` in `admin_trusted_devices`, with a label built from browser
and OS, `expires_at = now + 30 days`, `last_used_at` refreshed on use. An expired row is
ignored and replaced after the next successful OTP. A password change, reset or CLI recovery
deletes all device rows and all session rows for the account in one transaction — that is the
only revocation path in ADMIN_SPEC scope.

### Lockout

5 failed attempts for the same `account_type='admin'` + identifier within 15 minutes lock that
account for 15 minutes; 20 failed attempts from one IP within an hour block that IP. Counts
come from `login_attempts`; the two policies are separate so customer traffic can never lock
the admin account. A lockout does not extend on further attempts (no indefinite lock), and a
successful login does not erase history — the time window does that.

### Forgot password (`POST /api/admin/auth/forgot-password`)

- Always returns the same generic 200 message, whether or not the email exists.
- If the account exists and is not throttled: create a `forgot_password` OTP (10 minutes,
  HMAC-hashed, 5 attempts) and email it immediately. If an OTP email fails to send, the code
  is burned and the response stays generic.
- Reset (`POST /api/admin/auth/reset-password`) takes email + code + new password, checks the
  OTP, enforces the password policy, updates the hash, deletes all sessions and trusted
  devices, writes the activity log, and sends a "password changed" notice. The user must log
  in again on every device.

### Change password (`POST /api/admin/auth/change-password`, authenticated)

Current password + new password (same policy). Re-hash, delete all sessions and devices, log
the event, send the notice, clear cookies and force a fresh login everywhere, including the
current browser. No password history is kept.

### Logout and timeout

`POST /api/admin/auth/logout` deletes the session row, clears session/CSRF/pending cookies
(the device cookie stays, so the next login skips OTP), logs the event. Timeout is enforced in
the auth middleware as described in §5; expiry returns `session_expired` and the SPA
redirects. An expired row is deleted lazily on the next use, not by a browser timer.

---

## 8. One-time setup and recovery scripts

Both scripts are CLI-only, self-guarding, never callable over HTTP, and use the same hidden
password prompt. There is no public registration route, no invite flow, no "first visitor
becomes admin"; `/api/admin/setup` and any obvious variant return 404. Neither script ever
prints or emails a password.

### First-time setup — `php server/bin/create-admin.php`

- Refuses to run unless `PHP_SAPI === 'cli'` and `SETUP_ALLOWED=1`.
- Refuses if `admin_users` already has a row (the table is the lock). No `--force`.
- Takes name and email as arguments, reads the password twice from a hidden prompt.
- Enforces the password policy, then inserts the single row with `password_hash`.
- Writes an `admin.setup.created` activity-log row and prints "set SETUP_ALLOWED=0 and delete
  this script".
- Re-running after setup fails safely on the existing row even if the flag was left on.

### Recovery — `php server/bin/reset-admin-password.php`

This is the recovery path when the owner's mailbox is unavailable. It does not create a second
account and does not weaken login.

- Refuses to run unless `PHP_SAPI === 'cli'` and `RECOVERY_ALLOWED=1` (a separate flag from
  `SETUP_ALLOWED`, `0` by default). Refuses if `admin_users` is empty.
- Prompts for the existing email (or takes `--email=`), then reads the new password twice from
  a hidden prompt and enforces the same 12-character/byte policy.
- In one transaction: updates `password_hash`, deletes every `admin_sessions` row and every
  `admin_trusted_devices` row for that account, and writes an `admin.password.recovered`
  activity-log row with `entity_type='admin_user'`, the IP/runtime context and no secret.
- Prints "set RECOVERY_ALLOWED=0". Does not send email, because the mailbox may be the broken
  part; the activity log is the record.
- Leaving the flag on is still not a remote risk: the script refuses the web SAPI, and an
  attacker would need shell access, at which point the password is the least of the problems.

---

## 9. Email

- `Mailer` interface: `send(EmailMessage $message): void`; `EmailMessage` carries to, subject,
  text body, optional HTML body, reply-to. Templates are plain PHP files returning strings,
  with values passed in and escaped for HTML.
- `LogTransport` (local dev, `MAIL_TRANSPORT=log`) writes one `.eml`-style file per message to
  `server/private/var/mail/` with a timestamp and recipient in the filename. Nothing is sent.
  It uses only core PHP, so it works before Composer exists. Files contain OTP codes, so the
  directory is private, `0600`, excluded from git, and cleaned periodically.
- `SmtpTransport` wraps PHPMailer (the only approved package) and requires Composer.
  **Composer is not installed on the owner's machine yet.** It is needed from slice 5 onward;
  slices 1 to 4 must build and run without it. Until the owner installs Composer and PHPMailer,
  staging and production run with `MAIL_TRANSPORT=log` or not at all (local only), and
  `MAIL_TRANSPORT=smtp` fails with a clear "Composer dependencies missing" error instead of a
  fatal. SMTP debug off, credentials never logged, 10-second timeout.
- The Razorpay PHP library is not installed or used before Milestone 8.
- OTP and password-reset emails are sent **immediately and synchronously**, and are **never
  written to `notifications`**. `notifications` is the durable queue for order and account
  notices only (§39 in `DATABASE.md`).
- A failed send is reported as a generic `server_error` (or a safe retry message on the
  forgot-password screen); the OTP row is burned and the pending cookie cleared, so a
  half-sent code cannot be reused.
- Subjects are fixed and short ("Your Sarmelle admin code"), bodies state the expiry and say
  to ignore the mail if it was not requested. No links in OTP mails; reset mails use a code,
  not a link.

---

## 10. Activity log writes

`activity_log` is append-only. Milestone 4 writes one row per event, with `admin_user_id`,
`action`, `entity_type='admin_user'`, `entity_id`, `ip`, and JSON `old_value`/`new_value`
containing only non-secret fields (name, email, reason). Never a password, OTP, token or hash.

Events: `admin.setup.created`, `admin.password.recovered`, `admin.login.success`,
`admin.logout`, `admin.otp.requested`, `admin.otp.verified`, `admin.otp.failed`,
`admin.device.trusted`, `admin.password.changed`, `admin.password.reset`,
`admin.session.expired`, `admin.account.locked`.

Failed logins are not written here one row per attempt — they already live in
`login_attempts`, and flooding the 3-month audit table with bot traffic would bury real
events. On failure the app writes to the private security log instead. When no admin account
matches the identifier there is no `admin_user_id`, and `DATABASE.md` reserves `NULL` for
system rows, so those attempts go only to the security log. This keeps the audit trail
readable and the nullable rule honest.

---

## 11. Customer registration and login (later slice — endpoints only)

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/api/auth/register` | name + email + phone + password |
| POST | `/api/auth/login` | email **or** phone + password |
| POST | `/api/auth/logout` | destroy PHP session |
| GET | `/api/auth/me` | current customer summary |
| GET | `/api/auth/csrf` | issue CSRF token |
| POST | `/api/auth/forgot-password` | always-generic response, emailed link |
| POST | `/api/auth/reset-password` | token + new password |
| POST | `/api/auth/change-password` | current + new password |
| PATCH | `/api/account` | name, email, phone |
| GET/POST/PATCH/DELETE | `/api/account/addresses` | saved addresses |

Both identifiers are unique and normalised (`DATABASE.md` rule 3); one password serves both,
with the same maximum-length rule as §6. Customer reset uses `customer_password_resets`
(hashed token, 30 minutes, single use) — not `admin_otp_codes`. These endpoints are designed
here, not built in this milestone.

---

## 12. Threats considered

| Threat | Handling |
| --- | --- |
| Brute force / credential stuffing | 5 failures per account per 15 min, 20 per IP per hour, generic errors, no lockout feedback that distinguishes real accounts, Argon2id/bcrypt cost makes guessing slow |
| Session fixation | `session_regenerate_id(true)` on customer login; admin gets a brand-new random token per login, never reuses the pre-login value |
| Session theft | `HttpOnly`, `Secure`, `SameSite=Lax`, admin tokens stored hashed, absolute + idle timeout, password change/reset/recovery revokes everything |
| CSRF | per-session token in a header, `hash_equals`, Origin check on unsafe methods, `SameSite=Lax`, no state change on GET, no cross-origin CORS surface at all |
| SQL injection | PDO prepared statements everywhere, `EMULATE_PREPARES=false`, identifiers only from allow-lists, input typed by the validator |
| OTP replay | single use (`used_at`), 10-minute expiry, newest-code-wins, 5 attempts then burned, request cap 3/hour, keyed hash stored |
| OTP / code guessing across accounts | verify and resend use the signed pending cookie for the account and code row; the body cannot name another admin or another code |
| Pending-login cookie forgery | HMAC-SHA256 with `APP_KEY` over admin id, code row id and expiry; tampered or expired values are rejected before lookup |
| User enumeration | identical responses and timing for unknown accounts, forgot-password is always generic, OTP is only offered after a correct password, lockout messages are account-neutral |
| Timing attacks | `password_verify` against a dummy hash for unknown emails, `hash_equals` for tokens and OTPs, no early return before the comparison |
| IP spoofing | `REMOTE_ADDR` is the default; `X-Forwarded-For` is read only when the immediate peer is listed in `APP_TRUSTED_PROXIES`, and only to the right of that proxy |
| Token leakage in logs | tokens, OTPs and passwords never logged; only their presence or failure is logged; mail log is private and local-only |
| Clickjacking / MIME sniffing | `X-Frame-Options: DENY` on admin, `nosniff`, `Referrer-Policy` |
| Error-message leakage | fixed JSON codes, SQL and paths only in the private log, no debug output when `APP_DEBUG=0` |
| Cross-app privilege leak | separate hosts, separate bundles, separate cookies, route sets registered per entry point |
| OTP hash weakness | 6-digit codes are stored as HMAC-SHA256 keyed by `APP_KEY`, so a database dump alone cannot be brute-forced offline; an attacker holding both dump and key can, but then password hashes are already exposed |

---

## 13. Proposed slices

Each slice is small, ends with a working tree that can be tested, and does not need the next
slice to be useful. No slice installs a dependency; Composer arrives only in slice 5.

### Slice 1 — Skeleton, config and local dev servers
Files: `server/private/bootstrap.php`, `server/private/Config/Env.php`,
`server/private/Config/Config.php`, `server/private/Core/Autoloader.php`,
`server/web-storefront/api/index.php`, `server/web-admin/api/index.php`,
`server/web-storefront/index.php`, `server/bin/dev-router.php`, `bootstrap-path.php`
(git-ignored), `.env.example`, `.gitignore` additions, `server/private/var/.gitignore`.
Test: `php -l` on every file; start both `php -S` commands and get the JSON envelope from
`/api/health` on 8080 and 8081; delete a required key and confirm a clean server error, not a
stack trace; confirm `server/private/` is unreachable over HTTP; curl `/api/health` on the
admin port for a storefront-only route and get 404.
Could go wrong: a path that only works on Windows; `.env` accidentally committed; the dev
router swallowing static assets; the two entry points registering the same routes; PHP
version below 8.2 on the host.

### Slice 2 — Database, IST clock, health checks
Files: `server/private/Core/Connection.php`, `server/private/Core/Clock.php`,
`server/bin/health.php`, local-only detail in the health handler.
Test: `php server/bin/health.php` reports `utf8mb4`, `+05:30`, and a DB `NOW()` matching PHP's
IST time to the second; with `APP_ENV=local`, `/api/health` adds `checks`; with
`APP_ENV=staging`, the same URL returns exactly `{"ok":true}`; run the same DB check from
`server/bin/app.php`; confirm a bad password yields a generic error and one private log line.
Could go wrong: forgetting `SET time_zone` in the CLI path; the host not supporting
`utf8mb4_unicode_ci`; PDO MySQL extension missing; credentials with special characters that
the hand-written `.env` parser mangles; health detail leaking on production because `APP_ENV`
was left as `local`.

### Slice 3 — Router, JSON, errors, headers
Files: `server/private/Core/Router.php`, `Request.php`, `Response.php`, `Json.php`,
`ClientIp.php`, `Http/ErrorHandler.php`, `.htaccess` for both web roots, security headers
middleware.
Test: unknown path → 404, wrong method → 405 with `Allow`, oversized body → 413, malformed
JSON → `validation_failed`, 500 path returns a request ID while the log has the detail, a
foreign `Origin` on POST → `csrf_failed`, no `Access-Control-Allow-Origin` header on any
response.
Could go wrong: rewrite rules not applied on LiteSpeed; `PATH_INFO` differences; headers
duplicated by the host; `index.php` reachable at both `/` and `/api/`; the dev router and
`.htaccess` disagreeing on routing.

### Slice 4 — Validation, CSRF, throttle primitives
Files: `server/private/Support/Validator.php`, `Normaliser.php`, `Auth/Policy.php`,
`Http/Csrf.php`, `Auth/Throttle.php`, `Repositories/LoginAttempts.php`.
Test: CLI checks for email/phone normalisation and every validator rule, including a password
of 12 characters, 12 multi-byte characters, 72 bytes exactly and 73 bytes on bcrypt, and 129
characters on Argon2id; a POST without the CSRF header fails; 6 rapid failures lock the
identifier; 21 from one IP block; none of this touches a file bucket because there is none.
Could go wrong: a CSRF token that never rotates; counting successes as failures; throttle
queries missing the index and scanning; the 72-byte rule counting characters instead of
bytes, or crashing on a long password instead of rejecting it.

### Slice 5 — Mailer and password helpers (Composer first)
Files: `server/private/Mail/Mailer.php`, `EmailMessage.php`, `LogTransport.php`,
`SmtpTransport.php`, `Templates/*.php`, `server/private/Auth/Password.php`,
`server/private/Core/Ids.php`, `composer.json`, `composer.lock` (created only when the owner
installs Composer and PHPMailer).
Test: send a template through the log transport and inspect the file in
`server/private/var/mail`; confirm the directory is not web-reachable; hash/verify/rehash
round-trip for both algorithms; confirm Argon2id availability on XAMPP and on Hostinger's PHP
build; with `MAIL_TRANSPORT=smtp` and no `vendor/`, confirm the clear dependency error.
Could go wrong: Composer missing (the whole slice stalls until the owner installs it — the log
transport must keep working without it); a `composer.json` with an unpinned version; OTP codes
ending up in the app log; SMTP blocked by the host; a mail file left world-readable.

### Slice 6 — Setup, recovery and activity log
Files: `server/bin/create-admin.php`, `server/bin/reset-admin-password.php`,
`server/private/Auth/AdminUsers.php`, `server/private/Support/ActivityLog.php`,
`SETUP_ALLOWED` and `RECOVERY_ALLOWED` guards.
Test: setup with no row → one admin created, hash verifies, activity row written; setup again
→ refused; setup from the web SAPI → refused; setup with an 11-character password → refused;
recovery with `RECOVERY_ALLOWED=0` → refused; recovery with the flag on → hash replaced, all
sessions and trusted devices gone, `admin.password.recovered` row written, no email sent;
`admin_users` count stays exactly one.
Could go wrong: a script running under the web server; a weak or over-long password accepted
because the check lives only in the UI; the activity log writing a hash or password; a flag
left on after use; recovery silently keeping a session alive.

### Slice 7 — Policy, sessions, lockout, middleware (CLI only, no routes)
Files: `server/private/Auth/AdminSessions.php`, `Auth/Throttle.php`,
`server/private/Repositories/AdminSessions.php`, `Repositories/LoginAttempts.php`,
`server/private/Http/Middleware/AdminAuth.php`, `server/private/Core/ClientIp.php`,
`server/bin/test-auth-cli.php`.
Test: a CLI harness creates a session row for the seeded admin and asserts a valid token
resolves; a tampered token fails; an `expires_at` in the past returns `session_expired`; a
`created_at` older than 12 hours expires even with a fresh `expires_at`; the sliding refresh
stops at the absolute cap; 5 failures lock the identifier and 20 from one IP block it; the
middleware rejects missing, expired and revoked tokens; proxy resolution returns the
right-most untrusted address only when the peer is trusted. On staging (slice 10), one login
attempt from a phone is checked against the phone's public IP.
Could go wrong: a session that can be fixed by the pre-login value; lockout counting across
account types; cookies shared with the customer session on localhost; the sliding refresh
turning into an unlimited session; trusting `X-Forwarded-For` from any caller and letting an
attacker choose their own IP.

**No route exists in this slice.** There is no temporary "login without OTP" path anywhere in
the design.

### Slice 8 — Login, OTP, resend and logout (OTP from the first commit)
Files: `server/private/Auth/AdminLogin.php`, `Auth/Otp.php`, `Auth/AdminDevices.php`,
`Auth/PendingLogin.php`, `Repositories/AdminOtpCodes.php`,
`Repositories/AdminTrustedDevices.php`, `Http/Routes/AdminAuthRoutes.php`,
`Http/Middleware/PendingLogin.php`, `Mail/Templates/admin-otp.php`.
Test: correct password on a new device → 202, a `SARM_ADMIN_PENDING` cookie and a mail file;
verify with the code and no email in the body → session and device cookies; verify without
the pending cookie, with a tampered cookie, or after 10 minutes → `otp_expired`; the code
works once and a second try fails; 5 wrong tries burn it; resend replaces the code and the
pending cookie and the old code no longer works; a 4th resend in an hour is refused; a valid
device skips the OTP; a 31-day-old device is challenged again; logout deletes the session row
but keeps the device; `sarmelle.com/api/admin/...` is 404.
Could go wrong: the pending cookie making a cross-account verify possible; the OTP hash not
being keyed; resend leaving two valid codes; the code surviving a "burn"; the device cookie
readable by JavaScript; the device token not scoped to the admin row; a 202 response leaking
whether the account exists (it must only ever follow a correct password).

### Slice 9 — Forgot password, change password, timeouts
Files: `server/private/Auth/PasswordReset.php`, routes `forgot-password`, `reset-password`,
`change-password`, password templates; timeout enforcement in `AdminAuth`.
Test: reset with a valid code changes the hash and deletes all sessions and devices; the old
password fails; a reused code fails; an unknown email returns the same body and a similar
response time; change-password forces re-login everywhere; an idle session over 30 minutes and
a session over 12 hours both return `session_expired`.
Could go wrong: reset not revoking sessions (the whole point of the DB table); an enumeration
difference in status or timing; the generic message accidentally differing by branch; timeouts
computed from the wrong clock or a browser-supplied timestamp.

### Slice 10 — Integration and deployment check
Files: only wiring and tests — the Vite `/api` proxy target, `docs/MILESTONE4_DESIGN.md`
status update, a manual test sheet, Hostinger docroot and permission notes.
Test: full click-through on `php -S` with 8080/8081 and Vite on 3000; confirm no CORS headers
and no preflight are involved; then the same on staging with `MAIL_TRANSPORT=smtp` (after
Composer and PHPMailer) and one real address; verify `REMOTE_ADDR`/`APP_TRUSTED_PROXIES` from
a phone; confirm `SETUP_ALLOWED=0` and `RECOVERY_ALLOWED=0`; confirm no admin route answers on
the storefront host; confirm logs are outside the web root; confirm staging and production use
separate databases and secrets.
Could go wrong: staging sharing production's `.env`; cookies with `Secure` on an HTTP staging
host (login silently fails); Hostinger's mail rate limits; `server/bin/` still uploaded;
`X-Forwarded-For` still untrusted after the proxy check, so every visitor shares one IP and
the per-IP lockout blocks everyone.

Customer auth endpoints (§11) are a separate later slice, after this milestone is reviewed.

---

## 14. Decisions

| # | Question | Decision |
| --- | --- | --- |
| 1 | Session lengths | Confirmed: admin idle 30 minutes, absolute 12 hours, customer 30 days |
| 2 | OTP policy | Confirmed: 6 digits, valid 10 minutes, 5 tries, 3 requests per hour |
| 3 | Password rules | Length only: 12 characters minimum, no breached-password list |
| 4 | Account recovery | Through `server/bin/reset-admin-password.php`; no second mailbox required |
| 5 | Mail provider | A Hostinger mailbox, chosen at deployment; DNS stays at GoDaddy |
| 6 | PHPMailer timing | Allowed in slice 5, after the owner installs Composer |
| 7 | Hashing | Argon2id when the PHP build supports it, otherwise bcrypt cost 12 |
| 8 | Rate-limit table | None added; non-auth throttling is deferred |
| 9 | Roadmap naming | The backend foundation is Milestone 4 (noted at the top of `TODO.md`; nothing else renumbered) |
| 10 | Local ports | Storefront 8080, admin 8081, Vite 3000; no hosts-file entry |
| 11 | Staging admin | Its own admin account and its own mailbox; never production credentials |
| 12 | Failed logins in the audit trail | Stay in `login_attempts` and the security log, not `activity_log` |
| 13 | Change password | Logs out everywhere, including the current browser |

---

## Status

- Branch: `refactor/split-app`
- Last 3 commits: `74e5697` docs: rejected return shipment flow · `2cc0688` docs: database design final tidy and index · `ffdb72c` docs: database design part B2b
- Files changed: `docs/MILESTONE4_DESIGN.md` (revised), `TODO.md` (one naming note)
- Git status: only the two documentation files in this commit; no other changes
