<?php
declare(strict_types=1);

/**
 * CLI self-test for the config parser, config validation and (from slice 2)
 * the IST clock. Uses in-memory strings only: no .env file, no database.
 *
 *   php server/bin/selftest.php
 */

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

require dirname(__DIR__) . '/private/bootstrap.php';

use Sarmelle\Auth\Policy;
use Sarmelle\Config\Config;
use Sarmelle\Config\Env;
use Sarmelle\Core\ClientIp;
use Sarmelle\Core\Clock;
use Sarmelle\Core\Connection;
use Sarmelle\Core\Json;
use Sarmelle\Core\Request;
use Sarmelle\Core\Response;
use Sarmelle\Core\Router;
use Sarmelle\Http\Csrf;
use Sarmelle\Http\SecurityHeaders;
use Sarmelle\Support\Normaliser;
use Sarmelle\Support\ValidationException;
use Sarmelle\Support\Validator;

final class Selftest
{
    private int $passed = 0;
    private int $failed = 0;

    public function run(string $label, callable $test): void
    {
        try {
            $test();
            $this->passed++;
            echo '[PASS] ' . $label . PHP_EOL;
        } catch (\Throwable $exception) {
            $this->failed++;
            echo '[FAIL] ' . $label . ' - ' . $exception->getMessage() . PHP_EOL;
        }
    }

    public function same(mixed $expected, mixed $actual, string $message = ''): void
    {
        if ($expected !== $actual) {
            throw new \RuntimeException(
                ($message !== '' ? $message . ': ' : '')
                . 'expected ' . var_export($expected, true)
                . ', got ' . var_export($actual, true)
            );
        }
    }

    public function true(bool $condition, string $message): void
    {
        if (!$condition) {
            throw new \RuntimeException($message);
        }
    }

    public function throws(string $exceptionClass, string $needle, callable $callable): void
    {
        try {
            $callable();
        } catch (\Throwable $exception) {
            if (!$exception instanceof $exceptionClass) {
                throw new \RuntimeException(
                    'expected ' . $exceptionClass . ', got ' . $exception::class . ': ' . $exception->getMessage()
                );
            }

            if ($needle !== '' && !str_contains($exception->getMessage(), $needle)) {
                throw new \RuntimeException(
                    'exception message does not contain "' . $needle . '": ' . $exception->getMessage()
                );
            }

            return;
        }

        throw new \RuntimeException('expected ' . $exceptionClass . ' but nothing was thrown');
    }

    public function summary(): int
    {
        echo PHP_EOL . $this->passed . ' passed, ' . $this->failed . ' failed' . PHP_EOL;

        return $this->failed === 0 ? 0 : 1;
    }
}

$test = new Selftest();

$baseConfig = static fn (array $overrides = []): array => array_merge([
    'APP_ENV' => 'local',
    'APP_DEBUG' => '1',
    'APP_URL' => 'http://localhost:3000',
    'ADMIN_URL' => 'http://localhost:8081',
    'APP_KEY' => base64_encode(str_repeat('k', 32)),
    'APP_TIMEZONE' => 'Asia/Kolkata',
    'DB_HOST' => '127.0.0.1',
    'DB_PORT' => '3307',
    'DB_NAME' => 'sarmelle_db',
    'DB_USER' => 'sarmelle_user',
    'DB_PASSWORD' => 'local-password',
    'DB_CHARSET' => 'utf8mb4',
    'DB_TIMEZONE' => '+05:30',
], $overrides);

$productionConfig = static fn (array $overrides = []): array => $baseConfig(array_merge([
    'APP_ENV' => 'production',
    'APP_DEBUG' => '0',
    'APP_URL' => 'https://sarmelle.com',
    'ADMIN_URL' => 'https://admin.sarmelle.com',
    'COOKIE_SECURE' => '1',
    'MAIL_TRANSPORT' => 'smtp',
    'MAIL_HOST' => 'smtp.example.com',
    'MAIL_USERNAME' => 'mailer@example.com',
    'MAIL_PASSWORD' => 'smtp-secret',
    'MAIL_FROM_ADDRESS' => 'shop@example.com',
], $overrides));

// --- Parser -----------------------------------------------------------------

$test->run('env: simple keys, empty value and full-line comments', function () use ($test): void {
    $values = Env::parse("# header comment\nAPP_ENV=local\nEMPTY=\n");

    $test->same('local', $values['APP_ENV']);
    $test->same('', $values['EMPTY']);
    $test->true(!array_key_exists('# header comment', $values), 'comment leaked into values');
});

$test->run('env: quoted values keep # $ quotes = and spaces', function () use ($test): void {
    $input = <<<'ENV'
SPECIAL_DOUBLE="pa#ss $word 'single' \"double\" = ok"
SPECIAL_SINGLE='it # is $ fine = yes'
ENV;

    $values = Env::parse($input);

    $test->same('pa#ss $word \'single\' "double" = ok', $values['SPECIAL_DOUBLE']);
    $test->same('it # is $ fine = yes', $values['SPECIAL_SINGLE']);
});

