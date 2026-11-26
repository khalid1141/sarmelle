#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
mysql -h 127.0.0.1 -P 3307 -u sarmelle -psarmelle_local_dev -e "DROP DATABASE IF EXISTS sarmelle_db; CREATE DATABASE sarmelle_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -h 127.0.0.1 -P 3307 -u sarmelle -psarmelle_local_dev sarmelle_db < db/schema_draft.sql
mysql -h 127.0.0.1 -P 3307 -u sarmelle -psarmelle_local_dev sarmelle_db < db/migrations/001_read_api.sql
mysql -h 127.0.0.1 -P 3307 -u sarmelle -psarmelle_local_dev sarmelle_db < db/seed.sql
echo "Reset complete."
