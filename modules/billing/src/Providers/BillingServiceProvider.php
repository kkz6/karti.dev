<?php

namespace Modules\Billing\Providers;

use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;
use Modules\Billing\Console\Commands\BillingAccessCommand;
use Modules\Billing\Console\Commands\CustomerAccessCommand;
use Modules\Billing\Models\Customer;
use Modules\Billing\Models\TaxRate;
use Modules\Billing\Policies\BillingSettingsPolicy;
use Modules\Billing\Policies\CustomerPolicy;
use Modules\Billing\Policies\TaxRatePolicy;
use Modules\Billing\Settings\BillingSettings;

class BillingServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(\Modules\Billing\Contracts\PaymentProvider::class, \Modules\Billing\Services\DodoPaymentProvider::class);
        $this->app->bind(\Modules\Billing\Contracts\InvoicePdfRenderer::class, \Modules\Billing\Services\DompdfInvoiceRenderer::class);
    }

    public function boot(): void
    {
        $this->loadViewsFrom(__DIR__.'/../../resources/views', 'billing');
        $this->loadMigrationsFrom(__DIR__.'/../../database/migrations');
        $this->loadRoutesFrom(__DIR__.'/../../routes/billing-routes.php');
        Gate::policy(\Modules\Billing\Models\Payment::class, \Modules\Billing\Policies\PaymentPolicy::class);
        Gate::policy(\Modules\Billing\Models\RecurringInvoice::class, \Modules\Billing\Policies\RecurringInvoicePolicy::class);
        Gate::policy(\Modules\Billing\Models\CreditNote::class, \Modules\Billing\Policies\CreditNotePolicy::class);
        Gate::policy(Customer::class, CustomerPolicy::class);
        Gate::policy(\Modules\Billing\Models\Invoice::class, \Modules\Billing\Policies\InvoicePolicy::class);
        Gate::policy(TaxRate::class, TaxRatePolicy::class);
        Gate::policy(BillingSettings::class, BillingSettingsPolicy::class);
        $this->callAfterResolving(\Illuminate\Console\Scheduling\Schedule::class, function ($schedule) {
            $schedule->command('billing:reconcile-payments')->everyFiveMinutes()->withoutOverlapping();
            $schedule->command('billing:recurring')->hourly()->withoutOverlapping();
            $schedule->command('billing:reminders')->hourly()->withoutOverlapping();
        });
        $this->commands([\Modules\Billing\Console\Commands\ImportPerfexBilling::class, \Modules\Billing\Console\Commands\ReconcileOnlinePayments::class, \Modules\Billing\Console\Commands\GenerateRecurringInvoices::class, \Modules\Billing\Console\Commands\QueueInvoiceReminders::class, CustomerAccessCommand::class, BillingAccessCommand::class]);
    }
}