$test->run('env: a # is a comment only after whitespace outside quotes', function () use ($test): void {
    $values = Env::parse("A=value # note\nB=a#b\nC=#hash\nD= # comment only\n");

    $test->same('value', $values['A']);
    $test->same('a#b', $values['B']);
    $test->same('#hash', $values['C']);
    $test->same('', $values['D']);
});

$test->run('env: quoted spaces are kept and unquoted values are trimmed', function () use ($test): void {
    $values = Env::parse("SPACED =   padded value   \nKEEP=\"  keep  spaces  \"\n");

    $test->same('padded value', $values['SPACED']);
    $test->same('  keep  spaces  ', $values['KEEP']);
});

$test->run('env: escaped backslash and quote survive', function () use ($test): void {
    $values = Env::parse('E="back\\\\slash and \\"quote\\""');

    $test->same('back\\slash and "quote"', $values['E']);
});

$test->run('env: CRLF and a UTF-8 BOM are handled', function () use ($test): void {
    $values = Env::parse("\xEF\xBB\xBFA=1\r\nB=2\r\n");

    $test->same('1', $values['A']);
    $test->same('2', $values['B']);
});

$test->run('env: malformed lines are rejected', function () use ($test): void {
    $test->throws(\InvalidArgumentException::class, 'expected KEY=value', static fn () => Env::parse('NO_EQUALS'));
    $test->throws(\InvalidArgumentException::class, 'bad key name', static fn () => Env::parse('=value'));
    $test->throws(\InvalidArgumentException::class, 'unterminated', static fn () => Env::parse('A="open'));
    $test->throws(\InvalidArgumentException::class, 'closing quote', static fn () => Env::parse('A="x" junk'));
    $test->throws(\InvalidArgumentException::class, 'duplicate', static fn () => Env::parse("A=1\nA=2"));
});

// --- Config -----------------------------------------------------------------

$test->run('config: a minimal valid set builds and defaults apply', function () use ($test, $baseConfig): void {
    $config = Config::fromArray($baseConfig());

    $test->same('local', $config->env());
    $test->true($config->isLocal(), 'expected local environment');
    $test->true($config->debug(), 'expected debug on');
    $test->same(3307, $config->int('DB_PORT'));
    $test->same('log', $config->string('MAIL_TRANSPORT'));
    $test->same(30, $config->int('ADMIN_TRUSTED_DEVICE_DAYS'));
    $test->same(32, strlen((string) base64_decode($config->appKey(), true)));
});

$test->run('config: a missing required key is named in the error', function () use ($test, $baseConfig): void {
    $values = $baseConfig();
    unset($values['APP_KEY']);

    $test->throws(\RuntimeException::class, 'APP_KEY', static fn () => Config::fromArray($values));
});

$test->run('config: APP_DEBUG=1 is refused in production', function () use ($test, $productionConfig): void {
    $test->throws(
        \RuntimeException::class,
        'APP_DEBUG',
        static fn () => Config::fromArray($productionConfig(['APP_DEBUG' => '1']))
    );
});

$test->run('config: production with APP_DEBUG=0 builds', function () use ($test, $productionConfig): void {
    $config = Config::fromArray($productionConfig());

    $test->true($config->isProduction(), 'expected production environment');
    $test->true(!$config->debug(), 'expected debug off');
});

$test->run('config: the IST timezone is asserted, not trusted', function () use ($test, $baseConfig): void {
    $test->throws(
        \RuntimeException::class,
        'Asia/Kolkata',
        static fn () => Config::fromArray($baseConfig(['APP_TIMEZONE' => 'UTC']))
    );
});

$test->run('config: APP_KEY must decode to exactly 32 bytes', function () use ($test, $baseConfig): void {
    $test->throws(
        \RuntimeException::class,
        'APP_KEY',
        static fn () => Config::fromArray($baseConfig(['APP_KEY' => base64_encode('short')]))
    );
});

$test->run('config: an unknown APP_ENV is refused', function () use ($test, $baseConfig): void {
    $test->throws(
        \RuntimeException::class,
        'APP_ENV',
        static fn () => Config::fromArray($baseConfig(['APP_ENV' => 'qa']))
    );
});

