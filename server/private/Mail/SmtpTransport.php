<?php
declare(strict_types=1);

namespace Sarmelle\Mail;

use Sarmelle\Config\Config;
use Sarmelle\Core\RequestId;

/**
 * PHPMailer-backed SMTP transport.
 *
 * Composer is required only here: vendor/autoload.php is loaded lazily on the
 * first send, and only when the file exists. The log transport and every other
 * slice keep working without a vendor directory.
 *
 * Failures produce one MailException with a fixed message and one log line
 * containing only the message kind, a short category and the request ID. The
 * password, recipient and raw SMTP reply are never logged or thrown.
 */
final class SmtpTransport implements Mailer
{
    private static bool $autoloadAttempted = false;
    private static bool $available = false;

    public function __construct(private readonly Config $config)
    {
    }

    public function send(EmailMessage $message): void
    {
        try {
            Headers::assertEmail($message->to());
            Headers::assertNoNewlines($message->subject());

            $fromAddress = trim($this->config->string('MAIL_FROM_ADDRESS'));
            $fromName = trim($this->config->string('MAIL_FROM_NAME'));

            Headers::assertEmail($fromAddress);
            Headers::assertNoNewlines($fromName);

            $this->loadDependencies();
            $this->deliver($message, $fromAddress, $fromName);
        } catch (MailException $exception) {
            $this->logFailure($message->kind(), $exception->category());
            throw $exception;
        } catch (\Throwable $exception) {
            $this->logFailure($message->kind(), MailException::SMTP_FAILURE);
            throw new MailException(MailException::SMTP_FAILURE);
        }
    }

    private function loadDependencies(): void
    {
        if (!self::$autoloadAttempted) {
            self::$autoloadAttempted = true;
            $autoload = dirname(__DIR__) . '/vendor/autoload.php';

            if (is_file($autoload)) {
                require_once $autoload;
            }

            self::$available = class_exists(\PHPMailer\PHPMailer\PHPMailer::class);
        }

        if (!self::$available) {
            throw new MailException(MailException::DEPENDENCIES_MISSING);
        }
    }

    private function deliver(EmailMessage $message, string $fromAddress, string $fromName): void
    {
        $encryption = strtolower(trim($this->config->string('MAIL_ENCRYPTION')));

        $mailer = new \PHPMailer\PHPMailer\PHPMailer(true);
        $mailer->isSMTP();
        $mailer->SMTPDebug = \PHPMailer\PHPMailer\SMTP::DEBUG_OFF;
        $mailer->Host = $this->config->string('MAIL_HOST');
        $mailer->Port = $this->config->int('MAIL_PORT');
        $mailer->SMTPAuth = true;
        $mailer->Username = $this->config->string('MAIL_USERNAME');
        $mailer->Password = $this->config->string('MAIL_PASSWORD');
        $mailer->Timeout = $this->config->int('MAIL_TIMEOUT_SECONDS');
        $mailer->SMTPSecure = match ($encryption) {
            'ssl' => \PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_SMTPS,
            'tls' => \PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS,
            default => '',
        };
        $mailer->SMTPAutoTLS = $encryption !== 'none';
        $mailer->CharSet = 'UTF-8';
        $mailer->setFrom($fromAddress, $fromName);
        $mailer->addAddress($message->to());
        $mailer->Subject = $message->subject();
        $mailer->isHTML(false);
        $mailer->Body = $message->body();

        if (!$mailer->send()) {
            throw new MailException(MailException::SMTP_FAILURE);
        }
    }

    private function logFailure(string $kind, string $category): void
    {
        error_log(sprintf(
            '[sarmelle] %s mail_failed kind=%s category=%s',
            RequestId::current(),
            self::safeKind($kind),
            $category
        ));
    }

    private static function safeKind(string $kind): string
    {
        $kind = preg_replace('/[^A-Za-z0-9._-]/', '', $kind) ?? '';
        $kind = substr($kind, 0, 40);

        return $kind === '' ? 'unknown' : $kind;
    }
}
