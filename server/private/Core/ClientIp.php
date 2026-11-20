<?php
declare(strict_types=1);

namespace Sarmelle\Core;

use Sarmelle\Config\Config;

/**
 * Resolves the visitor IP.
 *
 * Default: REMOTE_ADDR only. X-Forwarded-For is read only when the immediate
 * peer is listed in APP_TRUSTED_PROXIES, and then right to left until the first
 * address that is not itself a trusted proxy.
 */
final class ClientIp
{
    public static function resolve(string $remoteAddr, ?string $forwardedFor, string $trustedProxies): string
    {
        $remote = trim($remoteAddr);

        if (filter_var($remote, FILTER_VALIDATE_IP) === false) {
            return '';
        }

        $trusted = self::parseTrusted($trustedProxies);

        if ($trusted === [] || !in_array($remote, $trusted, true)) {
            return $remote;
        }

        $forwarded = $forwardedFor === null ? '' : trim($forwardedFor);

        if ($forwarded === '') {
            return $remote;
        }

        $parts = explode(',', $forwarded);

        for ($index = count($parts) - 1; $index >= 0; $index--) {
            $candidate = trim($parts[$index]);

            if (filter_var($candidate, FILTER_VALIDATE_IP) === false) {
                continue;
            }

            if (in_array($candidate, $trusted, true)) {
                continue;
            }

            return $candidate;
        }

        return $remote;
    }

    public static function forRequest(Request $request, Config $config): string
    {
        return self::resolve(
            $request->remoteAddr(),
            $request->header('x-forwarded-for'),
            $config->string('APP_TRUSTED_PROXIES')
        );
    }

    /**
     * @return array<int, string>
     */
    private static function parseTrusted(string $value): array
    {
        $entries = [];

        foreach (preg_split('/[\s,]+/', $value) ?: [] as $entry) {
            $entry = trim($entry);

            if ($entry !== '' && filter_var($entry, FILTER_VALIDATE_IP) !== false) {
                $entries[] = $entry;
            }
        }

        return $entries;
    }
}
