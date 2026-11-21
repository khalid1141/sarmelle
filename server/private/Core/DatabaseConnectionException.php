<?php
declare(strict_types=1);

namespace Sarmelle\Core;

/**
 * A database connection/session-setup failure.
 *
 * It carries only a sanitised SQLSTATE (or driver code). The DSN, username,
 * password and the original PDOException are deliberately not stored or
 * chained: ErrorHandler writes the one log line with the request ID.
 */
final class DatabaseConnectionException extends \RuntimeException
{
    public function __construct(private readonly string $sqlState)
    {
        parent::__construct('Database connection failed.');
    }

    public function sqlState(): string
    {
        return $this->sqlState;
    }
}
