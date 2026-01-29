<?php

namespace App\Enums;

enum BloodTypeEnum: string
{
    case A_POSITIVE = 'A+';
    case A_NEGATIVE = 'A-';
    case B_POSITIVE = 'B+';
    case B_NEGATIVE = 'B-';
    case O_POSITIVE = 'O+';
    case O_NEGATIVE = 'O-';
    case AB_POSITIVE = 'AB+';
    case AB_NEGATIVE = 'AB-';

    /**
     * Get all values as an array for frontend select options
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    /**
     * Get options for select dropdowns
     */
    public static function options(): array
    {
        return array_map(fn($case) => [
            'value' => $case->value,
            'label' => $case->value,
        ], self::cases());
    }

    /**
     * Get human-readable label
     */
    public function label(): string
    {
        return match($this) {
            self::A_POSITIVE => 'A Positivo (A+)',
            self::A_NEGATIVE => 'A Negativo (A-)',
            self::B_POSITIVE => 'B Positivo (B+)',
            self::B_NEGATIVE => 'B Negativo (B-)',
            self::O_POSITIVE => 'O Positivo (O+)',
            self::O_NEGATIVE => 'O Negativo (O-)',
            self::AB_POSITIVE => 'AB Positivo (AB+)',
            self::AB_NEGATIVE => 'AB Negativo (AB-)',
        };
    }
}
