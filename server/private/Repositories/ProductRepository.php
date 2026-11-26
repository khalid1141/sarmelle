<?php
declare(strict_types=1);

namespace Sarmelle\Repositories;

use PDO;
use Sarmelle\Core\DatabaseException;

final class ProductRepository
{
    public function __construct(private readonly PDO $pdo)
    {
    }

    /**
     * @param array<string, mixed> $filters
     * @return array<int, array<string, mixed>>
     */
    public function list(array $filters = []): array
    {
        $sql = 'SELECT p.id, p.name, p.slug, p.description, p.offer_type, '
            . 'p.mrp_paise, p.sale_price_paise, p.is_manual_out_of_stock, '
            . 'p.is_best_seller, p.is_new_arrival, c.name AS category_name, f.name AS fabric_name '
            . 'FROM products p '
            . 'JOIN categories c ON c.id = p.category_id '
            . 'LEFT JOIN fabrics f ON f.id = p.fabric_id '
            . 'WHERE p.status = ? AND p.deleted_at IS NULL';
        $params = ['Published'];

        $category = trim((string) ($filters['category'] ?? ''));
        if ($category !== '' && $category !== 'All') {
            $sql .= ' AND c.name = ?';
            $params[] = $category;
        }

        $fabric = trim((string) ($filters['fabric'] ?? ''));
        if ($fabric !== '' && $fabric !== 'All') {
            $sql .= ' AND f.name = ?';
            $params[] = $fabric;
        }

        $offer = trim((string) ($filters['offer'] ?? ''));
        if ($offer !== '' && $offer !== 'All') {
            $sql .= ' AND p.offer_type = ?';
            $params[] = $offer;
        }

        $q = trim((string) ($filters['q'] ?? ''));
        if ($q !== '') {
            $sql .= ' AND (p.name LIKE ? OR p.description LIKE ?)';
            $like = '%' . $q . '%';
            $params[] = $like;
            $params[] = $like;
        }

        try {
            $statement = $this->pdo->prepare($sql);
            $statement->execute($params);
            $rows = $statement->fetchAll(PDO::FETCH_ASSOC);
        } catch (\PDOException $exception) {
            throw DatabaseException::fromPdo($exception);
        }

        if (!is_array($rows) || $rows === []) {
            return [];
        }

        $ids = array_map(static fn (array $r): int => (int) $r['id'], $rows);
        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        $imagesByProduct = [];
        $colorsByProduct = [];
        $sizesByProduct = [];
        $reviewsByProduct = [];

        try {
            $stmt = $this->pdo->prepare(
                "SELECT product_id, image_url, is_primary, display_order FROM product_images WHERE product_id IN ($placeholders) ORDER BY product_id, display_order"
            );
            $stmt->execute($ids);
            foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
                $imagesByProduct[(int) $row['product_id']][] = (string) $row['image_url'];
            }

            $stmt = $this->pdo->prepare(
                "SELECT product_id, colour_name, colour_code FROM product_colour_variants WHERE product_id IN ($placeholders) AND is_active = 1 ORDER BY product_id, display_order"
            );
            $stmt->execute($ids);
            foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
                $colorsByProduct[(int) $row['product_id']][] = [
                    'name' => (string) $row['colour_name'],
                    'hex' => (string) $row['colour_code'],
                ];
            }

