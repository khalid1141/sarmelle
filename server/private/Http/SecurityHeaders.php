<?php
declare(strict_types=1);

namespace Sarmelle\Http;

use Sarmelle\Core\Response;

/**
 * Security headers for every API response. No CORS headers exist anywhere.
 */
final class SecurityHeaders
{
    public function __construct(private readonly bool $admin = false)
    {
    }

    public function apply(Response $response): Response
    {
        $response = $response
            ->withHeader('Cache-Control', 'no-store')
            ->withHeader('X-Content-Type-Options', 'nosniff')
            ->withHeader('Referrer-Policy', 'no-referrer');

        if ($this->admin) {
            $response = $response->withHeader('X-Frame-Options', 'DENY');
        }

        return $response;
    }
}
