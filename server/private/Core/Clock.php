<?php
declare(strict_types=1);

namespace Sarmelle\Core;

/**
 * The only source of "now" in the backend.
 *
 * The process timezone is set to Asia/Kolkata by bootstrap.php; this class makes
 * that explicit and also returns the MySQL-ready "Y-m-d H:i:s" string so no
 * request code has to call date() or format times itself.
 */
final class Clock
{
    private static ?\DateTimeZone $zone = null;

    public static function zone(): \DateTimeZone
    {
        return self::$zone ??= new \DateTimeZone('Asia/Kolkata');
    }

    public static function now(): \DateTimeImmutable
    {
        return new \DateTimeImmutable('now', self::zone());
    }

    public static function nowMysql(): string
    {
        return self::now()->format('Y-m-d H:i:s');
    }

    /**
     * Parses a DATETIME/TIMESTAMP string read from MySQL as IST wall time.
     * The "!" resets unparsed fields so no current-time residue leaks in.
     */
    public static function fromMysql(string $value): \DateTimeImmutable
    {
        $parsed = \DateTimeImmutable::createFromFormat('!Y-m-d H:i:s', $value, self::zone());

        if ($parsed === false) {
            throw new \InvalidArgumentException('Invalid MySQL datetime: ' . $value);
        }

        return $parsed;
    }
}
