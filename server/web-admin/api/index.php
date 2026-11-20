<?php
declare(strict_types=1);

/**
 * Admin API entry point.
 * Registers only admin routes; storefront routes never exist on this host.
 */

use Sarmelle\Config\Config;
use Sarmelle\Core\Connection;
use Sarmelle\Core\Request;
use Sarmelle\Core\Response;
use Sarmelle\Core\Router;
use Sarmelle\Http\ErrorHandler;
use Sarmelle\Http\SecurityHeaders;

$isAdmin = true;
$bootstrapPathFile = __DIR__ . '/../bootstrap-path.php';

$respondNotConfigured = static function (): void {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo '{"ok":false,"error":{"code":"server_error","message":"Server is not configured."}}';
};

if (!is_file($bootstrapPathFile)) {
    $respondNotConfigured();
    exit;
}

$privateRoot = require $bootstrapPathFile;

if (!is_string($privateRoot) || trim($privateRoot) === '') {
    $respondNotConfigured();
    exit;
}

require rtrim(str_replace('\\', '/', $privateRoot), '/') . '/bootstrap.php';

$requestId = Request::newRequestId();

try {
    $config = Config::load($privateRoot);
} catch (\Throwable $exception) {
    $response = ErrorHandler::serverError($requestId, $exception, false);
    (new SecurityHeaders($isAdmin))->apply($response)->send();
    exit;
}

if (!defined('SARM_DEBUG')) {
    define('SARM_DEBUG', $config->debug());
}

$router = new Router($config, $config->adminUrl());

$router->add('GET', '/api/health', static function (Request $request) use ($config): Response {
    if (!$config->isLocal()) {
        return Response::raw(['ok' => true]);
    }

    $checks = Connection::diagnostics(Connection::open($config));

    return Response::raw(['ok' => true, 'checks' => $checks]);
});

$request = Request::fromGlobals($config->int('MAX_JSON_BYTES'), $requestId);
$response = $router->dispatch($request);

(new SecurityHeaders($isAdmin))->apply($response)->send();
