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
use Sarmelle\Repositories\AdminSessions;
use Sarmelle\Repositories\AdminOtpCodes;
use Sarmelle\Repositories\AdminTrustedDevices;
use Sarmelle\Auth\AdminUsers as AdminUsersRepo;
use Sarmelle\Repositories\LoginAttempts;
use Sarmelle\Auth\AdminAuth;
use Sarmelle\Auth\Throttle;
use Sarmelle\Support\ActivityLog;
use Sarmelle\Mail\MailerFactory;

$requestId = 'req_' . bin2hex(random_bytes(8));
$isAdmin = true;
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

$router = new Router($config, $config->adminUrl());

$router->add('GET', '/api/health', static function (Request $request) use ($config): Response {
    if (!$config->isLocal()) {
        return Response::raw(['ok' => true]);
    }

    $checks = Connection::diagnostics(Connection::open($config));

    return Response::raw(['ok' => true, 'checks' => $checks]);
});

$adminAuthFactory = static function () use ($config): AdminAuth {
    $pdo = Connection::open($config);
    $adminUsers = new AdminUsersRepo($pdo, new ActivityLog($pdo), $config->string('PASSWORD_ALGO'), $config->int('PASSWORD_BCRYPT_COST'));
    $sessions = new AdminSessions($pdo);
    $otpCodes = new AdminOtpCodes($pdo);
    $devices = new AdminTrustedDevices($pdo);
    $attempts = new LoginAttempts($pdo);
    $throttle = new Throttle($attempts);
    $activity = new ActivityLog($pdo);
    $mailer = (new MailerFactory())->create($config);

    return new AdminAuth($pdo, $config, $adminUsers, $sessions, $otpCodes, $devices, $attempts, $throttle, $activity, $mailer);
};

$router->add('POST', '/api/admin/auth/login', static function (Request $request) use ($config, $adminAuthFactory): Response {
    $body = $request->json();
    $email = (string) ($body['email'] ?? '');
    $password = (string) ($body['password'] ?? '');

    $auth = $adminAuthFactory();
    $result = $auth->login($request, $email, $password);

    foreach ($result['cookies'] as $name => $value) {
        setcookie($name, $value, [
            'expires' => 0,
            'path' => '/',
            'domain' => '',
            'secure' => $config->bool('COOKIE_SECURE'),
            'httponly' => true,
            'samesite' => $config->string('COOKIE_SAMESITE'),
        ]);
    }

    if ($result['clearPending']) {
        setcookie($config->string('ADMIN_PENDING_COOKIE'), '', time() - 3600, '/', '', $config->bool('COOKIE_SECURE'), true);
    }

    return Response::raw($result['body'], $result['status']);
});

$router->add('POST', '/api/admin/auth/otp/verify', static function (Request $request) use ($config, $adminAuthFactory): Response {
    $body = $request->json();
    $code = (string) ($body['code'] ?? '');

    $auth = $adminAuthFactory();
    $result = $auth->verifyOtp($request, $code);

    foreach ($result['cookies'] as $name => $value) {
        setcookie($name, $value, [
            'expires' => 0,
            'path' => '/',
            'domain' => '',
            'secure' => $config->bool('COOKIE_SECURE'),
            'httponly' => true,
            'samesite' => $config->string('COOKIE_SAMESITE'),
        ]);
    }

    if ($result['clearPending']) {
        setcookie($config->string('ADMIN_PENDING_COOKIE'), '', time() - 3600, '/', '', $config->bool('COOKIE_SECURE'), true);
    }

    return Response::raw($result['body'], $result['status']);
});

$router->add('POST', '/api/admin/auth/otp/resend', static function (Request $request) use ($config, $adminAuthFactory): Response {
    $auth = $adminAuthFactory();
    $result = $auth->resendOtp($request);

    foreach ($result['cookies'] as $name => $value) {
        setcookie($name, $value, [
            'expires' => 0,
            'path' => '/',
            'domain' => '',
            'secure' => $config->bool('COOKIE_SECURE'),
            'httponly' => true,
            'samesite' => $config->string('COOKIE_SAMESITE'),
        ]);
    }

    return Response::raw($result['body'], $result['status']);
});

