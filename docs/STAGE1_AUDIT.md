# Stage 1 Security Audit — Milestone 4 Backend (Slices 1–4)

- **Branch:** `refactor/split-app`
- **HEAD at audit time:** `b8a11ac` (`fix: table order in schema draft, no FK check bypass`)
- **Scope:** `server/**`, `db/schema_draft.sql`, `.gitignore`, `HANDOVER.md`, and `docs/MILESTONE4_DESIGN.md` §1–6, §12, slices 1–4.
- **Method:** code was read directly, not comments or earlier reports. `server/private/Config/.env` was **not** opened; only the directory entry name was observed.
- **Verdicts:** PASS, FAIL or UNSURE per item, with file:line evidence.

## Verdict summary

| # | Item | Verdict |
| --- | --- | --- |
| 1 | SQL construction and prepared statements | **PASS** |
| 2 | PDO options, IST time zone on every connection, no credential/DSN leak | **PASS** |
| 3 | No ad-hoc date/time outside `Core/Clock.php` | **PASS** |
| 4 | Public health endpoint is exactly `{"ok":true}` and DB-free outside local | **PASS** |
| 5 | No traces/SQL/paths in responses; one log line per error with request ID | **FAIL** |
| 6 | No secrets in logs or error text | **PASS** (with a defence-in-depth caveat) |
| 7 | `.env` parsing and production/staging refusals | **PASS** (loading is broken on case-sensitive hosts — see item 16) |
| 8 | Router separation, path bypasses, dev-router/`.htaccess` parity | **FAIL** |
| 9 | Origin, `hash_equals`, no CORS, no state change on GET | **PASS** |
| 10 | Client IP cannot be spoofed without a trusted peer | **PASS** |
| 11 | Validator behaviour on unknown keys, bytes/chars, huge/invalid input | **PASS** (one 500 edge case noted) |
| 12 | Throttle window, failures only, separate IP/identifier limits, index use | **PASS** (fixed 15-minute lockout not implemented — see item 16) |
| 13 | PHP 8.2 compatibility | **PASS** |
| 14 | `.gitignore` and tracked files | **PASS** (one non-secret repo-hygiene item) |
| 15 | Schema FK order and no `FOREIGN_KEY_CHECKS` bypass | **PASS** |
| 16 | Anything contradicting the design document | **FAIL** |

---

## 1. SQL construction — PASS

- `server/private/Repositories/LoginAttempts.php:36-40` inserts with `prepare()` and four bound values.
- `LoginAttempts.php:54-58` and `LoginAttempts.php:72-76` count with `prepare()` and bound values; the only interpolated text is the static SQL fragment.
- `server/private/Core/Connection.php:106-111`, `127`, `152`, `160`, `170-173` use `query()` only with constant SQL and no variables.
- `server/private/Core/Connection.php:77-79` uses `exec()` with validated constants (`Config::TIMEZONE_OFFSET`, `REQUIRED_SQL_MODE`); no user input.
- `server/bin/db-selftest.php:91-101` builds `?` placeholder lists from array counts, not from request data, then binds the values. That is safe.
- The only varying identifier set is `LoginAttempts::ACCOUNT_TYPES` (`LoginAttempts.php:18`), enforced by `assertAccountType()` (`LoginAttempts.php:88-93`).
- No `ORDER BY`, table name or column name is taken from input anywhere under `server/`.

**Verdict: PASS.**

## 2. PDO options, time zone, connection-error handling — PASS

