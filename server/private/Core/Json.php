<?php
declare(strict_types=1);

namespace Sarmelle\Core;

/**
 * JSON encode/decode helpers. JSON_THROW_ON_ERROR keeps a bad payload from
 * turning into a silent null.
 */
final class Json
{
    public static function encode(mixed $value): string
    {
        return json_encode(
            $value,
            JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR
        );
    }

    /**
     * Decodes a request body that must be a JSON object.
     *
     * @return array<string, mixed>
     */
    public static function decodeObject(string $body): array
    {
        $body = trim($body);

        if ($body === '' || $body === '{}') {
            return [];
        }

        if ($body[0] !== '{') {
            throw new \InvalidArgumentException('The request body must be a JSON object.');
        }

        try {
            $decoded = json_decode($body, true, 32, JSON_THROW_ON_ERROR);
        } catch (\JsonException $exception) {
            throw new \InvalidArgumentException('Malformed JSON body.', 0, $exception);
        }

        if (!is_array($decoded)) {
            throw new \InvalidArgumentException('The request body must be a JSON object.');
        }

        return $decoded;
    }
}
