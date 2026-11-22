<?php
declare(strict_types=1);

namespace Sarmelle\Config;

/**
 * Typed configuration for one deployment.
 *
 * Values come from server/private/Config/.env, which is never committed.
 * Process environment variables are deliberately not merged, so web and CLI
 * cannot disagree about the same deployment.
 */
final class Config
{
    public const TIMEZONE = 'Asia/Kolkata';
    public const TIMEZONE_OFFSET = '+05:30';

    /**
     * Keys with no safe default. Secrets in particular are never defaulted.
     */
    private const REQUIRED = [
        'APP_ENV',
        'APP_DEBUG',
        'APP_URL',
        'ADMIN_URL',
        'APP_KEY',
        'APP_TIMEZONE',
        'DB_HOST',
        'DB_PORT',
        'DB_NAME',
        'DB_USER',
        'DB_PASSWORD',
        'DB_CHARSET',
        'DB_TIMEZONE',
    ];

    /**
     * Non-secret keys with the design's documented defaults.
     */
    private const DEFAULTS = [
        'APP_TRUSTED_PROXIES' => '',
        'DB_SSL' => '0',
        'DB_SSL_CA' => '',
        'SESSION_NAME_CUSTOMER' => 'SARM_SESS',
        'SESSION_LIFETIME_CUSTOMER_DAYS' => '30',
        'SESSION_SAVE_PATH' => 'var/sessions',
        'ADMIN_SESSION_COOKIE' => 'SARM_ADMIN_SESSION',
        'ADMIN_DEVICE_COOKIE' => 'SARM_ADMIN_DEVICE',
        'ADMIN_PENDING_COOKIE' => 'SARM_ADMIN_PENDING',
        'ADMIN_CSRF_COOKIE' => 'SARM_ADMIN_CSRF',
        'ADMIN_SESSION_IDLE_MINUTES' => '30',
        'ADMIN_SESSION_ABSOLUTE_HOURS' => '12',
        'ADMIN_TRUSTED_DEVICE_DAYS' => '30',
        'COOKIE_SECURE' => '0',
        'COOKIE_SAMESITE' => 'Lax',
        'PASSWORD_ALGO' => 'auto',
        'PASSWORD_BCRYPT_COST' => '12',
        'MAIL_TRANSPORT' => 'log',
        'MAIL_HOST' => '',
        'MAIL_PORT' => '465',
        'MAIL_USERNAME' => '',
        'MAIL_PASSWORD' => '',
        'MAIL_ENCRYPTION' => 'ssl',
        'MAIL_FROM_ADDRESS' => '',
        'MAIL_FROM_NAME' => 'Sarmelle',
        'MAIL_REPLY_TO' => '',
        'MAIL_LOG_DIR' => 'var/mail',
        'MAIL_TIMEOUT_SECONDS' => '10',
        'MAX_JSON_BYTES' => '65536',
        'LOG_DIR' => 'var/log',
        'LOG_LEVEL' => 'warning',
        'SETUP_ALLOWED' => '0',
        'RECOVERY_ALLOWED' => '0',
        'RAZORPAY_KEY_ID' => '',
        'RAZORPAY_KEY_SECRET' => '',
        'RAZORPAY_WEBHOOK_SECRET' => '',
    ];

    /**
     * @param array<string, string> $values
     */
    private function __construct(
        private readonly array $values,
        private readonly string $privateRoot
    ) {
    }

    public static function load(string $privateRoot): self
    {
        $root = self::normalisePath($privateRoot);
        $envPath = self::normalisePath($root . '/Config/.env');

        self::assertSafeEnvPath($envPath, $root);

        if (!is_file($envPath)) {
            throw new \RuntimeException(
                'Configuration file is missing. Copy .env.example to server/private/Config/.env.'
            );
        }

        $contents = @file_get_contents($envPath);

        if (!is_string($contents)) {
            throw new \RuntimeException('Configuration file could not be read.');
        }

        return self::fromArray(Env::parse($contents), $root);
    }

