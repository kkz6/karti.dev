<?php

namespace Modules\Shared\Tables;

use Illuminate\Database\Eloquent\Model;
use Modules\Table\Action;

class RestoreAction
{
    public static function make(): Action
    {
        return Action::make(
            label: 'Restore',
            handle: fn (Model $model) => $model->restore(),
            icon: 'archive-restore',
            authorize: fn () => auth()->check(),
        )
            ->withTrashed()
            ->disabledAndHidden(fn (?Model $model) => $model !== null && ! $model->trashed())
            ->confirm('Restore selected items?', 'These items will return to their original lists with their previous publication status.', 'Restore')
            ->asBulkAction();
    }
}
