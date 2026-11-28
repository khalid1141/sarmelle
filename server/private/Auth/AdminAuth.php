<?php
declare(strict_types=1);

namespace Sarmelle\Auth;

use PDO;
use Sarmelle\Config\Config;
use Sarmelle\Core\ClientIp;
use Sarmelle\Core\Clock;
use Sarmelle\Core\Request;
use Sarmelle\Mail\EmailMessage;
use Sarmelle\Mail\Mailer;
use Sarmelle\Repositories\AdminOtpCodes;
use Sarmelle\Repositories\AdminSessions;
use Sarmelle\Repositories\AdminTrustedDevices;
use Sarmelle\Auth\AdminUsers as AdminUsersRepo;
use Sarmelle\Repositories\LoginAttempts;
use Sarmelle\Support\ActivityLog;
use Sarmelle\Support\Normaliser;

final class AdminAuth
{
    public function __construct(
        private readonly PDO $pdo,
        private readonly Config $config,
        private readonly AdminUsersRepo $adminUsers,
        private readonly AdminSessions $sessions,
        private readonly AdminOtpCodes $otpCodes,
        private readonly AdminTrustedDevices $devices,
        private readonly LoginAttempts $attempts,
        private readonly Throttle $throttle,
        private readonly ActivityLog $activity,
        private readonly Mailer $mailer,
    ) {
    }

    /**
     * @return array{status: int, body: array<string, mixed>, cookies: array<string, string>, clearPending: bool}
     */
    public function login(Request $request, string $email, string $password): array
    {
        $normalisedEmail = Normaliser::email($email);

        if ($normalisedEmail === null) {
            $normalisedEmail = trim($email);
        }

        $ip = ClientIp::forRequest($request, $this->config);
        $admin = $this->adminUsers->sole();

        // lockout check
        $lockError = $this->throttle->check('admin', $normalisedEmail, $ip);

        if ($lockError !== null) {
            $this->attempts->record('admin', $normalisedEmail, $ip, false);

            return ['status' => 429, 'body' => ['error' => ['code' => $lockError]], 'cookies' => [], 'clearPending' => false];
        }

        $dummyHash = '$argon2id$v=19$m=65536,t=3,p=4$' . str_repeat('a', 22) . '$' . str_repeat('b', 43);
        $hash = $admin !== null ? $admin['password_hash'] : $dummyHash;

        $ok = Password::verify($password, $hash);

        if (!$ok || $admin === null) {
            $this->attempts->record('admin', $normalisedEmail, $ip, false);

            return ['status' => 401, 'body' => ['error' => ['code' => 'invalid_credentials']], 'cookies' => [], 'clearPending' => false];
        }

        $this->attempts->record('admin', $normalisedEmail, $ip, true);

        // trusted device?
        $deviceCookieName = $this->config->string('ADMIN_DEVICE_COOKIE');
        $deviceToken = $_COOKIE[$deviceCookieName] ?? null;
        $deviceValid = false;

        if (is_string($deviceToken) && $deviceToken !== '') {
            $device = $this->devices->findByTokenHash(hash('sha256', $deviceToken));

            if (is_array($device) && (int) $device['admin_user_id'] === (int) $admin['id']
                && strtotime((string) $device['expires_at']) > time()) {
                $deviceValid = true;
                $this->devices->touch((int) $device['id']);
            }
        }

        if ($deviceValid) {
            return $this->createSession($request, $admin, $ip);
        }

        // OTP path
        $adminId = (int) $admin['id'];
        $code = (string) random_int(100000, 999999);
        $codeHash = hash_hmac('sha256', $code, $this->config->appKey());
        $expiresAt = Clock::now()->modify('+10 minutes')->format('Y-m-d H:i:s');
        $otpRowId = $this->otpCodes->create($adminId, $codeHash, 'new_device', $expiresAt);

        // throttle OTP requests
        $recent = $this->otpCodes->countRecentByPurpose($adminId, 'new_device', 60);
        if ($recent > 3) {
            // burn
            $this->otpCodes->markUsed($otpRowId);

            return ['status' => 429, 'body' => ['error' => ['code' => 'rate_limited']], 'cookies' => [], 'clearPending' => false];
        }

        $pendingExpires = time() + (10 * 60);
        $pendingValue = PendingLogin::sign($this->config, $adminId, $otpRowId, $pendingExpires);

        $this->mailer->send(new EmailMessage(
            $admin['email'],
            'Your Sarmelle admin code',
            "Your verification code is {$code}. It expires in 10 minutes.\n",
            'admin_otp'
        ));

        $this->activity->record($adminId, 'admin.otp.requested', 'admin_user', $adminId, null, null, $ip);

        return [
            'status' => 202,
            'body' => ['otp_required' => true, 'expires_in' => 600],
            'cookies' => [
                $this->config->string('ADMIN_PENDING_COOKIE') => $pendingValue,
            ],
            'clearPending' => false,
        ];
    }