$test->run('config: smtp needs credentials, log transport does not', function () use ($test, $baseConfig): void {
    $smtp = [
        'MAIL_TRANSPORT' => 'smtp',
        'MAIL_HOST' => 'smtp.example.com',
        'MAIL_USERNAME' => 'mailer@example.com',
        'MAIL_FROM_ADDRESS' => 'shop@example.com',
    ];

    $test->throws(
        \RuntimeException::class,
        'MAIL_PASSWORD',
        static fn () => Config::fromArray($baseConfig($smtp))
    );

    $withPassword = $smtp;
    $withPassword['MAIL_PASSWORD'] = 'smtp-secret';
    $config = Config::fromArray($baseConfig($withPassword));
    $test->same('smtp', $config->string('MAIL_TRANSPORT'));

    $log = Config::fromArray($baseConfig(['MAIL_TRANSPORT' => 'log']));
    $test->same('log', $log->string('MAIL_TRANSPORT'));
});

$test->run('config: a non-integer port is refused', function () use ($test, $baseConfig): void {
    $test->throws(
        \RuntimeException::class,
        'DB_PORT',
        static fn () => Config::fromArray($baseConfig(['DB_PORT' => 'abc']))
    );
});

$test->run('config: an unknown key is refused and the closest key is suggested', function () use ($test, $baseConfig): void {
    $caught = null;

    try {
        Config::fromArray($baseConfig(['DB_PASS' => 'typo']));
    } catch (\RuntimeException $exception) {
        $caught = $exception;
    }

    $test->true($caught instanceof \RuntimeException, 'an unknown key must be refused');
    $test->true(str_contains($caught->getMessage(), 'DB_PASS'), 'the unknown key must be named');
    $test->true(str_contains($caught->getMessage(), 'DB_PASSWORD'), 'the closest key must be suggested');
});

$test->run('config: DB_SSL=1 requires DB_SSL_CA', function () use ($test, $baseConfig): void {
    $test->throws(
        \RuntimeException::class,
        'DB_SSL_CA',
        static fn () => Config::fromArray($baseConfig(['DB_SSL' => '1']))
    );
});

$test->run('config: .env inside a web root is refused', function () use ($test): void {
    $test->throws(
        \RuntimeException::class,
        'web root',
        static fn () => Config::assertSafeEnvPath(
            'C:/repo/server/web-storefront/.env',
            'C:/repo/server/private'
        )
    );
});

$test->run('config: .env outside the private tree is refused', function () use ($test): void {
    $test->throws(
        \RuntimeException::class,
        'private tree',
        static fn () => Config::assertSafeEnvPath('C:/temp/.env', 'C:/repo/server/private', '')
    );
});

$test->run('config: .env inside the private tree is accepted', function () use ($test): void {
    Config::assertSafeEnvPath(
        'C:/repo/server/private/Config/.env',
        'C:/repo/server/private',
        ''
    );

    $test->true(true, 'no exception expected');
});

$test->run('config: the on-disk .env directory is exactly Config (case-sensitive)', function () use ($test): void {
    // file_exists() cannot prove the case on Windows, so compare the real
    // directory entry name returned by scandir().
    $privateRoot = dirname(__DIR__) . '/private';
    $entries = scandir($privateRoot);

    $test->true(is_array($entries), 'could not list server/private');

    $test->true(
        in_array('Config', $entries, true),
        'server/private/Config is missing (expected that exact case)'
    );
    $test->true(
        !in_array('config', $entries, true),
        'a lowercase server/private/config directory also exists; the path is ambiguous'
    );
});

// --- Config hardening --------------------------------------------------------

$test->run('config: staging and production need COOKIE_SECURE=1', function () use ($test, $baseConfig, $productionConfig): void {
    foreach (['staging', 'production'] as $environment) {
        $values = $environment === 'production'
            ? $productionConfig(['COOKIE_SECURE' => '0'])
            : $baseConfig([
                'APP_ENV' => 'staging',
                'APP_DEBUG' => '0',
                'APP_URL' => 'https://stag.sarmelle.com',
                'ADMIN_URL' => 'https://admin.stag.sarmelle.com',
                'COOKIE_SECURE' => '0',
            ]);

        $test->throws(
            \RuntimeException::class,
            'COOKIE_SECURE',
            static fn () => Config::fromArray($values)
        );
    }
});

$test->run('config: staging and production need https app and admin URLs', function () use ($test, $baseConfig, $productionConfig): void {
    $test->throws(
        \RuntimeException::class,
        'APP_URL',
        static fn () => Config::fromArray($productionConfig(['APP_URL' => 'http://sarmelle.com']))
    );

    $test->throws(
        \RuntimeException::class,
        'ADMIN_URL',
        static fn () => Config::fromArray($productionConfig(['ADMIN_URL' => 'http://admin.sarmelle.com']))
    );

    $staging = Config::fromArray($baseConfig([
        'APP_ENV' => 'staging',
        'APP_DEBUG' => '0',
        'APP_URL' => 'https://stag.sarmelle.com',
        'ADMIN_URL' => 'https://admin.stag.sarmelle.com',
        'COOKIE_SECURE' => '1',
    ]));

    $test->same('staging', $staging->env());
});