- `server/private/Core/Connection.php:39-46` sets `ERRMODE_EXCEPTION`, `EMULATE_PREPARES=false`, `STRINGIFY_FETCHES=false`, `FETCH_ASSOC`, `PERSISTENT=false`, short timeout.
- `Connection.php:77` runs `SET time_zone = '+05:30'` and `Connection.php:78-79` runs `SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci` and strict `sql_mode` on every `open()`.
- `Connection::open()` is the only place a PDO is constructed: the only `new PDO` in `server/` is `Connection.php:58`. Web (`web-storefront/api/index.php:62`, `web-admin/api/index.php:62`), CLI (`server/bin/app.php:43`) and the DB self-test (`server/bin/db-selftest.php:68` → `sarmelle_cli_connection()`) all go through it. `server/bin/selftest.php` opens no database.
- `Connection.php:64-74` catches the constructor `PDOException`, logs only a sanitised SQLSTATE (line 67-71), and throws `new \RuntimeException('Database connection failed.')` (line 73) without the previous exception. The DSN and password are not logged or exposed.
- `Connection.php:89-96` guards the PHP 8.4 `Pdo\Mysql::ATTR_SSL_CA` with `class_exists()` and falls back to `PDO::MYSQL_ATTR_SSL_CA`.
- Caveat: the three `exec()` calls at lines 77-79 are outside the `try`. If one fails, a raw `PDOException` reaches the router; the response is still generic, but the log line comes from `ErrorHandler` and may contain the SQL statement (not credentials or the DSN). See Top risks.

**Verdict: PASS.**

## 3. No ad-hoc date/time outside Clock — PASS

- A repository-wide search for `date(`, `time(`, `new DateTime`, `DateTime::`, `microtime` and `strtotime` under `server/*.php` returns only the explanatory comment at `server/private/Core/Clock.php:11`.
- `Clock.php:19` creates the only `DateTimeZone`; `Clock.php:24` the only `DateTimeImmutable`; `Clock.php:38` uses `DateTimeImmutable::createFromFormat`.
- `server/private/bootstrap.php:9` calls `date_default_timezone_set('Asia/Kolkata')`, which is a process setting, not a "now" read, and is required by design §3.
- `LoginAttempts.php:82-86` derives the cutoff through `Clock::now()`.

**Verdict: PASS.**

## 4. Public health endpoint — PASS

- `server/web-storefront/api/index.php:57-65` and `server/web-admin/api/index.php:57-65` register `GET /api/health`.
- Both handlers return `Response::raw(['ok' => true])` immediately when `!$config->isLocal()` (lines 58-60); the database is touched only in the local branch (line 62).
- `Response::raw()` serialises the exact array (`server/private/Core/Response.php:34-37`, `109-115`), so the staging/production body is `{"ok":true}` with no checks, versions or paths.
- `SecurityHeaders` only adds headers (`server/private/Http/SecurityHeaders.php:19-28`), it does not alter the body.
- The detailed CLI path is separate (`server/bin/health.php:23-46`).

**Verdict: PASS.**

## 5. Error responses and logging — FAIL

What holds:

- `ErrorHandler::serverError()` (`server/private/Http/ErrorHandler.php:95-121`) always builds the generic `server_error` envelope and adds `debug` data only when `$debug` is true (lines 110-118).
- `Router::dispatch()` catches every `Throwable` and routes it through that method (`server/private/Core/Router.php:95-100`).
- `bootstrap.php:41-83` also keeps the web body generic and adds detail only when `SARM_DEBUG === true` (lines 42, 71-79).
- Validation, 404, 405, 413 and CSRF bodies contain only codes, messages, field **names** and request IDs (`ErrorHandler.php:58-93`, `126-149`).

Why the item fails:

1. **Two log lines for one database connection error.** `Connection.php:69-71` writes one line containing the SQLSTATE; the thrown `RuntimeException` is then caught by the router and `ErrorHandler.php:151-159` writes a second line. Design slice 2 explicitly expects "a generic error and one private log line" (`docs/MILESTONE4_DESIGN.md:666`). The first line also has no request ID.
2. **The last-resort handler logs without a request ID.** `server/private/bootstrap.php:44-50` logs class, message, file and line but no request ID, although the design requires the detail to be logged with the request ID (`docs/MILESTONE4_DESIGN.md:226-227`).
3. **The "not configured" path logs nothing.** Both entry points return a 500 without calling `ErrorHandler` or any logger: `server/web-storefront/api/index.php:20-30` and `server/web-admin/api/index.php:20-30`. That is an error with zero log lines and no `request_id` in the envelope.
4. **Notice logging has no request ID.** `bootstrap.php:32` logs notices/warnings with file and line only.

