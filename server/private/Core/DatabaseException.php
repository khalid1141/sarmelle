<?php
declare(strict_types=1);

namespace Sarmelle\Core;

/**
 * A database operation failure that is safe to show or log.
 *
 * The message is fixed. The SQLSTATE (or driver code) is sanitised to
 * alphanumerics, and the original PDOException is deliberately not stored or
 * chained, because its message can contain SQL text and bound values.
 */
final class DatabaseException extends \RuntimeException
{
    public function __construct(private readonly string $sqlState)
    {
        parent::__construct('Database operation failed.');
    }

    public static function fromPdo(\PDOException $exception): self
    {
        $errorInfo = $exception->errorInfo ?? null;
        $sqlState = '';

        if (is_array($errorInfo) && isset($errorInfo[0]) && is_string($errorInfo[0])) {
            $sqlState = $errorInfo[0];
        }

        if ($sqlState === '') {
            $sqlState = (string) $exception->getCode();
        }

        $sqlState = preg_replace('/[^A-Za-z0-9]/', '', $sqlState) ?? '';

        return new self($sqlState === '' ? 'unknown' : $sqlState);
    }

    public function sqlState(): string
    {
        return $this->sqlState;
    }
}
