<?php
declare(strict_types=1);

namespace Sarmelle\Repositories;

use PDO;
use Sarmelle\Core\Clock;
use Sarmelle\Core\DatabaseException;

/**
 * login_attempts repository. Prepared statements only; the identifier is
 * stored exactly as typed so unknown emails are counted too.
 *
 * Only failures count toward lockouts (is_success = 0), and the time window
 * makes old rows irrelevant without a cleanup job.
 */
final class LoginAttempts
{
    private const ACCOUNT_TYPES = ['admin', 'customer'];
    private const MAX_IDENTIFIER_BYTES = 255;
    private const MAX_IP_BYTES = 45;

    public function __construct(private readonly PDO $pdo)
    {
    }

    public function record(string $accountType, string $identifier, ?string $ip, bool $success): int
    {
        $this->assertAccountType($accountType);
        $this->assertIdentifier($identifier);
        $this->assertIp($ip);

        if ($ip === '') {
            $ip = null;
        }

        $statement = $this->pdo->prepare(
            'INSERT INTO login_attempts (account_type, identifier, ip, is_success)'
            . ' VALUES (?, ?, ?, ?)'
        );
        try {
            $statement->execute([$accountType, $identifier, $ip, $success ? 1 : 0]);
            return (int) $this->pdo->lastInsertId();
        } catch (\PDOException $e) {
            throw DatabaseException::fromPdo($e);
        }
    }

    public function countIdentifierFailures(
        string $accountType,
        string $identifier,
        int $windowMinutes
    ): int {
        $this->assertAccountType($accountType);
        $this->assertIdentifier($identifier);
        $this->assertWindow($windowMinutes);

        $statement = $this->pdo->prepare(
            'SELECT COUNT(*) FROM login_attempts'
            . ' WHERE account_type = ? AND identifier = ? AND is_success = 0 AND created_at >= ?'
        );
        try {
            $statement->execute([$accountType, $identifier, self::cutoff($windowMinutes)]);
            return (int) $statement->fetchColumn();
        } catch (\PDOException $e) {
            throw DatabaseException::fromPdo($e);
        }
    }

    public function countIpFailures(?string $ip, int $windowMinutes): int
    {
        if ($ip === null || trim($ip) === '') {
            return 0;
        }

        $this->assertIp($ip);
        $this->assertWindow($windowMinutes);

        $statement = $this->pdo->prepare(
            'SELECT COUNT(*) FROM login_attempts'
            . ' WHERE ip = ? AND is_success = 0 AND created_at >= ?'
        );
        try {
            $statement->execute([$ip, self::cutoff($windowMinutes)]);
            return (int) $statement->fetchColumn();
        } catch (\PDOException $e) {
            throw DatabaseException::fromPdo($e);
        }
    }

    private static function cutoff(int $windowMinutes): string
    {
        return Clock::now()
            ->modify('-' . $windowMinutes . ' minutes')
            ->format('Y-m-d H:i:s');
    }

    private function assertAccountType(string $accountType): void
    {
        if (!in_array($accountType, self::ACCOUNT_TYPES, true)) {
            throw new \InvalidArgumentException('Unknown account type.');
        }
    }

    private function assertIdentifier(string $identifier): void
    {
        if (strlen($identifier) > self::MAX_IDENTIFIER_BYTES) {
            throw new \InvalidArgumentException('Identifier is too long.');
        }
    }

    private function assertIp(?string $ip): void
    {
        if ($ip === null || $ip === '') {
            return;
        }

        if (strlen($ip) > self::MAX_IP_BYTES || filter_var($ip, FILTER_VALIDATE_IP) === false) {
            throw new \InvalidArgumentException('Invalid IP address.');
        }
    }

    private function assertWindow(int $windowMinutes): void
    {
        if ($windowMinutes < 1 || $windowMinutes > 10080) {
            throw new \InvalidArgumentException('Invalid throttle window.');
        }
    }
}