The non-leak half of the item does hold: with `APP_DEBUG=0`, no stack trace, SQL text or file path is placed in a response.

**Verdict: FAIL** (logging-count/request-ID requirement; response-leak requirement passes).

## 6. Secrets in logs and error text — PASS

Every logging/output site was inspected:

| Site | What is written |
| --- | --- |
| `server/private/bootstrap.php:32` | PHP notice/warning message, file, line |
| `server/private/bootstrap.php:44-50` | Unhandled exception class, message, file, line |
| `server/private/Http/ErrorHandler.php:159` | Request ID, error code, and class/message/file/line for 500s; field names, path, Origin or `Allow` for other errors |
| `server/private/Core/Connection.php:69-71` | SQLSTATE only |
| `server/bin/health.php:33-35` | Exception message to `error_log` and STDERR |
| `server/bin/db-selftest.php:38` | Test failure message to stdout (CLI only) |

- `DB_PASSWORD` is only passed to the PDO constructor (`Connection.php:60-62`) and is never logged.
- `APP_KEY` is only base64-decoded and length-checked (`server/private/Config/Config.php:463-470`); it is never logged.
- `MAIL_PASSWORD` is only read for emptiness validation (`Config.php:448-451`).
- No password, OTP or token value is placed in a validation message: `Validator.php:251-280` returns fixed strings, and `ValidationException.php:18-22` stores only field→message pairs. The self-test confirms this at `server/bin/selftest.php:839-855`.
- `Csrf` tokens live in `$_SESSION` (`server/private/Http/Csrf.php:19-20`) and are never logged.
- `health.php:26-29` prints the environment and database host/port/name to **CLI stdout**, not to a web response and not a password. Worth redacting in CI, but not a secret.

Caveat: the fallback handler logs arbitrary exception messages (`bootstrap.php:44-47`). Current code never puts a secret in an exception message, but future code could. This is a defence-in-depth issue, not a present leak.

**Verdict: PASS.**

## 7. `.env` parsing and production/staging refusals — PASS

- **Special characters:** `server/private/Config/Env.php:84-134` handles quoted values, escaped quote/backslash, comments only after whitespace, and rejects unterminated quotes or trailing text.
- **Duplicates:** `Env.php:59-63` throws on a duplicate key.
- **Unknown keys:** `Config.php:121-137` throws and suggests the closest known key.
- **Missing required keys:** `Config.php:115-119` throws a named-key error before any output.
- **`APP_DEBUG=1` in production:** refused at `Config.php:319-321`.
- **`.env` in a web root or `DOCUMENT_ROOT`:** `Config.php:163-201` refuses both, including a private tree accidentally placed under `public_html`.
- **`COOKIE_SECURE=0` in staging/production:** refused at `Config.php:331-336`.
- **Non-https `APP_URL`/`ADMIN_URL` in staging/production:** refused at `Config.php:338-345`.
- **`MAIL_TRANSPORT=log` in production:** refused at `Config.php:409-413`.
- **`SETUP_ALLOWED`/`RECOVERY_ALLOWED` from the web SAPI:** refused at `Config.php:383-387` and `Config.php:420-434`.

Operational caveat: `Config::load()` hardcodes `$root . '/config/.env'` (`Config.php:91`, also the comment at line 9 and the error text at line 97), but the real directory in the repository is `server/private/Config/` and the real file is `server/private/Config/.env` (uppercase). Windows and macOS are case-insensitive, so it loads locally; Linux/Hostinger is case-sensitive, so it will fail closed with "Configuration file is missing". That is item 16 and Top risk #1.

**Verdict: PASS for the listed checks.** The path-case defect prevents loading, but it does not bypass any guard and it fails closed.

## 8. Router separation, path bypasses, dev-router/`.htaccess` parity — FAIL

What holds:

