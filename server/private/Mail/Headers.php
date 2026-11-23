<?php
declare(strict_types=1);

namespace Sarmelle\Mail;

/**
 * Header-safety checks shared by both transports.
 *
 * A CR or LF anywhere in a recipient, subject or From value would let the value
 * start a new header (header injection), so it is refused with a generic
 * exception. The recipient must also be a syntactically valid address.
 */
final class Headers
{
    public static function assertNoNewlines(string $value): void
    {
        if (preg_match('/[\r\n\0]/', $value) === 1) {
            throw new MailException(MailException::INVALID_MESSAGE);
        }
    }

    public static function assertEmail(string $value): void
    {
        self::assertNoNewlines($value);

        if ($value === '' || filter_var($value, FILTER_VALIDATE_EMAIL) === false) {
            throw new MailException(MailException::INVALID_MESSAGE);
        }
    }
}
