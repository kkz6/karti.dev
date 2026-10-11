<?php

use Illuminate\Database\Migrations\Migration;
use Modules\Billing\Support\BillingPermissions;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

return new class extends Migration
{
    public function up(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();
        foreach (BillingPermissions::DRAFTS as $name) {
            Permission::findOrCreate($name, 'web');
        }
        Role::findOrCreate('admin', 'web')->givePermissionTo(BillingPermissions::DRAFTS);
        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    public function down(): void
    {
        Permission::where('guard_name', 'web')->whereIn('name', BillingPermissions::DRAFTS)->delete();
        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
};
