<?php
declare(strict_types=1);

/**
 * Shared CLI bootstrap: loads .env, opens the database and exposes the IST clock.
 *
 * CLI scripts require this file. Running it directly performs the same detailed
 * checks as server/bin/health.php, so the CLI database path is exercised too.
 */

use Sarmelle\Config\Config;
use Sarmelle\Core\Connection;

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

require_once dirname(__DIR__) . '/private/bootstrap.php';

if (!function_exists('sarmelle_cli_private_root')) {
    function sarmelle_cli_private_root(): string
    {
        return dirname(__DIR__) . '/private';
    }

    function sarmelle_cli_config(): Config
    {
        static $config = null;

        if (!$config instanceof Config) {
            $config = Config::load(sarmelle_cli_private_root());
        }

        return $config;
    }

    function sarmelle_cli_connection(): \PDO
    {
        static $connection = null;

        if (!$connection instanceof \PDO) {
            $connection = Connection::open(sarmelle_cli_config());
        }

        return $connection;
    }
}

// health.php requires this file, so only run the checks when app.php itself is
// the script: that keeps the two entry points from calling each other in a loop.
if (
    isset($_SERVER['SCRIPT_FILENAME'])
    && realpath((string) $_SERVER['SCRIPT_FILENAME']) === realpath(__FILE__)
) {
    require __DIR__ . '/health.php';
}
