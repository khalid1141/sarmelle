<?php
declare(strict_types=1);

/**
 * Storefront API entry point.
 * Registers only storefront routes; admin routes never exist on this host.
 */

use Sarmelle\Config\Config;
use Sarmelle\Core\Connection;
use Sarmelle\Core\Request;
use Sarmelle\Core\Response;
use Sarmelle\Core\Router;
use Sarmelle\Http\ErrorHandler;
use Sarmelle\Http\SecurityHeaders;
use Sarmelle\Repositories\CampaignRepository;
use Sarmelle\Repositories\OrderRepository;
use Sarmelle\Repositories\ProductRepository;

$requestId = 'req_' . bin2hex(random_bytes(8));
$isAdmin = false;
$bootstrapPathFile = __DIR__ . '/../bootstrap-path.php';

$respondNotConfigured = static function (string $requestId): void {
    // One line, error code only: never log file contents or the private path.
    error_log('[sarmelle] ' . $requestId . ' server_error not_configured');

    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo '{"ok":false,"error":{"code":"server_error",'
        . '"message":"Server is not configured.","request_id":"' . $requestId . '"}}';
};

if (!is_file($bootstrapPathFile)) {
    $respondNotConfigured($requestId);
    exit;
}

$privateRoot = require $bootstrapPathFile;

if (!is_string($privateRoot) || trim($privateRoot) === '') {
    $respondNotConfigured($requestId);
    exit;
}

require rtrim(str_replace('\\', '/', $privateRoot), '/') . '/bootstrap.php';

\Sarmelle\Core\RequestId::set($requestId);

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

$router = new Router($config, $config->appUrl());

$router->add('GET', '/api/health', static function (Request $request) use ($config): Response {
    if (!$config->isLocal()) {
        return Response::raw(['ok' => true]);
    }

    $checks = Connection::diagnostics(Connection::open($config));

    return Response::raw(['ok' => true, 'checks' => $checks]);
});

$router->add('GET', '/api/products', static function (Request $request) use ($config): Response {
    $pdo = Connection::open($config);
    $repo = new ProductRepository($pdo);

    return Response::success(['products' => $repo->list([
        'category' => $request->query('category'),
        'fabric' => $request->query('fabric'),
        'offer' => $request->query('offer'),
        'q' => $request->query('q'),
        'sort' => $request->query('sort'),
    ])]);
});

$router->add('GET', '/api/product', static function (Request $request) use ($config): Response {
    $slug = trim((string) $request->query('slug', ''));

    if ($slug === '') {
        return ErrorHandler::validation($request->requestId(), ['slug' => 'slug is required.']);
    }

    $pdo = Connection::open($config);
    $repo = new ProductRepository($pdo);
    $product = $repo->findBySlug($slug);

    if ($product === null) {
        return ErrorHandler::notFound($request->requestId(), '/api/product');
    }

    return Response::success(['product' => $product]);
});

$router->add('GET', '/api/campaign', static function (Request $request) use ($config): Response {
    $pdo = Connection::open($config);
    $repo = new CampaignRepository($pdo);

    return Response::success($repo->all());
});

$router->add('GET', '/api/reviews', static function (Request $request) use ($config): Response {
    $productId = (int) $request->query('product_id', 0);

    if ($productId <= 0) {
        return ErrorHandler::validation($request->requestId(), ['product_id' => 'product_id is required.']);
    }

    $pdo = Connection::open($config);
    $repo = new ProductRepository($pdo);

    return Response::success(['reviews' => $repo->reviews($productId)]);
});

$router->add('GET', '/api/account/orders', static function (Request $request) use ($config): Response {
    if (!$config->isLocal()) {
        return ErrorHandler::notFound($request->requestId(), '/api/account/orders');
    }

    $customerId = (int) $request->query('customer_id', 1);

    if ($customerId <= 0) {
        $customerId = 1;
    }

    $pdo = Connection::open($config);
    $repo = new OrderRepository($pdo);

    return Response::success($repo->account($customerId));
});

$request = Request::fromGlobals($config->int('MAX_JSON_BYTES'), $requestId);
$response = $router->dispatch($request);

(new SecurityHeaders($isAdmin))->apply($response)->send();