- The route table is exact method + path: `Router.php:59-72`; unknown path → 404, known path/wrong method → 405 with `Allow`.
- `Request.php:41-48` collapses trailing slashes with `rtrim`, and `Router::add()` does the same (`Router.php:38`). Therefore `/api/health/` matches `/api/health`; that is a deliberate (if undocumented) trailing-slash rule, not a bypass.
- Double slashes (`/api//health`), percent-encoded separators (`/api%2Fhealth`) and `..` segments are **not** normalised in PHP. They simply fail the exact map lookup and become 404. No route is reached by an alternative spelling.
- The two entry points are separate files with separate route registrations; `web-storefront` uses `appUrl()` (`web-storefront/api/index.php:55`) and `web-admin` uses `adminUrl()` (`web-admin/api/index.php:55`).

Why the item fails:

1. **The route sets are not demonstrably different.** Both entry points register only `GET /api/health` (`web-storefront/api/index.php:57-65`, `web-admin/api/index.php:57-65`). Design §1 (`docs/MILESTONE4_DESIGN.md:73-77`) and the slice-1 test (`docs/MILESTONE4_DESIGN.md:655`) require a storefront-only route to return 404 on the admin host. No such route exists yet, so cross-host route isolation is unproven.
2. **The dev router and `.htaccess` differ for real files under `/api/`.** `server/bin/dev-router.php:38-48` sends every `/api` or `/api/*` request to `api/index.php`, regardless of whether a real file exists. `server/web-storefront/.htaccess:16-17` and `server/web-admin/.htaccess:16-17` rewrite only when `REQUEST_FILENAME` is not a file, so a real file under `/api/` is served statically in Apache/LiteSpeed but not by the dev router. This is exactly the disagreement design slice 3 warns about (`docs/MILESTONE4_DESIGN.md:681-682`).

**Verdict: FAIL** (parity and demonstrable separation; no path-bypass was found).

## 9. Origin, CSRF, CORS, GET — PASS

- Origin checking is in `Router::checkUnsafe()` (`Router.php:103-126`) and `originAllowed()` (`Router.php:128-141`). A mismatched foreign `Origin` returns `csrf_failed` (`Router.php:111-115`); an absent `Origin` is accepted on unsafe methods, which matches design §4 (`docs/MILESTONE4_DESIGN.md:303-307`).
- Customer CSRF uses `hash_equals` (`server/private/Http/Csrf.php:40`); admin double-submit uses `hash_equals` (`Csrf.php:62`).
- No CORS headers exist: the only `Access-Control` references are test assertions (`server/bin/selftest.php:563-570`, `653`). `SecurityHeaders.php:17-29` sets only `Cache-Control`, `X-Content-Type-Options`, `Referrer-Policy` and (admin) `X-Frame-Options`.
- The only registered route is `GET /api/health`, which performs read-only checks (local diagnostics or no-op). No GET handler changes state.
- CSRF tokens are primitives only in this slice and are not yet attached to routes; design slice 4 expects exactly that (no routes).

**Verdict: PASS.**

## 10. Client IP spoofing — PASS

- `server/private/Core/ClientIp.php:25-29` returns `REMOTE_ADDR` immediately when the trusted-proxy list is empty or the peer is not in it. `X-Forwarded-For` is not read in that case.
- `ClientIp.php:31-53` walks `X-Forwarded-For` right-to-left and returns the first address that is not itself a trusted proxy; invalid candidates are skipped.
- `forRequest()` passes `REMOTE_ADDR` and the `x-forwarded-for` header (`ClientIp.php:56-63`).
- Trusted entries are parsed only as literal IPs (`ClientIp.php:68-80`). Caveat: no CIDR support; if the host uses a proxy range, every proxy IP must be listed exactly.

**Verdict: PASS.**

## 11. Validator — PASS