    /**
     * @param array<string, mixed> $values
     */
    public static function fromArray(array $values, string $privateRoot = ''): self
    {
        foreach (self::REQUIRED as $key) {
            if (!array_key_exists($key, $values) || trim((string) $values[$key]) === '') {
                throw new \RuntimeException('Missing required configuration key: ' . $key);
            }
        }

        $known = array_merge(self::REQUIRED, array_keys(self::DEFAULTS));

        foreach ($values as $key => $value) {
            if (!is_string($key)) {
                throw new \RuntimeException('Configuration keys must be strings.');
            }

            if (!in_array($key, $known, true)) {
                $suggestion = self::closestKey($key, $known);

                throw new \RuntimeException(
                    'Unknown configuration key: ' . $key
                    . ($suggestion !== null ? ' (did you mean ' . $suggestion . '?)' : '')
                    . '. Remove it from server/private/Config/.env.'
                );
            }
        }

        $merged = self::DEFAULTS;

        foreach ($values as $key => $value) {
            if ($value !== null && !is_scalar($value)) {
                throw new \RuntimeException('Configuration key ' . $key . ' must be a scalar value.');
            }

            $merged[$key] = (string) $value;
        }

        $config = new self($merged, self::normalisePath($privateRoot));
        $config->validate();

        return $config;
    }

    /**
     * Public so server/bin/selftest.php can prove the web-root refusal without
     * touching a real file. Never call it from request code.
     *
     * The document root is read from $_SERVER unless a value is passed, so a
     * deployment where the private tree was accidentally placed inside
     * public_html is refused too.
     */
    public static function assertSafeEnvPath(
        string $envPath,
        string $privateRoot,
        ?string $documentRoot = null
    ): void {
        $envPath = self::normalisePath($envPath);
        $root = self::normalisePath($privateRoot);

        $webRoots = [
            self::normalisePath($root . '/../web-storefront'),
            self::normalisePath($root . '/../web-admin'),
        ];

        foreach ($webRoots as $webRoot) {
            if (self::isWithin($envPath, $webRoot)) {
                throw new \RuntimeException('Refusing to load .env from inside a web root.');
            }
        }

        if ($documentRoot === null) {
            $documentRoot = isset($_SERVER['DOCUMENT_ROOT']) && is_string($_SERVER['DOCUMENT_ROOT'])
                ? $_SERVER['DOCUMENT_ROOT']
                : '';
        }

        $documentRoot = trim($documentRoot);

        if ($documentRoot !== '') {
            $docRoot = self::normalisePath($documentRoot);

            if ($docRoot !== '' && $docRoot !== '/' && self::isWithin($envPath, $docRoot)) {
                throw new \RuntimeException('Refusing to load .env from inside the document root.');
            }
        }

        if (!self::isWithin($envPath, $root)) {
            throw new \RuntimeException('Refusing to load .env outside the private tree.');
        }
    }

    public function env(): string
    {
        return $this->string('APP_ENV');
    }

    public function isLocal(): bool
    {
        return $this->env() === 'local';
    }

    public function isProduction(): bool
    {
        return $this->env() === 'production';
    }

    public function debug(): bool
    {
        return $this->bool('APP_DEBUG');
    }

    public function appUrl(): string
    {
        return $this->string('APP_URL');
    }

    public function adminUrl(): string
    {
        return $this->string('ADMIN_URL');
    }

    public function appKey(): string
    {
        return $this->string('APP_KEY');
    }

    public function timezone(): string
    {
        return $this->string('APP_TIMEZONE');
    }

    public function privateRoot(): string
    {
        return $this->privateRoot;
    }

    /**
     * Resolves a filesystem setting against the private root.
     *
     * Relative values stay relative to that root, so a deployment whose private
     * tree is called something else on disk (Hostinger uses a name such as
     * sarmelle-private) still finds its sessions, mail logs and app logs.
     * Older values copied from the design's repository-relative examples
     * ("server/private/var/...") are accepted and treated the same way.
     */
    public function path(string $key): string
    {
        $value = trim($this->string($key));

        if ($value === '') {
            throw new \RuntimeException('Configuration key ' . $key . ' must be a path.');
        }

        $value = str_replace('\\', '/', $value);
        $absolute = str_starts_with($value, '/')
            || preg_match('#^[A-Za-z]:/#', $value) === 1;

        if ($absolute) {
            return self::normalisePath($value);
        }

        if ($this->privateRoot === '') {
            throw new \RuntimeException(
                'The private root is not set; cannot resolve configuration key ' . $key . '.'
            );
        }

        if (str_starts_with($value, 'server/private/')) {
            $value = substr($value, strlen('server/private/'));
        }

        return self::normalisePath($this->privateRoot . '/' . $value);
    }

