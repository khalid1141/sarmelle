<?php
declare(strict_types=1);

namespace Sarmelle\Mail;

use Sarmelle\Config\Config;

/**
 * Picks the transport from MAIL_TRANSPORT. Config validates the value at load,
 * so the default branch is only a defensive guard.
 */
final class MailerFactory
{
    public function create(Config $config): Mailer
    {
        return match ($config->string('MAIL_TRANSPORT')) {
            'log' => new LogTransport($config),
            'smtp' => new SmtpTransport($config),
            default => throw new MailException(MailException::UNSUPPORTED_TRANSPORT),
        };
    }
}
