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
        foreach (BillingPermissions::CATALOGUE as $name) {
            Permission::findOrCreate($name, 'web');
        }
        Role::findOrCreate('admin', 'web')->givePermissionTo(BillingPermissions::CATALOGUE);
        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    public function down(): void
    {
        Permission::where('guard_name', 'web')->whereIn('name', BillingPermissions::CATALOGUE)->delete();
        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
};
