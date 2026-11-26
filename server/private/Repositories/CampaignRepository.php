<?php
declare(strict_types=1);

namespace Sarmelle\Repositories;

use PDO;
use Sarmelle\Core\DatabaseException;

final class CampaignRepository
{
    public function __construct(private readonly PDO $pdo)
    {
    }

    /**
     * @return array<string, mixed>
     */
    public function all(): array
    {
        return [
            'heroSlides' => $this->heroSlides(),
            'promoBanners' => $this->promoBanners(),
            'featuredBlocks' => $this->featuredBlocks(),
            'lookbook' => $this->lookbook(),
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function heroSlides(): array
    {
        $rows = $this->fetchAll('SELECT * FROM campaign_hero_slides WHERE is_active = 1 ORDER BY display_order, id');
        $result = [];
        foreach ($rows as $row) {
            $result[] = [
                'id' => (int) $row['id'],
                'badge' => $row['badge'],
                'titlePart1' => (string) $row['title_part1'],
                'titlePart2' => (string) $row['title_part2'],
                'subtitle' => (string) $row['subtitle'],
                'offerTag' => $row['offer_tag'],
                'ctaTextDesktop' => (string) $row['cta_text_desktop'],
                'ctaTextMobile' => (string) $row['cta_text_mobile'],
                'categoryTarget' => $row['category_target'],
                'offerTarget' => $row['offer_target'],
                'desktopImage' => (string) $row['desktop_image'],
                'mobileImage' => (string) $row['mobile_image'],
                'active' => (bool) $row['is_active'],
            ];
        }
        return $result;
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function promoBanners(): array
    {
        $rows = $this->fetchAll('SELECT * FROM campaign_promo_banners WHERE is_active = 1 ORDER BY display_order, id');
        $result = [];
        foreach ($rows as $row) {
            $result[] = [
                'id' => (int) $row['id'],
                'badge' => (string) $row['badge'],
                'title' => (string) $row['title'],
                'subtitle' => (string) $row['subtitle'],
                'ctaText' => (string) $row['cta_text'],
                'image' => (string) $row['image'],
                'targetCategory' => $row['target_category'],
                'targetOffer' => $row['target_offer'],
            ];
        }
        return $result;
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function featuredBlocks(): array
    {
        $rows = $this->fetchAll('SELECT * FROM campaign_featured_blocks WHERE is_active = 1 ORDER BY display_order, id');
        $result = [];
        foreach ($rows as $row) {
            $result[] = [
                'id' => (int) $row['id'],
                'title' => (string) $row['title'],
                'ctaText' => (string) $row['cta_text'],
                'image' => (string) $row['image'],
                'category' => (string) $row['category'],
            ];
        }
        return $result;
    }

    /**
     * @return array<string, mixed>|null
     */
    public function lookbook(): ?array
    {
        $rows = $this->fetchAll('SELECT * FROM campaign_lookbook WHERE is_active = 1 ORDER BY id LIMIT 1');
        if ($rows === []) {
            return null;
        }
        $row = $rows[0];
        return [
            'title' => (string) $row['title'],
            'subtitle' => (string) $row['subtitle'],
            'ctaText' => (string) $row['cta_text'],
            'image' => (string) $row['image'],
            'offerTarget' => $row['offer_target'],
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function fetchAll(string $sql): array
    {
        try {
            $statement = $this->pdo->query($sql);
            $rows = $statement->fetchAll(PDO::FETCH_ASSOC);
        } catch (\PDOException $exception) {
            throw DatabaseException::fromPdo($exception);
        }
        return is_array($rows) ? $rows : [];
    }
}
