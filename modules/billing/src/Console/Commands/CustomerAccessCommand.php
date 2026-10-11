<?php

namespace Modules\Billing\Console\Commands;

use Illuminate\Console\Command;
use Modules\Auth\Models\User;
use Modules\Billing\Support\CustomerPermissions;
use Spatie\Permission\Models\Permission;

class CustomerAccessCommand extends Command
{
    protected $signature = 'billing:customer-access {email : Existing administrator email} {--revoke : Remove direct customer permissions}';

    protected $description = 'Grant or revoke direct customer management permissions for an existing user';

    public function handle(): int
    {
        $user = User::where('email', $this->argument('email'))->first();
        if (! $user) {
            $this->error('No user was found for that email.');

            return self::FAILURE;
        }
        foreach (CustomerPermissions::ALL as $name) {
            Permission::findOrCreate($name, 'web');
        }
        if ($this->option('revoke')) {
            $user->revokePermissionTo(CustomerPermissions::ALL);
            $this->info('Direct permissions removed. Access inherited from admin or super-admin roles remains available.');
        } else {
            $user->givePermissionTo(CustomerPermissions::ALL);
            $this->info('Customer management access granted.');
        }

        return self::SUCCESS;
    }
}
