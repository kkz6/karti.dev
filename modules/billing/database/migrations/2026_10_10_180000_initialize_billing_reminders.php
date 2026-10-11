<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Spatie\LaravelSettings\Migrations\SettingsMigration;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

return new class extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->add('billing_automation.reminders_enabled', false);
        $this->migrator->add('billing_automation.reminder_offsets', [0, 3, 7, 14]);
        Schema::table('billing_invoices', fn (Blueprint $t) =>$t->boolean('reminders_disabled')->default(false));
        Permission::findOrCreate('remind invoice', 'web');
        Role::findOrCreate('admin', 'web')->givePermissionTo('remind invoice');
    }

    public function down(): void
    {
        Schema::table('billing_invoices', fn (Blueprint $t) =>$t->dropColumn('reminders_disabled'));
        $this->migrator->delete('billing_automation.reminders_enabled');
        $this->migrator->delete('billing_automation.reminder_offsets');
        Permission::where('name', 'remind invoice')->delete();
    }
};