$test->run('config: production refuses the log mail transport', function () use ($test, $productionConfig): void {
    $test->throws(
        \RuntimeException::class,
        'MAIL_TRANSPORT',
        static fn () => Config::fromArray($productionConfig(['MAIL_TRANSPORT' => 'log']))
    );

    $staging = Config::fromArray($productionConfig([
        'APP_ENV' => 'staging',
        'APP_URL' => 'https://stag.sarmelle.com',
        'ADMIN_URL' => 'https://admin.stag.sarmelle.com',
        'MAIL_TRANSPORT' => 'log',
    ]));

    $test->same('log', $staging->string('MAIL_TRANSPORT'));
});

$test->run('config: SameSite=None requires a secure cookie', function () use ($test, $baseConfig): void {
    $test->throws(
        \RuntimeException::class,
        'COOKIE_SAMESITE',
        static fn () => Config::fromArray($baseConfig(['COOKIE_SAMESITE' => 'None']))
    );

    $secure = Config::fromArray($baseConfig([
        'COOKIE_SAMESITE' => 'None',
        'COOKIE_SECURE' => '1',
    ]));

    $test->same('None', $secure->string('COOKIE_SAMESITE'));
});

$test->run('config: setup and recovery flags are CLI-only', function () use ($test): void {
    Config::assertRuntimeFlags(true, true, 'cli');
    Config::assertRuntimeFlags(false, false, 'apache2handler');

    $test->throws(
        \RuntimeException::class,
        'CLI-only',
        static fn () => Config::assertRuntimeFlags(true, false, 'apache2handler')
    );

    $test->throws(
        \RuntimeException::class,
        'CLI-only',
        static fn () => Config::assertRuntimeFlags(false, true, 'fpm-fcgi')
    );
});

$test->run('config: .env inside the document root is refused', function () use ($test): void {
    $previous = $_SERVER['DOCUMENT_ROOT'] ?? null;
    $_SERVER['DOCUMENT_ROOT'] = 'C:/home/u123/public_html';

    try {
        $test->throws(
            \RuntimeException::class,
            'document root',
            static fn () => Config::assertSafeEnvPath(
                'C:/home/u123/public_html/private/config/.env',
                'C:/home/u123/public_html/private'
            )
        );
    } finally {
        if ($previous === null) {
            unset($_SERVER['DOCUMENT_ROOT']);
        } else {
            $_SERVER['DOCUMENT_ROOT'] = $previous;
        }
    }

    $test->throws(
        \RuntimeException::class,
        'document root',
        static fn () => Config::assertSafeEnvPath(
            '/home/u/private/config/.env',
            '/home/u/private',
            '/home/u'
        )
    );
});

$test->run('config: private paths resolve against the private root', function () use ($test, $baseConfig): void {
    $config = Config::fromArray($baseConfig(), 'C:/deploy/sarmelle-private');

    $test->same('C:/deploy/sarmelle-private/var/sessions', $config->path('SESSION_SAVE_PATH'));
    $test->same('C:/deploy/sarmelle-private/var/mail', $config->path('MAIL_LOG_DIR'));
    $test->same('C:/deploy/sarmelle-private/var/log', $config->path('LOG_DIR'));

    $legacy = Config::fromArray(
        $baseConfig(['LOG_DIR' => 'server/private/var/log']),
        'C:/deploy/sarmelle-private'
    );
    $test->same('C:/deploy/sarmelle-private/var/log', $legacy->path('LOG_DIR'));

    $absolute = Config::fromArray(
        $baseConfig(['LOG_DIR' => '/home/u/sarmelle-private/var/log']),
        'C:/deploy/sarmelle-private'
    );
    $test->same('/home/u/sarmelle-private/var/log', $absolute->path('LOG_DIR'));

    $windows = Config::fromArray(
        $baseConfig(['LOG_DIR' => 'D:\\logs']),
        'C:/deploy/sarmelle-private'
    );
    $test->same('D:/logs', $windows->path('LOG_DIR'));
});

$test->run('connection: the required sql_mode is the strict set', function () use ($test): void {
    $test->same(
        'STRICT_ALL_TABLES,NO_ZERO_DATE,NO_ZERO_IN_DATE,'
        . 'ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION',
        Connection::REQUIRED_SQL_MODE
    );
});

// --- Clock -------------------------------------------------------------------

$test->run('clock: now() is Asia/Kolkata at +05:30', function () use ($test): void {
    $now = Clock::now();

    $test->same('Asia/Kolkata', $now->getTimezone()->getName());
    $test->same('+05:30', $now->format('P'));
    $test->same('Asia/Kolkata', Clock::zone()->getName());
});

