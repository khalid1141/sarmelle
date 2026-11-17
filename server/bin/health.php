<?php
declare(strict_types=1);

/**
 * Detailed health checks. CLI only; always runs, on every environment, prints a
 * readable report and exits non-zero on failure.
 *
 *   php server/bin/health.php
 *   php server/bin/app.php   (same checks through the shared CLI bootstrap)
 */

use Sarmelle\Core\Connection;

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

require_once __DIR__ . '/app.php';

echo 'Sarmelle health check' . PHP_EOL;

try {
    $config = sarmelle_cli_config();

    echo 'environment: ' . $config->env() . PHP_EOL;
    echo 'database: ' . $config->string('DB_HOST')
        . ':' . $config->int('DB_PORT')
        . '/' . $config->string('DB_NAME') . PHP_EOL;

    $checks = Connection::diagnostics(sarmelle_cli_connection());
} catch (\Throwable $exception) {
    error_log('[sarmelle] health check failed: ' . $exception->getMessage());
    fwrite(STDERR, 'failure: ' . $exception->getMessage() . PHP_EOL);
    fwrite(STDERR, 'result: failed' . PHP_EOL);
    exit(1);
}

echo 'charset: ' . $checks['charset'] . ' [ok]' . PHP_EOL;
echo 'collation: ' . $checks['collation'] . ' [ok]' . PHP_EOL;
echo 'session time_zone: ' . $checks['session_time_zone'] . ' [ok]' . PHP_EOL;
echo 'php now: ' . $checks['php_now'] . PHP_EOL;
echo 'db now: ' . $checks['db_now'] . PHP_EOL;
echo 'clock skew: ' . $checks['clock_skew_seconds'] . 's [ok]' . PHP_EOL;
echo 'tables: ' . $checks['tables'] . PHP_EOL;
echo 'result: ok' . PHP_EOL;

exit(0);
