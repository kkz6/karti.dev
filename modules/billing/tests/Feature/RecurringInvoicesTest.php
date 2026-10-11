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

test('recurring migration repairs a missing unique index without losing schedules or occurrences', function () {
    $this->artisan('billing:recurring')->assertSuccessful();
    $table = 'billing_recurrence_occurrences';
    $before = \Illuminate\Support\Facades\DB::table($table)->orderBy('id')->get()->toJson();
    $index = collect(\Illuminate\Support\Facades\Schema::getIndexes($table))
        ->first(fn ($index) => $index['unique'] && $index['columns'] === ['recurring_invoice_id', 'scheduled_date']);
    \Illuminate\Support\Facades\Schema::table($table, fn ($blueprint) => $blueprint->dropUnique($index['name']));

    $migration = require base_path('modules/billing/database/migrations/2026_10_10_200000_create_recurring_invoices.php');
    $migration->up();
    $migration->up();

    expect($this->schedule->fresh())->not->toBeNull()
        ->and(\Illuminate\Support\Facades\DB::table($table)->orderBy('id')->get()->toJson())->toBe($before)
        ->and(\Illuminate\Support\Facades\Schema::hasIndex($table, ['recurring_invoice_id', 'scheduled_date'], 'unique'))->toBeTrue();

    $occurrence = (array) \Illuminate\Support\Facades\DB::table($table)->first();
    unset($occurrence['id']);
    expect(fn () => \Illuminate\Support\Facades\DB::table($table)->insert($occurrence))
        ->toThrow(\Illuminate\Database\UniqueConstraintViolationException::class);
});

test('recurring migration generates MySQL identifiers within the 64 character limit', function () {
    $connection = new class(fn () => throw new RuntimeException('No database connection expected')) extends \Illuminate\Database\MySqlConnection
    {
        public function isMaria()
        {
            return false;
        }

        public function getServerVersion(): string
        {
            return '8.0.36';
        }
    };
    $connection->useDefaultSchemaGrammar();
    $schema = \Illuminate\Support\Facades\Schema::getFacadeRoot();
    $statements = [];
    $mock = Mockery::mock(\Illuminate\Database\Schema\Builder::class);
    $mock->shouldReceive('hasTable')->andReturnFalse();
    $mock->shouldReceive('hasIndex')->andReturnFalse();
    foreach (['create', 'table'] as $method) {
        $mock->shouldReceive($method)->andReturnUsing(function ($table, $callback) use ($connection, &$statements, $method) {
            $blueprint = new \Illuminate\Database\Schema\Blueprint($connection, $table);
            if ($method === 'create') {
                $blueprint->create();
            }
            $callback($blueprint);
            array_push($statements, ...$blueprint->toSql());
        });
    }
    \Illuminate\Support\Facades\Schema::swap($mock);
    try {
        $migration = require base_path('modules/billing/database/migrations/2026_10_10_200000_create_recurring_invoices.php');
        $migration->up();
    } finally {
        \Illuminate\Support\Facades\Schema::swap($schema);
    }

    $sql = implode("\n", $statements);
    expect($sql)->toContain('unique `billing_recurrence_schedule_unique`(`recurring_invoice_id`, `scheduled_date`)');
    preg_match_all('/`([^`]+)`/', $sql, $matches);
    foreach ($matches[1] as $identifier) {
        expect(strlen($identifier))->toBeLessThanOrEqual(64);
    }
});