- **Unknown keys rejected:** `server/private/Support/Validator.php:44-56` adds "This field is not allowed." for any key not in the rule set. Long/binary keys are truncated safely or replaced with `input`; `mb_check_encoding` guards the truncation (lines 48-52).
- **Byte vs character rules:** the minimum uses characters (`mb_strlen`, `Validator.php:261-265`); bcrypt uses `strlen` (bytes) and a 72-byte cap (`Validator.php:267-273`); Argon2id uses characters and a 128-character cap (`Validator.php:275-277`). The 4096-byte defensive ceiling and UTF-8 check run before the hash rules (`Validator.php:251-260`).
- **Huge input:** the request body is capped by `MAX_JSON_BYTES` (`Request.php:78-79`, `Router.php:55-57`), and the password path rejects anything over 4096 bytes before `mb_*` work (`Validator.php:253-255`).
- **Invalid UTF-8:** the password path rejects it explicitly (`Validator.php:257-259`); `charLength()` returns `PHP_INT_MAX` instead of crashing (`Validator.php:282-287`); `Normaliser::name()` returns `null` for a failed `/u` match (`Normaliser.php:53-55`).
- **Errors never echo passwords/OTPs:** `passwordError()` returns fixed strings (`Validator.php:251-280`); OTP/email/phone messages are fixed (`Validator.php:139-148`); `ValidationException` stores no submitted values.
- Edge case: a `regex:` rule whose pattern is valid but whose input is invalid UTF-8 makes `preg_match()` return `false`, which `Validator.php:181-183` treats as an invalid **rule** and throws `InvalidArgumentException` → generic 500. This is not a crash or a leak, but a malformed request should be a 422, not a 500.

**Verdict: PASS** (edge case in Top risks).

## 12. Throttle and LoginAttempts — PASS

- **Failures only:** both count queries filter `is_success = 0` (`server/private/Repositories/LoginAttempts.php:56`, `74`); successes are inserted but never counted (`LoginAttempts.php:40`).
- **Window:** `cutoff()` subtracts the window from `Clock::now()` and formats IST (`LoginAttempts.php:81-86`); the SQL compares `created_at >= ?` (`LoginAttempts.php:56`, `74`).
- **Separate limits:** identifier count uses `account_type + identifier` (`LoginAttempts.php:54-58`); IP count uses `ip` (`LoginAttempts.php:72-76`). `Throttle::check()` checks identifier first, then IP (`server/private/Auth/Throttle.php:38-49`).
- **Constants:** 5/15 min and 20/60 min are fixed in `server/private/Auth/Policy.php:12-17`, matching design §6 (`docs/MILESTONE4_DESIGN.md:395-396`).
- **Index use:** `login_attempts` has `(account_type, identifier, created_at)` and `(ip, created_at)` (`db/schema_draft.sql:432-433`). Both count queries can use the leading columns and the time range.
- Caveat: design says "5 in 15 min → **lock 15 min**" (`docs/MILESTONE4_DESIGN.md:395`). The implementation is a sliding count, not a fixed lock from the fifth failure, and `Policy::LOCKOUT_MINUTES` (`Policy.php:14`) is never read. Five failures spread over 14 minutes unlock as soon as the oldest one ages out — potentially one minute after the fifth. This is recorded under item 16 and Top risks #2.

**Verdict: PASS for the listed window/index mechanics**, with the lock-duration discrepancy tracked separately.

## 13. PHP 8.2 compatibility — PASS

- No syntax or function from 8.3+ was found. The code uses `readonly` properties (8.1), `match`, `str_starts_with`, `array_key_exists`, `mb_*`, `random_bytes`, `hash_equals` and `JSON_THROW_ON_ERROR` — all available in 8.2.
- The only 8.4-specific symbol is `\Pdo\Mysql`, and it is used safely: `Connection.php:91-95` calls `class_exists(\Pdo\Mysql::class)` and only evaluates `\Pdo\Mysql::ATTR_SSL_CA` inside the true branch. `::class` is a compile-time string and does not require the class to exist in 8.2.
- `PDO::MYSQL_ATTR_SSL_CA` (line 95) exists in 8.2.
- `php -l` on every one of the 29 PHP files under `server/` reported 0 failures (local binary: PHP 8.5.12; syntax is a subset of 8.2).

**Verdict: PASS.**

## 14. `.gitignore` and tracked files — PASS

