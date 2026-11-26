<?php
declare(strict_types=1);

namespace Sarmelle\Repositories;

use PDO;
use Sarmelle\Core\DatabaseException;
use Sarmelle\Support\Normaliser;

final class Customers
{
    public function __construct(private readonly PDO $pdo)
    {
    }

    /**
     * @return array{id: int, name: string, email: string, phone: string, password_hash: string, is_active: int}|null
     */
    public function findByEmailOrPhone(string $identifier): ?array
    {
        $email = Normaliser::email($identifier);
        $phone = Normaliser::phone($identifier);

        if ($email === null && $phone === null) {
            return null;
        }

        $column = $email !== null ? 'email' : 'phone';
        $value = $email !== null ? $email : $phone;

        $statement = $this->pdo->prepare(
            "SELECT id, name, email, phone, password_hash, is_active FROM customers WHERE {$column} = ? LIMIT 1"
        );
        $statement->execute([$value]);
        $row = $statement->fetch();

        if (!is_array($row)) {
            return null;
        }

        return [
            'id' => (int) $row['id'],
            'name' => (string) $row['name'],
            'email' => (string) $row['email'],
            'phone' => (string) $row['phone'],
            'password_hash' => (string) $row['password_hash'],
            'is_active' => (int) $row['is_active'],
        ];
    }

    public function create(string $name, string $email, string $phone, string $passwordHash): int
    {
        $statement = $this->pdo->prepare(
            'INSERT INTO customers (name, email, phone, password_hash) VALUES (?, ?, ?, ?)'
        );
        $statement->execute([$name, $email, $phone, $passwordHash]);

        return (int) $this->pdo->lastInsertId();
    }

    /**
     * @return array{id: int, name: string, email: string, phone: string}|null
     */
    public function findById(int $id): ?array
    {
        $statement = $this->pdo->prepare('SELECT id, name, email, phone FROM customers WHERE id = ? LIMIT 1');
        $statement->execute([$id]);
        $row = $statement->fetch();

        if (!is_array($row)) {
            return null;
        }

        return [
            'id' => (int) $row['id'],
            'name' => (string) $row['name'],
            'email' => (string) $row['email'],
            'phone' => (string) $row['phone'],
        ];
    }
}