$test->run('clock: nowMysql() is a MySQL DATETIME string for the same instant', function () use ($test): void {
    $value = Clock::nowMysql();

    $test->true(
        preg_match('/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/', $value) === 1,
        'unexpected MySQL datetime format: ' . $value
    );

    $parsed = Clock::fromMysql($value);
    $test->same($value, $parsed->format('Y-m-d H:i:s'));
    $test->same('+05:30', $parsed->format('P'));
    $test->true(
        abs(Clock::now()->getTimestamp() - $parsed->getTimestamp()) <= 2,
        'nowMysql() is not close to now()'
    );
});

$test->run('clock: fromMysql() reads IST wall time, not the server timezone', function () use ($test): void {
    $parsed = Clock::fromMysql('2026-01-02 03:04:05');

    $test->same('2026-01-02 03:04:05', $parsed->format('Y-m-d H:i:s'));
    $test->same('+05:30', $parsed->format('P'));
    $test->same('Asia/Kolkata', $parsed->getTimezone()->getName());
});

$test->run('clock: fromMysql() rejects a non-datetime string', function () use ($test): void {
    $test->throws(
        \InvalidArgumentException::class,
        'Invalid MySQL datetime',
        static fn () => Clock::fromMysql('not-a-date')
    );
});

// --- JSON, router, headers and client IP -------------------------------------

$test->run('json: only a JSON object body is accepted', function () use ($test): void {
    $test->same([], Json::decodeObject(''));
    $test->same([], Json::decodeObject('{}'));
    $test->same(['a' => 1], Json::decodeObject('{"a":1}'));
    $test->throws(\InvalidArgumentException::class, 'Malformed', static fn () => Json::decodeObject('{"a":'));
    $test->throws(\InvalidArgumentException::class, 'JSON object', static fn () => Json::decodeObject('[]'));
});

$routerConfig = Config::fromArray($baseConfig());

$buildRouter = static function (Config $config): Router {
    $router = new Router($config, $config->appUrl());
    $router->add('GET', '/api/health', static fn (Request $request): Response => Response::raw(['ok' => true]));
    $router->add('GET', '/api/boom', static function (Request $request): Response {
        throw new \RuntimeException('SQLSTATE[HY000] secret detail');
    });
    $router->add(
        'POST',
        '/api/test',
        static fn (Request $request): Response => Response::success(['received' => $request->json()])
    );

    return $router;
};

$test->run('router: unknown path is 404 with a request id and no CORS header', function () use ($test, $buildRouter, $routerConfig): void {
    $response = $buildRouter($routerConfig)->dispatch(new Request('GET', '/api/missing'));
    $body = $response->decoded();

    $test->same(404, $response->status());
    $test->same('not_found', $body['error']['code']);
    $test->true(isset($body['error']['request_id']), 'request_id is missing');
    $test->same(null, $response->header('Access-Control-Allow-Origin'));
});

$test->run('router: a known path with the wrong method is 405 with Allow', function () use ($test, $buildRouter, $routerConfig): void {
    $response = $buildRouter($routerConfig)->dispatch(new Request('DELETE', '/api/health'));

    $test->same(405, $response->status());
    $test->same('GET', $response->header('Allow'));
    $test->same('method_not_allowed', $response->decoded()['error']['code']);
});

$test->run('router: an oversized body is 413 before JSON parsing', function () use ($test, $buildRouter, $baseConfig): void {
    $config = Config::fromArray($baseConfig(['MAX_JSON_BYTES' => '1024']));
    $response = $buildRouter($config)->dispatch(
        new Request('POST', '/api/test', ['content-type' => 'application/json'], str_repeat('a', 1025))
    );

    $test->same(413, $response->status());
    $test->same('payload_too_large', $response->decoded()['error']['code']);
});

$test->run('router: malformed JSON is validation_failed', function () use ($test, $buildRouter, $routerConfig): void {
    $response = $buildRouter($routerConfig)->dispatch(
        new Request('POST', '/api/test', ['content-type' => 'application/json'], '{"a":')
    );

    $test->same(422, $response->status());
    $test->same('validation_failed', $response->decoded()['error']['code']);
    $test->true(isset($response->decoded()['error']['fields']['body']), 'body field error is missing');
});

$test->run('router: a form post is rejected as validation_failed', function () use ($test, $buildRouter, $routerConfig): void {
    $response = $buildRouter($routerConfig)->dispatch(
        new Request('POST', '/api/test', ['content-type' => 'application/x-www-form-urlencoded'], 'a=1')
    );

    $test->same(422, $response->status());
    $test->same('validation_failed', $response->decoded()['error']['code']);
});

$test->run('router: a foreign Origin on POST is csrf_failed', function () use ($test, $buildRouter, $routerConfig): void {
    $response = $buildRouter($routerConfig)->dispatch(new Request(
        'POST',
        '/api/test',
        ['content-type' => 'application/json', 'origin' => 'https://evil.example'],
        '{}'
    ));

    $test->same(403, $response->status());
    $test->same('csrf_failed', $response->decoded()['error']['code']);
});

