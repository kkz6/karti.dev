<?php

use Illuminate\Database\Migrations\Migration;
use Modules\Billing\Support\CustomerPermissions;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

return new class extends Migration
{
    public function up(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();
        foreach (CustomerPermissions::ALL as $name) {
            Permission::findOrCreate($name, 'web');
        }
        Role::findOrCreate('admin', 'web')->givePermissionTo(CustomerPermissions::ALL);
        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    public function down(): void
    {
        Permission::where('guard_name', 'web')->whereIn('name', CustomerPermissions::ALL)->delete();
        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
};
