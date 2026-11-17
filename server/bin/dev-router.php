<?php
declare(strict_types=1);

/**
 * Router script for PHP's built-in server.
 *
 *   php -S localhost:8080 -t server/web-storefront server/bin/dev-router.php
 *   php -S localhost:8081 -t server/web-admin server/bin/dev-router.php
 *
 * /api/* goes to that web root's api/index.php. Everything else falls through
 * to the built-in server, which serves static files and index.php/index.html.
 */

$path = parse_url((string) ($_SERVER['REQUEST_URI'] ?? '/'), PHP_URL_PATH);
$path = is_string($path) && $path !== '' ? $path : '/';

if ($path === '/api' || str_starts_with($path, '/api/')) {
    $documentRoot = rtrim(str_replace('\\', '/', (string) ($_SERVER['DOCUMENT_ROOT'] ?? '')), '/');
    $entry = $documentRoot . '/api/index.php';

    if (!is_file($entry)) {
        http_response_code(404);
        header('Content-Type: application/json; charset=utf-8');
        echo '{"ok":false,"error":{"code":"not_found","message":"Not found."}}';
        return true;
    }

    require $entry;
    return true;
}

return false;