            $stmt = $this->pdo->prepare(
                "SELECT product_id, size_name, quantity FROM product_variant_sizes WHERE product_id IN ($placeholders) AND is_active = 1 ORDER BY product_id, display_order"
            );
            $stmt->execute($ids);
            foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
                $pid = (int) $row['product_id'];
                $sizesByProduct[$pid][] = (string) $row['size_name'];
            }

            $stmt = $this->pdo->prepare(
                "SELECT product_id, COUNT(*) AS cnt, AVG(rating) AS avg_rating FROM product_reviews WHERE product_id IN ($placeholders) AND is_visible = 1 GROUP BY product_id"
            );
            $stmt->execute($ids);
            foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
                $reviewsByProduct[(int) $row['product_id']] = [
                    'count' => (int) $row['cnt'],
                    'avg' => (float) $row['avg_rating'],
                ];
            }
        } catch (\PDOException $exception) {
            throw DatabaseException::fromPdo($exception);
        }

        $products = [];
        foreach ($rows as $row) {
            $id = (int) $row['id'];
            $mrp = (int) $row['mrp_paise'];
            $sale = (int) $row['sale_price_paise'];
            $discount = $mrp > 0 ? (int) round((1 - $sale / $mrp) * 100) : 0;
            $review = $reviewsByProduct[$id] ?? ['count' => 0, 'avg' => 0.0];
            $sizes = array_values(array_unique($sizesByProduct[$id] ?? []));
            $images = $imagesByProduct[$id] ?? [];
            $colors = $colorsByProduct[$id] ?? [];

            $inStock = (int) $row['is_manual_out_of_stock'] === 0;
            if ($inStock) {
                $hasStock = false;
                $stmt = $this->pdo->prepare('SELECT 1 FROM product_variant_sizes WHERE product_id = ? AND is_active = 1 AND quantity > 0 LIMIT 1');
                $stmt->execute([$id]);
                $hasStock = (bool) $stmt->fetchColumn();
                $inStock = $hasStock;
            }

            $products[] = [
                'id' => $id,
                'name' => (string) $row['name'],
                'category' => (string) $row['category_name'],
                'price' => $sale / 100,
                'originalPrice' => $mrp / 100,
                'discount' => $discount,
                'rating' => round($review['avg'], 1),
                'reviewsCount' => $review['count'],
                'image' => $images[0] ?? '',
                'images' => $images,
                'colors' => $colors,
                'sizes' => $sizes,
                'inStock' => $inStock,
                'offerType' => (string) ($row['offer_type'] ?? ''),
                'fabric' => (string) ($row['fabric_name'] ?? ''),
                'isBestSeller' => (bool) $row['is_best_seller'],
                'isNewArrival' => (bool) $row['is_new_arrival'],
            ];
        }

        $sort = (string) ($filters['sort'] ?? 'featured');
        usort($products, static function (array $a, array $b) use ($sort): int {
            return match ($sort) {
                'price_asc' => $a['price'] <=> $b['price'],
                'price_desc' => $b['price'] <=> $a['price'],
                'rating' => $b['rating'] <=> $a['rating'],
                'discount' => $b['discount'] <=> $a['discount'],
                'newest' => $b['id'] <=> $a['id'],
                default => 0,
            };
        });

        return $products;
    }

    /**
     * @return array<string, mixed>|null
     */
    public function findBySlug(string $slug): ?array
    {
        $list = $this->list([]);
        foreach ($list as $product) {
            // slug is not in the list payload; resolve by id lookup instead
        }

        $statement = $this->pdo->prepare(
            'SELECT p.id FROM products p WHERE p.slug = ? AND p.deleted_at IS NULL LIMIT 1'
        );
        try {
            $statement->execute([$slug]);
            $id = $statement->fetchColumn();
        } catch (\PDOException $exception) {
            throw DatabaseException::fromPdo($exception);
        }
        if ($id === false) {
            return null;
        }

        foreach ($this->list([]) as $product) {
            if ($product['id'] === (int) $id) {
                $product['reviews'] = $this->reviews((int) $id);
                return $product;
            }
        }

        return null;
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function reviews(int $productId): array
    {
        $statement = $this->pdo->prepare(
            'SELECT id, author, rating, title, comment, location, is_verified, review_date '
            . 'FROM product_reviews WHERE product_id = ? AND is_visible = 1 ORDER BY review_date DESC'
        );
        try {
            $statement->execute([$productId]);
            $rows = $statement->fetchAll(PDO::FETCH_ASSOC);
        } catch (\PDOException $exception) {
            throw DatabaseException::fromPdo($exception);
        }

        $result = [];
        foreach ($rows as $row) {
            $result[] = [
                'id' => (int) $row['id'],
                'author' => (string) $row['author'],
                'rating' => (int) $row['rating'],
                'date' => date('d M Y', strtotime((string) $row['review_date'])),
                'title' => (string) $row['title'],
                'comment' => (string) $row['comment'],
                'verified' => (bool) $row['is_verified'],
                'location' => (string) ($row['location'] ?? ''),
            ];
        }

        return $result;
    }
}
