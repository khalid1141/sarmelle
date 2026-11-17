<?php
declare(strict_types=1);

namespace Sarmelle\Config;

/**
 * Hand-written .env parser. No dotenv package, no variable interpolation,
 * no export, no ${} expansion.
 *
 * Rules:
 * - "KEY=value", one per line; keys match [A-Za-z_][A-Za-z0-9_]*.
 * - A line whose first non-space character is "#" is a comment.
 * - A value may be wrapped in single or double quotes; the matching quote is
 *   found at the end, and a "#" after whitespace following that quote starts a
 *   comment. Inside quotes everything is literal, except \" and \\ (or \' and
 *   \\ in single quotes).
 * - Outside quotes, a "#" starts a comment only when it is preceded by
 *   whitespace; "pa#ss" stays "pa#ss".
 * - Unquoted values are trimmed; quoted values keep their spaces.
 */
final class Env
{
    /**
     * @return array<string, string>
     */
    public static function parse(string $contents): array
    {
        if (str_starts_with($contents, "\xEF\xBB\xBF")) {
            $contents = substr($contents, 3);
        }

        $lines = preg_split('/\r\n|\n|\r/', $contents);
        $values = [];

        foreach ($lines === false ? [] : $lines as $index => $line) {
            $lineNumber = $index + 1;
            $trimmed = ltrim($line, " \t");

            if ($trimmed === '' || $trimmed[0] === '#') {
                continue;
            }

            $equalsAt = strpos($line, '=');

            if ($equalsAt === false) {
                throw new \InvalidArgumentException(
                    sprintf('Invalid .env line %d: expected KEY=value.', $lineNumber)
                );
            }

            $key = trim(substr($line, 0, $equalsAt), " \t");

            if (preg_match('/^[A-Za-z_][A-Za-z0-9_]*$/', $key) !== 1) {
                throw new \InvalidArgumentException(
                    sprintf('Invalid .env line %d: bad key name.', $lineNumber)
                );
            }

            if (array_key_exists($key, $values)) {
                throw new \InvalidArgumentException(
                    sprintf('Invalid .env line %d: duplicate key %s.', $lineNumber, $key)
                );
            }

            $values[$key] = self::parseValue(substr($line, $equalsAt + 1), $lineNumber);
        }

        return $values;
    }

    private static function parseValue(string $raw, int $lineNumber): string
    {
        $hadLeadingSpace = $raw !== '' && ($raw[0] === ' ' || $raw[0] === "\t");
        $raw = ltrim($raw, " \t");

        if ($raw === '') {
            return '';
        }

        if ($raw[0] === '#') {
            return $hadLeadingSpace ? '' : $raw;
        }

        if ($raw[0] === '"' || $raw[0] === "'") {
            return self::parseQuoted($raw, $lineNumber);
        }

        $commentAt = self::findCommentStart($raw);

        if ($commentAt !== null) {
            $raw = substr($raw, 0, $commentAt);
        }

        return rtrim($raw, " \t");
    }

    private static function parseQuoted(string $raw, int $lineNumber): string
    {
        $quote = $raw[0];
        $length = strlen($raw);
        $value = '';

        for ($index = 1; $index < $length; $index++) {
            $char = $raw[$index];

            if ($char === '\\' && $index + 1 < $length) {
                $next = $raw[$index + 1];

                if ($next === $quote || $next === '\\') {
                    $value .= $next;
                    $index++;
                    continue;
                }
            }

            if ($char === $quote) {
                $rest = trim(substr($raw, $index + 1), " \t");

                if ($rest !== '' && $rest[0] !== '#') {
                    throw new \InvalidArgumentException(
                        sprintf('Invalid .env line %d: unexpected text after the closing quote.', $lineNumber)
                    );
                }

                return $value;
            }

            $value .= $char;
        }

        throw new \InvalidArgumentException(
            sprintf('Invalid .env line %d: unterminated quoted value.', $lineNumber)
        );
    }

    private static function findCommentStart(string $raw): ?int
    {
        $length = strlen($raw);

        for ($index = 1; $index < $length; $index++) {
            if ($raw[$index] === '#' && ($raw[$index - 1] === ' ' || $raw[$index - 1] === "\t")) {
                return $index;
            }
        }

        return null;
    }
}
