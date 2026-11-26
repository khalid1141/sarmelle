<?php
declare(strict_types=1);

namespace Sarmelle\Repositories;

use PDO;
use Sarmelle\Core\DatabaseException;

final class AdminSessions
{
    public function __construct(private readonly PDO $pdo)
    {
    }

    public function create(int $adminUserId, string $tokenHash, string $expiresAt, ?string $ip, ?string $userAgent): void
    {
        $statement = $this->pdo->prepare(
            'INSERT INTO admin_sessions (admin_user_id, session_token_hash, expires_at, ip, user_agent)'
            . ' VALUES (?, ?, ?, ?, ?)'
        );
        $statement->execute([$adminUserId, $tokenHash, $expiresAt, $ip, $userAgent]);
    }

    /**
     * @return array{id: int, admin_user_id: int, expires_at: string, created_at: string}|null
     */
    public function findByTokenHash(string $tokenHash): ?array
    {
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
    }

    public function deleteByTokenHash(string $tokenHash): void
    {
        $statement = $this->pdo->prepare('DELETE FROM admin_sessions WHERE session_token_hash = ?');
        $statement->execute([$tokenHash]);
    }

    public function deleteAllForAdmin(int $adminUserId): void
    {
        $statement = $this->pdo->prepare('DELETE FROM admin_sessions WHERE admin_user_id = ?');
        $statement->execute([$adminUserId]);
    }

    public function slideExpiry(int $id, string $expiresAt): void
    {
        $statement = $this->pdo->prepare('UPDATE admin_sessions SET expires_at = ? WHERE id = ?');
        $statement->execute([$expiresAt, $id]);
    }
}