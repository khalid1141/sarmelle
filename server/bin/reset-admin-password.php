<?php
declare(strict_types=1);

/**
 * Owner password recovery. CLI only and the only recovery path.
 *
 *   php server/bin/reset-admin-password.php
 *
 * Refuses unless RECOVERY_ALLOWED=1. Replaces the hash in one transaction,
 * deletes every admin session and trusted device for the account, clears the
 * account's login_attempts rows and writes an activity-log entry. No email is
 * sent and no password is echoed, logged or accepted as an argument.
 */

use Sarmelle\Auth\AdminUsers;
use Sarmelle\Config\Config;
use Sarmelle\Core\Connection;
use Sarmelle\Support\ActivityLog;
use Sarmelle\Support\Console;
use Sarmelle\Support\Normaliser;

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

require dirname(__DIR__) . '/private/bootstrap.php';

try {
    $config = Config::load(dirname(__DIR__) . '/private');

    AdminUsers::assertRecoveryAllowed($config->bool('RECOVERY_ALLOWED'), PHP_SAPI);

    $pdo = Connection::open($config);
    $admins = new AdminUsers(
        $pdo,
        new ActivityLog($pdo),
        $config->string('PASSWORD_ALGO'),
        $config->int('PASSWORD_BCRYPT_COST')
    );

    $admin = $admins->sole();

    if ($admin === null) {
        throw new \RuntimeException('No admin account exists. Run create-admin.php first.');
    }

    fwrite(STDOUT, 'Sarmelle admin password recovery' . PHP_EOL);

    $email = Normaliser::email(Console::ask('Admin email: '));

    if ($email === null || !hash_equals($admin['email'], $email)) {
        throw new \RuntimeException('That email does not match the admin account.');
    }

    $password = Console::askHidden('New password (minimum 12 characters): ');
    $confirm = Console::askHidden('Confirm new password: ');

    if (!hash_equals($password, $confirm)) {
        throw new \RuntimeException('The passwords do not match.');
    }

    $counts = $admins->recoverPassword($admin['id'], $password);

    fwrite(STDOUT, 'Password replaced for ' . $admin['email'] . '.' . PHP_EOL);
    fwrite(STDOUT, 'Sessions revoked: ' . $counts['sessions_revoked'] . PHP_EOL);
    fwrite(STDOUT, 'Trusted devices revoked: ' . $counts['devices_revoked'] . PHP_EOL);
    fwrite(STDOUT, 'Login attempts cleared: ' . $counts['attempts_cleared'] . PHP_EOL);
    fwrite(STDOUT, 'Set RECOVERY_ALLOWED=0 in server/private/Config/.env now.' . PHP_EOL);
    exit(0);
} catch (\Throwable $exception) {
    fwrite(STDERR, 'recovery failed: ' . $exception->getMessage() . PHP_EOL);
    exit(1);
}