    public function string(string $key): string
    {
        if (!array_key_exists($key, $this->values)) {
            throw new \InvalidArgumentException('Unknown configuration key: ' . $key);
        }

        return $this->values[$key];
    }

    public function int(string $key): int
    {
        $value = $this->string($key);

        if (preg_match('/^\d+$/', $value) !== 1) {
            throw new \RuntimeException('Configuration key ' . $key . ' must be an integer.');
        }

        return (int) $value;
    }

    public function bool(string $key): bool
    {
        return self::toBool($this->string($key), $key);
    }

    private function validate(): void
    {
        if (!in_array($this->env(), ['local', 'staging', 'production'], true)) {
            throw new \RuntimeException('APP_ENV must be local, staging or production.');
        }

        $this->bool('APP_DEBUG');

        if (in_array($this->env(), ['staging', 'production'], true) && $this->debug()) {
            throw new \RuntimeException(
                'Refusing to start: APP_DEBUG must be 0 when APP_ENV is staging or production.'
            );
        }

        if ($this->timezone() !== self::TIMEZONE) {
            throw new \RuntimeException('APP_TIMEZONE must be ' . self::TIMEZONE . '.');
        }

        $this->assertAppKey();
        $this->assertUrl('APP_URL');
        $this->assertUrl('ADMIN_URL');

        if (in_array($this->env(), ['staging', 'production'], true)) {
            if (!$this->bool('COOKIE_SECURE')) {
                throw new \RuntimeException(
                    'Refusing to start: COOKIE_SECURE must be 1 when APP_ENV is staging or production.'
                );
            }

            foreach (['APP_URL', 'ADMIN_URL'] as $urlKey) {
                if ($this->urlScheme($urlKey) !== 'https') {
                    throw new \RuntimeException(
                        'Refusing to start: ' . $urlKey
                        . ' must use https when APP_ENV is staging or production.'
                    );
                }
            }

            if (strtolower(trim($this->string('DB_USER'))) === 'root') {
                throw new \RuntimeException(
                    'Refusing to start: DB_USER must not be root when APP_ENV is staging or production.'
                );
            }

            foreach (['APP_URL', 'ADMIN_URL'] as $urlKey) {
                $this->assertOriginOnly($urlKey);
            }

            if ($this->urlHost('APP_URL') === $this->urlHost('ADMIN_URL')) {
                throw new \RuntimeException(
                    'Refusing to start: APP_URL and ADMIN_URL must use different hosts'
                    . ' when APP_ENV is staging or production.'
                );
            }
        }

        if (preg_match('/^[A-Za-z0-9._:-]+$/', $this->string('DB_HOST')) !== 1) {
            throw new \RuntimeException('DB_HOST contains unsupported characters.');
        }

        if (preg_match('/^[A-Za-z0-9_]+$/', $this->string('DB_NAME')) !== 1) {
            throw new \RuntimeException('DB_NAME must contain only letters, digits and underscores.');
        }

        $this->assertIntRange('DB_PORT', 1, 65535);

        if ($this->string('DB_CHARSET') !== 'utf8mb4') {
            throw new \RuntimeException('DB_CHARSET must be utf8mb4.');
        }

        if ($this->string('DB_TIMEZONE') !== self::TIMEZONE_OFFSET) {
            throw new \RuntimeException('DB_TIMEZONE must be ' . self::TIMEZONE_OFFSET . '.');
        }

        if ($this->bool('DB_SSL') && trim($this->string('DB_SSL_CA')) === '') {
            throw new \RuntimeException('DB_SSL_CA must be set when DB_SSL=1.');
        }

        $this->assertIntRange('SESSION_LIFETIME_CUSTOMER_DAYS', 1, 3650);
        $this->assertIntRange('ADMIN_SESSION_IDLE_MINUTES', 1, 1440);
        $this->assertIntRange('ADMIN_SESSION_ABSOLUTE_HOURS', 1, 720);
        $this->assertIntRange('ADMIN_TRUSTED_DEVICE_DAYS', 1, 365);
        $this->assertIntRange('PASSWORD_BCRYPT_COST', 4, 31);
        $this->assertIntRange('MAIL_PORT', 1, 65535);
        $this->assertIntRange('MAIL_TIMEOUT_SECONDS', 1, 120);
        $this->assertIntRange('MAX_JSON_BYTES', 1024, 1048576);

        foreach (['COOKIE_SECURE', 'SETUP_ALLOWED', 'RECOVERY_ALLOWED'] as $booleanKey) {
            $this->bool($booleanKey);
        }

        self::assertRuntimeFlags(
            $this->bool('SETUP_ALLOWED'),
            $this->bool('RECOVERY_ALLOWED'),
            PHP_SAPI
        );

        if (!in_array($this->string('COOKIE_SAMESITE'), ['Lax', 'Strict', 'None'], true)) {
            throw new \RuntimeException('COOKIE_SAMESITE must be Lax, Strict or None.');
        }

        if ($this->string('COOKIE_SAMESITE') === 'None' && !$this->bool('COOKIE_SECURE')) {
            throw new \RuntimeException(
                'Refusing to start: COOKIE_SAMESITE=None requires COOKIE_SECURE=1.'
            );
        }

        if (!in_array($this->string('PASSWORD_ALGO'), ['auto', 'argon2id', 'bcrypt'], true)) {
            throw new \RuntimeException('PASSWORD_ALGO must be auto, argon2id or bcrypt.');
        }

        if (!in_array($this->string('LOG_LEVEL'), ['debug', 'info', 'warning', 'error', 'critical'], true)) {
            throw new \RuntimeException('LOG_LEVEL is not recognised.');
        }

        $this->validateMail();

        if ($this->isProduction() && $this->string('MAIL_TRANSPORT') === 'log') {
            throw new \RuntimeException(
                'Refusing to start: MAIL_TRANSPORT must not be log when APP_ENV=production.'
            );
        }
    }

