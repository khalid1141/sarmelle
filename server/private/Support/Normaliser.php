<?php
declare(strict_types=1);

namespace Sarmelle\Support;

/**
 * Normalisers from design section 6. Each returns null when the input is not
 * acceptable; they never throw on user input.
 */
final class Normaliser
{
    public static function email(string $value): ?string
    {
        $value = trim($value);

        if ($value === '' || strlen($value) > 254) {
            return null;
        }

        $value = mb_strtolower($value, 'UTF-8');

        return filter_var($value, FILTER_VALIDATE_EMAIL) === false ? null : $value;
    }

    /**
     * Reduces a phone number to "+" plus 10 to 13 digits.
     */
    public static function phone(string $value): ?string
    {
        $value = trim($value);
        $value = str_replace([" ", "\t", "\u{00A0}", '-', '(', ')', '.'], '', $value);

        if (str_starts_with($value, '00')) {
            $value = '+' . substr($value, 2);
        } elseif (!str_starts_with($value, '+')) {
            $value = '+' . $value;
        }

        return preg_match('/^\+[0-9]{10,13}$/', $value) === 1 ? $value : null;
    }

    public static function otp(string $value): ?string
    {
        $value = trim($value);

        return preg_match('/^[0-9]{6}$/', $value) === 1 ? $value : null;
    }

    public static function name(string $value): ?string
    {
        $value = trim($value);

        if (preg_match('/[\x00-\x08\x0A-\x1F\x7F]/u', $value) !== 0) {
            return null;
        }

        $value = preg_replace('/\s+/u', ' ', $value) ?? $value;
        $length = mb_strlen($value, 'UTF-8');

        return $length >= 1 && $length <= 150 ? $value : null;
    }
}
