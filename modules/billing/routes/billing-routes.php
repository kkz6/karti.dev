<?php

use Illuminate\Support\Facades\Route;
use Modules\Billing\Http\Controllers\BillingSettingsController;
use Modules\Billing\Http\Controllers\ContactsController;
use Modules\Billing\Http\Controllers\CustomersController;
use Modules\Billing\Http\Controllers\TaxRatesController;

Route::middleware(['web', 'auth', 'verified', \Modules\Billing\Http\Middleware\PreserveInvoicePanel::class])->prefix('admin')->name('admin.')->group(function () {
    Route::get('invoices/customer-options', [\Modules\Billing\Http\Controllers\InvoicesController::class, 'customerOptions'])->name('invoices.customer-options');
    Route::post('invoices/preview', [\Modules\Billing\Http\Controllers\InvoicesController::class, 'preview'])->name('invoices.preview');
    Route::post('invoices/{invoice}/preview', [\Modules\Billing\Http\Controllers\InvoicesController::class, 'preview'])->name('invoices.draft-preview');
    Route::resource('invoices', \Modules\Billing\Http\Controllers\InvoicesController::class)->except('destroy');
    Route::get('billing/imports', [\Modules\Billing\Http\Controllers\BillingImportsController::class, 'index'])->name('billing.imports.index');
    Route::post('billing/imports/dry-run', [\Modules\Billing\Http\Controllers\BillingImportsController::class, 'stage'])->name('billing.imports.stage');
    Route::get('billing/imports/{batch}', [\Modules\Billing\Http\Controllers\BillingImportsController::class, 'show'])->name('billing.imports.show');
    Route::get('billing/imports/{batch}/archive', [\Modules\Billing\Http\Controllers\BillingImportsController::class, 'archive'])->name('billing.imports.archive');
    Route::post('billing/imports/{batch}/commit', [\Modules\Billing\Http\Controllers\BillingImportsController::class, 'commit'])->name('billing.imports.commit');
    Route::get('customers/{customer}/statement', \Modules\Billing\Http\Controllers\CustomerStatementController::class)->name('customers.statement');
    Route::get('credit-notes/{creditNote}/pdf', [\Modules\Billing\Http\Controllers\CreditNotesController::class, 'pdf'])->name('credit-notes.pdf');
    Route::get('credit-notes', [\Modules\Billing\Http\Controllers\CreditNotesController::class, 'index'])->name('credit-notes.index');
    Route::get('credit-notes/{creditNote}', [\Modules\Billing\Http\Controllers\CreditNotesController::class, 'show'])->name('credit-notes.show');
    Route::post('invoices/{invoice}/credit-notes', [\Modules\Billing\Http\Controllers\CreditNotesController::class, 'store'])->name('invoices.credit-notes.store');
    Route::patch('credit-notes/{creditNote}', [\Modules\Billing\Http\Controllers\CreditNotesController::class, 'update'])->name('credit-notes.update');
    foreach (['issue', 'allocate', 'refund', 'cancel'] as $operation) {
        Route::post('credit-notes/{creditNote}/'.$operation, [\Modules\Billing\Http\Controllers\CreditNotesController::class, $operation])->name('credit-notes.'.$operation);
    }
    Route::post('credit-notes/{creditNote}/allocations/{allocation}/reverse', [\Modules\Billing\Http\Controllers\CreditNotesController::class, 'reverseAllocation'])->name('credit-notes.allocations.reverse');
    Route::post('credit-notes/{creditNote}/refunds/{refund}/reverse', [\Modules\Billing\Http\Controllers\CreditNotesController::class, 'reverseRefund'])->name('credit-notes.refunds.reverse');
    Route::get('billing/online-payments', [\Modules\Billing\Http\Controllers\OnlinePaymentsController::class, 'settings'])->name('billing.online.edit');
    Route::put('billing/online-payments', [\Modules\Billing\Http\Controllers\OnlinePaymentsController::class, 'updateSettings'])->name('billing.online.update');
    Route::get('billing/reconciliation', [\Modules\Billing\Http\Controllers\OnlinePaymentsController::class, 'reconciliation'])->name('billing.reconciliation');
    Route::post('billing/reconciliation/{event}/retry', [\Modules\Billing\Http\Controllers\OnlinePaymentsController::class, 'retry'])->name('billing.reconciliation.retry');
    Route::patch('invoices/{invoice}/internal-note', \Modules\Billing\Http\Controllers\InvoiceInternalNoteController::class)->name('invoices.internal-note');
    Route::post('invoices/{invoice}/checkout', [\Modules\Billing\Http\Controllers\OnlinePaymentsController::class, 'create'])->name('invoices.checkout');
    Route::post('bookings/{booking}/customer', [\Modules\Billing\Http\Controllers\OnlinePaymentsController::class, 'associate'])->name('bookings.customer');
    Route::resource('recurring-invoices', \Modules\Billing\Http\Controllers\RecurringInvoicesController::class)->parameters(['recurring-invoices' => 'recurringInvoice'])->except(['show', 'destroy']);
    Route::get('billing/automation', [\Modules\Billing\Http\Controllers\BillingAutomationController::class, 'edit'])->name('billing.automation.edit');
    Route::put('billing/automation', [\Modules\Billing\Http\Controllers\BillingAutomationController::class, 'update'])->name('billing.automation.update');
    Route::post('invoices/{invoice}/reminders', [\Modules\Billing\Http\Controllers\BillingAutomationController::class, 'reminder'])->name('invoices.reminders');
    Route::post('invoices/{invoice}/links', [\Modules\Billing\Http\Controllers\InvoiceLinkController::class, 'store'])->name('invoices.links.store');
    Route::post('invoices/{invoice}/links/{link}/revoke', [\Modules\Billing\Http\Controllers\InvoiceLinkController::class, 'revoke'])->scopeBindings()->name('invoices.links.revoke');
    Route::post('invoices/{invoice}/send', \Modules\Billing\Http\Controllers\InvoiceDeliveryController::class)->name('invoices.send');
    Route::get('invoices/{invoice}/pdf', \Modules\Billing\Http\Controllers\InvoicePdfController::class)->name('invoices.pdf');
    Route::get('invoices/{invoice}/issue-review', [\Modules\Billing\Http\Controllers\InvoicesController::class, 'issueReview'])->name('invoices.issue-review');
    Route::post('invoices/{invoice}/issue', [\Modules\Billing\Http\Controllers\InvoicesController::class, 'issue'])->name('invoices.issue');
    Route::post('invoices/{invoice}/cancel', [\Modules\Billing\Http\Controllers\InvoicesController::class, 'cancel'])->name('invoices.cancel');
    Route::post('invoices/{invoice}/payments', [\Modules\Billing\Http\Controllers\PaymentsController::class, 'store'])->name('invoices.payments.store');
    Route::get('payments', [\Modules\Billing\Http\Controllers\PaymentsController::class, 'index'])->name('payments.index');
    Route::post('payments/{payment}/reverse', [\Modules\Billing\Http\Controllers\PaymentsController::class, 'reverse'])->name('payments.reverse');
    Route::get('settings/billing', [BillingSettingsController::class, 'edit'])->name('settings.billing.edit');
    Route::put('settings/billing', [BillingSettingsController::class, 'update'])->name('settings.billing.update');
    Route::resource('tax-rates', TaxRatesController::class)->parameters(['tax-rates' => 'taxRate'])->except('destroy');
    Route::post('tax-rates/{taxRate}/archive', [TaxRatesController::class, 'archive'])->name('tax-rates.archive');
    Route::post('tax-rates/{taxRate}/restore', [TaxRatesController::class, 'restore'])->name('tax-rates.restore');
    Route::resource('customers', CustomersController::class)->except('destroy');
    Route::post('customers/{customer}/archive', [CustomersController::class, 'archive'])->name('customers.archive');
    Route::post('customers/{customer}/restore', [CustomersController::class, 'restore'])->name('customers.restore');
    Route::scopeBindings()->group(function () {
        Route::post('customers/{customer}/contacts', [ContactsController::class, 'store'])->name('customers.contacts.store');
        Route::patch('customers/{customer}/contacts/{contact}', [ContactsController::class, 'update'])->name('customers.contacts.update');
        Route::post('customers/{customer}/contacts/{contact}/archive', [ContactsController::class, 'archive'])->name('customers.contacts.archive');
        Route::post('customers/{customer}/contacts/{contact}/restore', [ContactsController::class, 'restore'])->name('customers.contacts.restore');
    });
});

Route::get('billing/invoices/{token}', \Modules\Billing\Http\Controllers\PublicInvoiceController::class)->middleware(['web', 'throttle:60,1'])->where('token', '[a-f0-9]{64}')->name('billing.public-invoice');

Route::post('billing/webhooks/dodo', \Modules\Billing\Http\Controllers\ProviderWebhookController::class)->middleware('throttle:120,1')->name('billing.webhooks.dodo');

Route::post('billing/invoices/{token}/checkout', [\Modules\Billing\Http\Controllers\OnlinePaymentsController::class, 'publicCreate'])->middleware(['web', 'throttle:20,1'])->where('token', '[a-f0-9]{64}')->name('billing.public-invoice.checkout');
Route::get('billing/payment-return/{checkout}', [\Modules\Billing\Http\Controllers\OnlinePaymentsController::class, 'receipt'])->middleware('web')->whereUuid('checkout')->name('billing.payment-return');
