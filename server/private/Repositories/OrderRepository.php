<?php
declare(strict_types=1);

namespace Sarmelle\Repositories;

use PDO;
use Sarmelle\Core\DatabaseException;

final class OrderRepository
{
    public function __construct(private readonly PDO $pdo)
    {
    }

    /**
     * @return array{orders: array<int, array<string, mixed>>, returns: array<int, array<string, mixed>>}
     */
    public function account(int $customerId): array
    {
        return [
            'orders' => $this->orders($customerId),
            'returns' => $this->returns($customerId),
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function orders(int $customerId): array
    {
        $statement = $this->pdo->prepare(
            'SELECT o.id, o.order_number, o.status, o.total_paise, o.tracking_id, o.courier_name, '
            . 'o.delivered_at, o.created_at, o.shipping_paise '
            . 'FROM orders o WHERE o.customer_id = ? ORDER BY o.created_at DESC'
        );
        try {
            $statement->execute([$customerId]);
            $rows = $statement->fetchAll(PDO::FETCH_ASSOC);
        } catch (\PDOException $exception) {
            throw DatabaseException::fromPdo($exception);
        }

        $orderIds = array_map(static fn (array $r): int => (int) $r['id'], $rows ?: []);
        $itemsByOrder = [];
        if ($orderIds !== []) {
            $placeholders = implode(',', array_fill(0, count($orderIds), '?'));
            $stmt = $this->pdo->prepare(
                "SELECT order_id, product_name, image_path, size_name, colour_name, price_paise, quantity "
                . "FROM order_items WHERE order_id IN ($placeholders) ORDER BY id"
            );
            $stmt->execute($orderIds);
            foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
                $itemsByOrder[(int) $row['order_id']][] = [
                    'name' => (string) $row['product_name'],
                    'image' => (string) ($row['image_path'] ?? ''),
                    'size' => (string) $row['size_name'],
                    'color' => (string) $row['colour_name'],
                    'price' => (int) $row['price_paise'] / 100,
                    'quantity' => (int) $row['quantity'],
                ];
            }
        }

        $result = [];
        foreach ($rows as $row) {
            $status = match ((string) $row['status']) {
                'shipped' => 'In Transit',
                'delivered' => 'Delivered',
                default => 'Confirmed',
            };
            $result[] = [
                'id' => (string) $row['id'],
                'orderNumber' => (string) $row['order_number'],
                'date' => date('d M Y', strtotime((string) $row['created_at'])),
                'totalAmount' => (int) $row['total_paise'] / 100,
                'status' => $status,
                'trackingNumber' => (string) ($row['tracking_id'] ?? ''),
                'carrier' => (string) ($row['courier_name'] ?? ''),
                'estimatedDelivery' => $status === 'In Transit' ? 'Estimated 2-3 Business Days' : '',
                'deliveredDate' => $row['delivered_at'] !== null
                    ? date('d M Y', strtotime((string) $row['delivered_at']))
                    : null,
                'canReturn' => (string) $row['status'] === 'delivered',
                'items' => $itemsByOrder[(int) $row['id']] ?? [],
            ];
        }

        return $result;
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function returns(int $customerId): array
    {
        $statement = $this->pdo->prepare(
            'SELECT rr.id, rr.type, rr.status, rr.reason, rr.requested_at, rr.refund_amount_paise, '
            . 'o.order_number, oi.product_name, oi.image_path, oi.size_name, oi.colour_name, oi.price_paise '
            . 'FROM return_requests rr '
            . 'JOIN orders o ON o.id = rr.order_id '
            . 'LEFT JOIN return_request_items rri ON rri.return_request_id = rr.id '
            . 'LEFT JOIN order_items oi ON oi.id = rri.order_item_id '
            . 'WHERE o.customer_id = ? ORDER BY rr.requested_at DESC'
        );
        try {
            $statement->execute([$customerId]);
            $rows = $statement->fetchAll(PDO::FETCH_ASSOC);
        } catch (\PDOException $exception) {
            throw DatabaseException::fromPdo($exception);
        }

        $result = [];
        foreach ($rows as $row) {
            $status = match ((string) $row['status']) {
                'received' => 'In Inspection',
                'completed', 'accepted' => 'Refund Processed',
                default => 'Initiated Return',
            };
            $type = (string) $row['type'] === 'exchange' ? 'Exchange' : 'Return';
            $result[] = [
                'id' => 'ret-' . $row['id'],
                'returnNumber' => 'RET-2026-' . str_pad((string) $row['id'], 4, '0', STR_PAD_LEFT),
                'orderNumber' => (string) $row['order_number'],
                'date' => date('d M Y', strtotime((string) $row['requested_at'])),
                'status' => $status,
                'type' => $type,
                'reason' => (string) $row['reason'],
                'refundAmount' => $row['refund_amount_paise'] !== null ? (int) $row['refund_amount_paise'] / 100 : null,
                'refundNote' => '',
                'item' => [
                    'name' => (string) ($row['product_name'] ?? ''),
                    'image' => (string) ($row['image_path'] ?? ''),
                    'size' => (string) ($row['size_name'] ?? ''),
                    'color' => (string) ($row['colour_name'] ?? ''),
                    'price' => (int) ($row['price_paise'] ?? 0) / 100,
                ],
            ];
        }

        return $result;
    }
}
