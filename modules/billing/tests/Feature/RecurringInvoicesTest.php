<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Modules\Auth\Models\User;
use Modules\Billing\Actions\SaveInvoiceDraft;
use Modules\Billing\Models\Customer;
use Modules\Billing\Models\Invoice;
use Modules\Billing\Models\RecurringInvoice;
use Modules\Billing\Services\RecurringInvoiceGenerator;

uses(RefreshDatabase::class);
beforeEach(function () {
    $this->travelTo(\Carbon\Carbon::parse('2026-03-31 12:00:00', 'UTC'));
    $this->admin=User::factory()->create()->assignRole('admin');
    $this->actingAs($this->admin);
    $customer      =Customer::factory()->create();
    $source        =app(SaveInvoiceDraft::class)->handle(['customer_id'=>$customer->id, 'invoice_date'=>'2026-01-31', 'currency'=>'INR', 'discount_mode'=>'none', 'discount_value'=>'0', 'items'=>[['key'=>(string) Str::uuid(), 'description'=>'Monthly service', 'unit'=>'month', 'quantity'=>'1', 'rate'=>'100', 'taxes'=>[]]]]);
    $this->schedule=RecurringInvoice::create(['source_invoice_id'=>$source->id, 'actor_id'=>$this->admin->id, 'name'=>'Monthly service', 'template'=>RecurringInvoiceGenerator::template($source), 'interval'=>'month', 'every'=>1, 'timezone'=>'Asia/Kolkata', 'anchor_date'=>'2026-01-31', 'next_date'=>'2026-01-31', 'due_days'=>30, 'cycle_limit'=>3, 'policy'=>'draft', 'active'=>true]);
});
test('month end catch-up creates one draft per occurrence and finite cycles stop without duplicates', function () {
    $this->artisan('billing:recurring')->assertSuccessful();
    $this->artisan('billing:recurring')->assertSuccessful();
    expect(Invoice::count())->toBe(4)->and(Invoice::orderBy('id')->pluck('invoice_date')->map(fn ($d) =>$d->format('Y-m-d'))->all())->toBe(['2026-01-31', '2026-01-31', '2026-02-28', '2026-03-31'])->and($this->schedule->fresh()->active)->toBeFalse()->and($this->schedule->fresh()->cycles_done)->toBe(3);
});
test('paused schedules and revoked owner permissions do not generate invoices', function () {
    $this->schedule->update(['active'=>false]);
    $this->artisan('billing:recurring')->assertSuccessful();
    expect(Invoice::count())->toBe(1);
    $this->schedule->update(['active'=>true]);
    $this->admin->removeRole('admin');
    $this->artisan('billing:recurring')->assertSuccessful();
    expect(Invoice::count())->toBe(1)->and($this->schedule->fresh()->last_error)->not->toBeNull();
});
test('failed generation rolls back and recovers after customer restore', function () {
    $customer=Customer::first();
    $customer->forceFill(['archived_at'=>now()])->save();
    $this->artisan('billing:recurring')->assertSuccessful();
    expect(Invoice::count())->toBe(1)->and($this->schedule->fresh()->cycles_done)->toBe(0);
    $customer->forceFill(['archived_at'=>null])->save();
    $this->artisan('billing:recurring')->assertSuccessful();
    expect(Invoice::count())->toBe(4)->and($this->schedule->fresh()->last_error)->toBeNull();
});

test('cancelling the source invoice pauses future recurrence without generating further charges', function () {
    \Modules\Billing\Models\Invoice::findOrFail($this->schedule->source_invoice_id)->forceFill(['status'=>'cancelled'])->save();
    $this->artisan('billing:recurring')->assertSuccessful();
    expect(Invoice::count())->toBe(1)->and($this->schedule->fresh()->active)->toBeFalse();
});
