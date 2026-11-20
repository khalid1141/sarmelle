<?php
declare(strict_types=1);

namespace Sarmelle\Support;

/**
 * Carries a field => message map to the router, which turns it into the
 * validation_failed envelope. Messages never contain submitted values.
 */
final class ValidationException extends \RuntimeException
{
    /** @var array<string, string> */
    private readonly array $fields;

    /**
     * @param array<string, string> $fields
     */
    public function __construct(array $fields)
    {
        parent::__construct('Check the highlighted fields.');
        $this->fields = $fields;
    }

    /**
     * @return array<string, string>
     */
    public function fields(): array
    {
        return $this->fields;
    }
}
