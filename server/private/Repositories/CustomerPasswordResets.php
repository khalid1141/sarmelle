<?php
declare(strict_types=1);

namespace Sarmelle\Repositories;

use PDO;

final class CustomerPasswordResets
{
    public function __construct(private readonly PDO $pdo)
    {
    }

    public function create(int $customerId, string $tokenHash, string $expiresAt): void
    {
        $this->pdo->prepare(
            'INSERT INTO customer_password_resets (customer_id, token_hash, expires_at) VALUES (?, ?, ?)'
        )->execute([$customerId, $tokenHash, $expiresAt]);
    }

    /**
     * @return array{id: int, customer_id: int, expires_at: string, used_at: ?string}|null
     */
    public function findByTokenHash(string $tokenHash): ?array
    {
        $statement = $this->pdo->prepare(
            'SELECT id, customer_id, expires_at, used_at FROM customer_password_resets WHERE token_hash = ? LIMIT 1'
        );
        $statement->execute([$tokenHash]);
        $row = $statement->fetch();

        if (!is_array($row)) {
            return null;
        }

        return [
            'id' => (int) $row['id'],
            'customer_id' => (int) $row['customer_id'],
            'expires_at' => (string) $row['expires_at'],
            'used_at' => $row['used_at'] === null ? null : (string) $row['used_at'],
        ];
    }

    public function markUsed(int $id): void
    {
        $this->pdo->prepare('UPDATE customer_password_resets SET used_at = NOW() WHERE id = ?')->execute([$id]);
    }

    public function countRecent(int $customerId, int $windowMinutes): int
    {
        $statement = $this->pdo->prepare(
            'SELECT COUNT(*) FROM customer_password_resets WHERE customer_id = ? AND created_at >= ?'
        );
        $cutoff = \Sarmelle\Core\Clock::now()->modify('-' . $windowMinutes . ' minutes')->format('Y-m-d H:i:s');
        $statement->execute([$customerId, $cutoff]);

        return (int) $statement->fetchColumn();
    }
}