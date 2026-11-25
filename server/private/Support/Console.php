<?php
declare(strict_types=1);

namespace Sarmelle\Support;

/**
 * Terminal input for the CLI setup and recovery scripts.
 *
 * ask() reads a visible line. askHidden() suppresses echo where the platform
 * allows it: `stty -echo` on POSIX and a PowerShell Read-Host -AsSecureString
 * helper on Windows. If hidden input is unavailable, it warns on STDERR and
 * falls back to a visible line rather than hanging or failing the setup.
 *
 * Passwords are returned exactly as typed (only the line terminator is
 * removed) and are never logged or included in an exception.
 */
final class Console
{
    public static function ask(string $prompt): string
    {
        fwrite(STDOUT, $prompt);

        $line = fgets(STDIN);

        if ($line === false) {
            throw new \RuntimeException('No input was received.');
        }

        return rtrim($line, "\r\n");
    }

    public static function askHidden(string $prompt): string
    {
        if (!self::isInteractive()) {
            // A redirected pipe does not echo, so reading a line is safe and
            // also makes the scripts testable without a terminal.
            return self::ask($prompt);
        }

        if (PHP_OS_FAMILY === 'Windows') {
            $value = self::askHiddenWindows($prompt);

            if ($value !== null) {
                return $value;
            }
        } else {
            $value = self::askHiddenPosix($prompt);

            if ($value !== null) {
                return $value;
            }
        }

        fwrite(
            STDERR,
            'Warning: hidden input is unavailable here; the password will be visible as you type.'
                . PHP_EOL
        );

        return self::ask($prompt);
    }

    private static function isInteractive(): bool
    {
        return function_exists('stream_isatty') && @stream_isatty(STDIN);
    }

    private static function askHiddenPosix(string $prompt): ?string
    {
        $previous = @shell_exec('stty -g 2>/dev/null');

        if (!is_string($previous) || trim($previous) === '') {
            return null;
        }

        @shell_exec('stty -echo 2>/dev/null');
        fwrite(STDOUT, $prompt);

        try {
            $line = fgets(STDIN);
        } finally {
            @shell_exec('stty ' . escapeshellarg(trim($previous)) . ' 2>/dev/null');
            fwrite(STDOUT, PHP_EOL);
        }

        if ($line === false) {
            return null;
        }

        return rtrim($line, "\r\n");
    }

    private static function askHiddenWindows(string $prompt): ?string
    {
        $escapedPrompt = str_replace("'", "''", $prompt);
        $script = "\$ErrorActionPreference = 'Stop';"
            . '[Console]::OutputEncoding = [System.Text.Encoding]::UTF8;'
            . "\$secure = Read-Host -AsSecureString -Prompt '" . $escapedPrompt . "';"
            . '$bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure);'
            . 'try {'
            . '[Console]::Out.Write([Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr));'
            . '} finally {'
            . '[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr);'
            . '}';

        $descriptors = [
            0 => STDIN,
            1 => ['pipe', 'w'],
            2 => ['pipe', 'w'],
        ];

        $process = @proc_open(
            ['powershell.exe', '-NoProfile', '-NoLogo', '-Command', $script],
            $descriptors,
            $pipes
        );

        if (!is_resource($process)) {
            return null;
        }

        $stdout = stream_get_contents($pipes[1]);
        stream_get_contents($pipes[2]);
        fclose($pipes[1]);
        fclose($pipes[2]);
        $exitCode = proc_close($process);

        if ($exitCode !== 0 || !is_string($stdout)) {
            return null;
        }

        if (str_starts_with($stdout, "\xEF\xBB\xBF")) {
            $stdout = substr($stdout, 3);
        }

        return rtrim($stdout, "\r\n");
    }
}