$router->add('POST', '/api/admin/auth/logout', static function (Request $request) use ($config, $adminAuthFactory): Response {
    $auth = $adminAuthFactory();
    $auth->logout();

    foreach ([$config->string('ADMIN_SESSION_COOKIE'), $config->string('ADMIN_CSRF_COOKIE')] as $name) {
        setcookie($name, '', time() - 3600, '/', '', $config->bool('COOKIE_SECURE'), true);
    }

    return Response::success(['logged_out' => true]);
});

$router->add('POST', '/api/admin/auth/forgot-password', static function (Request $request) use ($config, $adminAuthFactory): Response {
    $body = $request->json();
    $email = \Sarmelle\Support\Normaliser::email((string) ($body['email'] ?? ''));

    $pdo = \Sarmelle\Core\Connection::open($config);
    $adminUsers = new \Sarmelle\Auth\AdminUsers($pdo, new \Sarmelle\Support\ActivityLog($pdo), $config->string('PASSWORD_ALGO'), $config->int('PASSWORD_BCRYPT_COST'));
    $admin = $adminUsers->sole();

    if ($email !== null && $admin !== null && strtolower($admin['email']) === $email) {
        $otpCodes = new \Sarmelle\Repositories\AdminOtpCodes($pdo);
        $recent = $otpCodes->countRecentByPurpose((int) $admin['id'], 'forgot_password', 60);

        if ($recent < 3) {
            $code = (string) random_int(100000, 999999);
            $codeHash = hash_hmac('sha256', $code, $config->appKey());
            $expiresAt = \Sarmelle\Core\Clock::now()->modify('+10 minutes')->format('Y-m-d H:i:s');
            $otpCodes->create((int) $admin['id'], $codeHash, 'forgot_password', $expiresAt);

            $mailer = (new \Sarmelle\Mail\MailerFactory())->create($config);
            $mailer->send(new \Sarmelle\Mail\EmailMessage(
                $admin['email'],
                'Your Sarmelle admin code',
                "Your verification code is {$code}. It expires in 10 minutes.\n",
                'admin_otp'
            ));
        }
    }

    return Response::success(['message' => 'If the email exists, a reset code has been sent.']);
});

$router->add('POST', '/api/admin/auth/reset-password', static function (Request $request) use ($config): Response {
    $body = $request->json();
    $email = \Sarmelle\Support\Normaliser::email((string) ($body['email'] ?? ''));
    $code = (string) ($body['code'] ?? '');
    $password = (string) ($body['password'] ?? '');

    $pdo = \Sarmelle\Core\Connection::open($config);
    $adminUsers = new \Sarmelle\Auth\AdminUsers($pdo, new \Sarmelle\Support\ActivityLog($pdo), $config->string('PASSWORD_ALGO'), $config->int('PASSWORD_BCRYPT_COST'));
    $admin = $adminUsers->sole();

    if ($email === null || $admin === null || strtolower($admin['email']) !== $email) {
        return ErrorHandler::error($request->requestId(), 'invalid_credentials');
    }

    $normalisedCode = \Sarmelle\Support\Normaliser::otp($code);
    if ($normalisedCode === null) {
        return ErrorHandler::error($request->requestId(), 'otp_invalid');
    }

    $otpCodes = new \Sarmelle\Repositories\AdminOtpCodes($pdo);
    // find latest unused forgot_password code for admin
    $stmt = $pdo->prepare(
        'SELECT id, code_hash, expires_at, attempts, used_at FROM admin_otp_codes'
        . ' WHERE admin_user_id = ? AND purpose = ? AND used_at IS NULL ORDER BY id DESC LIMIT 1'
    );
    $stmt->execute([(int) $admin['id'], 'forgot_password']);
    $otp = $stmt->fetch();

    if (!is_array($otp) || strtotime((string) $otp['expires_at']) <= time()) {
        return ErrorHandler::error($request->requestId(), 'otp_expired');
    }

    if ((int) $otp['attempts'] >= 5) {
        $otpCodes->markUsed((int) $otp['id']);

        return ErrorHandler::error($request->requestId(), 'otp_locked');
    }

    $expectedHash = hash_hmac('sha256', $normalisedCode, $config->appKey());
    if (!hash_equals((string) $otp['code_hash'], $expectedHash)) {
        $otpCodes->incrementAttempts((int) $otp['id']);

        return ErrorHandler::error($request->requestId(), 'otp_invalid');
    }

    $err = \Sarmelle\Auth\Password::error($password, $config->string('PASSWORD_ALGO'));
    if ($err !== null) {
        return ErrorHandler::validation($request->requestId(), ['password' => $err]);
    }

    $otpCodes->markUsed((int) $otp['id']);

    $ip = \Sarmelle\Core\ClientIp::forRequest($request, $config);
    $adminUsers->recoverPassword((int) $admin['id'], $password, $ip);

    return Response::success(['reset' => true]);
});

