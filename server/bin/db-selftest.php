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

use Sarmelle\Auth\AdminUsers;
use Sarmelle\Auth\Password;
use Sarmelle\Auth\Policy;
use Sarmelle\Auth\Throttle;
use Sarmelle\Core\Clock;
use Sarmelle\Core\DatabaseException;
use Sarmelle\Repositories\AdminSessions;
use Sarmelle\Repositories\LoginAttempts;
use Sarmelle\Support\ActivityLog;

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

    public function throws(string $exceptionClass, string $needle, callable $callable): void
    {
        try {
            $callable();
        } catch (\Throwable $exception) {
            if (!$exception instanceof $exceptionClass) {
                throw new \RuntimeException(
                    'expected ' . $exceptionClass . ', got ' . $exception::class
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

$pdo = sarmelle_cli_connection();
$attempts = new LoginAttempts($pdo);
$throttle = new Throttle($attempts);
$test = new DbSelftest();

$prefix = 'selftest-' . bin2hex(random_bytes(6));
$identifier = static fn (string $suffix): string => $prefix . '-' . $suffix . '@invalid.test';
$ips = ['192.0.2.11', '192.0.2.12', '192.0.2.13', '192.0.2.14', '192.0.2.15', '192.0.2.16', '192.0.2.17'];

$cleanup = static function (\PDO $pdo) use ($prefix): void {
    $statement = $pdo->prepare('DELETE FROM login_attempts WHERE identifier LIKE ?');
    $statement->execute([$prefix . '-%@invalid.test']);
    $pdo->prepare("DELETE FROM admin_sessions WHERE ip LIKE '192.0.2.%'")->execute();
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

    $test->run('the identifier lock is a rolling window, not a fixed lock', function () use ($test, $attempts, $throttle, $identifier, $ageRows, $pdo): void {
        $account = $identifier('rolling');
        $ip = '192.0.2.17';
        $ids = [];

        for ($index = 0; $index < Policy::LOGIN_FAILURES_PER_IDENTIFIER; $index++) {
            $ids[] = $attempts->record('customer', $account, $ip, false);
        }

        $test->true($throttle->isIdentifierLocked('customer', $account), 'five fresh failures should lock');

        // Spread the five failures across the window: the oldest is outside it,
        // the other four are inside.
        $ageRows($pdo, [$ids[0]], Policy::LOGIN_WINDOW_MINUTES + 1);
        $ageRows($pdo, [$ids[1]], 14);
        $ageRows($pdo, [$ids[2]], 13);
        $ageRows($pdo, [$ids[3]], 12);
        $ageRows($pdo, [$ids[4]], 11);

        $test->same(
            4,
            $attempts->countIdentifierFailures('customer', $account, Policy::LOGIN_WINDOW_MINUTES)
        );
        $test->true(
            !$throttle->isIdentifierLocked('customer', $account),
            'four in-window failures should not lock'
        );

        // A fifth in-window failure locks again.
        $newest = $attempts->record('customer', $account, $ip, false);
        $test->same(
            5,
            $attempts->countIdentifierFailures('customer', $account, Policy::LOGIN_WINDOW_MINUTES)
        );
        $test->true(
            $throttle->isIdentifierLocked('customer', $account),
            'five in-window failures should lock'
        );

        // The lock ends as soon as the oldest in-window failure ages out, not
        // 15 minutes after the fifth failure.
        $ageRows($pdo, [$ids[1]], Policy::LOGIN_WINDOW_MINUTES + 1);
        $test->same(
            4,
            $attempts->countIdentifierFailures('customer', $account, Policy::LOGIN_WINDOW_MINUTES)
        );
        $test->true(
            !$throttle->isIdentifierLocked('customer', $account),
            'the rolling window should have unlocked'
        );
        $test->same(null, $throttle->check('customer', $account, $ip), 'check() should allow the attempt');
        $test->true($newest > 0, 'the newest failure id should be positive');
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

    $test->run('account-type isolation: admin failures do not lock the customer account for the same identifier', function () use ($test, $attempts, $throttle, $identifier): void {
        // Build up 5 admin failures for a shared identifier — enough to lock the admin type.
        $shared = $identifier('shared-isolation@invalid.test');
        for ($i = 0; $i < Policy::LOGIN_FAILURES_PER_IDENTIFIER; $i++) {
            $attempts->record('admin', $shared, null, false);
        }

        // Admin type must now be locked.
        $test->true(
            $throttle->isIdentifierLocked('admin', $shared),
            'admin should be locked after ' . Policy::LOGIN_FAILURES_PER_IDENTIFIER . ' failures'
        );

        // Customer type with the exact same identifier string must remain unlocked.
        $customerCount = $attempts->countIdentifierFailures('customer', $shared, Policy::LOGIN_WINDOW_MINUTES);
        $test->same(0, $customerCount, 'customer failure count should be zero when only admin failures exist');
        $test->true(
            !$throttle->isIdentifierLocked('customer', $shared),
            'customer should not be locked by admin failures'
        );
        $test->same(null, $throttle->check('customer', $shared, null), 'check() should allow the customer attempt');
    });

    // --- Slice 6: admin setup, recovery and activity log ----------------------
    //
    // The single-owner rule means a second admin cannot be committed. These
    // tests run inside one caller-owned transaction and are rolled back at the
    // end, so the real admin row, sessions, devices and attempts are restored
    // exactly as they were. The setup-creation test only runs when the table is
    // empty; on a database that is already set up, recovery is tested on the
    // existing owner row and rolled back.

    $adminEmail = 'selftest-admin-' . bin2hex(random_bytes(6)) . '@invalid.test';
    $setupPassword = 'Setup-Password-42';
    $recoveredPassword = 'Recovered-Password-99';
    $adminUserId = 0;
    $setupHash = '';
    $oldPassword = null;

    $activityLog = new ActivityLog($pdo);
    $adminUsers = new AdminUsers($pdo, $activityLog, 'bcrypt', 4);

    $pdo->beginTransaction();

    try {
        $existingAdmins = $adminUsers->count();

        if ($existingAdmins === 0) {
            $test->run('setup creates exactly one admin with a verifiable hash and an activity row', function () use ($test, $adminUsers, $pdo, $adminEmail, $setupPassword, &$adminUserId, &$setupHash, &$oldPassword): void {
                $adminUserId = $adminUsers->create(
                    'Selftest Owner',
                    $adminEmail,
                    $setupPassword,
                    null,
                    false
                );
                $oldPassword = $setupPassword;

                $test->true($adminUserId > 0, 'setup did not return an admin id');
                $test->same(1, $adminUsers->count(), 'setup must create exactly one admin');

                $admin = $adminUsers->sole();
                $test->true(is_array($admin), 'the created admin was not found');
                $test->same($adminEmail, $admin['email']);
                $test->same('Selftest Owner', $admin['name']);
                $setupHash = $admin['password_hash'];

                $test->true(Password::verify($setupPassword, $setupHash), 'the stored hash does not verify');
                $test->true($setupHash !== $setupPassword, 'the plain password was stored');
                $test->true(!str_contains($setupHash, $setupPassword), 'the password leaked into the hash');

                $statement = $pdo->prepare(
                    'SELECT action, entity_type, entity_id, old_value, new_value FROM activity_log'
                    . ' WHERE admin_user_id = ? AND action = ?'
                );
                $statement->execute([$adminUserId, AdminUsers::SETUP_ACTION]);
                $rows = $statement->fetchAll();
                $test->same(1, count($rows), 'setup must write exactly one activity row');

                $row = $rows[0];
                $test->same(AdminUsers::ENTITY_TYPE, $row['entity_type']);
                $test->same($adminUserId, (int) $row['entity_id']);
                $test->same(null, $row['old_value']);

                $snapshot = (string) $row['new_value'];
                $test->true(str_contains($snapshot, $adminEmail), 'the setup snapshot is missing the email');
                $test->true(!str_contains($snapshot, $setupPassword), 'the setup snapshot contains the password');
                $test->true(!str_contains($snapshot, $setupHash), 'the setup snapshot contains the hash');
            });
        } else {
            $existing = $adminUsers->sole();

            if (!is_array($existing)) {
                throw new \RuntimeException('Could not read the existing admin account.');
            }

            $adminUserId = $existing['id'];
            $adminEmail = $existing['email'];
            $setupHash = $existing['password_hash'];

            echo '[SKIP] setup creation: admin_users is not empty;'
                . ' testing recovery on the existing owner row instead' . PHP_EOL;
        }

        $test->run('a second setup is refused and leaves exactly one admin', function () use ($test, $adminUsers, $adminUserId): void {
            $test->throws(
                \RuntimeException::class,
                'already exists',
                static fn () => $adminUsers->create(
                    'Second Owner',
                    'selftest-second-owner@invalid.test',
                    'Second-Password-42',
                    null,
                    false
                )
            );

            $test->same(1, $adminUsers->count(), 'the refused setup changed the admin count');

            $admin = $adminUsers->sole();
            $test->true(is_array($admin), 'the original admin disappeared');
            $test->same($adminUserId, $admin['id']);
        });

        $test->run('recovery replaces the hash, revokes sessions/devices and clears attempts', function () use ($test, $adminUsers, $attempts, $pdo, $adminUserId, $adminEmail, $oldPassword, $recoveredPassword, $setupHash): void {
            $tokenHash = bin2hex(random_bytes(32));
            $expiresAt = Clock::now()->modify('+1 hour')->format('Y-m-d H:i:s');

            $pdo->prepare(
                'INSERT INTO admin_sessions (admin_user_id, session_token_hash, expires_at) VALUES (?, ?, ?)'
            )->execute([$adminUserId, $tokenHash, $expiresAt]);

            $pdo->prepare(
                'INSERT INTO admin_trusted_devices (admin_user_id, token_hash, expires_at) VALUES (?, ?, ?)'
            )->execute([$adminUserId, bin2hex(random_bytes(32)), $expiresAt]);

            $attempts->record('admin', $adminEmail, '192.0.2.31', false);
            $attempts->record('admin', strtoupper($adminEmail), '192.0.2.32', false);
            $attempts->record('admin', 'selftest-other-admin@invalid.test', '192.0.2.33', false);
            $attempts->record('customer', $adminEmail, '192.0.2.34', false);

            $recoveryRowsBefore = $pdo->prepare(
                'SELECT COUNT(*) FROM activity_log WHERE admin_user_id = ? AND action = ?'
            );
            $recoveryRowsBefore->execute([$adminUserId, AdminUsers::RECOVERY_ACTION]);
            $before = (int) $recoveryRowsBefore->fetchColumn();

            $counts = $adminUsers->recoverPassword($adminUserId, $recoveredPassword, null, false);

            $test->same(1, $counts['sessions_revoked']);
            $test->same(1, $counts['devices_revoked']);
            $test->same(2, $counts['attempts_cleared']);

            $sessions = $pdo->prepare('SELECT COUNT(*) FROM admin_sessions WHERE admin_user_id = ?');
            $sessions->execute([$adminUserId]);
            $test->same(0, (int) $sessions->fetchColumn(), 'an admin session survived recovery');

            $devices = $pdo->prepare(
                'SELECT COUNT(*) FROM admin_trusted_devices WHERE admin_user_id = ?'
            );
            $devices->execute([$adminUserId]);
            $test->same(0, (int) $devices->fetchColumn(), 'a trusted device survived recovery');

            $remaining = $pdo->prepare(
                "SELECT COUNT(*) FROM login_attempts WHERE account_type = 'admin' AND LOWER(identifier) = ?"
            );
            $remaining->execute([$adminEmail]);
            $test->same(0, (int) $remaining->fetchColumn(), 'an admin login attempt survived recovery');

            $other = $pdo->prepare(
                "SELECT COUNT(*) FROM login_attempts WHERE identifier = 'selftest-other-admin@invalid.test'"
            );
            $other->execute();
            $test->same(1, (int) $other->fetchColumn(), 'another admin attempt was cleared');

            $customer = $pdo->prepare(
                "SELECT COUNT(*) FROM login_attempts WHERE account_type = 'customer' AND identifier = ?"
            );
            $customer->execute([$adminEmail]);
            $test->same(1, (int) $customer->fetchColumn(), 'a customer attempt was cleared');

            $admin = $adminUsers->sole();
            $test->true(is_array($admin), 'the admin disappeared after recovery');
            $test->true($admin['password_hash'] !== $setupHash, 'the hash was not replaced');
            $test->true(Password::verify($recoveredPassword, $admin['password_hash']), 'the new hash does not verify');
            $test->true(!str_contains($admin['password_hash'], $recoveredPassword), 'the new password leaked into the hash');

            if (is_string($oldPassword)) {
                $test->true(
                    !Password::verify($oldPassword, $admin['password_hash']),
                    'the old password still verifies'
                );
            }

            $statement = $pdo->prepare(
                'SELECT action, old_value, new_value FROM activity_log'
                . ' WHERE admin_user_id = ? AND action = ? ORDER BY id DESC LIMIT 1'
            );
            $statement->execute([$adminUserId, AdminUsers::RECOVERY_ACTION]);
            $rows = $statement->fetchAll();

            $test->same(1, count($rows), 'recovery must write one activity row');

            $after = $pdo->prepare(
                'SELECT COUNT(*) FROM activity_log WHERE admin_user_id = ? AND action = ?'
            );
            $after->execute([$adminUserId, AdminUsers::RECOVERY_ACTION]);
            $test->same($before + 1, (int) $after->fetchColumn(), 'recovery must add one activity row');

            $snapshot = (string) $rows[0]['old_value'] . (string) $rows[0]['new_value'];
            $test->true(!str_contains($snapshot, $recoveredPassword), 'the new password leaked into the activity log');
            $test->true(!str_contains($snapshot, $setupHash), 'the old hash leaked into the activity log');
            $test->true(!str_contains($snapshot, 'argon2id'), 'a hash algorithm leaked into the activity log');
            $test->true(str_contains($snapshot, 'sessions_revoked'), 'the recovery snapshot is missing its counts');

            if (is_string($oldPassword)) {
                $test->true(!str_contains($snapshot, $oldPassword), 'the old password leaked into the activity log');
            }
        });

        $test->run('repository PDO failures become a sanitised DatabaseException', function () use ($test, $activityLog, $adminUserId): void {
            // new_value is TEXT (65535 bytes); a larger JSON value fails under
            // strict mode and proves the repository does not leak SQL details.
            $caught = null;

            try {
                $activityLog->record(
                    $adminUserId,
                    'admin.selftest',
                    AdminUsers::ENTITY_TYPE,
                    $adminUserId,
                    null,
                    ['blob' => str_repeat('s', 70000)]
                );
            } catch (DatabaseException $exception) {
                $caught = $exception;
            }

            $test->true($caught instanceof DatabaseException, 'the PDO failure was not sanitised');
            $test->same('Database operation failed.', $caught->getMessage());
            $test->same(null, $caught->getPrevious());
            $test->true(
                preg_match('/^[A-Za-z0-9]+$/', $caught->sqlState()) === 1,
                'the SQLSTATE is not sanitised'
            );
            $test->true(
                !str_contains($caught->getMessage(), 'activity_log'),
                'the table name leaked into the exception message'
            );
            $test->true(
                !str_contains($caught->getMessage(), 'admin.selftest'),
                'a SQL parameter leaked into the exception message'
            );
        });

        $adminSessions = new AdminSessions($pdo);

        $test->run('admin sessions: plaintext token is never stored and hash resolves correctly', function () use ($test, $adminSessions, $pdo, $adminUserId): void {
            $created = $adminSessions->createWithRawToken($adminUserId, '192.0.2.20', 'SelftestUA/1.0');
            $rawToken = $created['token'];
            $tokenHash = $created['token_hash'];

            $test->same(64, strlen($rawToken), 'raw session token must be 32 bytes hex (64 chars)');
            $test->same(hash('sha256', $rawToken), $tokenHash);

            $checkHash = $pdo->prepare('SELECT COUNT(*) FROM admin_sessions WHERE session_token_hash = ?');
            $checkHash->execute([$tokenHash]);
            $test->same(1, (int) $checkHash->fetchColumn());

            $checkPlain = $pdo->prepare('SELECT COUNT(*) FROM admin_sessions WHERE session_token_hash = ?');
            $checkPlain->execute([$rawToken]);
            $test->same(0, (int) $checkPlain->fetchColumn(), 'plaintext token leaked into session_token_hash');

            $resolved = $adminSessions->resolve($rawToken);
            $test->same('valid', $resolved['status']);
            $test->true(is_array($resolved['session']), 'session is not an array');
            $test->same($adminUserId, $resolved['session']['admin_user_id']);
        });

        $test->run('admin sessions: tampered or unknown token fails resolution', function () use ($test, $adminSessions, $adminUserId): void {
            $created = $adminSessions->createWithRawToken($adminUserId, '192.0.2.21', 'SelftestUA/1.0');
            $rawToken = $created['token'];

            $tampered = $adminSessions->resolve($rawToken . 'x');
            $test->same('invalid', $tampered['status']);
            $test->same(null, $tampered['session']);

            $unknown = $adminSessions->resolve(str_repeat('0', 64));
            $test->same('invalid', $unknown['status']);
            $test->same(null, $unknown['session']);

            $empty = $adminSessions->resolve('');
            $test->same('invalid', $empty['status']);
            $test->same(null, $empty['session']);
        });

        $test->run('admin sessions: idle timeout (30m) deletes expired session', function () use ($test, $adminSessions, $pdo, $adminUserId): void {
            $rawToken = bin2hex(random_bytes(32));
            $tokenHash = hash('sha256', $rawToken);
            $expiredTime = Clock::now()->modify('-1 minute')->format('Y-m-d H:i:s');
            $stmt = $pdo->prepare("INSERT INTO admin_sessions (admin_user_id, session_token_hash, expires_at, ip, user_agent) VALUES (?, ?, ?, '192.0.2.22', 'Selftest')");
            $stmt->execute([$adminUserId, $tokenHash, $expiredTime]);

            $result = $adminSessions->resolve($rawToken);
            $test->same('session_expired', $result['status']);
            $test->same(null, $result['session']);

            $check = $pdo->prepare('SELECT COUNT(*) FROM admin_sessions WHERE session_token_hash = ?');
            $check->execute([$tokenHash]);
            $test->same(0, (int) $check->fetchColumn(), 'expired session was not deleted');
        });

        $test->run('admin sessions: 12-hour absolute cap expires even if actively refreshed', function () use ($test, $adminSessions, $pdo, $adminUserId): void {
            $rawToken = bin2hex(random_bytes(32));
            $tokenHash = hash('sha256', $rawToken);
            $oldCreated = Clock::now()->modify('-13 hours')->format('Y-m-d H:i:s');
            $freshExpiry = Clock::now()->modify('+20 minutes')->format('Y-m-d H:i:s');
            $stmt = $pdo->prepare("INSERT INTO admin_sessions (admin_user_id, session_token_hash, expires_at, ip, user_agent, created_at) VALUES (?, ?, ?, '192.0.2.23', 'Selftest', ?)");
            $stmt->execute([$adminUserId, $tokenHash, $freshExpiry, $oldCreated]);

            $result = $adminSessions->resolve($rawToken);
            $test->same('session_expired', $result['status']);
            $test->same(null, $result['session']);

            $check = $pdo->prepare('SELECT COUNT(*) FROM admin_sessions WHERE session_token_hash = ?');
            $check->execute([$tokenHash]);
            $test->same(0, (int) $check->fetchColumn(), 'session exceeding 12h absolute cap was not deleted');
        });

        $test->run('admin sessions: sliding refresh stops at the 12-hour absolute cap', function () use ($test, $adminSessions, $pdo, $adminUserId): void {
            $rawToken = bin2hex(random_bytes(32));
            $tokenHash = hash('sha256', $rawToken);
            $createdTime = Clock::now()->modify('-710 minutes');
            $initialExpiry = Clock::now()->modify('+5 minutes')->format('Y-m-d H:i:s');
            $stmt = $pdo->prepare("INSERT INTO admin_sessions (admin_user_id, session_token_hash, expires_at, ip, user_agent, created_at) VALUES (?, ?, ?, '192.0.2.24', 'Selftest', ?)");
            $stmt->execute([$adminUserId, $tokenHash, $initialExpiry, $createdTime->format('Y-m-d H:i:s')]);

            $result = $adminSessions->resolve($rawToken);
            $test->same('valid', $result['status']);

            $expectedCap = $createdTime->modify('+12 hours')->format('Y-m-d H:i:s');
            $test->same($expectedCap, $result['session']['expires_at'], 'sliding refresh exceeded the 12h absolute cap');
        });

        $test->run('admin sessions: revocation by token and bulk revocation for admin', function () use ($test, $adminSessions, $adminUserId): void {
            $s1 = $adminSessions->createWithRawToken($adminUserId, '192.0.2.25', 'Selftest');
            $s2 = $adminSessions->createWithRawToken($adminUserId, '192.0.2.26', 'Selftest');

            $adminSessions->deleteByTokenHash($s1['token_hash']);
            $res1 = $adminSessions->resolve($s1['token']);
            $test->same('invalid', $res1['status']);

            $res2 = $adminSessions->resolve($s2['token']);
            $test->same('valid', $res2['status']);

            $deletedCount = $adminSessions->deleteAllForAdmin($adminUserId);
            $test->true($deletedCount >= 1, 'no sessions were deleted');
            $res2After = $adminSessions->resolve($s2['token']);
            $test->same('invalid', $res2After['status']);
        });
    } finally {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
    }
} finally {
    $cleanup($pdo);
}

exit($test->summary());
