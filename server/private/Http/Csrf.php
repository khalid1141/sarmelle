<?php
declare(strict_types=1);

namespace Sarmelle\Http;

/**
 * CSRF primitives from design section 6: a customer token in the PHP session,
 * and an admin double-submit token compared with hash_equals.
 *
 * Callers decide when a session exists. Pre-authentication POSTs carry no token
 * and rely on the Origin check, SameSite=Lax and their throttles.
 */
final class Csrf
{
    private const SESSION_KEY = 'csrf_token';

    public static function issueCustomerToken(): string
    {
        $token = bin2hex(random_bytes(32));
        $_SESSION[self::SESSION_KEY] = $token;

        return $token;
    }

    public static function customerToken(): ?string
    {
        $token = $_SESSION[self::SESSION_KEY] ?? null;

        return is_string($token) && $token !== '' ? $token : null;
    }

    public static function verifyCustomer(?string $submitted): bool
    {
        $expected = self::customerToken();

        if ($expected === null || !is_string($submitted) || $submitted === '') {
            return false;
        }

        return hash_equals($expected, $submitted);
    }

    public static function clearCustomerToken(): void
    {
        unset($_SESSION[self::SESSION_KEY]);
    }

    public static function issueAdminToken(): string
    {
        return bin2hex(random_bytes(32));
    }

    public static function verifyAdmin(?string $cookieToken, ?string $headerToken): bool
    {
        if (
            !is_string($cookieToken) || $cookieToken === ''
            || !is_string($headerToken) || $headerToken === ''
        ) {
            return false;
        }

        return hash_equals($cookieToken, $headerToken);
    }
}
