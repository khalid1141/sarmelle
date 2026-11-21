<?php
declare(strict_types=1);

/**
 * Private bootstrap. Loaded by the API entry points and by CLI scripts.
 * It must never be reachable over HTTP: server/private/ sits outside every web root.
 */

date_default_timezone_set('Asia/Kolkata');

ini_set('display_errors', '0');
ini_set('log_errors', '1');
error_reporting(E_ALL);

require __DIR__ . '/Core/Autoloader.php';

\Sarmelle\Core\Autoloader::register(__DIR__);

/**
 * Warnings become exceptions so a broken include or a failed write cannot be
 * half-ignored. Notices are logged and swallowed.
 */
set_error_handler(static function (int $severity, string $message, string $file, int $line): bool {
    if ((error_reporting() & $severity) === 0) {
        return false;
    }

    if (($severity & (E_WARNING | E_USER_WARNING | E_RECOVERABLE_ERROR)) !== 0) {
        throw new \ErrorException($message, 0, $severity, $file, $line);
    }

    error_log(sprintf(
        '[sarmelle] %s %s in %s:%d',
        \Sarmelle\Core\RequestId::current(),
        $message,
        $file,
        $line
    ));

    return true;
});

/**
 * Last-resort handler. Web responses stay generic and never contain a stack
 * trace, SQL text or a file path unless SARM_DEBUG is explicitly true.
 */
set_exception_handler(static function (\Throwable $exception): void {
    $debug = defined('SARM_DEBUG') && SARM_DEBUG === true;
    $requestId = \Sarmelle\Core\RequestId::current();

    error_log(sprintf(
        '[sarmelle] %s unhandled %s: %s in %s:%d',
        $requestId,
        $exception::class,
        $exception->getMessage(),
        $exception->getFile(),
        $exception->getLine()
    ));

    if (PHP_SAPI === 'cli') {
        fwrite(STDERR, 'Error: ' . ($debug ? (string) $exception : $exception->getMessage()) . PHP_EOL);
        exit(1);
    }

    if (!headers_sent()) {
        http_response_code(500);
        header('Content-Type: application/json; charset=utf-8');
        header('Cache-Control: no-store');
    }

    $payload = [
        'ok' => false,
        'error' => [
            'code' => 'server_error',
            'message' => 'Something went wrong.',
            'request_id' => $requestId,
        ],
    ];

    if ($debug) {
        $payload['error']['debug'] = [
            'type' => $exception::class,
            'message' => $exception->getMessage(),
            'file' => $exception->getFile(),
            'line' => $exception->getLine(),
            'trace' => $exception->getTraceAsString(),
        ];
    }

    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit(1);
});
