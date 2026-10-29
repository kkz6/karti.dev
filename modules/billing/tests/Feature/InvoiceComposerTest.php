<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Auth\Models\User;
use Modules\Billing\Models\Customer;
use Modules\Billing\Models\Invoice;
use Modules\Billing\Settings\BillingSettings;

uses(RefreshDatabase::class);
beforeEach(function () {
    $this->actingAs(User::factory()->create()->assignRole('admin'));
    $this->customer=Customer::factory()->create(['display_name'=>'USD customer', 'default_currency'=>'USD', 'billing_address'=>'Customer street', 'billing_country'=>'US']);
});
function composerPayload(int $id): array
{
    return ['customer_id'=>$id, 'invoice_date'=>'2026-10-11', 'due_date'=>'2026-11-10', 'currency'=>'USD', 'discount_mode'=>'none', 'discount_value'=>'0', 'items'=>[['key'=>'00000000-0000-4000-8000-000000000011', 'description'=>'Alpha', 'unit'=>'item', 'quantity'=>'1', 'rate'=>'20', 'taxes'=>[]], ['key'=>'00000000-0000-4000-8000-000000000012', 'description'=>'Beta', 'unit'=>'item', 'quantity'=>'1', 'rate'=>'30', 'taxes'=>[]]]];
}
test('create opens the composer and JSON provides guarded editor options including customer currencies', function () {
    $this->get(route('admin.invoices.create'))->assertRedirect(route('admin.invoices.index', ['compose'=>1]));
    $this->getJson(route('admin.invoices.create'))->assertOk()->assertJsonPath('customers.0.default_currency', 'USD')->assertJsonPath('invoice', null)->assertJsonCount(10, 'currencies');
    $this->actingAs(User::factory()->create())->getJson(route('admin.invoices.create'))->assertForbidden();
});
test('JSON save update and verification retain exact values and dragged item order', function () {
    $payload           =composerPayload($this->customer->id);
    $response          =$this->postJson(route('admin.invoices.store'), $payload)->assertOk()->assertJsonPath('invoice.totals.total', '50.00')->assertJsonPath('invoice.currency', 'USD');
    $id                =$response->json('invoice.id');
    $payload['version']=$response->json('invoice.version');
    $payload['items']  =array_reverse($payload['items']);
    $this->patchJson(route('admin.invoices.update', $id), $payload)->assertOk()->assertJsonPath('invoice.items.0.description', 'Beta')->assertJsonPath('invoice.items.1.description', 'Alpha')->assertJsonPath('invoice.totals.total', '50.00');
    $review=$this->getJson(route('admin.invoices.issue-review', $id))->assertOk();
    expect($review->json('review.errors'))->not->toBeEmpty();
    $this->postJson(route('admin.invoices.issue', $id), ['version'=>$review->json('review.invoice.version'), 'review_token'=>$review->json('review.token'), 'refresh_seller'=>true, 'refresh_customer'=>false])->assertUnprocessable();
    expect(Invoice::find($id)->status)->toBe('draft');
});
test('JSON issuance requires the current verified token and returns the permanent invoice', function () {
    app(BillingSettings::class)->fill(['legal_name'=>'Example company', 'address'=>'Company street', 'country'=>'US'])->save();
    $saved =$this->postJson(route('admin.invoices.store'), composerPayload($this->customer->id))->assertOk();
    $id    =$saved->json('invoice.id');
    $review=$this->getJson(route('admin.invoices.issue-review', $id))->assertOk()->assertJsonCount(0, 'review.errors');
    $this->postJson(route('admin.invoices.issue', $id), ['version'=>$review->json('review.invoice.version'), 'review_token'=>$review->json('review.token'), 'refresh_seller'=>true, 'refresh_customer'=>false])->assertOk()->assertJsonPath('invoice.status', 'issued')->assertJsonPath('invoice.totals.total', '50.00')->assertJsonStructure(['url', 'invoice'=>['formatted_number']]);
});
test('JSON validation returns field errors without creating a draft', function () {
    $this->postJson(route('admin.invoices.store'), [])->assertUnprocessable()->assertJsonValidationErrors(['customer_id', 'items', 'currency']);
    expect(Invoice::count())->toBe(0);
});

test('payment after issuing a draft edit link keeps the list usable and records once', function () {
    \Illuminate\Support\Facades\Queue::fake();
    \Illuminate\Support\Facades\Mail::fake();
    app(BillingSettings::class)->fill(['legal_name'=>'Example company', 'address'=>'Company street', 'country'=>'US'])->save();
    $saved = $this->postJson(route('admin.invoices.store'), composerPayload($this->customer->id))->assertOk();
    $id    = $saved->json('invoice.id');
    $list  = ['edit'=>$id, 'search'=>'USD customer', 'view'=>'issued', 'page'=>2];
    $this->get(route('admin.invoices.index', $list))->assertOk();
    $review = $this->getJson(route('admin.invoices.issue-review', $id))->assertOk();
    $issued = $this->postJson(route('admin.invoices.issue', $id), ['version'=>$review->json('review.invoice.version'), 'review_token'=>$review->json('review.token'), 'refresh_seller'=>true, 'refresh_customer'=>false])->assertOk();
    $input  = ['version'=>$issued->json('invoice.version'), 'request_key'=>(string) \Illuminate\Support\Str::uuid(), 'amount'=>'50.00', 'currency'=>'USD', 'payment_date'=>now()->format('Y-m-d'), 'method'=>'cash', 'reference'=>'WISE-DEEP-LINK', 'send_receipt'=>false];
    $this->postJson(route('admin.invoices.payments.store', $id), $input)->assertOk()->assertJsonPath('settlement.state', 'paid');
    $this->postJson(route('admin.invoices.payments.store', $id), $input)->assertOk();
    $this->get(route('admin.invoices.index', $list))->assertRedirect(route('admin.invoices.index', array_diff_key($list, ['edit'=>true])));
    $this->followingRedirects()->get(route('admin.invoices.index', $list))->assertOk();
    expect(\Modules\Billing\Models\Payment::where('invoice_id', $id)->count())->toBe(1);
    \Illuminate\Support\Facades\Queue::assertNothingPushed();
    \Illuminate\Support\Facades\Mail::assertNothingSent();
});

test('stale draft edit links drop editor flags and keep filters without bypassing authorization', function (string $status) {
    $saved   = $this->postJson(route('admin.invoices.store'), composerPayload($this->customer->id))->assertOk();
    $invoice = Invoice::findOrFail($saved->json('invoice.id'));
    $invoice->forceFill(['status'=>$status])->save();
    $query = ['edit'=>$invoice->id, 'compose'=>1, 'search'=>'USD customer', 'view'=>'issued'];
    $this->get(route('admin.invoices.index', $query))->assertRedirect(route('admin.invoices.index', ['search'=>'USD customer', 'view'=>'issued']));
    $this->actingAs(User::factory()->create()->givePermissionTo('view any invoice'))->get(route('admin.invoices.index', $query))->assertForbidden();
})->with(['issued', 'cancelled']);
