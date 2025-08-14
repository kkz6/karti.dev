<?php

declare(strict_types=1);

namespace Modules\Table;

use Closure;
use Illuminate\Contracts\Database\Eloquent\Builder;
use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Traits\Conditionable;
use Illuminate\Support\Traits\Tappable;

class Action implements Arrayable
{
    use BelongsToTable;
    use Conditionable;
    use GeneratesSignedTableUrls;
    use HandlesAuthorization;
    use HasDataAttributes;
    use HasMeta;
    use Tappable;

    /**
     * The index of the Action.
     */
    protected int $index;

    public function __construct(
        public string $label,
        public bool $asRowAction,
        public bool $asBulkAction,
        public ActionStyle $style,
        public ?Closure $url,
        public ?Closure $before,
        public ?Closure $handle,
        public ?Closure $after,
        public bool|Closure $authorize,
        public int $chunkSize,
        public bool $eachById,
        public bool $confirmationRequired,
        public string $confirmationTitle,
        public string $confirmationMessage,
        public string $confirmationConfirmButton,
        public string $confirmationCancelButton,
        public bool $showLabel,
        public ?string $icon,
        public ?array $dataAttributes,
        public ?array $meta,
        public bool $asDownload,
        public bool|Closure $disabled,
        public bool|Closure $hidden,
        public int|string|null $id,
        public ?Variant $variant = null,
        public ?ActionType $type = null,
        public ?string $buttonClass = null,
        public ?string $linkClass = null,
    ) {
        $this->variant ??= $style->toVariant();
        $this->type ??= $style->toActionType();
    }

    /**
     * Get the label of the Action.
     */
    public function getLabel(): string
    {
        return $this->label;
    }

    /**
     * Determine if the action is an action.
     */
    protected function isAction(): bool
    {
        return $this->before instanceof Closure || $this->handle instanceof Closure || $this->after instanceof Closure;
    }

    /**
     * Determine if the action is a link.
     */
    public function isLink(): bool
    {
        return $this->url instanceof Closure;
    }

    /**
     * Determine if the action is a custom action and should be handled by the frontend.
     */
    public function isCustom(): bool
    {
        return ! $this->isAction() && ! $this->isLink();
    }

    /**
     * Setter for the index of the Action.
     */
    public function setIndex(int $index): self
    {
        $this->index = $index;

        return $this;
    }

    /**
     * Resolve the URL for the given item.
     */
    public function resolveUrl(mixed $item): string|array|null
    {
        return Url::resolve($item, $this->url);
    }

    /**
     * Set the variant for the action.
     */
    public function variant(Variant $variant): self
    {
        $this->variant = $variant;

        return $this;
    }

    /**
     * Set the class for the action button.
     */
    public function buttonClass(?string $buttonClass = null): self
    {
        $this->buttonClass = $buttonClass;

        return $this;
    }

    /**
     * Set the class for the action link.
     */
    public function linkClass(?string $linkClass = null): self
    {
        $this->linkClass = $linkClass;

        return $this;
    }

    /**
     * Set the type for the action.
     */
    public function type(ActionType $type): self
    {
        $this->type = $type;

        return $this;
    }

    /**
     * Style the action as a button.
     */
    public function asButton(Variant|string|null $variantOrClass = null): self
    {
        $this->style = ActionStyle::Button; // deprecated

        return $this->type(ActionType::Button)
            ->variant($variantOrClass instanceof Variant ? $variantOrClass : $this->variant)
            ->buttonClass(is_string($variantOrClass) ? $variantOrClass : $this->buttonClass);
    }

    /**
     * Helper method to style the action as a danger button.
     */
    public function asDangerButton(): self
    {
        return tap($this->asButton(Variant::Danger), function (): void {
            $this->style = ActionStyle::DangerButton; // deprecated (for backwards compatibility)
        });
    }

    /**
     * Helper method to style the action as a default button.
     */
    public function asDefaultButton(): self
    {
        return $this->asButton(Variant::Default);
    }