- `.gitignore:6` ignores `*.log`.
- `.gitignore:7-8` ignores `.env*` but keeps `.env.example`.
- `.gitignore:11-14` explicitly ignores both `config/.env` and `Config/.env` plus `.env.*` in both cases.
- `.gitignore:15-16` ignores `server/web-storefront/bootstrap-path.php` and `server/web-admin/bootstrap-path.php`.
- `.gitignore:17-18` ignores `server/private/var/*` except the tracked `server/private/var/.gitignore`.
- `.gitignore:19` ignores `*.eml`.
- `git ls-files` contains no `.env`, no real `bootstrap-path.php`, no `var/` contents and no `.eml`.
- Suspicious but not secret: `.aistudio/artifacts/brain/.../media_*.png` (two tracked PNG artefacts). They are repo-hygiene noise, not credentials.

**Verdict: PASS.**

## 15. Schema FK order — PASS

- `db/schema_draft.sql` contains **no** `FOREIGN_KEY_CHECKS` statement (repository search: no matches).
- The file defines 44 tables in dependency order. All 63 `REFERENCES` targets are either the same table or a table created earlier:
  - `categories` → itself (`schema_draft.sql:36`), the only self-reference.
  - `size_chart_cells` → `size_chart_rows` (144) and `size_chart_columns` (156), both before 168.
  - `products` (181) references `categories` (22), `size_charts` (134), `set_types` (119), `fabrics` (59), `occasions` (71), `fits` (83), `sleeve_types` (95), `neck_types` (107).
  - `orders` (529) references `customers` (325) and `couriers` (467).
  - `stock_movements` (826) references `orders` (529), `admin_users` (379), `cancellation_requests` (687), `return_requests` (737), `product_variant_sizes` (298) and `products` (181).
  - `refunds` (873) references `payments` (627), `orders` (529), `admin_users` (379), `cancellation_requests` (687) and `return_requests` (737).
- No forward reference was found.

**Verdict: PASS.**

## 16. Contradictions with the design document — FAIL

1. **`.env` path case.** Design §1 shows the directory as `Config/` (`docs/MILESTONE4_DESIGN.md:36`) but puts the file at `config/.env` (line 45); §2 repeats `server/private/config/.env` (line 127); `.env.example:2` says the same. The real file is `server/private/Config/.env` (uppercase directory). `Config::load()` uses the lowercase path (`Config.php:91`). Design line 119 explicitly requires "Linux-case-sensitive filenames", so on Hostinger this cannot load. It fails closed, but the deployment cannot start.
2. **Missing storefront entry point.** Design §1 lists `server/web-storefront/index.php` (line 47) and slice 1 lists it as a file to create (`docs/MILESTONE4_DESIGN.md:650`). `git ls-files` shows only `server/web-storefront/.htaccess`, `server/web-storefront/api/index.php` and the example bootstrap path. There is no `index.php` (and no built `index.html` in the repo). `/` therefore depends entirely on build output that is not present.
3. **Route sets are identical, not different.** Design §1 says the two entries "register **different route sets**" and a storefront route on the admin host must 404 (lines 73-77). Both entries currently register only `GET /api/health` (`web-storefront/api/index.php:57-65`, `web-admin/api/index.php:57-65`), so the required 404 cannot be demonstrated.
4. **Lockout duration.** Design §6 says "5 in 15 min → lock 15 min" (`docs/MILESTONE4_DESIGN.md:395`). `Throttle::isIdentifierLocked()` (`Throttle.php:19-23`) recomputes a sliding 15-minute count; `Policy::LOCKOUT_MINUTES` (`Policy.php:14`) is unused. The lock can end before 15 minutes have elapsed since the fifth failure.
5. **"One private log line" on a bad database password.** Design slice 2 expects one line (`docs/MILESTONE4_DESIGN.md:666`). The code writes one line in `Connection.php:69-71` and a second in `ErrorHandler.php:151-159` when the generic `RuntimeException` reaches the router. Design §3 requires the SQL detail to be logged with the request ID (`docs/MILESTONE4_DESIGN.md:226-227`); the first line has no request ID.
6. **Dev router vs `.htaccess`.** Design slice 3 lists "the dev router and `.htaccess` disagreeing on routing" as a risk (`docs/MILESTONE4_DESIGN.md:681-682`). They do disagree for real files under `/api/`: `dev-router.php:38-48` always routes to `api/index.php`; `.htaccess:16-17` leaves real files static.
7. **Trailing-slash rule is unspecified in code.** Design §4 requires an "exact trailing-slash rule" (`docs/MILESTONE4_DESIGN.md:256`). `Request.php:43-45` and `Router.php:38` silently accept a trailing slash. This is consistent between the two, but the design never states which behaviour is intended and no test pins it.
8. **Staging debug is allowed.** Design §2 says `APP_DEBUG` is `1` local and `0` elsewhere (line 148) and "never `1` in production" (line 137). `Config.php:319-321` refuses only production; staging with `APP_DEBUG=1` starts and returns debug traces (`ErrorHandler.php:110-118`).

