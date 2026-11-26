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
use Sarmelle\Repositories\Customers;
use Sarmelle\Repositories\LoginAttempts;
use Sarmelle\Repositories\OrderRepository;
use Sarmelle\Repositories\ProductRepository;
use Sarmelle\Auth\Password;
use Sarmelle\Auth\Throttle;
use Sarmelle\Support\Normaliser;

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

// Customer PHP session (design section 5).
$sessionSavePath = $config->path('SESSION_SAVE_PATH');
if (!is_dir($sessionSavePath)) {
    @mkdir($sessionSavePath, 0700, true);
}
session_save_path($sessionSavePath);
session_name($config->string('SESSION_NAME_CUSTOMER'));
$secure = $config->bool('COOKIE_SECURE');
$samesite = $config->string('COOKIE_SAMESITE');
session_set_cookie_params([
    'lifetime' => $config->int('SESSION_LIFETIME_CUSTOMER_DAYS') * 86400,
    'path' => '/',
    'domain' => '',
    'secure' => $secure,
    'httponly' => true,
    'samesite' => $samesite,
]);
if (session_status() !== PHP_SESSION_ACTIVE) {
    session_start();
}

$router = new Router($config, $config->appUrl());

$router->add('GET', '/api/health', static function (Request $request) use ($config): Response {
    if (!$config->isLocal()) {
        return Response::raw(['ok' => true]);
    }

    $checks = Connection::diagnostics(Connection::open($config));

    return Response::raw(['ok' => true, 'checks' => $checks]);
});

// Customer auth (PHP session based)
$router->add('GET', '/api/auth/csrf', static function (Request $request) use ($config): Response {
    if (empty($_SESSION['customer_id'])) {
        // issue token even for guests? design: issued by GET /api/auth/csrf
    }
    $token = \Sarmelle\Http\Csrf::issueCustomerToken();

    return Response::success(['csrf_token' => $token]);
});

$router->add('POST', '/api/auth/register', static function (Request $request) use ($config): Response {
    $body = $request->json();
    $name = Normaliser::name((string) ($body['name'] ?? ''));
    $email = Normaliser::email((string) ($body['email'] ?? ''));
    $phone = Normaliser::phone((string) ($body['phone'] ?? ''));
    $password = (string) ($body['password'] ?? '');

    if ($name === null || $email === null || $phone === null) {
        return ErrorHandler::validation($request->requestId(), ['fields' => 'invalid']);
    }

    $error = Password::error($password, $config->string('PASSWORD_ALGO'));
    if ($error !== null) {
        return ErrorHandler::validation($request->requestId(), ['password' => $error]);
    }

    $pdo = Connection::open($config);
    $repo = new Customers($pdo);

    if ($repo->findByEmailOrPhone($email) !== null) {
        return ErrorHandler::validation($request->requestId(), ['email' => 'Email already registered.']);
    }

    $hash = Password::hash($password, $config->string('PASSWORD_ALGO'), $config->int('PASSWORD_BCRYPT_COST'));
    $id = $repo->create($name, $email, $phone, $hash);

    $_SESSION['customer_id'] = $id;
    $_SESSION['logged_in_at'] = time();
    session_regenerate_id(true);
    \Sarmelle\Http\Csrf::clearCustomerToken();
    \Sarmelle\Http\Csrf::issueCustomerToken();

    return Response::success(['customer' => ['id' => $id, 'name' => $name, 'email' => $email, 'phone' => $phone]]);
});

$router->add('POST', '/api/auth/login', static function (Request $request) use ($config): Response {
    $body = $request->json();
    $identifier = (string) ($body['identifier'] ?? $body['email'] ?? $body['phone'] ?? '');
    $password = (string) ($body['password'] ?? '');

    $pdo = Connection::open($config);
    $repo = new Customers($pdo);
    $attempts = new LoginAttempts($pdo);
    $throttle = new Throttle($attempts);
    $ip = \Sarmelle\Core\ClientIp::forRequest($request, $config);

    $lock = $throttle->check('customer', $identifier, $ip);
    if ($lock !== null) {
        $attempts->record('customer', $identifier, $ip, false);

        return ErrorHandler::error($request->requestId(), $lock);
    }

    $customer = $repo->findByEmailOrPhone($identifier);
    $hash = $customer !== null ? $customer['password_hash'] : '';

    $dummy = '$argon2id$v=19$m=65536,t=3,p=4$' . str_repeat('a', 22) . '$' . str_repeat('b', 43);
    if ($customer === null) {
        Password::verify($password, $dummy);
        $attempts->record('customer', $identifier, $ip, false);

        return ErrorHandler::error($request->requestId(), 'invalid_credentials');
    }

    if ((int) $customer['is_active'] !== 1) {
        $attempts->record('customer', $identifier, $ip, false);

        return ErrorHandler::error($request->requestId(), 'invalid_credentials');
    }

    if (!Password::verify($password, $hash)) {
        $attempts->record('customer', $identifier, $ip, false);

        return ErrorHandler::error($request->requestId(), 'invalid_credentials');
    }

    $attempts->record('customer', $identifier, $ip, true);

    session_regenerate_id(true);
    $_SESSION['customer_id'] = (int) $customer['id'];
    $_SESSION['logged_in_at'] = time();
    $_SESSION['last_seen'] = time();
    \Sarmelle\Http\Csrf::clearCustomerToken();
    \Sarmelle\Http\Csrf::issueCustomerToken();

    return Response::success(['customer' => ['id' => (int) $customer['id'], 'name' => (string) $customer['name'], 'email' => (string) $customer['email'], 'phone' => (string) $customer['phone']]]);
});

