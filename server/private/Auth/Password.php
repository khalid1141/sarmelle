<?php
declare(strict_types=1);

namespace Sarmelle\Auth;

/**
 * Password hashing for the CLI setup/recovery scripts (and, in later slices,
 * the login and change-password endpoints).
 *
 * Policy (design section 6, constants in Policy): at least 12 characters;
 * Argon2id when this PHP build supports it, otherwise bcrypt with a hard
 * 72-byte cap. A longer bcrypt password is rejected, never truncated.
 *
 * A password is never logged, stored, accepted as a command-line argument or
 * placed in an exception message; every failure uses a fixed message.
 */
final class Password
{
    /** Argon2id defaults are stable in PHP, so rehash checks use the same options. */
    private const ARGON2ID_OPTIONS = [];

    public static function hash(string $password, string $algorithm = 'auto', int $bcryptCost = 12): string
    {
        $algorithm = self::resolveAlgorithm($algorithm);
        self::assertAcceptable($password, $algorithm);
        self::assertBcryptCost($bcryptCost);

        $options = $algorithm === 'bcrypt' ? ['cost' => $bcryptCost] : self::ARGON2ID_OPTIONS;
        $phpAlgorithm = $algorithm === 'bcrypt'
            ? PASSWORD_BCRYPT
            : self::argon2idConstant();

        try {
            $hash = password_hash($password, $phpAlgorithm, $options);
        } catch (\Throwable $exception) {
            // No previous exception: a driver message must never carry input.
            throw new \RuntimeException('Password could not be hashed.');
        }

        if (!is_string($hash) || $hash === '') {
            throw new \RuntimeException('Password could not be hashed.');
        }

        return $hash;
    }

    public static function verify(string $password, string $hash): bool
    {
        if ($hash === '' || str_contains($hash, "\0")) {
            return false;
        }

        try {
            return password_verify($password, $hash) === true;
        } catch (\Throwable $exception) {
            return false;
        }
    }

    /**
     * True when the stored hash does not match the configured algorithm/cost,
     * or when the hash is not a recognised PHP password hash.
     */
    public static function needsRehash(string $hash, string $algorithm = 'auto', int $bcryptCost = 12): bool
    {
        $algorithm = self::resolveAlgorithm($algorithm);
        self::assertBcryptCost($bcryptCost);

        $info = password_get_info($hash);
        $current = is_array($info) && isset($info['algoName']) && is_string($info['algoName'])
            ? $info['algoName']
            : '';

        if ($current !== $algorithm) {
            return true;
        }

        $options = $algorithm === 'bcrypt' ? ['cost' => $bcryptCost] : self::ARGON2ID_OPTIONS;

        try {
            return password_needs_rehash($hash, $algorithm === 'bcrypt'
                ? PASSWORD_BCRYPT
                : self::argon2idConstant(), $options) === true;
        } catch (\Throwable $exception) {
            return true;
        }
    }

    /**
     * Returns the policy message, or null when the password is acceptable.
     * The message never includes the submitted value.
     */
    public static function error(string $password, string $algorithm = 'auto'): ?string
    {
        $algorithm = self::resolveAlgorithm($algorithm);

        if (strlen($password) > Policy::PASSWORD_INPUT_MAX_BYTES) {
            return 'Password is too long.';
        }

        if (!mb_check_encoding($password, 'UTF-8')) {
            return 'Password must be valid text.';
        }

        $characters = mb_strlen($password, 'UTF-8');

        if ($characters < Policy::PASSWORD_MIN_LENGTH) {
            return 'Password must be at least ' . Policy::PASSWORD_MIN_LENGTH . ' characters.';
        }

        if ($algorithm === 'bcrypt') {
            if (strlen($password) > Policy::PASSWORD_BCRYPT_MAX_BYTES) {
                return 'Password is too long for bcrypt ('
                    . Policy::PASSWORD_BCRYPT_MAX_BYTES . ' bytes maximum).';
            }

            return null;
        }

        if ($characters > Policy::PASSWORD_ARGON2ID_MAX_CHARS) {
            return 'Password is too long ('
                . Policy::PASSWORD_ARGON2ID_MAX_CHARS . ' characters maximum).';
        }

        return null;
    }

    /**
     * @throws \InvalidArgumentException with a fixed, value-free message
     */
    public static function assertAcceptable(string $password, string $algorithm = 'auto'): void
    {
        $message = self::error($password, $algorithm);

        if ($message !== null) {
            throw new \InvalidArgumentException($message);
        }
    }

    /**
     * The PHP password_get_info() name for a stored hash, or null.
     */
    public static function algorithmOf(string $hash): ?string
    {
        $info = password_get_info($hash);

        if (!is_array($info) || !isset($info['algoName']) || !is_string($info['algoName'])) {
            return null;
        }

        return $info['algoName'] === 'unknown' ? null : $info['algoName'];
    }

    private static function resolveAlgorithm(string $algorithm): string
    {
        return Policy::passwordAlgorithm($algorithm);
    }

    private static function assertBcryptCost(int $cost): void
    {
        if ($cost < 4 || $cost > 31) {
            throw new \InvalidArgumentException('Password hashing cost is out of range.');
        }
    }

    private static function argon2idConstant(): string|int
    {
        if (!defined('PASSWORD_ARGON2ID')) {
            throw new \RuntimeException('Argon2id is not available on this PHP build.');
        }

        return constant('PASSWORD_ARGON2ID');
    }
}