**Verdict: FAIL.**

---

## Top risks (severity order)

1. **High — `.env` cannot be loaded on a case-sensitive host.** `Config::load()` looks for `config/.env` (`Config.php:91`), but the deployed directory is `Config/` and the real file is `Config/.env`. Windows hides the bug; Hostinger/Linux will fail every request with "Configuration file is missing". Fail-closed, but a launch blocker.
2. **High — the 15-minute lockout is not actually a 15-minute lock.** The throttle is a sliding count (`Throttle.php:19-23`, `LoginAttempts.php:54-58`) and `LOCKOUT_MINUTES` is unused (`Policy.php:14`). An attacker who spaces five failures across the window can retry almost immediately after the fifth, weakening the brute-force control in design §12.
3. **Medium — duplicate and unlabelled error logs.** A database connection failure produces the SQLSTATE line from `Connection.php:69-71` **and** the generic line from `ErrorHandler.php:159`; the first has no request ID. The "not configured" path (`web-*/api/index.php:20-30`) logs nothing, and the fallback handler (`bootstrap.php:44-50`) logs without a request ID. This breaks the design's "one private log line with the request ID" rule and complicates incident tracing.
4. **Medium — dev-router/`.htaccess` divergence under `/api/`.** `dev-router.php:38-48` ignores real files; `.htaccess:16-17` serves them. A file that is harmless in local development (or vice versa) can behave differently in production, and an unexpected upload/living file under `/api/` would be served statically by Apache/LiteSpeed.
5. **Medium — cross-host route isolation is unproven.** Both entries register exactly the same single route, so the design's "storefront route on the admin host → 404" property has never been exercised. The deployment separation is structural only.
6. **Medium — missing `server/web-storefront/index.php`.** The slice 1 deliverable is absent (`git ls-files`, design line 47/650). In production `/` depends on a built `index.html`; if the build is missing or stale, the storefront root has no entry point.
7. **Medium — malformed UTF-8 on a `regex:` rule becomes a 500.** `preg_match()` returns `false`, and `Validator.php:181-183` throws `InvalidArgumentException` ("Invalid validator regex") instead of returning a validation error. Not a leak, but an avoidable server-error path driven by client input.
8. **Low/Medium — staging can run with `APP_DEBUG=1`.** Only production is refused (`Config.php:319-321`); staging responses then include file paths, exception messages and stack traces (`ErrorHandler.php:110-118`). Staging is often internet-reachable.
9. **Low — topology printed by the CLI health check.** `health.php:26-29` prints database host, port and name to stdout. Useful locally; should be redacted or gated in shared CI logs.
10. **Low — notice/unhandled-exception logs omit the request ID.** `bootstrap.php:32` and `bootstrap.php:44-50` cannot correlate a failure with an API request.
11. **Info — path-normalisation assumptions.** PHP normalises only trailing slashes; `//`, `%2f` and `..` rely on the web server plus exact-match 404s. No bypass was found, but the behaviour is not specified or tested.
12. **Info — `APP_TRUSTED_PROXIES` has no CIDR support.** Exact IPs only (`ClientIp.php:68-80`); a proxy range must be enumerated.
13. **Info — tracked AI Studio artefacts.** `.aistudio/artifacts/brain/.../media_*.png` are in `git ls-files`; not secret, but repository noise.
14. **Info — `Config::path()` is only exercised by the self-test.** `SESSION_SAVE_PATH`, `MAIL_LOG_DIR` and `LOG_DIR` are resolved safely in tests (`selftest.php:462-482`), but no runtime session/mail/log code uses them yet; those slices must not read the raw values.

