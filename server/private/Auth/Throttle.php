<?php
declare(strict_types=1);

namespace Sarmelle\Auth;

use Sarmelle\Repositories\LoginAttempts;

/**
 * Rolling-window login throttling. Five failures inside the 15-minute window
 * lock an identifier until the count drops below five; twenty failures inside
 * the one-hour window block an IP. Successes are recorded but never counted.
 *
 * This is a rolling window, not a fixed lock: the block can end as soon as the
 * oldest failure ages out of the window.
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
