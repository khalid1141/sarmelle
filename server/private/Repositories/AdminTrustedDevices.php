<?php
declare(strict_types=1);

namespace Sarmelle\Repositories;

use PDO;

final class AdminTrustedDevices
{
    public function __construct(private readonly PDO $pdo)
    {
    }

    public function create(int $adminUserId, string $tokenHash, string $label, string $expiresAt): void
    {
        $statement = $this->pdo->prepare(
            'INSERT INTO admin_trusted_devices (admin_user_id, token_hash, label, expires_at, last_used_at)'
            . ' VALUES (?, ?, ?, ?, NOW())'
        );
        $statement->execute([$adminUserId, $tokenHash, $label, $expiresAt]);
    }

    /**
     * @return array{id: int, admin_user_id: int, expires_at: string}|null
     */
    public function findByTokenHash(string $tokenHash): ?array
    {
        $statement = $this->pdo->prepare(
            'SELECT id, admin_user_id, expires_at FROM admin_trusted_devices WHERE token_hash = ? LIMIT 1'
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
        ];
    }

    public function touch(int $id): void
    {
        $this->pdo->prepare('UPDATE admin_trusted_devices SET last_used_at = NOW() WHERE id = ?')->execute([$id]);
    }

    public function deleteAllForAdmin(int $adminUserId): void
    {
        $this->pdo->prepare('DELETE FROM admin_trusted_devices WHERE admin_user_id = ?')->execute([$adminUserId]);
    }
}