## Suggested fixes (not applied)

1. **Make the `.env` path unambiguous.** Either rename `server/private/Config/` to `config/`, or change `Config::load()` to probe `Config/.env` and `config/.env` (prefer the exact deployed name), and update `.env.example:2`, the error text at `Config.php:97`, design §2, and the slice 1 test. Add a self-test that asserts the on-disk directory name.
2. **Implement a real lockout.** When the fifth failure is recorded, persist or derive a fixed `locked_until` (using `Policy::LOCKOUT_MINUTES`) and make `Throttle::isIdentifierLocked()` honour it; or change design §6 to state that a sliding window is intended. Add a test with failures spread across the 15-minute window.
3. **Log each failure exactly once.** Move the SQLSTATE into a typed exception thrown by `Connection` and let `ErrorHandler` write the single request-ID line; remove the `error_log()` at `Connection.php:69-71`. Give `respondNotConfigured()` a generated request ID and one log line. Generate/pass a request ID into the fallback and notice handlers.
4. **Align the dev router with `.htaccess`.** In `dev-router.php`, before requiring `api/index.php`, serve an existing real file under `/api/` (or remove the `!-f` condition from both `.htaccess` files). Add a parity test for `/api/<real-file>` and `/api/index.php`.
5. **Prove route separation.** Register at least one storefront-only and one admin-only placeholder route (or a route-table assertion in the self-test) so `/api/admin/...` on the storefront and a customer route on admin both return 404. Keep health identical.
6. **Restore or remove `server/web-storefront/index.php`.** If `/` is meant to be served from the built SPA, add the promised entry point or amend design §1/slice 1 and document the build assumption.
7. **Treat invalid UTF-8 as validation, not a rule error.** In `Validator.php:178-191`, check `preg_last_error()`/`mb_check_encoding()` and return a field error; reserve `InvalidArgumentException` for malformed rule definitions.
8. **Restrict debug to local.** Refuse `APP_DEBUG=1` for `staging` as well as `production` (`Config.php:319-321`), or document and monitor staging debug explicitly.
9. **Redact CLI topology.** Gate the `health.php:27-29` host/port/name line behind a `--verbose` flag or omit it in CI.
10. **Add request IDs to CLI/fallback logs.** Use the same `req_...` format so web and CLI incidents can be correlated.
11. **Pin the trailing-slash and path-normalisation rules with tests.** Cover `/api/health/`, `//api/health`, `%2f`, `..`, and encoded dots.
12. **Document proxy expectations.** Add CIDR support to `ClientIp::parseTrusted()` if the host uses a range, or state that exact IPs are required.
13. **Remove the `.aistudio/` artefacts** from the repository unless they are intentional fixtures.
14. **Use `Config::path()` at the point of use** when sessions, mail and file logging arrive, and assert the resolved directory stays inside the private root and is writable.

---

## Status block (at audit time)

```
Branch:         refactor/split-app
HEAD:           b8a11ac fix: table order in schema draft, no FK check bypass
Last 3 commits: b8a11ac fix: table order in schema draft, no FK check bypass
                939a35b fix(server): strict sql_mode and safe connection errors
                32a3cda fix(server): production safety checks in config
Files changed:  docs/STAGE1_AUDIT.md (new, this audit only)
Selftest:       61 passed, 0 failed (php server/bin/selftest.php)
Lint:           29 PHP files, 0 failures (php -l)
Schema check:   44 tables, 63 foreign keys, 1 self-reference, 0 forward references
                (db/schema_draft.sql); no FOREIGN_KEY_CHECKS statements
git status:     clean tracked tree before this file; only docs/STAGE1_AUDIT.md
                is new/untracked
Real .env:      NOT read (server/private/Config/.env); only the directory name
                was observed
```