    private function createSession(Request $request, array $admin, string $ip): array
    {
        $token = bin2hex(random_bytes(32));
        $tokenHash = hash('sha256', $token);
        $idle = (int) $this->config->int('ADMIN_SESSION_IDLE_MINUTES');
        $expiresAt = Clock::now()->modify('+' . $idle . ' minutes')->format('Y-m-d H:i:s');
        $userAgent = substr((string) $request->header('user-agent'), 0, 255);

        $this->sessions->create((int) $admin['id'], $tokenHash, $expiresAt, $ip, $userAgent);

        $csrfToken = Csrf::issueAdminToken();

        $this->activity->record((int) $admin['id'], 'admin.login.success', 'admin_user', (int) $admin['id'], null, null, $ip);

        return [
            'status' => 200,
            'body' => ['admin' => ['id' => (int) $admin['id'], 'name' => (string) $admin['name'], 'email' => (string) $admin['email']]],
            'cookies' => [
                $this->config->string('ADMIN_SESSION_COOKIE') => $token,
                $this->config->string('ADMIN_CSRF_COOKIE') => $csrfToken,
            ],
            'clearPending' => true,
        ];
    }

    /**
     * @return array{status: int, body: array<string, mixed>, cookies: array<string, string>, clearPending: bool}
     */
    public function verifyOtp(Request $request, string $code): array
    {
        $pendingCookieName = $this->config->string('ADMIN_PENDING_COOKIE');
        $pendingValue = $_COOKIE[$pendingCookieName] ?? null;

        if (!is_string($pendingValue) || $pendingValue === '') {
            return ['status' => 401, 'body' => ['error' => ['code' => 'otp_expired']], 'cookies' => [], 'clearPending' => false];
        }

        $parsed = PendingLogin::verify($this->config, $pendingValue);

        if ($parsed === null) {
            return ['status' => 401, 'body' => ['error' => ['code' => 'otp_expired']], 'cookies' => [], 'clearPending' => true];
        }

        $otp = $this->otpCodes->findById($parsed['otp_row_id']);

        if (!is_array($otp) || (int) $otp['admin_user_id'] !== $parsed['admin_id']
            || $otp['purpose'] !== 'new_device' || $otp['used_at'] !== null
            || strtotime((string) $otp['expires_at']) <= time()) {
            return ['status' => 401, 'body' => ['error' => ['code' => 'otp_expired']], 'cookies' => [], 'clearPending' => true];
        }

        // attempts
        if ((int) $otp['attempts'] >= 5) {
            $this->otpCodes->markUsed($parsed['otp_row_id']);

            return ['status' => 429, 'body' => ['error' => ['code' => 'otp_locked']], 'cookies' => [], 'clearPending' => true];
        }

        $normalisedCode = Normaliser::otp($code);

        if ($normalisedCode === null) {
            $this->otpCodes->incrementAttempts($parsed['otp_row_id']);

            return ['status' => 401, 'body' => ['error' => ['code' => 'otp_invalid']], 'cookies' => [], 'clearPending' => false];
        }

        $expectedHash = hash_hmac('sha256', $normalisedCode, $this->config->appKey());

        if (!hash_equals((string) $otp['code_hash'], $expectedHash)) {
            $this->otpCodes->incrementAttempts($parsed['otp_row_id']);
            $this->activity->record($parsed['admin_id'], 'admin.otp.failed', 'admin_user', $parsed['admin_id'], null, null, ClientIp::forRequest($request, $this->config));

            // burn after 5
            $otp = $this->otpCodes->findById($parsed['otp_row_id']);
            if (is_array($otp) && (int) $otp['attempts'] >= 5) {
                $this->otpCodes->markUsed($parsed['otp_row_id']);
            }

            return ['status' => 401, 'body' => ['error' => ['code' => 'otp_invalid']], 'cookies' => [], 'clearPending' => false];
        }

        // success
        $this->otpCodes->markUsed($parsed['otp_row_id']);

        $admin = $this->adminUsers->sole();

        if ($admin === null || (int) $admin['id'] !== $parsed['admin_id']) {
            return ['status' => 401, 'body' => ['error' => ['code' => 'otp_expired']], 'cookies' => [], 'clearPending' => true];
        }

        // trusted device
        $deviceToken = bin2hex(random_bytes(32));
        $deviceHash = hash('sha256', $deviceToken);
        $deviceExpires = Clock::now()->modify('+' . $this->config->int('ADMIN_TRUSTED_DEVICE_DAYS') . ' days')->format('Y-m-d H:i:s');
        $label = 'Browser';
        $this->devices->create((int) $admin['id'], $deviceHash, $label, $deviceExpires);

        $ip = ClientIp::forRequest($request, $this->config);
        $result = $this->createSessionInternal($request, $admin, $ip);

        $this->activity->record((int) $admin['id'], 'admin.otp.verified', 'admin_user', (int) $admin['id'], null, null, $ip);
        $this->activity->record((int) $admin['id'], 'admin.device.trusted', 'admin_user', (int) $admin['id'], null, null, $ip);

        $cookies = $result['cookies'];
        $cookies[$this->config->string('ADMIN_DEVICE_COOKIE')] = $deviceToken;

        return [
            'status' => 200,
            'body' => $result['body'],
            'cookies' => $cookies,
            'clearPending' => true,
        ];
    }

