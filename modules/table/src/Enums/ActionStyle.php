<?php

declare(strict_types=1);

namespace Modules\Table\Enums;

/**
 * @deprecated Use a combination of ActionType and Variant instead
 */
enum ActionStyle: string
{
    case Link          = 'link';
    case Button        = 'button';
    case PrimaryButton = 'primary-button';
    case DangerButton  = 'danger-button';

    public static function fromStyleAndType(Style $style, ActionType $type): self
    {
        if ($type === ActionType::Link) {
            return self::Link;
        }

        return match ($style) {
            Style::Info   => self::PrimaryButton,
            Style::Danger => self::DangerButton,
            default       => self::Button,
        };
    }

    public function toActionType(): ActionType
    {
        return match ($this) {
            self::Link => ActionType::Link,
            default    => ActionType::Button,
        };
    }

    public function toVariant(): Variant
    {
        return match ($this) {
            self::PrimaryButton => Variant::Info,
            self::DangerButton  => Variant::Destructive,
            default             => Variant::Default,
        };
    }
}
