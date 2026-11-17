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

use Sarmelle\Config\Config;
use Sarmelle\Config\Env;
use Sarmelle\Core\Clock;

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

$test->run('config: APP_DEBUG=1 is refused in production', function () use ($test, $baseConfig): void {
    $test->throws(
        \RuntimeException::class,
        'APP_DEBUG',
        static fn () => Config::fromArray($baseConfig(['APP_ENV' => 'production', 'APP_DEBUG' => '1']))
    );
});

$test->run('config: production with APP_DEBUG=0 builds', function () use ($test, $baseConfig): void {
    $config = Config::fromArray($baseConfig(['APP_ENV' => 'production', 'APP_DEBUG' => '0']));

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
        static fn () => Config::assertSafeEnvPath('C:/temp/.env', 'C:/repo/server/private')
    );
});

$test->run('config: .env inside the private tree is accepted', function () use ($test): void {
    Config::assertSafeEnvPath(
        'C:/repo/server/private/config/.env',
        'C:/repo/server/private'
    );

    $test->true(true, 'no exception expected');
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

exit($test->summary());