$router->add('POST', '/api/admin/auth/change-password', static function (Request $request) use ($config, $adminAuthFactory): Response {
    $auth = $adminAuthFactory();
    $admin = $auth->currentAdmin();

    if ($admin === null) {
        return ErrorHandler::error($request->requestId(), 'unauthenticated');
    }

    $body = $request->json();
    $current = (string) ($body['current_password'] ?? '');
    $new = (string) ($body['new_password'] ?? '');

    $pdo = \Sarmelle\Core\Connection::open($config);
    $adminUsers = new \Sarmelle\Auth\AdminUsers($pdo, new \Sarmelle\Support\ActivityLog($pdo), $config->string('PASSWORD_ALGO'), $config->int('PASSWORD_BCRYPT_COST'));
    $sole = $adminUsers->sole();

    if ($sole === null || !\Sarmelle\Auth\Password::verify($current, $sole['password_hash'])) {
        return ErrorHandler::error($request->requestId(), 'invalid_credentials');
    }

    $err = \Sarmelle\Auth\Password::error($new, $config->string('PASSWORD_ALGO'));
    if ($err !== null) {
        return ErrorHandler::validation($request->requestId(), ['new_password' => $err]);
    }

    // revoke all sessions/devices
    $pdo->prepare('DELETE FROM admin_sessions WHERE admin_user_id = ?')->execute([(int) $sole['id']]);
    $pdo->prepare('DELETE FROM admin_trusted_devices WHERE admin_user_id = ?')->execute([(int) $sole['id']]);
    $hash = \Sarmelle\Auth\Password::hash($new, $config->string('PASSWORD_ALGO'), $config->int('PASSWORD_BCRYPT_COST'));
    $pdo->prepare('UPDATE admin_users SET password_hash = ? WHERE id = ?')->execute([$hash, (int) $sole['id']]);

    // clear cookies
    foreach ([$config->string('ADMIN_SESSION_COOKIE'), $config->string('ADMIN_CSRF_COOKIE'), $config->string('ADMIN_PENDING_COOKIE')] as $name) {
        setcookie($name, '', time() - 3600, '/', '', $config->bool('COOKIE_SECURE'), true);
    }

    return Response::success(['changed' => true]);
});

$router->add('GET', '/api/admin/auth/me', static function (Request $request) use ($config, $adminAuthFactory): Response {
    $auth = $adminAuthFactory();
    $admin = $auth->currentAdmin();

    if ($admin === null) {
        return ErrorHandler::error($request->requestId(), 'unauthenticated');
    }

    return Response::success(['admin' => $admin]);
});

$request = Request::fromGlobals($config->int('MAX_JSON_BYTES'), $requestId);
$response = $router->dispatch($request);

(new SecurityHeaders($isAdmin))->apply($response)->send();
