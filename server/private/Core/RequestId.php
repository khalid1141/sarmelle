<?php
declare(strict_types=1);

namespace Sarmelle\Core;

/**
 * Process-wide request ID holder.
 *
 * A web entry point sets it as early as possible so bootstrap.php's notice and
 * last-resort exception handlers can correlate a log line with the request.
 * CLI runs and failures before an entry point sets it use the fixed "req_none"
 * marker, which keeps the same req_ shape.
 */
final class RequestId
{
    private static string $current = 'req_none';

    public static function set(string $requestId): void
    {
        self::$current = $requestId === '' ? 'req_none' : $requestId;
    }

    public static function current(): string
    {
        return self::$current;
    }

    public static function generate(): string
    {
        return 'req_' . bin2hex(random_bytes(8));
    }
}