$test->run('router: a local dev Origin is accepted and JSON reaches the handler', function () use ($test, $buildRouter, $routerConfig): void {
    $response = $buildRouter($routerConfig)->dispatch(new Request(
        'POST',
        '/api/test',
        ['content-type' => 'application/json', 'origin' => 'http://localhost:3000'],
        '{"name":"x"}'
    ));

    $test->same(200, $response->status());
    $test->same(['received' => ['name' => 'x']], $response->decoded()['data']);
});

$test->run('router: 500 hides detail unless APP_DEBUG=1', function () use ($test, $buildRouter, $routerConfig, $productionConfig): void {
    $production = Config::fromArray($productionConfig());
    $hidden = $buildRouter($production)->dispatch(new Request('GET', '/api/boom'));

    $test->same(500, $hidden->status());
    $test->same('server_error', $hidden->decoded()['error']['code']);
    $test->true(isset($hidden->decoded()['error']['request_id']), 'request_id is missing');
    $test->true(!str_contains($hidden->body(), 'SQLSTATE'), 'SQL detail leaked into the response');
    $test->true(!str_contains($hidden->body(), 'secret detail'), 'exception detail leaked into the response');

    $visible = $buildRouter($routerConfig)->dispatch(new Request('GET', '/api/boom'));
    $test->true(str_contains($visible->body(), 'SQLSTATE'), 'APP_DEBUG=1 should include the detail');
});

$test->run('response: the health body is exactly {"ok":true}', function () use ($test, $buildRouter, $routerConfig): void {
    $response = $buildRouter($routerConfig)->dispatch(new Request('GET', '/api/health'));

    $test->same(200, $response->status());
    $test->same('{"ok":true}', $response->body());
    $test->same(null, $response->header('Access-Control-Allow-Origin'));
});

$test->run('response: success wraps data and an empty payload is an object', function () use ($test): void {
    $test->same(
        ['ok' => true, 'data' => ['id' => 7]],
        Response::success(['id' => 7])->decoded()
    );
    $test->true(
        str_contains(Response::success()->body(), '"data":{}'),
        'empty data must encode as an object'
    );
});

$test->run('headers: security headers are set and admin denies framing', function () use ($test, $buildRouter, $routerConfig): void {
    $response = $buildRouter($routerConfig)->dispatch(new Request('GET', '/api/health'));

    $secured = (new SecurityHeaders())->apply($response);
    $test->same('no-store', $secured->header('Cache-Control'));
    $test->same('nosniff', $secured->header('X-Content-Type-Options'));
    $test->same('no-referrer', $secured->header('Referrer-Policy'));
    $test->same(null, $secured->header('X-Frame-Options'));

    $admin = (new SecurityHeaders(true))->apply($response);
    $test->same('DENY', $admin->header('X-Frame-Options'));
});

$test->run('client ip: X-Forwarded-For is ignored without a trusted peer', function () use ($test): void {
    $test->same('203.0.113.9', ClientIp::resolve('203.0.113.9', '1.1.1.1, 2.2.2.2', ''));
    $test->same('203.0.113.9', ClientIp::resolve('203.0.113.9', '1.1.1.1', '10.0.0.1'));
});

$test->run('client ip: right-most untrusted entry is used behind a trusted proxy', function () use ($test): void {
    $test->same('2.2.2.2', ClientIp::resolve('10.0.0.1', '1.1.1.1, 2.2.2.2', '10.0.0.1'));
    $test->same(
        '1.1.1.1',
        ClientIp::resolve('10.0.0.1', '1.1.1.1, 10.0.0.2', '10.0.0.1, 10.0.0.2')
    );
    $test->same('2001:db8::1', ClientIp::resolve('2001:db8::2', 'junk, 2001:db8::1', '2001:db8::2'));
});

$test->run('client ip: all-trusted or invalid chains fall back to REMOTE_ADDR', function () use ($test): void {
    $test->same(
        '10.0.0.1',
        ClientIp::resolve('10.0.0.1', '10.0.0.2, 10.0.0.3', '10.0.0.1, 10.0.0.2, 10.0.0.3')
    );
    $test->same('10.0.0.1', ClientIp::resolve('10.0.0.1', 'not-an-ip', '10.0.0.1'));
    $test->same('10.0.0.1', ClientIp::resolve('10.0.0.1', '', '10.0.0.1'));
});

// --- Slice 4: normalisers, validator, CSRF and policy ------------------------

$fieldsOf = static function (callable $callable): array {
    try {
        $callable();
    } catch (ValidationException $exception) {
        return $exception->fields();
    }

    throw new \RuntimeException('expected a ValidationException');
};

$test->run('normaliser: email is trimmed, lowercased and validated', function () use ($test): void {
    $test->same('foo@bar.com', Normaliser::email('  Foo@Bar.COM '));
    $test->same(null, Normaliser::email('nope'));
    $test->same(null, Normaliser::email(''));
    $test->same(null, Normaliser::email(str_repeat('a', 250) . '@example.com'));
});

