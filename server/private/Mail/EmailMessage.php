<?php
declare(strict_types=1);

namespace Sarmelle\Mail;

/**
 * One outbound plain-text message.
 *
 * The transport supplies the From address from configuration. The kind is a
 * short label such as "test", "admin-otp" or "password-reset"; it is used for
 * logging and for the local mail-log header, never for routing.
 */
final class EmailMessage
{
    public function __construct(
        private readonly string $to,
        private readonly string $subject,
        private readonly string $textBody,
        private readonly string $kind
    ) {
    }

    public function to(): string
    {
        return $this->to;
    }

    public function subject(): string
    {
        return $this->subject;
    }

    public function body(): string
    {
        return $this->textBody;
    }

    public function kind(): string
    {
        return $this->kind;
    }
}
