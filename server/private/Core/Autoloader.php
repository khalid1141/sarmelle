<?php
declare(strict_types=1);

namespace Sarmelle\Core;

/**
 * Hand-written PSR-4 style autoloader: Sarmelle\ -> server/private/.
 * Kept dependency-free so slices 1 to 4 need no Composer.
 */
final class Autoloader
{
    private const PREFIX = 'Sarmelle\\';

    public static function register(string $privateRoot): void
    {
        $root = rtrim(str_replace('\\', '/', $privateRoot), '/');

        spl_autoload_register(static function (string $class) use ($root): void {
            if (!str_starts_with($class, self::PREFIX)) {
                return;
            }

            $relative = substr($class, strlen(self::PREFIX));
            $file = $root . '/' . str_replace('\\', '/', $relative) . '.php';

            if (is_file($file)) {
                require $file;
            }
        });
    }
}
