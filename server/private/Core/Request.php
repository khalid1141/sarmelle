<?php
declare(strict_types=1);

namespace Sarmelle\Core;

/**
 * One immutable request value. Construct it directly in tests; fromGlobals()
 * is the web entry point.
 */
final class Request
{
    private readonly string $method;
    private readonly string $path;
    private readonly string $body;
    private readonly string $remoteAddr;
    private readonly string $requestId;

    /** @var array<string, string> */
    private readonly array $headers;

    /** @var array<string, mixed>|null */
    private ?array $json = null;

    /**
     * @param array<string, string> $headers
     */
    public function __construct(
        string $method,
        string $path,
        array $headers = [],
        string $body = '',
        string $remoteAddr = '',
        ?string $requestId = null
    ) {
        $normalisedHeaders = [];

        foreach ($headers as $name => $value) {
            $normalisedHeaders[strtolower((string) $name)] = trim((string) $value);
        }

        $path = $path === '' ? '/' : $path;

        if ($path !== '/') {
            $path = rtrim($path, '/');
        }

        $this->method = strtoupper($method);
        $this->path = $path === '' ? '/' : $path;
        $this->headers = $normalisedHeaders;
        $this->body = $body;
        $this->remoteAddr = $remoteAddr;
        $this->requestId = $requestId ?? self::newRequestId();
    }

    public static function fromGlobals(int $maxBytes = 0, ?string $requestId = null): self
    {
        $method = (string) ($_SERVER['REQUEST_METHOD'] ?? 'GET');
        $uri = (string) ($_SERVER['REQUEST_URI'] ?? '/');
        $rawPath = parse_url($uri, PHP_URL_PATH);
        $path = is_string($rawPath) && $rawPath !== '' ? $rawPath : '/';

        $headers = [];

        foreach ($_SERVER as $key => $value) {
            if (!is_string($key) || !is_string($value) || !str_starts_with($key, 'HTTP_')) {
                continue;
            }

            $headers[str_replace('_', '-', strtolower(substr($key, 5)))] = $value;
        }

        foreach (['CONTENT_TYPE', 'CONTENT_LENGTH'] as $serverKey) {
            if (isset($_SERVER[$serverKey]) && is_string($_SERVER[$serverKey])) {
                $headers[strtolower(str_replace('_', '-', $serverKey))] = $_SERVER[$serverKey];
            }
        }

        $length = $maxBytes > 0 ? $maxBytes + 1 : null;
        $body = file_get_contents('php://input', false, null, 0, $length);

        return new self(
            $method,
            $path,
            $headers,
            is_string($body) ? $body : '',
            (string) ($_SERVER['REMOTE_ADDR'] ?? ''),
            $requestId
        );
    }

    public static function newRequestId(): string
    {
        return 'req_' . bin2hex(random_bytes(8));
    }

    public function method(): string
    {
        return $this->method;
    }

    public function path(): string
    {
        return $this->path;
    }

    public function header(string $name): ?string
    {
        return $this->headers[strtolower($name)] ?? null;
    }

    public function body(): string
    {
        return $this->body;
    }

    public function remoteAddr(): string
    {
        return $this->remoteAddr;
    }

    public function requestId(): string
    {
        return $this->requestId;
    }

    public function contentType(): ?string
    {
        $value = $this->header('content-type');

        if ($value === null) {
            return null;
        }

        $mediaType = trim(explode(';', $value, 2)[0]);

        return strtolower($mediaType);
    }

    public function isUnsafe(): bool
    {
        return !in_array($this->method, ['GET', 'HEAD', 'OPTIONS'], true);
    }

    /**
     * @return array<string, mixed>
     */
    public function json(): array
    {
        if ($this->json === null) {
            $this->json = Json::decodeObject($this->body);
        }

        return $this->json;
    }
}
