<?php

namespace Modules\Table\Examples;

use Modules\Auth\Models\User;
use Modules\Table\Table;
use Modules\Table\Columns\TextColumn;
use Modules\Table\Columns\DateColumn;
use Modules\Table\Columns\BooleanColumn;
use Modules\Table\Filters\TextFilter;
use Modules\Table\Filters\DateFilter;

class UsersTable extends Table
{
    protected ?string $resource = User::class;
    
    protected ?string $defaultSort = 'name';
    
    protected array|string $search = ['name', 'email'];

    public function columns(): array
    {
        return [
            TextColumn::make('name', 'Name', sortable: true),
            TextColumn::make('email', 'Email', sortable: true),
            DateColumn::make('email_verified_at', 'Email Verified'),
            BooleanColumn::make('two_factor_enabled', '2FA Enabled'),
            DateColumn::make('created_at', 'Created', sortable: true),
        ];
    }

    public function filters(): array
    {
        return [
            TextFilter::make('name', 'Name'),
            TextFilter::make('email', 'Email'),
            DateFilter::make('created_at', 'Created Date'),
        ];
    }
}
