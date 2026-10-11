<?php

namespace Modules\Billing\Console\Commands;

use Illuminate\Console\Command;
use Modules\Auth\Models\User;
use Modules\Billing\Support\BillingPermissions;
use Spatie\Permission\Models\Permission;

class BillingAccessCommand extends Command
{
    protected $signature = 'billing:access {email : Existing user email} {--revoke : Remove direct billing permissions}';

    protected $description = 'Grant or revoke direct access to the implemented billing features';

    public function handle(): int
    {
        $user = User::where('email', $this->argument('email'))->first();
        if (! $user) {
            $this->error('No user was found for that email.');

            return self::FAILURE;
        }
        foreach (BillingPermissions::ALL as $name) {
            Permission::findOrCreate($name, 'web');
        }
        if ($this->option('revoke')) {
            $user->revokePermissionTo(BillingPermissions::ALL);
            $this->info('Direct billing access removed. Access inherited from roles remains available.');
        } else {
            $user->givePermissionTo(BillingPermissions::ALL);
            $this->info('Billing access granted.');
        }

        return self::SUCCESS;
    }
}
