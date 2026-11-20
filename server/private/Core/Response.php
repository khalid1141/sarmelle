<?php
declare(strict_types=1);

namespace Sarmelle\Core;

/**
 * Immutable API response. Handlers return one of these; nothing echoes directly.
 */
final class Response
{
    /**
     * @param array<string, string> $headers
     */
    private function __construct(
        private readonly int $status,
        private readonly array $headers,
        private readonly string $body
    ) {
    }

    public static function success(mixed $data = [], int $status = 200): self
    {
        return self::fromPayload($status, [
            'ok' => true,
            'data' => $data === [] ? new \stdClass() : $data,
        ]);
    }

    /**
     * Used by /api/health, whose public body is exactly {"ok":true}.
     *
     * @param array<string, mixed> $payload
     */
    public static function raw(array $payload, int $status = 200): self
    {
        return self::fromPayload($status, $payload);
    }

    public function withHeader(string $name, string $value): self
    {
        $headers = $this->headers;

        foreach (array_keys($headers) as $existing) {
            if (strcasecmp($existing, $name) === 0) {
                unset($headers[$existing]);
            }
        }

        $headers[$name] = $value;

        return new self($this->status, $headers, $this->body);
    }

    public function status(): int
    {
        return $this->status;
    }

    /**
     * @return array<string, string>
     */
    public function headers(): array
    {
        return $this->headers;
    }

    public function header(string $name): ?string
    {
        foreach ($this->headers as $key => $value) {
            if (strcasecmp($key, $name) === 0) {
                return $value;
            }
        }

        return null;
    }

    public function body(): string
    {
        return $this->body;
    }

    /**
     * @return array<string, mixed>
     */
    public function decoded(): array
    {
        $decoded = json_decode($this->body, true);

        return is_array($decoded) ? $decoded : [];
    }

    public function send(): void
    {
        if (!headers_sent()) {
            http_response_code($this->status);

            foreach ($this->headers as $name => $value) {
                header($name . ': ' . $value, true);
            }
        }

        echo $this->body;
    }

    /**
     * @param array<string, mixed> $payload
     */
    private static function fromPayload(int $status, array $payload): self
    {
        return new self(
            $status,
            ['Content-Type' => 'application/json; charset=utf-8'],
            Json::encode($payload)
        );
    }
}