    /**
     * Helper method to style the action as an info button.
     */
    public function asInfoButton(): self
    {
        return $this->asButton(Variant::Info);
    }

    /**
     * Helper method to style the action as a primary button.
     */
    public function asPrimaryButton(): self
    {
        return tap($this->asInfoButton(), function (): void {
            $this->style = ActionStyle::PrimaryButton; // deprecated (for backwards compatibility)
        });
    }

    /**
     * Helper method to style the action as a success button.
     */
    public function asSuccessButton(): self
    {
        return $this->asButton(Variant::Success);
    }

    /**
     * Helper method to style the action as a warning button.
     */
    public function asWarningButton(): self
    {
        return $this->asButton(Variant::Warning);
    }

    /**
     * Style the action as a link.
     */
    public function asLink(Variant|string|null $variantOrClass = null): self
    {
        $this->style = ActionStyle::Link; // deprecated

        return $this->type(ActionType::Link)
            ->variant($variantOrClass instanceof Variant ? $variantOrClass : $this->variant)
            ->linkClass(is_string($variantOrClass) ? $variantOrClass : $this->linkClass);
    }

    /**
     * Helper method to style the action as a danger link.
     */
    public function asDangerLink(): self
    {
        return $this->asLink(Variant::Danger);
    }

    /**
     * Helper method to style the action as a default link.
     */
    public function asDefaultLink(): self
    {
        return $this->asLink(Variant::Default);
    }

    /**
     * Helper method to style the action as an info link.
     */
    public function asInfoLink(): self
    {
        return $this->asLink(Variant::Info);
    }

    /**
     * Helper method to style the action as a primary link.
     */
    public function asPrimaryLink(): self
    {
        return $this->asInfoLink();
    }

    /**
     * Helper method to style the action as a success link.
     */
    public function asSuccessLink(): self
    {
        return $this->asLink(Variant::Success);
    }

    /**
     * Helper method to style the action as a warning link.
     */
    public function asWarningLink(): self
    {
        return $this->asLink(Variant::Warning);
    }

    /**
     * Show the label for the action.
     */
    public function showLabel(bool $showLabel = true): self
    {
        $this->showLabel = $showLabel;

        return $this;
    }

    /**
     * Hide the label for the action.
     */
    public function hideLabel(): self
    {
        return $this->showLabel(false);
    }

    /**
     * Set the icon for the action.
     */
    public function icon(string $icon): self
    {
        $this->icon = $icon;

        return $this;
    }

    /**
     * This is an alias for the icon method. It is here for legacy reasons, as it was mentioned incorrectly in the documentation.
     */
    public function withIcon(string $icon): self
    {
        return $this->icon($icon);
    }

    /**
     * Show the action as a Bulk Action.
     */
    public function asBulkAction(bool $asBulkAction = true): self
    {
        $this->asBulkAction = $asBulkAction;

        return $this;
    }

    /**
     * Show the action as a Row Action.
     */
    public function asRowAction(bool $asRowAction = true): self
    {
        $this->asRowAction = $asRowAction;

        return $this;
    }

    /**
     * Show the action as a Bulk Action only.
     */
    public function onlyAsBulkAction(): self
    {
        return $this->asBulkAction(true)->asRowAction(false);
    }

    /**
     * Confirm the action before performing it.
     */
    public function confirm(
        string $title = 'Confirm action',
        string $message = 'Are you sure you want to perform this action?',
        string $confirmButton = 'Yes',
        string $cancelButton = 'Cancel',
    ): self {
        $this->confirmationRequired      = true;
        $this->confirmationTitle         = $title;
        $this->confirmationMessage       = $message;
        $this->confirmationConfirmButton = $confirmButton;
        $this->confirmationCancelButton  = $cancelButton;

        return $this;
    }

    /**
     * Marks the URL as a download URL.
     */
    public function asDownload(bool $asDownload = true): self
    {
        $this->asDownload = $asDownload;

        return $this;
    }

    /**
     * Set the URL callback for the action.
     */
    public function url(Closure|callable $url): self
    {
        $this->url = Helpers::asClosure($url);

        return $this;
    }

