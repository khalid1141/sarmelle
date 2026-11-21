<?php
declare(strict_types=1);

namespace Sarmelle\Core;

use PDO;
use Sarmelle\Config\Config;

/**
 * One PDO per request/CLI run, never persistent (design section 3).
 *
 * Every connection immediately pins the session time zone to IST and the
 * character set to utf8mb4, so a TIMESTAMP column cannot be written 5 hours
 * 30 minutes off by a path that forgot to configure itself.
 */
final class Connection
{
    private const CONNECT_TIMEOUT_SECONDS = 5;
    private const MAX_CLOCK_SKEW_SECONDS = 2;

    /**
     * Every session runs in strict mode. Without it MySQL silently truncates
     * oversized values and turns invalid dates into zero dates instead of
     * failing the statement.
     */
    public const REQUIRED_SQL_MODE = 'STRICT_ALL_TABLES,NO_ZERO_DATE,NO_ZERO_IN_DATE,'
        . 'ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

    public static function open(Config $config): PDO
    {
        $dsn = sprintf(
            'mysql:host=%s;port=%d;dbname=%s;charset=%s',
            $config->string('DB_HOST'),
            $config->int('DB_PORT'),
            $config->string('DB_NAME'),
            $config->string('DB_CHARSET')
        );

        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_EMULATE_PREPARES => false,
            PDO::ATTR_STRINGIFY_FETCHES => false,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_PERSISTENT => false,
            PDO::ATTR_TIMEOUT => self::CONNECT_TIMEOUT_SECONDS,
        ];

        // DB_SSL is "only if the host requires TLS": no CA path, no TLS request.
        if ($config->bool('DB_SSL')) {
            $caPath = $config->string('DB_SSL_CA');

            if ($caPath !== '') {
                $options[self::sslCaAttribute()] = $caPath;
            }
        }

        try {
            $pdo = new PDO(
                $dsn,
                $config->string('DB_USER'),
                $config->string('DB_PASSWORD'),
                $options
            );
        } catch (\PDOException $exception) {
            // Only the SQLSTATE goes to the log; the message can name the host
            // and user, and the exception itself is not chained to the response.
            $code = preg_replace('/[^A-Za-z0-9]/', '', (string) $exception->getCode()) ?? '';

            error_log(
                '[sarmelle] database connection failed, code ' . ($code === '' ? 'unknown' : $code)
            );

            throw new \RuntimeException('Database connection failed.');
        }

        // Constants from Config are validated, and no user input is involved.
        $pdo->exec("SET time_zone = '" . Config::TIMEZONE_OFFSET . "'");
        $pdo->exec('SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci');
        $pdo->exec("SET SESSION sql_mode = '" . self::REQUIRED_SQL_MODE . "'");

        return $pdo;
    }

    /**
     * PHP 8.4 moved the MySQL attributes to Pdo\Mysql; 8.2 and 8.3 only have
     * the PDO::MYSQL_* constants. Referencing the class with ::class does not
     * autoload it, so this stays safe on old versions.
     */
    private static function sslCaAttribute(): int
    {
        if (class_exists(\Pdo\Mysql::class)) {
            return \Pdo\Mysql::ATTR_SSL_CA;
        }

        return PDO::MYSQL_ATTR_SSL_CA;
    }

    /**
     * Detailed checks for server/bin/health.php and the local-only `/api/health`
     * detail. Throws on the first mismatch; callers decide how to report it.
     *
     * @return array<string, string|int>
     */
    public static function diagnostics(PDO $pdo): array
    {
        $charset = $pdo->query(
            'SELECT @@character_set_client AS cs_client,'
            . ' @@character_set_results AS cs_results,'
            . ' @@character_set_connection AS cs_connection,'
            . ' @@collation_connection AS cs_collation'
        )->fetch();

        if (!is_array($charset)) {
            throw new \RuntimeException('Could not read the connection charset.');
        }

        foreach (['cs_client', 'cs_results', 'cs_connection'] as $key) {
            if ((string) $charset[$key] !== 'utf8mb4') {
                throw new \RuntimeException('Connection charset is not utf8mb4.');
            }
        }

        if ((string) $charset['cs_collation'] !== 'utf8mb4_unicode_ci') {
            throw new \RuntimeException('Connection collation is not utf8mb4_unicode_ci.');
        }

        $sqlMode = (string) $pdo->query('SELECT @@session.sql_mode')->fetchColumn();
        $activeModes = [];

        foreach (explode(',', $sqlMode) as $mode) {
            $mode = strtoupper(trim($mode));

            if ($mode !== '') {
                $activeModes[] = $mode;
            }
        }

        $missingModes = [];

        foreach (explode(',', self::REQUIRED_SQL_MODE) as $requiredMode) {
            if (!in_array($requiredMode, $activeModes, true)) {
                $missingModes[] = $requiredMode;
            }
        }

        if ($missingModes !== []) {
            throw new \RuntimeException(
                'Session sql_mode is missing: ' . implode(', ', $missingModes) . '.'
            );
        }

        $sessionTimeZone = (string) $pdo->query('SELECT @@session.time_zone')->fetchColumn();

        if ($sessionTimeZone !== Config::TIMEZONE_OFFSET) {
            throw new \RuntimeException(
                'Session time zone is not ' . Config::TIMEZONE_OFFSET . '.'
            );
        }

        $dbNow = (string) $pdo->query('SELECT NOW()')->fetchColumn();
        $phpNow = Clock::now();
        $skew = abs(Clock::fromMysql($dbNow)->getTimestamp() - $phpNow->getTimestamp());

        if ($skew >= self::MAX_CLOCK_SKEW_SECONDS) {
            throw new \RuntimeException(
                'Database clock differs from the PHP clock by ' . $skew . ' seconds.'
            );
        }

        $tables = (int) $pdo->query(
            "SELECT COUNT(*) FROM information_schema.tables"
            . " WHERE table_schema = DATABASE() AND table_type = 'BASE TABLE'"
        )->fetchColumn();

        return [
            'charset' => 'utf8mb4',
            'collation' => 'utf8mb4_unicode_ci',
            'sql_mode' => $sqlMode,
            'session_time_zone' => $sessionTimeZone,
            'php_now' => $phpNow->format('Y-m-d H:i:s'),
            'db_now' => $dbNow,
            'clock_skew_seconds' => $skew,
            'tables' => $tables,
        ];
    }
}