$test->run('normaliser: phone becomes + and 10 to 13 digits', function () use ($test): void {
    $test->same('+919876543210', Normaliser::phone('+91 98765 43210'));
    $test->same('+919876543210', Normaliser::phone('0091-9876543210'));
    $test->same('+9876543210', Normaliser::phone('9876543210'));
    $test->same(null, Normaliser::phone('12345'));
    $test->same(null, Normaliser::phone('abcdefghij'));
});

$test->run('normaliser: OTP is exactly six digits and names are 1 to 150 characters', function () use ($test): void {
    $test->same('123456', Normaliser::otp(' 123456 '));
    $test->same(null, Normaliser::otp('12345'));
    $test->same(null, Normaliser::otp('1234567'));
    $test->same(null, Normaliser::otp('12345a'));

    $test->same('Aarav Sharma', Normaliser::name('  Aarav   Sharma '));
    $test->same(null, Normaliser::name(''));
    $test->same(null, Normaliser::name("A\nB"));
    $test->same(null, Normaliser::name(str_repeat('a', 151)));
    $test->same(150, mb_strlen(Normaliser::name(str_repeat('a', 150)) ?? '', 'UTF-8'));
});

$test->run('validator: unknown keys are rejected by name', function () use ($test, $fieldsOf): void {
    $validator = new Validator(['email' => ['required', 'string', 'email']]);
    $fields = $fieldsOf(static fn () => $validator->validate([
        'email' => 'a@b.co',
        'nickname' => 'x',
    ]));

    $test->true(isset($fields['nickname']), 'unknown key was not rejected');
});

$test->run('validator: normalises email and omits absent optional fields', function () use ($test): void {
    $validator = new Validator([
        'email' => ['required', 'string', 'email'],
        'phone' => ['optional', 'string', 'phone'],
    ]);

    $values = $validator->validate(['email' => '  Foo@Bar.COM ']);

    $test->same('foo@bar.com', $values['email']);
    $test->true(!array_key_exists('phone', $values), 'absent optional field was returned');
});

$test->run('validator: required, type, enum, regex and length rules', function () use ($test, $fieldsOf): void {
    $validator = new Validator([
        'role' => ['required', 'string', 'enum:admin,customer'],
        'code' => ['required', 'string', 'regex:/^[A-Z]{3}$/'],
        'nick' => ['required', 'string', 'min:2', 'max:5'],
        'name' => ['required', 'string', 'trim', 'collapse_spaces', 'name'],
    ]);

    $values = $validator->validate([
        'role' => 'admin',
        'code' => 'ABC',
        'nick' => 'ok',
        'name' => '  Aarav   Sharma ',
    ]);

    $test->same('Aarav Sharma', $values['name']);

    $fields = $fieldsOf(static fn () => $validator->validate([
        'role' => 'root',
        'code' => 'abc',
        'nick' => 'a',
        'name' => 'Aarav',
    ]));

    $test->true(isset($fields['role'], $fields['code'], $fields['nick']), 'one or more rules did not fail');

    $typed = new Validator([
        'age' => ['required', 'int'],
        'active' => ['required', 'bool'],
        'tags' => ['required', 'array'],
    ]);
    $typeFields = $fieldsOf(static fn () => $typed->validate([
        'age' => '7',
        'active' => 1,
        'tags' => 'x',
    ]));

    $test->true(
        isset($typeFields['age'], $typeFields['active'], $typeFields['tags']),
        'type checks did not all fail'
    );
});

$test->run('validator: bcrypt counts bytes for the 72-byte cap', function () use ($test, $fieldsOf): void {
    $validator = new Validator(['password' => ['required', 'string', 'password:bcrypt']]);

    foreach ([
        str_repeat('a', 12),
        str_repeat("\u{00E9}", 12),
        str_repeat('a', 72),
        str_repeat("\u{00E9}", 36),
    ] as $accepted) {
        $validator->validate(['password' => $accepted]);
    }

    foreach ([
        str_repeat('a', 73),
        str_repeat("\u{00E9}", 37),
        str_repeat('a', 100000),
    ] as $rejected) {
        $fields = $fieldsOf(static fn () => $validator->validate(['password' => $rejected]));
        $test->true(isset($fields['password']), 'password should have been rejected');
    }
});

$test->run('validator: argon2id counts characters for the 128-character cap', function () use ($test, $fieldsOf): void {
    $validator = new Validator(['password' => ['required', 'string', 'password:argon2id']]);

    $validator->validate(['password' => str_repeat('a', 128)]);

    $fields = $fieldsOf(static fn () => $validator->validate(['password' => str_repeat('a', 129)]));
    $test->true(isset($fields['password']), '129 characters should have been rejected');
});

