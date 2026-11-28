<?php
declare(strict_types=1);

namespace Sarmelle\Repositories;

use PDO;
use Sarmelle\Auth\Policy;
use Sarmelle\Core\Clock;
use Sarmelle\Core\DatabaseException;

final class AdminSessions
{
    public function __construct(private readonly PDO $pdo)
    {
    }

    public function create(int $adminUserId, string $tokenHash, string $expiresAt, ?string $ip, ?string $userAgent): int
    {
        try {
            $statement = $this->pdo->prepare(
                'INSERT INTO admin_sessions (admin_user_id, session_token_hash, expires_at, ip, user_agent)'
                . ' VALUES (?, ?, ?, ?, ?)'
            );
            $statement->execute([$adminUserId, $tokenHash, $expiresAt, $ip, $userAgent]);

            return (int) $this->pdo->lastInsertId();
        } catch (\PDOException $exception) {
            throw DatabaseException::fromPdo($exception);
        }
    }

    /**
     * Generates a cryptographically secure token, hashes it, stores the session row, and returns the raw token.
     *
     * @return array{token: string, token_hash: string, expires_at: string, id: int}
     */
    public function createWithRawToken(int $adminUserId, ?string $ip = null, ?string $userAgent = null, ?\DateTimeImmutable $now = null): array
    {
        $token = bin2hex(random_bytes(32));
        $tokenHash = hash('sha256', $token);
        $now ??= Clock::now();
        $expiresAt = $now->modify('+' . Policy::ADMIN_SESSION_IDLE_MINUTES . ' minutes')->format('Y-m-d H:i:s');
        $id = $this->create($adminUserId, $tokenHash, $expiresAt, $ip, $userAgent);

        return [
            'token' => $token,
            'token_hash' => $tokenHash,
            'expires_at' => $expiresAt,
            'id' => $id,
        ];
    }

    /**
     * @return array{id: int, admin_user_id: int, expires_at: string, created_at: string}|null
     */
    public function findByTokenHash(string $tokenHash): ?array
    {
        try {
            $statement = $this->pdo->prepare(
                'SELECT id, admin_user_id, expires_at, created_at FROM admin_sessions'
                . ' WHERE session_token_hash = ? LIMIT 1'
            );
            $statement->execute([$tokenHash]);
            $row = $statement->fetch();

            if (!is_array($row)) {
                return null;
            }

            return [
                'id' => (int) $row['id'],
                'admin_user_id' => (int) $row['admin_user_id'],
                'expires_at' => (string) $row['expires_at'],
                'created_at' => (string) $row['created_at'],
            ];
        } catch (\PDOException $exception) {
            throw DatabaseException::fromPdo($exception);
        }
    }

    /**
     * Resolves a raw session token, checks idle and absolute timeouts,
     * slides expiry if valid (stopping at the 12-hour absolute cap),
     * and deletes expired sessions.
     *
     * @return array{status: 'valid'|'invalid'|'session_expired', session: ?array{id: int, admin_user_id: int, expires_at: string, created_at: string}}
     */
    public function resolve(string $token, ?\DateTimeImmutable $now = null): array
    {
        if (trim($token) === '') {
            return ['status' => 'invalid', 'session' => null];
        }

        $tokenHash = hash('sha256', $token);
        $row = $this->findByTokenHash($tokenHash);

        if ($row === null) {
            return ['status' => 'invalid', 'session' => null];
        }

        $now ??= Clock::now();

        // 1. Idle timeout check (30 minutes)
        $expiresAt = Clock::fromMysql($row['expires_at']);
        if ($expiresAt <= $now) {
            $this->deleteByTokenHash($tokenHash);

            return ['status' => 'session_expired', 'session' => null];
        }

        // 2. Absolute timeout check (12 hours from created_at)
        $createdAt = Clock::fromMysql($row['created_at']);
        $absoluteCap = $createdAt->modify('+' . Policy::ADMIN_SESSION_ABSOLUTE_HOURS . ' hours');
        if ($absoluteCap <= $now) {
            $this->deleteByTokenHash($tokenHash);

            return ['status' => 'session_expired', 'session' => null];
        }

        // 3. Slide expiry within the idle window, capped at absolute timeout
        $idleExpiry = $now->modify('+' . Policy::ADMIN_SESSION_IDLE_MINUTES . ' minutes');
        $newExpiresAt = $idleExpiry > $absoluteCap ? $absoluteCap : $idleExpiry;
        $newExpiresAtStr = $newExpiresAt->format('Y-m-d H:i:s');

        $this->slideExpiry((int) $row['id'], $newExpiresAtStr);
        $row['expires_at'] = $newExpiresAtStr;

        return ['status' => 'valid', 'session' => $row];
    }

    public function deleteByTokenHash(string $tokenHash): void
    {
        try {
            $statement = $this->pdo->prepare('DELETE FROM admin_sessions WHERE session_token_hash = ?');
            $statement->execute([$tokenHash]);
        } catch (\PDOException $exception) {
            throw DatabaseException::fromPdo($exception);
        }
    }

    public function deleteAllForAdmin(int $adminUserId): int
    {
        try {
            $statement = $this->pdo->prepare('DELETE FROM admin_sessions WHERE admin_user_id = ?');
            $statement->execute([$adminUserId]);

            return $statement->rowCount();
        } catch (\PDOException $exception) {
            throw DatabaseException::fromPdo($exception);
        }
    }

    public function slideExpiry(int $id, string $expiresAt): void
    {
        try {
            $statement = $this->pdo->prepare('UPDATE admin_sessions SET expires_at = ? WHERE id = ?');
            $statement->execute([$expiresAt, $id]);
        } catch (\PDOException $exception) {
            throw DatabaseException::fromPdo($exception);
        }
    }
}