    /**
     * Setup and recovery switches are CLI-only. Public so selftest can prove
     * the refusal without changing the running SAPI.
     */
    public static function assertRuntimeFlags(
        bool $setupAllowed,
        bool $recoveryAllowed,
        string $sapi
    ): void {
        if (in_array($sapi, ['cli', 'phpdbg'], true)) {
            return;
        }

        if ($setupAllowed || $recoveryAllowed) {
            throw new \RuntimeException(
                'Refusing to start: SETUP_ALLOWED and RECOVERY_ALLOWED are CLI-only.'
            );
        }
    }

    private function validateMail(): void
    {
        $transport = $this->string('MAIL_TRANSPORT');

        if (!in_array($transport, ['log', 'smtp'], true)) {
            throw new \RuntimeException('MAIL_TRANSPORT must be log or smtp.');
        }

        if ($transport !== 'smtp') {
            return;
        }

        foreach (['MAIL_HOST', 'MAIL_USERNAME', 'MAIL_PASSWORD', 'MAIL_FROM_ADDRESS'] as $key) {
            if (trim($this->string($key)) === '') {
                throw new \RuntimeException('Missing required configuration key: ' . $key);
            }
        }

        if (!in_array($this->string('MAIL_ENCRYPTION'), ['ssl', 'tls', 'none'], true)) {
            throw new \RuntimeException('MAIL_ENCRYPTION must be ssl, tls or none.');
        }

        if (filter_var($this->string('MAIL_FROM_ADDRESS'), FILTER_VALIDATE_EMAIL) === false) {
            throw new \RuntimeException('MAIL_FROM_ADDRESS must be a valid email address.');
        }
    }

    private function assertAppKey(): void
    {
        $decoded = base64_decode($this->string('APP_KEY'), true);

        if ($decoded === false || strlen($decoded) !== 32) {
            throw new \RuntimeException('APP_KEY must be base64 encoding of exactly 32 bytes.');
        }
    }

