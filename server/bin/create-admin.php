<?php
declare(strict_types=1);

/**
 * One-time owner account setup. CLI only.
 *
 *   php server/bin/create-admin.php
 *
 * Refuses when SETUP_ALLOWED is 0 or when an admin account already exists.
 * Reads email, name and password from the terminal; the password is hidden
 * where the platform supports it and is never echoed, logged or passed as an
 * argument.
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

    AdminUsers::assertSetupAllowed($config->bool('SETUP_ALLOWED'), PHP_SAPI);

    $pdo = Connection::open($config);
    $admins = new AdminUsers(
        $pdo,
        new ActivityLog($pdo),
        $config->string('PASSWORD_ALGO'),
        $config->int('PASSWORD_BCRYPT_COST')
    );

    if ($admins->count() > 0) {
        throw new \RuntimeException(
            'An admin account already exists. Use reset-admin-password.php for recovery.'
        );
    }

    fwrite(STDOUT, 'Sarmelle admin setup' . PHP_EOL);

    $email = Normaliser::email(Console::ask('Admin email: '));

    if ($email === null) {
        throw new \InvalidArgumentException('Enter a valid email address.');
    }

    $name = Normaliser::name(Console::ask('Admin name: '));

    if ($name === null) {
        throw new \InvalidArgumentException('Enter a valid name.');
    }

    $password = Console::askHidden('Password (minimum 12 characters): ');
    $confirm = Console::askHidden('Confirm password: ');

    if (!hash_equals($password, $confirm)) {
        throw new \RuntimeException('The passwords do not match.');
    }

    $adminUserId = $admins->create($name, $email, $password);

    fwrite(STDOUT, 'Admin account created (id ' . $adminUserId . ').' . PHP_EOL);
    fwrite(
        STDOUT,
        'Set SETUP_ALLOWED=0 in server/private/Config/.env and delete this script before going live.'
            . PHP_EOL
    );
    exit(0);
} catch (\Throwable $exception) {
    fwrite(STDERR, 'setup failed: ' . $exception->getMessage() . PHP_EOL);
    exit(1);
}