    /**
     * Set the disabled state for the action.
     */
    public function disabled(bool|Closure|callable $disabled = true): self
    {
        if (! is_bool($disabled)) {
            $disabled = Helpers::asClosure($disabled);
        }

        $this->disabled = $disabled;

        return $this;
    }

    /**
     * Hide the action conditionally.
     */
    public function hidden(bool|Closure|callable $hidden = true): self
    {
        if (! is_bool($hidden)) {
            $hidden = Helpers::asClosure($hidden);
        }

        $this->hidden = $hidden;

        return $this;
    }

    /**
     * Disable and hide the action conditionally.
     */
    public function disabledAndHidden(bool|Closure|callable $disabledAndHidden = true): self
    {
        if (! is_bool($disabledAndHidden)) {
            $disabledAndHidden = Helpers::asClosure($disabledAndHidden);
        }

        return $this->disabled($disabledAndHidden)->hidden($disabledAndHidden);
    }

    /**
     * Set the id for the action.
     */
    public function id(int|string|null $id = null): self
    {
        $this->id = $id;

        return $this;
    }

    /**
     * Determine if the action is disabled for the given model.
     */
    public function isDisabled(?Model $model = null): bool
    {
        if (is_bool($this->disabled)) {
            return $this->disabled;
        }

        return (bool) call_user_func($this->disabled, $model);
    }

    /**
     * Determine if the action is hidden for the given model.
     */
    public function isHidden(?Model $model = null): bool
    {
        if (is_bool($this->hidden)) {
            return $this->hidden;
        }

        return (bool) call_user_func($this->hidden, $model);
    }

    /**
     * Create a new Action instance.
     */
    public static function make(
        string $label,
        ?Closure $url = null,
        ?Closure $handle = null,
        ?ActionStyle $style = null,
        bool $asRowAction = true,
        bool $asBulkAction = false,
        bool|Closure $authorize = true,
        ?Closure $before = null,
        Closure|string|null $after = null,
        int $chunkSize = 1000,
        bool $eachById = true,
        bool $confirmationRequired = false,
        string $confirmationTitle = 'Confirm action',
        string $confirmationMessage = 'Are you sure you want to perform this action?',
        string $confirmationConfirmButton = 'Yes',
        string $confirmationCancelButton = 'Cancel',
        bool $showLabel = true,
        ?string $icon = null,
        ?array $dataAttributes = null,
        ?array $meta = null,
        ?Closure $downloadUrl = null,
        ?bool $asDownload = null,
        Closure|callable|bool $disabled = false,
        Closure|callable|bool $hidden = false,
        Closure|callable|bool|null $disabledAndHidden = null,
        int|string|null $id = null,
        ?Variant $variant = null,
        ?ActionType $type = null,
        ?string $buttonClass = null,
        ?string $linkClass = null,
    ): self {
        $url ??= $downloadUrl;

        if (! is_bool($disabled)) {
            $disabled = Helpers::asClosure($disabled);
        }

        if (! is_bool($hidden)) {
            $hidden = Helpers::asClosure($hidden);
        }

        if (! is_bool($disabledAndHidden)) {
            $disabledAndHidden = Helpers::asClosure($disabledAndHidden);
        }

        return new static(
            label: $label,
            asRowAction: $asRowAction,
            asBulkAction: $asBulkAction,
            style: $style ?? ($url instanceof Closure ? ActionStyle::Link : ActionStyle::Button), // deprecated
            url: $url,
            before: $before,
            handle: $handle,
            after: is_string($after) ? fn () => redirect()->to($after) : $after,
            authorize: $authorize,
            chunkSize: $chunkSize,
            eachById: $eachById,
            confirmationRequired: $confirmationRequired,
            confirmationTitle: $confirmationTitle,
            confirmationMessage: $confirmationMessage,
            confirmationConfirmButton: $confirmationConfirmButton,
            confirmationCancelButton: $confirmationCancelButton,
            showLabel: $showLabel,
            icon: $icon,
            dataAttributes: $dataAttributes,
            meta: $meta,
            asDownload: $asDownload ?? ! is_null($downloadUrl),
            disabled: $disabledAndHidden ?? $disabled,
            hidden: $disabledAndHidden ?? $hidden,
            id: $id,
            variant: $variant,
            type: $type,
            buttonClass: $buttonClass,
            linkClass: $linkClass,
        );
    }

