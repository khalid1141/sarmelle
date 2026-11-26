<?php
declare(strict_types=1);

namespace Sarmelle\Repositories;

use PDO;

final class AdminOtpCodes
{
    public function __construct(private readonly PDO $pdo)
    {
    }

    public function create(int $adminUserId, string $codeHash, string $purpose, string $expiresAt): int
    {
        // mark older unused codes for same purpose used
        $this->pdo->prepare(
            'UPDATE admin_otp_codes SET used_at = NOW() WHERE admin_user_id = ? AND purpose = ? AND used_at IS NULL'
        )->execute([$adminUserId, $purpose]);

        $statement = $this->pdo->prepare(
            'INSERT INTO admin_otp_codes (admin_user_id, code_hash, purpose, expires_at) VALUES (?, ?, ?, ?)'
        );
        $statement->execute([$adminUserId, $codeHash, $purpose, $expiresAt]);

        return (int) $this->pdo->lastInsertId();
    }

    /**
     * @return array{id: int, admin_user_id: int, code_hash: string, purpose: string, expires_at: string, attempts: int, used_at: ?string}|null
     */
    public function findById(int $id): ?array
    {
        $statement = $this->pdo->prepare(
            'SELECT id, admin_user_id, code_hash, purpose, expires_at, attempts, used_at'
            . ' FROM admin_otp_codes WHERE id = ? LIMIT 1'
        );
        $statement->execute([$id]);
        $row = $statement->fetch();

        if (!is_array($row)) {
            return null;
        }

        return [
            'id' => (int) $row['id'],
            'admin_user_id' => (int) $row['admin_user_id'],
            'code_hash' => (string) $row['code_hash'],
            'purpose' => (string) $row['purpose'],
            'expires_at' => (string) $row['expires_at'],
            'attempts' => (int) $row['attempts'],
            'used_at' => $row['used_at'] === null ? null : (string) $row['used_at'],
        ];
    }

    public function incrementAttempts(int $id): void
    {
        $this->pdo->prepare('UPDATE admin_otp_codes SET attempts = attempts + 1 WHERE id = ?')->execute([$id]);
    }

    public function markUsed(int $id): void
    {
        $this->pdo->prepare('UPDATE admin_otp_codes SET used_at = NOW() WHERE id = ?')->execute([$id]);
    }

    public function countRecentByPurpose(int $adminUserId, string $purpose, int $windowMinutes): int
    {
        $statement = $this->pdo->prepare(
            'SELECT COUNT(*) FROM admin_otp_codes WHERE admin_user_id = ? AND purpose = ? AND created_at >= ?'
        );
        $cutoff = \Sarmelle\Core\Clock::now()->modify('-' . $windowMinutes . ' minutes')->format('Y-m-d H:i:s');
        $statement->execute([$adminUserId, $purpose, $cutoff]);

        return (int) $statement->fetchColumn();
    }
}
