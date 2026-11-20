<?php
declare(strict_types=1);

/**
 * Router script for PHP's built-in server.
 *
 *   php -S localhost:8080 -t server/web-storefront server/bin/dev-router.php
 *   php -S localhost:8081 -t server/web-admin server/bin/dev-router.php
 *
 * Mirrors .htaccess: dotfiles and the front controller are refused, /api and
 * /api/* go to that web root's api/index.php, everything else falls through to
 * the built-in server for static files and index.php/index.html.
 */

$path = parse_url((string) ($_SERVER['REQUEST_URI'] ?? '/'), PHP_URL_PATH);
$path = is_string($path) && $path !== '' ? $path : '/';

$deny = static function (int $status, string $code, string $message): bool {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode(
        ['ok' => false, 'error' => ['code' => $code, 'message' => $message]],
        JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE
    );

    return true;
};

if (preg_match('#(^|/)\.(?!well-known/)#', $path) === 1) {
    return $deny(403, 'forbidden', 'Forbidden.');
}

if ($path === '/api/index.php') {
    return $deny(403, 'forbidden', 'Forbidden.');
}

if ($path === '/api' || str_starts_with($path, '/api/')) {
    $documentRoot = rtrim(str_replace('\\', '/', (string) ($_SERVER['DOCUMENT_ROOT'] ?? '')), '/');
    $entry = $documentRoot . '/api/index.php';

    if (!is_file($entry)) {
        return $deny(404, 'not_found', 'Not found.');
    }

    require $entry;

    return true;
}

return false;