    private function createSessionInternal(Request $request, array $admin, string $ip): array
    {
        $token = bin2hex(random_bytes(32));
        $tokenHash = hash('sha256', $token);
        $idle = (int) $this->config->int('ADMIN_SESSION_IDLE_MINUTES');
        $expiresAt = Clock::now()->modify('+' . $idle . ' minutes')->format('Y-m-d H:i:s');
        $userAgent = substr((string) $request->header('user-agent'), 0, 255);

        $this->sessions->create((int) $admin['id'], $tokenHash, $expiresAt, $ip, $userAgent);

        $csrfToken = \Sarmelle\Http\Csrf::issueAdminToken();

        return [
            'status' => 200,
            'body' => ['admin' => ['id' => (int) $admin['id'], 'name' => (string) $admin['name'], 'email' => (string) $admin['email']]],
            'cookies' => [
                $this->config->string('ADMIN_SESSION_COOKIE') => $token,
                $this->config->string('ADMIN_CSRF_COOKIE') => $csrfToken,
            ],
            'clearPending' => true,
        ];
    }

    /**
     * @return array{status: int, body: array<string, mixed>, cookies: array<string, string>, clearPending: bool}
     */
    public function resendOtp(Request $request): array
    {
        $pendingCookieName = $this->config->string('ADMIN_PENDING_COOKIE');
        $pendingValue = $_COOKIE[$pendingCookieName] ?? null;

        if (!is_string($pendingValue) || $pendingValue === '') {
            return ['status' => 401, 'body' => ['error' => ['code' => 'otp_expired']], 'cookies' => [], 'clearPending' => false];
        }

        $parsed = PendingLogin::verify($this->config, $pendingValue);

        if ($parsed === null) {
            return ['status' => 401, 'body' => ['error' => ['code' => 'otp_expired']], 'cookies' => [], 'clearPending' => true];
        }

        $admin = $this->adminUsers->sole();

        if ($admin === null || (int) $admin['id'] !== $parsed['admin_id']) {
            return ['status' => 401, 'body' => ['error' => ['code' => 'otp_expired']], 'cookies' => [], 'clearPending' => true];
        }

        // throttle: 3 per hour
        $recent = $this->otpCodes->countRecentByPurpose($parsed['admin_id'], 'new_device', 60);

        if ($recent >= 3) {
            return ['status' => 429, 'body' => ['error' => ['code' => 'rate_limited']], 'cookies' => [], 'clearPending' => false];
        }

        $code = (string) random_int(100000, 999999);
        $codeHash = hash_hmac('sha256', $code, $this->config->appKey());
        $expiresAt = Clock::now()->modify('+10 minutes')->format('Y-m-d H:i:s');
        $otpRowId = $this->otpCodes->create($parsed['admin_id'], $codeHash, 'new_device', $expiresAt);

        $pendingExpires = time() + (10 * 60);
        $pendingValue = PendingLogin::sign($this->config, $parsed['admin_id'], $otpRowId, $pendingExpires);

        $this->mailer->send(new EmailMessage(
            $admin['email'],
            'Your Sarmelle admin code',
            "Your verification code is {$code}. It expires in 10 minutes.\n",
            'admin_otp'
        ));

        return [
            'status' => 202,
            'body' => ['otp_required' => true, 'expires_in' => 600],
            'cookies' => [
                $this->config->string('ADMIN_PENDING_COOKIE') => $pendingValue,
            ],
            'clearPending' => false,
        ];
    }

    public function currentAdmin(): ?array
    {
        $cookieName = $this->config->string('ADMIN_SESSION_COOKIE');
        $token = $_COOKIE[$cookieName] ?? null;

        if (!is_string($token) || $token === '') {
            return null;
        }

        $resolveResult = $this->sessions->resolve($token);
        if ($resolveResult['status'] !== 'valid' || $resolveResult['session'] === null) {
            return null;
        }

        $session = $resolveResult['session'];

        $admin = $this->adminUsers->sole();

        if ($admin === null || (int) $admin['id'] !== (int) $session['admin_user_id']) {
            return null;
        }

        return ['id' => (int) $admin['id'], 'name' => (string) $admin['name'], 'email' => (string) $admin['email']];
    }

    public function logout(): void
    {
        $cookieName = $this->config->string('ADMIN_SESSION_COOKIE');
        $token = $_COOKIE[$cookieName] ?? null;

        if (is_string($token) && $token !== '') {
            $this->sessions->deleteByTokenHash(hash('sha256', $token));
        }

        $ip = null;
        try {
            $ip = ClientIp::forRequest(
                \Sarmelle\Core\Request::fromGlobals(0),
                $this->config
            );
        } catch (\Throwable $e) {
            $ip = null;
        }

        $admin = $this->adminUsers->sole();
        if ($admin !== null) {
            $this->activity->record((int) $admin['id'], 'admin.logout', 'admin_user', (int) $admin['id'], null, null, $ip);
        }
    }
}