$test->run('validator: errors never echo passwords or OTPs', function () use ($test, $fieldsOf): void {
    $password = str_repeat('S3cret!', 12);
    $validator = new Validator(['password' => ['required', 'string', 'password:bcrypt']]);
    $fields = $fieldsOf(static fn () => $validator->validate(['password' => $password]));

    $test->true(isset($fields['password']), 'password error is missing');

    foreach ($fields as $message) {
        $test->true(!str_contains($message, $password), 'password leaked into a validation message');
    }

    $otpValidator = new Validator(['otp' => ['required', 'string', 'otp']]);
    $otpFields = $fieldsOf(static fn () => $otpValidator->validate(['otp' => '123456789']));

    foreach ($otpFields as $message) {
        $test->true(!str_contains($message, '123456789'), 'OTP leaked into a validation message');
    }
});

$test->run('csrf: customer token matches, rotates and clears', function () use ($test): void {
    $_SESSION = [];

    $token = Csrf::issueCustomerToken();
    $test->same(64, strlen($token));
    $test->true(Csrf::verifyCustomer($token), 'valid customer token rejected');
    $test->true(!Csrf::verifyCustomer($token . 'x'), 'wrong customer token accepted');
    $test->true(!Csrf::verifyCustomer(null), 'missing customer token accepted');

    $rotated = Csrf::issueCustomerToken();
    $test->true($rotated !== $token, 'customer token did not rotate');
    $test->true(!Csrf::verifyCustomer($token), 'old customer token is still valid');
    $test->true(Csrf::verifyCustomer($rotated), 'rotated customer token rejected');

    Csrf::clearCustomerToken();
    $test->true(!Csrf::verifyCustomer($rotated), 'cleared customer token is still valid');
});

$test->run('csrf: admin double-submit requires cookie and header to match', function () use ($test): void {
    $token = Csrf::issueAdminToken();

    $test->true(Csrf::verifyAdmin($token, $token), 'matching admin token rejected');
    $test->true(!Csrf::verifyAdmin($token, $token . 'x'), 'mismatched admin token accepted');
    $test->true(!Csrf::verifyAdmin(null, $token), 'missing admin cookie accepted');
    $test->true(!Csrf::verifyAdmin($token, null), 'missing admin header accepted');
});

$test->run('policy: fixed constants match the design', function () use ($test): void {
    $test->same(5, Policy::LOGIN_FAILURES_PER_IDENTIFIER);
    $test->same(15, Policy::LOGIN_WINDOW_MINUTES);
    $test->same(15, Policy::LOCKOUT_MINUTES);
    $test->same(20, Policy::LOGIN_FAILURES_PER_IP);
    $test->same(60, Policy::IP_WINDOW_MINUTES);
    $test->same(3, Policy::OTP_REQUESTS_PER_HOUR);
    $test->same(3, Policy::PASSWORD_RESET_REQUESTS_PER_HOUR);
    $test->same(6, Policy::OTP_LENGTH);
    $test->same(10, Policy::OTP_LIFETIME_MINUTES);
    $test->same(10, Policy::PENDING_COOKIE_LIFETIME_MINUTES);
    $test->same(5, Policy::OTP_MAX_ATTEMPTS);
    $test->same(12, Policy::PASSWORD_MIN_LENGTH);
    $test->same(72, Policy::PASSWORD_BCRYPT_MAX_BYTES);
    $test->same(128, Policy::PASSWORD_ARGON2ID_MAX_CHARS);
    $test->same('bcrypt', Policy::passwordAlgorithm('bcrypt'));
    $test->same('argon2id', Policy::passwordAlgorithm('argon2id'));
    $test->true(
        in_array(Policy::passwordAlgorithm('auto'), ['argon2id', 'bcrypt'], true),
        'auto did not resolve to a known algorithm'
    );
});

$test->run('router: a ValidationException becomes validation_failed', function () use ($test, $buildRouter, $routerConfig): void {
    $router = $buildRouter($routerConfig);
    $router->add('POST', '/api/validate', static function (Request $request): Response {
        $values = (new Validator(['email' => ['required', 'string', 'email']]))->validate($request->json());

        return Response::success($values);
    });

    $invalid = $router->dispatch(new Request(
        'POST',
        '/api/validate',
        ['content-type' => 'application/json'],
        '{"email":"nope"}'
    ));

    $test->same(422, $invalid->status());
    $test->same('validation_failed', $invalid->decoded()['error']['code']);
    $test->true(isset($invalid->decoded()['error']['fields']['email']), 'email field error is missing');

    $valid = $router->dispatch(new Request(
        'POST',
        '/api/validate',
        ['content-type' => 'application/json'],
        '{"email":"  Foo@Bar.COM "}'
    ));

    $test->same(200, $valid->status());
    $test->same('foo@bar.com', $valid->decoded()['data']['email']);
});

exit($test->summary());
