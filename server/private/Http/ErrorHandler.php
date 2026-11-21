<?php
declare(strict_types=1);

namespace Sarmelle\Http;

use Sarmelle\Core\DatabaseConnectionException;
use Sarmelle\Core\Response;

/**
 * Builds the JSON error envelope and writes exactly one private log line per
 * error. Response bodies never contain SQL, file paths or stack traces unless
 * APP_DEBUG=1.
 */
final class ErrorHandler
{
    private const STATUSES = [
        'validation_failed' => 422,
        'invalid_credentials' => 401,
        'otp_required' => 401,
        'otp_invalid' => 422,
        'otp_expired' => 410,
        'otp_locked' => 423,
        'account_locked' => 423,
        'ip_blocked' => 403,
        'unauthenticated' => 401,
        'session_expired' => 401,
        'csrf_failed' => 403,
        'forbidden' => 403,
        'not_found' => 404,
        'method_not_allowed' => 405,
        'payload_too_large' => 413,
        'rate_limited' => 429,
        'server_error' => 500,
    ];

    private const MESSAGES = [
        'validation_failed' => 'Check the highlighted fields.',
        'invalid_credentials' => 'Email or password is incorrect.',
        'otp_required' => 'Enter the code that was sent.',
        'otp_invalid' => 'That code is not valid.',
        'otp_expired' => 'That code has expired.',
        'otp_locked' => 'Too many attempts. Request a new code.',
        'account_locked' => 'Too many failed attempts. Try again later.',
        'ip_blocked' => 'Too many failed attempts. Try again later.',
        'unauthenticated' => 'Sign in required.',
        'session_expired' => 'Your session has expired. Sign in again.',
        'csrf_failed' => 'Request rejected.',
        'forbidden' => 'You do not have access to this resource.',
        'not_found' => 'Not found.',
        'method_not_allowed' => 'Method not allowed.',
        'payload_too_large' => 'Request body is too large.',
        'rate_limited' => 'Too many requests. Try again later.',
        'server_error' => 'Something went wrong.',
    ];

    /**
     * @param array<string, string> $fields
     */
    public static function validation(string $requestId, array $fields): Response
    {
        return self::error(
            $requestId,
            'validation_failed',
            $fields,
            'fields=' . implode(',', array_keys($fields))
        );
    }

    public static function notFound(string $requestId, string $path): Response
    {
        return self::error($requestId, 'not_found', [], 'path=' . $path);
    }

    /**
     * @param array<int, string> $allowed
     */
    public static function methodNotAllowed(string $requestId, array $allowed): Response
    {
        $allowed = array_values(array_unique(array_map('strtoupper', $allowed)));
        sort($allowed);

        return self::error($requestId, 'method_not_allowed', [], 'allow=' . implode(',', $allowed))
            ->withHeader('Allow', implode(', ', $allowed));
    }

    public static function payloadTooLarge(string $requestId): Response
    {
        return self::error($requestId, 'payload_too_large', [], 'body limit exceeded');
    }

    public static function csrf(string $requestId, ?string $origin): Response
    {
        return self::error($requestId, 'csrf_failed', [], 'origin=' . ($origin ?? '(none)'));
    }

    public static function serverError(string $requestId, \Throwable $exception, bool $debug): Response
    {
        $detail = $exception instanceof DatabaseConnectionException
            ? $exception::class . ': ' . $exception->getMessage()
                . ' sqlstate=' . $exception->sqlState()
            : $exception::class . ': ' . $exception->getMessage()
                . ' in ' . $exception->getFile() . ':' . $exception->getLine();

        self::log($requestId, 'server_error', $detail);

        $error = [
            'code' => 'server_error',
            'message' => self::MESSAGES['server_error'],
            'request_id' => $requestId,
        ];

        if ($debug) {
            $error['debug'] = [
                'type' => $exception::class,
                'message' => $exception->getMessage(),
                'file' => $exception->getFile(),
                'line' => $exception->getLine(),
                'trace' => $exception->getTraceAsString(),
            ];
        }

        return Response::raw(['ok' => false, 'error' => $error], 500);
    }

    /**
     * @param array<string, string> $fields
     */
    public static function error(
        string $requestId,
        string $code,
        array $fields = [],
        ?string $logDetail = null
    ): Response {
        $status = self::STATUSES[$code] ?? 500;
        $message = self::MESSAGES[$code] ?? self::MESSAGES['server_error'];

        self::log($requestId, $code, $logDetail ?? $message);

        $error = [
            'code' => $code,
            'message' => $message,
        ];

        if ($fields !== []) {
            $error['fields'] = $fields;
        }

        $error['request_id'] = $requestId;

        return Response::raw(['ok' => false, 'error' => $error], $status);
    }

    private static function log(string $requestId, string $code, string $detail): void
    {
        $detail = str_replace(["\r", "\n", "\0"], ' ', $detail);

        if (strlen($detail) > 2000) {
            $detail = substr($detail, 0, 2000) . '...';
        }

        error_log('[sarmelle] ' . $requestId . ' ' . $code . ' ' . $detail);
    }
}
