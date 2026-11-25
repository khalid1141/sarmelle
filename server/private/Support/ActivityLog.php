<?php
declare(strict_types=1);

namespace Sarmelle\Support;

use PDO;
use Sarmelle\Core\DatabaseException;
use Sarmelle\Core\Json;

/**
 * Append-only admin activity log (db/schema_draft.sql table `activity_log`).
 *
 * Callers supply action/entity names and optional JSON snapshots. This class
 * never receives a password or hash from the setup/recovery scripts. A
 * PDOException is reduced to a fixed DatabaseException so SQL text and bound
 * values cannot escape.
 */
final class ActivityLog
{
    private const MAX_NAME_BYTES = 50;
    private const MAX_IP_BYTES = 45;

    public function __construct(private readonly PDO $pdo)
    {
    }

    /**
     * @param array<string, mixed>|null $oldValue
     * @param array<string, mixed>|null $newValue
     */
    public function record(
        ?int $adminUserId,
        string $action,
        string $entityType,
        ?int $entityId = null,
        ?array $oldValue = null,
        ?array $newValue = null,
        ?string $ip = null
    ): int {
        $this->assertName('action', $action);
        $this->assertName('entity type', $entityType);

        if ($adminUserId !== null && $adminUserId < 1) {
            throw new \InvalidArgumentException('Invalid admin user id.');
        }

        if ($entityId !== null && $entityId < 1) {
            throw new \InvalidArgumentException('Invalid entity id.');
        }

        $this->assertIp($ip);

        $oldJson = $oldValue === null ? null : Json::encode($oldValue);
        $newJson = $newValue === null ? null : Json::encode($newValue);

        try {
            $statement = $this->pdo->prepare(
                'INSERT INTO activity_log'
                . ' (admin_user_id, action, entity_type, entity_id, old_value, new_value, ip)'
                . ' VALUES (?, ?, ?, ?, ?, ?, ?)'
            );
            $statement->execute([
                $adminUserId,
                $action,
                $entityType,
                $entityId,
                $oldJson,
                $newJson,
                $ip === '' ? null : $ip,
            ]);

            return (int) $this->pdo->lastInsertId();
        } catch (\PDOException $exception) {
            throw DatabaseException::fromPdo($exception);
        }
    }

    private function assertName(string $label, string $value): void
    {
        if ($value === '' || strlen($value) > self::MAX_NAME_BYTES) {
            throw new \InvalidArgumentException('Invalid activity log ' . $label . '.');
        }

        if (preg_match('/^[A-Za-z0-9._-]+$/', $value) !== 1) {
            throw new \InvalidArgumentException('Invalid activity log ' . $label . '.');
        }
    }

    private function assertIp(?string $ip): void
    {
        if ($ip === null || $ip === '') {
            return;
        }

        if (strlen($ip) > self::MAX_IP_BYTES || filter_var($ip, FILTER_VALIDATE_IP) === false) {
            throw new \InvalidArgumentException('Invalid activity log IP address.');
        }
    }
}
