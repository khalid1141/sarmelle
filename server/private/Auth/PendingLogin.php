<?php
declare(strict_types=1);

namespace Sarmelle\Auth;

use Sarmelle\Config\Config;

final class PendingLogin
{
    private const CONTEXT = 'admin-pending-login';
    private const VERSION = 'v1';

    public static function sign(Config $config, int $adminId, int $otpRowId, int $expiresUnix): string
    {
        $payload = self::VERSION . '|' . $adminId . '|' . $otpRowId . '|' . $expiresUnix;
        $mac = hash_hmac('sha256', $payload, self::key($config));

        return self::VERSION . '.' . $adminId . '.' . $otpRowId . '.' . $expiresUnix . '.' . $mac;
    }

    /**
     * @return array{admin_id: int, otp_row_id: int, expires: int}|null
     */
    public static function verify(Config $config, string $cookieValue): ?array
    {
        $parts = explode('.', $cookieValue);

        if (count($parts) !== 5) {
            return null;
        }

        [$version, $adminId, $otpRowId, $expires, $mac] = $parts;

        if ($version !== self::VERSION) {
            return null;
        }

        if (!ctype_digit($adminId) || !ctype_digit($otpRowId) || !ctype_digit($expires)) {
            return null;
        }

        $adminIdInt = (int) $adminId;
        $otpRowIdInt = (int) $otpRowId;
        $expiresInt = (int) $expires;

        if ($expiresInt < time()) {
            return null;
        }

        $payload = self::VERSION . '|' . $adminIdInt . '|' . $otpRowIdInt . '|' . $expiresInt;
        $expected = hash_hmac('sha256', $payload, self::key($config));

        if (!hash_equals($expected, $mac)) {
            return null;
        }

        return ['admin_id' => $adminIdInt, 'otp_row_id' => $otpRowIdInt, 'expires' => $expiresInt];
    }

    private static function key(Config $config): string
    {
        return hash('sha256', $config->appKey() . self::CONTEXT, true);
    }
}