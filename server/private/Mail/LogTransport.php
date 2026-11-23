<?php
declare(strict_types=1);

namespace Sarmelle\Mail;

use Sarmelle\Config\Config;
use Sarmelle\Core\Clock;
use Sarmelle\Core\RequestId;

/**
 * Local-development transport. Writes one .eml-style file per message into
 * Config::path('MAIL_LOG_DIR') and sends nothing.
 *
 * Uses only core PHP, so it works with no vendor directory. File names are
 * random and files are opened with exclusive create, so a message can never
 * overwrite another one. The variable content (OTP codes) makes the directory
 * private: it is created 0700 and files are 0600.
 */
final class LogTransport implements Mailer
{
    private readonly string $directory;
    private readonly string $fromAddress;
    private readonly string $fromName;

    public function __construct(Config $config)
    {
        $this->directory = $config->path('MAIL_LOG_DIR');

        $address = trim($config->string('MAIL_FROM_ADDRESS'));
        $this->fromAddress = $address === '' ? 'no-reply@example.com' : $address;

        $name = trim($config->string('MAIL_FROM_NAME'));
        $this->fromName = $name === '' ? 'Sarmelle' : $name;
    }

    public function send(EmailMessage $message): void
    {
        try {
            Headers::assertEmail($message->to());
            Headers::assertNoNewlines($message->subject());
            Headers::assertEmail($this->fromAddress);
            Headers::assertNoNewlines($this->fromName);

            $this->write($message);
        } catch (MailException $exception) {
            $this->logFailure($message->kind(), $exception->category());
            throw $exception;
        } catch (\Throwable $exception) {
            $this->logFailure($message->kind(), MailException::LOG_WRITE_FAILED);
            throw new MailException(MailException::LOG_WRITE_FAILED);
        }
    }

    private function write(EmailMessage $message): void
    {
        if (!is_dir($this->directory)) {
            if (!@mkdir($this->directory, 0700, true) && !is_dir($this->directory)) {
                throw new MailException(MailException::LOG_WRITE_FAILED);
            }

            @chmod($this->directory, 0700);
        }

        $path = '';
        $handle = false;

        for ($attempt = 0; $attempt < 5; $attempt++) {
            $path = $this->directory
                . '/mail_' . Clock::now()->format('Ymd_His') . '_' . bin2hex(random_bytes(8)) . '.eml';
            $handle = @fopen($path, 'x');

            if ($handle !== false) {
                break;
            }
        }

        if ($handle === false) {
            throw new MailException(MailException::LOG_WRITE_FAILED);
        }

        $contents = $this->render($message);

        try {
            $written = @fwrite($handle, $contents);
        } finally {
            fclose($handle);
        }

        if ($written === false || $written !== strlen($contents)) {
            @unlink($path);

            throw new MailException(MailException::LOG_WRITE_FAILED);
        }

        @chmod($path, 0600);
    }

    private function render(EmailMessage $message): string
    {
        $from = $this->fromName === ''
            ? $this->fromAddress
            : $this->fromName . ' <' . $this->fromAddress . '>';
        $body = $message->body();

        return 'Date: ' . Clock::now()->format('D, d M Y H:i:s O') . "\n"
            . 'From: ' . $from . "\n"
            . 'To: ' . $message->to() . "\n"
            . 'Subject: ' . $message->subject() . "\n"
            . 'X-Sarmelle-Kind: ' . self::safeKind($message->kind()) . "\n"
            . "MIME-Version: 1.0\n"
            . "Content-Type: text/plain; charset=UTF-8\n"
            . "Content-Transfer-Encoding: 8bit\n"
            . "\n"
            . $body
            . (str_ends_with($body, "\n") ? '' : "\n");
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