    /**
     * Get the signed URL for the action.
     */
    public function getActionUrl(): string
    {
        return $this->generateSignedTableUrl($this->table, 'inertia-tables.action', [
            ...request()->query(),
            'action' => $this->index,
        ]);
    }

    /**
     * Determine if the action is Bulk actionable.
     */
    public function isBulkActionable(): bool
    {
        return ! $this->isLink() && $this->asBulkAction;
    }

    /**
     * Get the array representation of the Action.
     */
    public function toArray(): array
    {
        return [
            'style'                => $this->style->value,
            'label'                => $this->label,
            'isAction'             => $this->isAction(),
            'isCustom'             => $this->isCustom(),
            'isLink'               => $this->isLink(),
            'asDownload'           => $this->asDownload,
            'asRowAction'          => $this->asRowAction,
            'asBulkAction'         => $this->isBulkActionable(),
            'confirmationRequired' => $this->confirmationRequired,
            'authorized'           => $this->isAuthorized(),
            'url'                  => $this->isAction() ? $this->getActionUrl() : null,
            ...$this->confirmationRequired ? [
                'confirmationTitle'         => $this->confirmationTitle,
                'confirmationMessage'       => $this->confirmationMessage,
                'confirmationConfirmButton' => $this->confirmationConfirmButton,
                'confirmationCancelButton'  => $this->confirmationCancelButton,
            ] : [],
            'icon'           => $this->icon,
            'showLabel'      => $this->showLabel,
            'dataAttributes' => $this->buildDataAttributes(),
            'meta'           => $this->meta,
            'id'             => $this->id,
            'variant'        => $this->variant->value,
            'type'           => $this->type->value,
            'buttonClass'    => $this->buttonClass,
            'linkClass'      => $this->linkClass,
        ];
    }

    /**
     * Handle the given keys.
     */
    public function handle(array $keys): mixed
    {
        if ($this->disabled === true) {
            return null;
        }

        return DB::transaction(function () use ($keys): mixed {
            $queryBuilder = $this->table->queryBuilder();

            // When all keys are selected, we apply the request filters to the query,
            // otherwise we simply scope the query by the primary key(s).
            $allItemsAreSelected = count($keys) === 1 && Arr::first($keys) === '*';
            $multipleItems       = $allItemsAreSelected || count($keys) > 1;

            // Protect against multiple items when the action is not Bulk Actionable...
            if ($multipleItems && ! $this->isBulkActionable()) {
                throw NoBulkActionException::new();
            }

            /** @var Builder $query */
            $query = $allItemsAreSelected
                ? $queryBuilder->getResourceWithRequestApplied(applySort: false)
                : $queryBuilder->getResource()->tap(fn (Builder $query) => $this->table->scopePrimaryKey($query, $keys));

            $result = null;

            // Run the 'before' callback...
            if ($this->before instanceof Closure) {
                $result = call_user_func($this->before, $keys);
            }

            // Run the 'each' callback...
            if ($this->handle instanceof Closure) {
                $chunkCallback = function (Model $model, $key) use ($multipleItems) {
                    if ($this->isDisabled($model)) {
                        return null;
                    }

                    if ($multipleItems && ! $this->table->isSelectable($model)) {
                        return null;
                    }

                    return call_user_func($this->handle, $model, $key);
                };

                $model = $query->getModel();

                $result = $this->eachById
                    ? $query->eachById($chunkCallback, $this->chunkSize, $model->getQualifiedKeyName(), $model->getKeyName())
                    : $query->each($chunkCallback, $this->chunkSize);
            }

            // Run the 'after' callback...
            if ($this->after instanceof Closure) {
                return call_user_func($this->after, $keys);
            }

            return $result;
        });
    }
}
