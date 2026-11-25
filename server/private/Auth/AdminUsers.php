<?php
declare(strict_types=1);

namespace Sarmelle\Auth;

use PDO;
use Sarmelle\Core\DatabaseException;
use Sarmelle\Support\ActivityLog;
use Sarmelle\Support\Normaliser;

/**
 * The single-owner admin account lifecycle.
 *
 * Setup creates exactly one row and refuses when any row exists. Recovery
 * replaces the hash and, in one transaction, deletes every admin session,
 * trusted device and login attempt for that account.
 *
 * Guards are static so selftest can prove the CLI-only and flag checks without
 * switching the running SAPI. No method accepts a password from argv.
 */
final class AdminUsers
{
    public const SETUP_ACTION = 'admin.setup.created';
    public const RECOVERY_ACTION = 'admin.password.recovered';
    public const ENTITY_TYPE = 'admin_user';

    public function __construct(
        private readonly PDO $pdo,
        private readonly ActivityLog $activity,
        private readonly string $passwordAlgorithm = 'auto',
        private readonly int $bcryptCost = 12
    ) {
    }

    /**
     * Setup and recovery are only reachable from a terminal. Config also
     * refuses to load these flags under a web SAPI; this is the second layer.
     */
    public static function assertCli(string $sapi): void
    {
        if (!in_array($sapi, ['cli', 'phpdbg'], true)) {
            throw new \RuntimeException('This script must be run from the command line.');
        }
    }

    public static function assertSetupAllowed(bool $setupAllowed, string $sapi): void
    {
        self::assertCli($sapi);

        if (!$setupAllowed) {
            throw new \RuntimeException(
                'Setup is disabled. Set SETUP_ALLOWED=1 in server/private/Config/.env for this run.'
            );
        }
    }

    public static function assertRecoveryAllowed(bool $recoveryAllowed, string $sapi): void
    {
        self::assertCli($sapi);

        if (!$recoveryAllowed) {
            throw new \RuntimeException(
                'Recovery is disabled. Set RECOVERY_ALLOWED=1 in server/private/Config/.env for this run.'
            );
        }
    }

    public function count(): int
    {
        try {
            return (int) $this->pdo->query('SELECT COUNT(*) FROM admin_users')->fetchColumn();
        } catch (\PDOException $exception) {
            throw DatabaseException::fromPdo($exception);
        }
    }

    /**
     * Returns the sole admin row, null when the table is empty, and throws if
     * the single-owner invariant has already been broken.
     *
     * @return array{id: int, name: string, email: string, password_hash: string}|null
     */
    public function sole(): ?array
    {
        try {
            $statement = $this->pdo->query(
                'SELECT id, name, email, password_hash FROM admin_users ORDER BY id ASC LIMIT 2'
            );
            $rows = $statement->fetchAll();
        } catch (\PDOException $exception) {
            throw DatabaseException::fromPdo($exception);
        }

        if (!is_array($rows) || $rows === []) {
            return null;
        }

        if (count($rows) > 1) {
            throw new \RuntimeException('More than one admin account exists.');
        }

        /** @var array<string, mixed> $row */
        $row = $rows[0];

        return [
            'id' => (int) $row['id'],
            'name' => (string) $row['name'],
            'email' => (string) $row['email'],
            'password_hash' => (string) $row['password_hash'],
        ];
    }

