<?php
declare(strict_types=1);

namespace Sarmelle\Auth;

use Sarmelle\Repositories\LoginAttempts;

/**
 * Window-based login throttling. Five failures lock an identifier for the
 * window; twenty failures block an IP for an hour. Successes are recorded but
 * never counted.
 */
final class Throttle
{
    public function __construct(private readonly LoginAttempts $attempts)
    {
    }

    public function isIdentifierLocked(string $accountType, string $identifier): bool
    {
        return $this->failuresForIdentifier($accountType, $identifier)
            >= Policy::LOGIN_FAILURES_PER_IDENTIFIER;
    }

    public function isIpBlocked(?string $ip): bool
    {
        if ($ip === null || trim($ip) === '') {
            return false;
        }

        return $this->attempts->countIpFailures($ip, Policy::IP_WINDOW_MINUTES)
            >= Policy::LOGIN_FAILURES_PER_IP;
    }

    /**
     * Returns the error code to send, or null when the attempt may proceed.
     */
    public function check(string $accountType, string $identifier, ?string $ip): ?string
    {
        if ($this->isIdentifierLocked($accountType, $identifier)) {
            return 'account_locked';
        }

        if ($this->isIpBlocked($ip)) {
            return 'ip_blocked';
        }

        return null;
    }

    private function failuresForIdentifier(string $accountType, string $identifier): int
    {
        return $this->attempts->countIdentifierFailures(
            $accountType,
            $identifier,
            Policy::LOGIN_WINDOW_MINUTES
        );
    }
}
