<?php
declare(strict_types=1);

namespace Sarmelle\Mail;

/**
 * The only mailer contract. Both the local log transport and the SMTP
 * transport implement it, so callers never know which one is configured.
 */
interface Mailer
{
    public function send(EmailMessage $message): void;
}
