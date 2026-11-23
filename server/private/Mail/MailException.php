<?php
declare(strict_types=1);

namespace Sarmelle\Mail;

/**
 * A sanitised mail failure.
 *
 * The message is one of a small fixed set. It never contains the recipient,
 * SMTP credentials or the raw server reply; callers log the category instead.
 */
final class MailException extends \RuntimeException
{
    public const INVALID_MESSAGE = 'invalid_message';
    public const DEPENDENCIES_MISSING = 'dependencies_missing';
    public const SMTP_FAILURE = 'smtp_failure';
    public const LOG_WRITE_FAILED = 'log_write_failed';
    public const UNSUPPORTED_TRANSPORT = 'unsupported_transport';

    private const MESSAGES = [
        self::INVALID_MESSAGE => 'Mail message rejected.',
        self::DEPENDENCIES_MISSING => 'Composer dependencies are missing. Run composer install in server/private.',
        self::SMTP_FAILURE => 'Mail delivery failed.',
        self::LOG_WRITE_FAILED => 'Mail log could not be written.',
        self::UNSUPPORTED_TRANSPORT => 'Mail transport is not supported.',
    ];

    public function __construct(private readonly string $category)
    {
        parent::__construct(self::MESSAGES[$category] ?? 'Mail delivery failed.');
    }

    public function category(): string
    {
        return $this->category;
    }
}