    private function assertUrl(string $key): void
    {
        $parts = parse_url($this->string($key));
        $scheme = is_array($parts) ? strtolower((string) ($parts['scheme'] ?? '')) : '';
        $host = is_array($parts) ? (string) ($parts['host'] ?? '') : '';

        if (!in_array($scheme, ['http', 'https'], true) || $host === '') {
            throw new \RuntimeException($key . ' must be an absolute http(s) URL.');
        }
    }

    private function urlScheme(string $key): string
    {
        $parts = parse_url($this->string($key));

        return is_array($parts) ? strtolower((string) ($parts['scheme'] ?? '')) : '';
    }

    /**
     * A configured origin is scheme + host + optional port only. A path, query
     * or fragment would make the Origin check compare against a value the
     * browser never sends.
     */
    private function assertOriginOnly(string $key): void
    {
        $parts = parse_url($this->string($key));

        if (!is_array($parts)) {
            throw new \RuntimeException($key . ' must be an absolute http(s) URL.');
        }

        $path = (string) ($parts['path'] ?? '');

        if ($path !== '' && $path !== '/') {
            throw new \RuntimeException(
                'Refusing to start: ' . $key
                . ' must not contain a path when APP_ENV is staging or production.'
            );
        }

        if (array_key_exists('query', $parts)) {
            throw new \RuntimeException(
                'Refusing to start: ' . $key
                . ' must not contain a query when APP_ENV is staging or production.'
            );
        }

        if (array_key_exists('fragment', $parts)) {
            throw new \RuntimeException(
                'Refusing to start: ' . $key
                . ' must not contain a fragment when APP_ENV is staging or production.'
            );
        }
    }

    private function urlHost(string $key): string
    {
        $parts = parse_url($this->string($key));

        return is_array($parts) ? strtolower((string) ($parts['host'] ?? '')) : '';
    }

    private function assertIntRange(string $key, int $minimum, int $maximum): void
    {
        $value = $this->int($key);

        if ($value < $minimum || $value > $maximum) {
            throw new \RuntimeException($key . ' is out of range.');
        }
    }

    private static function toBool(string $value, string $key): bool
    {
        return match (strtolower($value)) {
            '1', 'true', 'yes', 'on' => true,
            '0', 'false', 'no', 'off' => false,
            default => throw new \RuntimeException('Configuration key ' . $key . ' must be a boolean.'),
        };
    }

    /**
     * Suggests a known key for a typo, but only when the names are close.
     *
     * @param array<int, string> $known
     */
    private static function closestKey(string $key, array $known): ?string
    {
        $needle = strtoupper($key);
        $best = null;
        $bestPercent = 0.0;

        foreach ($known as $candidate) {
            similar_text($needle, strtoupper($candidate), $percent);

            if ($percent > $bestPercent) {
                $bestPercent = $percent;
                $best = $candidate;
            }
        }

        return $bestPercent >= 60.0 ? $best : null;
    }

    private static function normalisePath(string $path): string
    {
        $path = str_replace('\\', '/', $path);
        $path = preg_replace('#/+#', '/', $path) ?? $path;

        $prefix = '';

        if (preg_match('#^[A-Za-z]:/#', $path) === 1) {
            $prefix = substr($path, 0, 2);
            $path = substr($path, 2);
        }

        $absolute = str_starts_with($path, '/');
        $parts = [];

        foreach (explode('/', $path) as $part) {
            if ($part === '' || $part === '.') {
                continue;
            }

            if ($part === '..') {
                array_pop($parts);
                continue;
            }

            $parts[] = $part;
        }

        $normalised = implode('/', $parts);

        if ($prefix !== '') {
            return $prefix . '/' . $normalised;
        }

        return ($absolute ? '/' : '') . $normalised;
    }

    private static function isWithin(string $path, string $root): bool
    {
        $path = strtolower(rtrim($path, '/'));
        $root = strtolower(rtrim($root, '/'));

        return $path === $root || str_starts_with($path, $root . '/');
    }
}
