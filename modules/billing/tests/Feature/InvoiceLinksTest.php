<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;
use Modules\Auth\Models\User;
use Modules\Billing\Actions\ManageInvoiceLinks;
use Modules\Billing\Actions\SaveInvoiceDraft;
use Modules\Billing\Models\Customer;
use Modules\Billing\Models\InvoiceLink;

uses(RefreshDatabase::class);
beforeEach(function () {
    $this->admin=User::factory()->create()->assignRole('admin');
    $this->actingAs($this->admin);
    $customer     =Customer::factory()->create();
    $this->invoice=app(SaveInvoiceDraft::class)->handle(['customer_id'=>$customer->id, 'invoice_date'=>'2026-10-10', 'currency'=>'INR', 'discount_mode'=>'none', 'discount_value'=>'0', 'internal_note'=>'SECRET INTERNAL NOTE', 'items'=>[['key'=>(string) Str::uuid(), 'description'=>'Service', 'unit'=>'hour', 'quantity'=>'1', 'rate'=>'100', 'taxes'=>[]]]]);
    $this->invoice->forceFill(['status'=>'issued', 'formatted_number'=>'INV-000001'])->save();
});
test('private links expose one minimized invoice and authorized pdf without customer registration', function () {
    $created=app(ManageInvoiceLinks::class)->create($this->invoice, 90, 'Customer', $this->admin);
    auth()->logout();
    $response=$this->get($created['url']);
    $response->assertOk()->assertHeader('X-Robots-Tag', 'noindex, nofollow, noarchive')->assertHeader('Referrer-Policy', 'no-referrer')->assertInertia(fn (Assert $page) =>$page->component('billing::public-invoice')->missing('invoice.internal_note')->missing('invoice.customer_id')->missing('invoice.id')->missing('invoice.customer_snapshot.contacts')->missing('invoice.seller_snapshot.logo_media_id')->where('invoice.formatted_number', 'INV-000001'));
    $this->get($created['url'].'?pdf=1')->assertOk()->assertHeader('Content-Type', 'application/pdf');
    $token=basename($created['url']);
    expect(InvoiceLink::first()->token_hash)->toBe(hash('sha256', $token));
    expect(InvoiceLink::first()->toArray())->not->toHaveKey('token_hash');
});
test('revoked expired invalid draft and cancelled links fail closed', function () {
    $created=app(ManageInvoiceLinks::class)->create($this->invoice);
    auth()->logout();
    $this->get(route('billing.public-invoice', str_repeat('0', 64)))->assertNotFound();
    $created['link']->update(['expires_at'=>now()->subSecond()]);
    $this->get($created['url'])->assertNotFound();
    $created['link']->update(['expires_at'=>now()->addDay(), 'revoked_at'=>now()]);
    $this->get($created['url'].'?pdf=1')->assertNotFound();
    $created['link']->update(['revoked_at'=>null]);
    $this->invoice->forceFill(['status'=>'draft'])->save();
    $this->get($created['url'])->assertNotFound();
    $this->invoice->forceFill(['status'=>'cancelled'])->save();
    $this->get($created['url'])->assertNotFound();
});
test('link management requires sharing permission and scopes revocation to the correct invoice', function () {
    $reader=User::factory()->create()->givePermissionTo('view invoice');
    $this->actingAs($reader)->postJson(route('admin.invoices.links.store', $this->invoice), ['days'=>30])->assertForbidden();
    $this->actingAs($this->admin)->post(route('admin.invoices.links.store', $this->invoice), ['days'=>30, 'label'=>'Customer'])->assertSessionHas('billing_share_url');
    $link=InvoiceLink::first();
    $this->post(route('admin.invoices.links.revoke', [$this->invoice, $link]))->assertRedirect();
    expect($link->fresh()->revoked_at)->not->toBeNull();
    $other=$this->invoice->replicate();
    $other->forceFill(['formatted_number'=>'INV-000002'])->save();
    $this->post(route('admin.invoices.links.revoke', [$other, $link]))->assertNotFound();
});
