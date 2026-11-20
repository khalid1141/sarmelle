<?php
declare(strict_types=1);

/**
 * Database checks for the login throttle. CLI only, and the owner runs it:
 *
 *   php server/bin/db-selftest.php
 *
 * It writes only rows whose identifier starts with "selftest-" and ends in
 * "@invalid.test", uses TEST-NET-1 IPs, and deletes all of its rows at the end.
 */

use Sarmelle\Auth\Policy;
use Sarmelle\Auth\Throttle;
use Sarmelle\Core\Clock;
use Sarmelle\Repositories\LoginAttempts;

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

require_once __DIR__ . '/app.php';

final class DbSelftest
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

    public function true(bool $condition, string $message): void
    {
        if (!$condition) {
            throw new \RuntimeException($message);
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

    public function summary(): int
    {
        echo PHP_EOL . $this->passed . ' passed, ' . $this->failed . ' failed' . PHP_EOL;

        return $this->failed === 0 ? 0 : 1;
    }
}

$pdo = sarmelle_cli_connection();
$attempts = new LoginAttempts($pdo);
$throttle = new Throttle($attempts);
$test = new DbSelftest();

$prefix = 'selftest-' . bin2hex(random_bytes(6));
$identifier = static fn (string $suffix): string => $prefix . '-' . $suffix . '@invalid.test';
$ips = ['192.0.2.11', '192.0.2.12', '192.0.2.13', '192.0.2.14', '192.0.2.15', '192.0.2.16'];

$cleanup = static function (\PDO $pdo) use ($prefix): void {
    $statement = $pdo->prepare('DELETE FROM login_attempts WHERE identifier LIKE ?');
    $statement->execute([$prefix . '-%@invalid.test']);
};

/**
 * @param array<int, int> $ids
 */
$ageRows = static function (\PDO $pdo, array $ids, int $minutesAgo): void {
    if ($ids === []) {
        return;
    }

    $cutoff = Clock::now()->modify('-' . $minutesAgo . ' minutes')->format('Y-m-d H:i:s');
    $placeholders = implode(',', array_fill(0, count($ids), '?'));
    $statement = $pdo->prepare(
        'UPDATE login_attempts SET created_at = ? WHERE id IN (' . $placeholders . ')'
    );
    $statement->execute(array_merge([$cutoff], $ids));
};

try {
    // Isolate this run from any rows a previous crashed run left behind.
    $placeholders = implode(',', array_fill(0, count($ips), '?'));
    $pdo->prepare('DELETE FROM login_attempts WHERE ip IN (' . $placeholders . ')')->execute($ips);

    $test->run('five failures lock an identifier; the sixth is blocked', function () use ($test, $attempts, $throttle, $identifier): void {
        $account = $identifier('lock');
        $ip = '192.0.2.11';

        for ($index = 0; $index < Policy::LOGIN_FAILURES_PER_IDENTIFIER; $index++) {
            $attempts->record('customer', $account, $ip, false);
        }

        $test->same(
            Policy::LOGIN_FAILURES_PER_IDENTIFIER,
            $attempts->countIdentifierFailures('customer', $account, Policy::LOGIN_WINDOW_MINUTES)
        );
        $test->same(0, $attempts->countIdentifierFailures('admin', $account, Policy::LOGIN_WINDOW_MINUTES));
        $test->true($throttle->isIdentifierLocked('customer', $account), 'identifier is not locked');
        $test->same('account_locked', $throttle->check('customer', $account, $ip));
    });

    $test->run('twenty failures from one IP block that IP', function () use ($test, $attempts, $throttle, $identifier): void {
        $ip = '192.0.2.12';

        for ($index = 0; $index < Policy::LOGIN_FAILURES_PER_IP; $index++) {
            $attempts->record('customer', $identifier('ip-' . $index), $ip, false);
        }

        $test->same(Policy::LOGIN_FAILURES_PER_IP, $attempts->countIpFailures($ip, Policy::IP_WINDOW_MINUTES));
        $test->true($throttle->isIpBlocked($ip), 'IP is not blocked');
        $test->same('ip_blocked', $throttle->check('customer', $identifier('ip-probe'), $ip));
    });

    $test->run('successes are recorded but never counted as failures', function () use ($test, $attempts, $throttle, $identifier): void {
        $alwaysOk = $identifier('success');
        $mixed = $identifier('mixed');

        for ($index = 0; $index < 6; $index++) {
            $attempts->record('customer', $alwaysOk, '192.0.2.13', true);
        }

        for ($index = 0; $index < 4; $index++) {
            $attempts->record('customer', $mixed, '192.0.2.14', false);
        }

        for ($index = 0; $index < 3; $index++) {
            $attempts->record('customer', $mixed, '192.0.2.14', true);
        }

        $test->same(0, $attempts->countIdentifierFailures('customer', $alwaysOk, Policy::LOGIN_WINDOW_MINUTES));
        $test->same(4, $attempts->countIdentifierFailures('customer', $mixed, Policy::LOGIN_WINDOW_MINUTES));
        $test->true(!$throttle->isIdentifierLocked('customer', $alwaysOk), 'successes locked the identifier');
        $test->true(!$throttle->isIdentifierLocked('customer', $mixed), 'four failures locked the identifier');
    });

    $test->run('rows older than the window age out', function () use ($test, $attempts, $throttle, $identifier, $ageRows, $pdo): void {
        $account = $identifier('aged');
        $ids = [];

        for ($index = 0; $index < Policy::LOGIN_FAILURES_PER_IDENTIFIER; $index++) {
            $ids[] = $attempts->record('customer', $account, '192.0.2.16', false);
        }

        $test->true($throttle->isIdentifierLocked('customer', $account), 'identifier should start locked');
        $ageRows($pdo, $ids, Policy::LOGIN_WINDOW_MINUTES + 1);
        $test->same(0, $attempts->countIdentifierFailures('customer', $account, Policy::LOGIN_WINDOW_MINUTES));
        $test->true(!$throttle->isIdentifierLocked('customer', $account), 'old identifier rows did not age out');

        $ip = '192.0.2.15';
        $ipIds = [];

        for ($index = 0; $index < Policy::LOGIN_FAILURES_PER_IP; $index++) {
            $ipIds[] = $attempts->record('customer', $identifier('ip-aged-' . $index), $ip, false);
        }

        $test->true($throttle->isIpBlocked($ip), 'IP should start blocked');
        $ageRows($pdo, $ipIds, Policy::IP_WINDOW_MINUTES + 1);
        $test->same(0, $attempts->countIpFailures($ip, Policy::IP_WINDOW_MINUTES));
        $test->true(!$throttle->isIpBlocked($ip), 'old IP rows did not age out');
    });

    $test->run('the identifier is stored exactly as typed', function () use ($test, $attempts, $identifier, $pdo): void {
        $typed = $identifier('MiXeD-Case');
        $id = $attempts->record('customer', $typed, null, false);

        $statement = $pdo->prepare('SELECT identifier, ip FROM login_attempts WHERE id = ?');
        $statement->execute([$id]);
        $row = $statement->fetch();

        $test->true(is_array($row), 'inserted row was not found');
        $test->same($typed, $row['identifier']);
        $test->same(null, $row['ip']);
    });
} finally {
    $cleanup($pdo);
}

exit($test->summary());
