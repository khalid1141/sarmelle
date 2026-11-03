# Sarmelle — Operations & Deployment Manual

## Local Environment Setup
1. **Prerequisites:** XAMPP (PHP 8.2+, MySQL 10.4+), Git, VS Code.
2. **Database:** Access phpMyAdmin at `http://localhost/phpmyadmin`, create database `sarmelle_db`.
3. **Configuration:** Copy `.env.example` to `.env` and configure local database credentials.

## Deployment to Hostinger Shared Hosting
1. **Subdomains & Domains:**
   - Staging: `stag.sarmelle.com` -> points to `/public_html/staging/`
   - Production: `sarmelle.com` -> points to `/public_html/`
   - Admin: `admin.sarmelle.com` -> points to `/public_html/admin/` (or routed via `/admin`)
2. **DNS Management:** Configured via GoDaddy DNS pointing to Hostinger nameservers/A records, preserving existing MX records.
3. **Backups & Recovery:** Weekly automated database backups and file snapshots via Hostinger control panel. Rollback plans documented per release.
