<?php
declare(strict_types=1);

namespace Sarmelle\Auth;

/**
 * Fixed security constants from design section 2. These are code, not .env, so
 * they cannot be changed from the admin panel.
 */
final class Policy
{
    public const LOGIN_FAILURES_PER_IDENTIFIER = 5;
    public const LOGIN_WINDOW_MINUTES = 15;

    public const LOGIN_FAILURES_PER_IP = 20;
    public const IP_WINDOW_MINUTES = 60;

    public const OTP_REQUESTS_PER_HOUR = 3;
    public const PASSWORD_RESET_REQUESTS_PER_HOUR = 3;

    public const OTP_LENGTH = 6;
    public const OTP_LIFETIME_MINUTES = 10;
    public const PENDING_COOKIE_LIFETIME_MINUTES = 10;
    public const OTP_MAX_ATTEMPTS = 5;

    public const PASSWORD_MIN_LENGTH = 12;
    public const PASSWORD_BCRYPT_MAX_BYTES = 72;
    public const PASSWORD_ARGON2ID_MAX_CHARS = 128;

    /**
     * Defensive ceiling for hashing input. Larger bodies are rejected by the
     * request size limit long before this, but the validator must never feed a
     * multi-megabyte string to a hash function.
     */
    public const PASSWORD_INPUT_MAX_BYTES = 4096;

    /**
     * Resolves PASSWORD_ALGO=auto the same way the hash helper will.
     */
    public static function passwordAlgorithm(string $configured): string
    {
        if ($configured === 'bcrypt' || $configured === 'argon2id') {
            return $configured;
        }

        return defined('PASSWORD_ARGON2ID') ? 'argon2id' : 'bcrypt';
    }
}
