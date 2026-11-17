<?php
declare(strict_types=1);

/**
 * Storefront API entry point.
 * Slice 1 answers GET /api/health only; the router arrives in slice 3.
 * Admin routes are never registered on this host.
 */

$bootstrapPathFile = __DIR__ . '/../bootstrap-path.php';

$respond = static function (int $status, array $payload): void {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
};

if (!is_file($bootstrapPathFile)) {
    $respond(500, [
        'ok' => false,
        'error' => ['code' => 'server_error', 'message' => 'Server is not configured.'],
    ]);
    exit;
}

$privateRoot = require $bootstrapPathFile;

if (!is_string($privateRoot) || trim($privateRoot) === '') {
    $respond(500, [
        'ok' => false,
        'error' => ['code' => 'server_error', 'message' => 'Server is not configured.'],
    ]);
    exit;
}

require rtrim(str_replace('\\', '/', $privateRoot), '/') . '/bootstrap.php';

try {
    $config = \Sarmelle\Config\Config::load($privateRoot);
} catch (\Throwable $exception) {
    error_log('[sarmelle] configuration failure: ' . $exception->getMessage());
    $respond(500, [
        'ok' => false,
        'error' => ['code' => 'server_error', 'message' => 'Server is not configured.'],
    ]);
    exit;
}

if (!defined('SARM_DEBUG')) {
    define('SARM_DEBUG', $config->debug());
}

$method = strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET'));
$rawPath = parse_url((string) ($_SERVER['REQUEST_URI'] ?? '/'), PHP_URL_PATH);
$path = is_string($rawPath) && $rawPath !== '' ? $rawPath : '/';
$path = rtrim($path, '/');

if ($path === '') {
    $path = '/';
}

if ($method === 'GET' && $path === '/api/health') {
    $respond(200, ['ok' => true]);
    exit;
}

$respond(404, [
    'ok' => false,
    'error' => ['code' => 'not_found', 'message' => 'Not found.'],
]);
