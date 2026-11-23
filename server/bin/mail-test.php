<?php
declare(strict_types=1);

/**
 * Sends one test message through the configured transport.
 *
 *   php server/bin/mail-test.php you@example.com
 *
 * CLI only. With MAIL_TRANSPORT=log it writes one file under MAIL_LOG_DIR and
 * sends nothing; with MAIL_TRANSPORT=smtp it uses PHPMailer.
 */

use Sarmelle\Config\Config;
use Sarmelle\Core\RequestId;
use Sarmelle\Mail\EmailMessage;
use Sarmelle\Mail\MailerFactory;
use Sarmelle\Mail\MailException;

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

require dirname(__DIR__) . '/private/bootstrap.php';

if ($argc !== 2 || trim((string) $argv[1]) === '') {
    fwrite(STDERR, 'Usage: php server/bin/mail-test.php you@example.com' . PHP_EOL);
    exit(2);
}

$requestId = RequestId::generate();
RequestId::set($requestId);

try {
    $config = Config::load(dirname(__DIR__) . '/private');
    $transport = $config->string('MAIL_TRANSPORT');
    $mailer = (new MailerFactory())->create($config);

    $mailer->send(new EmailMessage(
        trim((string) $argv[1]),
        'Sarmelle mail test',
        "This is a test message from the Sarmelle backend.\n"
            . "If you can read this, the configured mail transport works.\n",
        'test'
    ));

    echo 'mail: ok transport=' . $transport . ' request_id=' . $requestId . PHP_EOL;
} catch (MailException $exception) {
    fwrite(
        STDERR,
        'mail: failed category=' . $exception->category()
            . ' request_id=' . $requestId . PHP_EOL
    );
    exit(1);
} catch (\Throwable $exception) {
    fwrite(STDERR, 'mail: failed category=server_error request_id=' . $requestId . PHP_EOL);
    exit(1);
}