$router->add('POST', '/api/auth/logout', static function (Request $request) use ($config): Response {
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'], $params['secure'], $params['httponly']);
    }
    session_destroy();
    \Sarmelle\Http\Csrf::clearCustomerToken();

    return Response::success(['logged_out' => true]);
});

$router->add('GET', '/api/auth/me', static function (Request $request) use ($config): Response {
    $id = (int) ($_SESSION['customer_id'] ?? 0);
    if ($id <= 0) {
        return ErrorHandler::error($request->requestId(), 'unauthenticated');
    }

    $pdo = Connection::open($config);
    $repo = new Customers($pdo);
    $customer = $repo->findById($id);

    if ($customer === null) {
        return ErrorHandler::error($request->requestId(), 'unauthenticated');
    }

    return Response::success(['customer' => $customer]);
});

// Customer password reset
$router->add('POST', '/api/auth/forgot-password', static function (Request $request) use ($config): Response {
    $body = $request->json();
    $email = \Sarmelle\Support\Normaliser::email((string) ($body['email'] ?? ''));

    if ($email === null) {
        return Response::success(['message' => 'If the email exists, a reset link has been sent.']);
    }

    $pdo = Connection::open($config);
    $repo = new Customers($pdo);
    $customer = $repo->findByEmailOrPhone($email);

    if ($customer !== null) {
        $resets = new \Sarmelle\Repositories\CustomerPasswordResets($pdo);
        $recent = $resets->countRecent((int) $customer['id'], 60);

        if ($recent < 3) {
            $token = bin2hex(random_bytes(32));
            $tokenHash = hash('sha256', $token);
            $expiresAt = \Sarmelle\Core\Clock::now()->modify('+30 minutes')->format('Y-m-d H:i:s');
            $resets->create((int) $customer['id'], $tokenHash, $expiresAt);

            $mailer = (new \Sarmelle\Mail\MailerFactory())->create($config);
            $mailer->send(new \Sarmelle\Mail\EmailMessage(
                $customer['email'],
                'Reset your Sarmelle password',
                "Your reset token is {$token}. It expires in 30 minutes.\n",
                'customer_password_reset'
            ));
        }
    }

    return Response::success(['message' => 'If the email exists, a reset link has been sent.']);
});

$router->add('POST', '/api/auth/reset-password', static function (Request $request) use ($config): Response {
    $body = $request->json();
    $token = trim((string) ($body['token'] ?? ''));
    $password = (string) ($body['password'] ?? '');

    if ($token === '') {
        return ErrorHandler::error($request->requestId(), 'validation_failed');
    }

    $error = Password::error($password, $config->string('PASSWORD_ALGO'));
    if ($error !== null) {
        return ErrorHandler::validation($request->requestId(), ['password' => $error]);
    }

    $pdo = Connection::open($config);
    $resets = new \Sarmelle\Repositories\CustomerPasswordResets($pdo);
    $reset = $resets->findByTokenHash(hash('sha256', $token));

    if ($reset === null || $reset['used_at'] !== null || strtotime((string) $reset['expires_at']) <= time()) {
        return ErrorHandler::error($request->requestId(), 'invalid_credentials');
    }

    $customers = new Customers($pdo);
    // find customer
    $stmt = $pdo->prepare('SELECT id FROM customers WHERE id = ?');
    $stmt->execute([(int) $reset['customer_id']]);
    if (!$stmt->fetch()) {
        return ErrorHandler::error($request->requestId(), 'invalid_credentials');
    }

    $hash = Password::hash($password, $config->string('PASSWORD_ALGO'), $config->int('PASSWORD_BCRYPT_COST'));
    $pdo->prepare('UPDATE customers SET password_hash = ? WHERE id = ?')->execute([$hash, (int) $reset['customer_id']]);
    $resets->markUsed((int) $reset['id']);

    return Response::success(['reset' => true]);
});

$router->add('POST', '/api/auth/change-password', static function (Request $request) use ($config): Response {
    $id = (int) ($_SESSION['customer_id'] ?? 0);
    if ($id <= 0) {
        return ErrorHandler::error($request->requestId(), 'unauthenticated');
    }

    $body = $request->json();
    $current = (string) ($body['current_password'] ?? '');
    $new = (string) ($body['new_password'] ?? '');

    $pdo = Connection::open($config);
    $customers = new Customers($pdo);
    $customer = $customers->findById($id);
    if ($customer === null) {
        return ErrorHandler::error($request->requestId(), 'unauthenticated');
    }

    // need password hash
    $stmt = $pdo->prepare('SELECT password_hash FROM customers WHERE id = ?');
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    $hash = is_array($row) ? (string) $row['password_hash'] : '';

    if (!Password::verify($current, $hash)) {
        return ErrorHandler::error($request->requestId(), 'invalid_credentials');
    }

    $err = Password::error($new, $config->string('PASSWORD_ALGO'));
    if ($err !== null) {
        return ErrorHandler::validation($request->requestId(), ['new_password' => $err]);
    }

    $newHash = Password::hash($new, $config->string('PASSWORD_ALGO'), $config->int('PASSWORD_BCRYPT_COST'));
    $pdo->prepare('UPDATE customers SET password_hash = ? WHERE id = ?')->execute([$newHash, $id]);

    return Response::success(['changed' => true]);
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

    $customerId = (int) ($_SESSION['customer_id'] ?? 0);
    if ($customerId <= 0) {
        $customerId = (int) $request->query('customer_id', 1);
    }
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
