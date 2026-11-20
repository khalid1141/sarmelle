<?php
declare(strict_types=1);

namespace Sarmelle\Support;

use Sarmelle\Auth\Policy;

/**
 * One validator with a per-route rule set.
 *
 * Rules: required, optional/nullable, string, int, bool, array, trim,
 * collapse_spaces, min:N, max:N, max_bytes:N, regex:PATTERN, enum:a,b,c,
 * email, phone, otp, name, password[:auto|bcrypt|argon2id].
 *
 * Unknown input keys are rejected. Password and OTP errors never echo the
 * submitted value.
 */
final class Validator
{
    /** @var array<string, array<int, string>> */
    private readonly array $rules;

    private readonly string $passwordAlgorithm;

    /**
     * @param array<string, array<int, string>> $rules
     */
    public function __construct(array $rules, string $passwordAlgorithm = 'auto')
    {
        $this->rules = $rules;
        $this->passwordAlgorithm = Policy::passwordAlgorithm($passwordAlgorithm);
    }

    /**
     * @param array<string, mixed> $input
     * @return array<string, mixed>
     * @throws ValidationException
     */
    public function validate(array $input): array
    {
        $errors = [];
        $values = [];

        foreach (array_keys($input) as $key) {
            if (!is_string($key) || !array_key_exists($key, $this->rules)) {
                $label = is_string($key) ? $key : 'input';

                if (strlen($label) > 64) {
                    $label = mb_check_encoding($label, 'UTF-8')
                        ? mb_substr($label, 0, 64, 'UTF-8')
                        : 'input';
                }

                $errors[$label] = 'This field is not allowed.';
            }
        }

        foreach ($this->rules as $field => $fieldRules) {
            $required = in_array('required', $fieldRules, true);
            $present = array_key_exists($field, $input);
            $value = $present ? $input[$field] : null;

            if (!$present || $value === null) {
                if ($required) {
                    $errors[$field] = 'This field is required.';
                }

                continue;
            }

            if ($required && is_string($value) && trim($value) === '') {
                $errors[$field] = 'This field is required.';
                continue;
            }

            $value = $this->applyField($field, $value, $fieldRules, $errors);

            if (!array_key_exists($field, $errors)) {
                $values[$field] = $value;
            }
        }

        if ($errors !== []) {
            throw new ValidationException($errors);
        }

        return $values;
    }

    /**
     * @param array<int, string> $rules
     * @param array<string, string> $errors
     */
    private function applyField(string $field, mixed $value, array $rules, array &$errors): mixed
    {
        foreach ($rules as $rule) {
            if (in_array($rule, ['required', 'optional', 'nullable'], true)) {
                continue;
            }

            if ($rule === 'string' || $rule === 'int' || $rule === 'bool' || $rule === 'array') {
                if (!$this->matchesType($value, $rule)) {
                    $errors[$field] = $this->typeMessage($rule);
                    return null;
                }

                continue;
            }

            if ($rule === 'trim') {
                if (is_string($value)) {
                    $value = trim($value);
                }

                continue;
            }

            if ($rule === 'collapse_spaces') {
                if (is_string($value)) {
                    $value = preg_replace('/\s+/u', ' ', trim($value)) ?? trim($value);
                }

                continue;
            }

            if (in_array($rule, ['email', 'phone', 'otp', 'name'], true)) {
                if (!is_string($value)) {
                    $errors[$field] = 'This field must be text.';
                    return null;
                }

                $normalised = match ($rule) {
                    'email' => Normaliser::email($value),
                    'phone' => Normaliser::phone($value),
                    'otp' => Normaliser::otp($value),
                    'name' => Normaliser::name($value),
                };

                if ($normalised === null) {
                    $errors[$field] = match ($rule) {
                        'email' => 'Enter a valid email address.',
                        'phone' => 'Enter a valid phone number.',
                        'otp' => 'Enter the 6-digit code.',
                        'name' => 'Enter a valid name.',
                    };

                    return null;
                }

                $value = $normalised;
                continue;
            }

            if (str_starts_with($rule, 'min:') || str_starts_with($rule, 'max:')) {
                $isMin = str_starts_with($rule, 'min:');
                $limit = (int) substr($rule, 4);
                $length = is_string($value) ? self::charLength($value) : -1;

                if (($isMin && $length < $limit) || (!$isMin && $length > $limit)) {
                    $errors[$field] = $isMin ? 'This field is too short.' : 'This field is too long.';
                    return null;
                }

                continue;
            }

            if (str_starts_with($rule, 'max_bytes:')) {
                $limit = (int) substr($rule, 10);

                if (!is_string($value) || strlen($value) > $limit) {
                    $errors[$field] = 'This field is too long.';
                    return null;
                }

                continue;
            }

            if (str_starts_with($rule, 'regex:')) {
                $result = @preg_match(substr($rule, 6), is_string($value) ? $value : '');

                if ($result === false) {
                    throw new \InvalidArgumentException('Invalid validator regex for ' . $field . '.');
                }

                if ($result === 0) {
                    $errors[$field] = 'This field has an invalid format.';
                    return null;
                }

                continue;
            }

            if (str_starts_with($rule, 'enum:')) {
                $allowed = explode(',', substr($rule, 5));

                if (!is_string($value) || !in_array($value, $allowed, true)) {
                    $errors[$field] = 'Choose a valid option.';
                    return null;
                }

                continue;
            }

            if ($rule === 'password' || str_starts_with($rule, 'password:')) {
                if (!is_string($value)) {
                    $errors[$field] = 'This field must be text.';
                    return null;
                }

                $algorithm = $rule === 'password'
                    ? $this->passwordAlgorithm
                    : Policy::passwordAlgorithm(substr($rule, 9));
                $message = self::passwordError($value, $algorithm);

                if ($message !== null) {
                    $errors[$field] = $message;
                    return null;
                }

                continue;
            }

            throw new \InvalidArgumentException('Unknown validator rule: ' . $rule);
        }

        return $value;
    }

    private function matchesType(mixed $value, string $type): bool
    {
        return match ($type) {
            'string' => is_string($value),
            'int' => is_int($value),
            'bool' => is_bool($value),
            'array' => is_array($value),
            default => false,
        };
    }

    private function typeMessage(string $type): string
    {
        return match ($type) {
            'string' => 'This field must be text.',
            'int' => 'This field must be a whole number.',
            'bool' => 'This field must be true or false.',
            'array' => 'This field must be a list.',
            default => 'This field has an invalid type.',
        };
    }

    private static function passwordError(string $value, string $algorithm): ?string
    {
        if (strlen($value) > Policy::PASSWORD_INPUT_MAX_BYTES) {
            return 'Password is too long.';
        }

        if (!mb_check_encoding($value, 'UTF-8')) {
            return 'Password must be valid text.';
        }

        $characters = mb_strlen($value, 'UTF-8');

        if ($characters < Policy::PASSWORD_MIN_LENGTH) {
            return 'Password must be at least ' . Policy::PASSWORD_MIN_LENGTH . ' characters.';
        }

        if ($algorithm === 'bcrypt') {
            if (strlen($value) > Policy::PASSWORD_BCRYPT_MAX_BYTES) {
                return 'Password is too long for bcrypt (72 bytes maximum).';
            }

            return null;
        }

        if ($characters > Policy::PASSWORD_ARGON2ID_MAX_CHARS) {
            return 'Password is too long (128 characters maximum).';
        }

        return null;
    }

    private static function charLength(string $value): int
    {
        $length = mb_strlen($value, 'UTF-8');

        return is_int($length) ? $length : PHP_INT_MAX;
    }
}
