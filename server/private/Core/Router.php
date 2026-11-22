<?php
declare(strict_types=1);

namespace Sarmelle\Core;

use Sarmelle\Config\Config;
use Sarmelle\Http\ErrorHandler;
use Sarmelle\Support\ValidationException;

/**
 * Single front controller router: explicit method + path table.
 *
 * 404 for an unknown path, 405 + Allow for a known path with a wrong method.
 * Unsafe methods must be JSON and must carry a same-origin Origin header when
 * one is present.
 */
final class Router
{
    /** @var array<string, array<string, callable>> */
    private array $routes = [];

    private readonly string $origin;
    private readonly bool $local;
    private readonly int $maxBytes;
    private readonly bool $debug;

    public function __construct(Config $config, string $origin)
    {
        $this->origin = rtrim($origin, '/');
        $this->local = $config->isLocal();
        $this->maxBytes = $config->int('MAX_JSON_BYTES');
        $this->debug = $config->debug();
    }

    public function add(string $method, string $path, callable $handler): void
    {
        $method = strtoupper($method);
        $path = $path === '' ? '/' : rtrim($path, '/');

        if ($path === '' || $path[0] !== '/') {
            throw new \InvalidArgumentException('Route paths must start with a forward slash.');
        }

        if (isset($this->routes[$path][$method])) {
            throw new \InvalidArgumentException('Duplicate route: ' . $method . ' ' . $path);
        }

        $this->routes[$path][$method] = $handler;
    }

    public function dispatch(Request $request): Response
    {
        $requestId = $request->requestId();

        if (strlen($request->body()) > $this->maxBytes) {
            return $this->finish(ErrorHandler::payloadTooLarge($requestId), $requestId);
        }

        $methods = $this->routes[$request->path()] ?? null;

        if ($methods === null) {
            return $this->finish(ErrorHandler::notFound($requestId, $request->path()), $requestId);
        }

        $method = $request->method();

        if (!isset($methods[$method])) {
            return $this->finish(
                ErrorHandler::methodNotAllowed($requestId, array_keys($methods)),
                $requestId
            );
        }

        try {
            if ($request->isUnsafe()) {
                $rejection = $this->checkUnsafe($request);

                if ($rejection !== null) {
                    return $this->finish($rejection, $requestId);
                }
            }

            $response = ($methods[$method])($request);

            if (!$response instanceof Response) {
                throw new \RuntimeException('Route handler did not return a Response.');
            }

            return $this->finish($response, $requestId);
        } catch (ValidationException $exception) {
            return $this->finish(
                ErrorHandler::validation($requestId, $exception->fields()),
                $requestId
            );
        } catch (\Throwable $exception) {
            return $this->finish(
                ErrorHandler::serverError($requestId, $exception, $this->debug),
                $requestId
            );
        }
    }

    private function checkUnsafe(Request $request): ?Response
    {
        if ($request->contentType() !== 'application/json') {
            return ErrorHandler::validation($request->requestId(), [
                'body' => 'Send the request as application/json.',
            ]);
        }

        $origin = $request->header('origin');

        if ($origin !== null && $origin !== '' && !$this->originAllowed($origin)) {
            return ErrorHandler::csrf($request->requestId(), $origin);
        }

        try {
            $request->json();
        } catch (\InvalidArgumentException $exception) {
            return ErrorHandler::validation($request->requestId(), [
                'body' => $exception->getMessage(),
            ]);
        }

        return null;
    }

    private function originAllowed(string $origin): bool
    {
        $allowed = [$this->origin];

        if ($this->local) {
            $allowed = array_merge($allowed, [
                'http://localhost:3000',
                'http://localhost:3001',
                'http://localhost:8080',
                'http://localhost:8081',
            ]);
        }

        return in_array(rtrim($origin, '/'), array_values(array_unique($allowed)), true);
    }

    private function finish(Response $response, string $requestId): Response
    {
        return $response->withHeader('X-Request-Id', $requestId);
    }
}