    /**
     * Creates the only admin row and writes one activity-log entry in the same
     * transaction. Refuses when a row already exists.
     */
    public function create(
        string $name,
        string $email,
        string $password,
        ?string $ip = null,
        bool $manageTransaction = true
    ): int {
        $normalisedName = Normaliser::name($name);

        if ($normalisedName === null) {
            throw new \InvalidArgumentException('Enter a valid name.');
        }

        $normalisedEmail = Normaliser::email($email);

        if ($normalisedEmail === null) {
            throw new \InvalidArgumentException('Enter a valid email address.');
        }

        Password::assertAcceptable($password, $this->passwordAlgorithm);
        $hash = Password::hash($password, $this->passwordAlgorithm, $this->bcryptCost);

        $this->begin($manageTransaction);

        try {
            $existing = $this->pdo->query(
                'SELECT id FROM admin_users ORDER BY id ASC LIMIT 1 FOR UPDATE'
            )->fetch();

            if (is_array($existing)) {
                throw new \RuntimeException('An admin account already exists.');
            }

            $statement = $this->pdo->prepare(
                'INSERT INTO admin_users (name, email, password_hash) VALUES (?, ?, ?)'
            );
            $statement->execute([$normalisedName, $normalisedEmail, $hash]);

            $adminUserId = (int) $this->pdo->lastInsertId();

            $this->activity->record(
                $adminUserId,
                self::SETUP_ACTION,
                self::ENTITY_TYPE,
                $adminUserId,
                null,
                ['name' => $normalisedName, 'email' => $normalisedEmail],
                $ip
            );

            if ($manageTransaction) {
                $this->pdo->commit();
            }

            return $adminUserId;
        } catch (\Throwable $exception) {
            if ($manageTransaction) {
                $this->rollback();
            }

            if ($exception instanceof \PDOException) {
                throw DatabaseException::fromPdo($exception);
            }

            throw $exception;
        }
    }

    /**
     * Replaces the password hash and revokes everything that could still hold a
     * session for this account. The activity entry contains counts only.
     *
     * @return array{sessions_revoked: int, devices_revoked: int, attempts_cleared: int}
     */
    public function recoverPassword(
        int $adminUserId,
        string $password,
        ?string $ip = null,
        bool $manageTransaction = true
    ): array {
        if ($adminUserId < 1) {
            throw new \InvalidArgumentException('Invalid admin user id.');
        }

        Password::assertAcceptable($password, $this->passwordAlgorithm);
        $hash = Password::hash($password, $this->passwordAlgorithm, $this->bcryptCost);

        $this->begin($manageTransaction);

        try {
            $statement = $this->pdo->prepare(
                'SELECT id, email FROM admin_users WHERE id = ? LIMIT 1 FOR UPDATE'
            );
            $statement->execute([$adminUserId]);
            $admin = $statement->fetch();

            if (!is_array($admin)) {
                throw new \RuntimeException('No admin account exists.');
            }

            $email = strtolower((string) $admin['email']);

            $update = $this->pdo->prepare(
                'UPDATE admin_users SET password_hash = ? WHERE id = ?'
            );
            $update->execute([$hash, $adminUserId]);

            $sessions = $this->pdo->prepare(
                'DELETE FROM admin_sessions WHERE admin_user_id = ?'
            );
            $sessions->execute([$adminUserId]);

            $devices = $this->pdo->prepare(
                'DELETE FROM admin_trusted_devices WHERE admin_user_id = ?'
            );
            $devices->execute([$adminUserId]);

            // Login identifiers are stored exactly as typed, so clear every
            // casing of this account's email, not just the canonical one.
            $attempts = $this->pdo->prepare(
                "DELETE FROM login_attempts WHERE account_type = 'admin' AND LOWER(identifier) = ?"
            );
            $attempts->execute([$email]);

            $counts = [
                'sessions_revoked' => $sessions->rowCount(),
                'devices_revoked' => $devices->rowCount(),
                'attempts_cleared' => $attempts->rowCount(),
            ];

            $this->activity->record(
                $adminUserId,
                self::RECOVERY_ACTION,
                self::ENTITY_TYPE,
                $adminUserId,
                null,
                $counts,
                $ip
            );

            if ($manageTransaction) {
                $this->pdo->commit();
            }

            return $counts;
        } catch (\Throwable $exception) {
            if ($manageTransaction) {
                $this->rollback();
            }

            if ($exception instanceof \PDOException) {
                throw DatabaseException::fromPdo($exception);
            }

            throw $exception;
        }
    }

    /**
     * A caller that owns the transaction (db-selftest and future batch jobs)
     * passes false so this class never commits or rolls back its work.
     */
    private function begin(bool $manageTransaction): void
    {
        if ($manageTransaction) {
            $this->pdo->beginTransaction();

            return;
        }

        if (!$this->pdo->inTransaction()) {
            throw new \LogicException('A caller-owned transaction is required.');
        }
    }

    private function rollback(): void
    {
        try {
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }
        } catch (\Throwable $exception) {
            // The original failure is the useful one.
        }
    }
}
