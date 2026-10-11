<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Modules\Auth\Models\User;
use Modules\Billing\Actions\IssueInvoice;
use Modules\Billing\Actions\QueueInvoiceDelivery;
use Modules\Billing\Actions\SaveInvoiceDraft;
use Modules\Billing\Jobs\DeliverInvoice;
use Modules\Billing\Mail\InvoiceEmail;
use Modules\Billing\Models\Customer;
use Modules\Billing\Models\InvoiceDelivery;
use Modules\Billing\Services\InvoiceIssueReview;
use Modules\Billing\Settings\BillingSettings;
use Modules\Settings\Support\EmailConfiguration;

uses(RefreshDatabase::class);
beforeEach(function () {
    Storage::fake('local');
    Queue::fake();
    Mail::fake();
    $this->admin=User::factory()->create()->assignRole('admin');
    $this->actingAs($this->admin);
    app(BillingSettings::class)->fill(['legal_name'=>'Example', 'address'=>'Street', 'country'=>'IN'])->save();
    $customer     =Customer::factory()->create(['billing_address'=>'Street', 'billing_country'=>'IN']);
    $this->invoice=app(SaveInvoiceDraft::class)->handle(['customer_id'=>$customer->id, 'invoice_date'=>'2026-10-10', 'currency'=>'INR', 'discount_mode'=>'none', 'discount_value'=>'0', 'items'=>[['key'=>(string) Str::uuid(), 'description'=>'Consulting', 'unit'=>'hour', 'quantity'=>'1', 'rate'=>'100', 'taxes'=>[]]]]);
    $review       =app(InvoiceIssueReview::class)->prepare($this->invoice, true, false);
    $this->invoice=app(IssueInvoice::class)->handle($this->invoice, ['version'=>1, 'review_token'=>$review['token'], 'refresh_seller'=>true, 'refresh_customer'=>false], $this->admin);
    $this->input  =['request_key'=>(string) Str::uuid(), 'recipients'=>['billing@example.test'], 'subject'=>'Invoice '.$this->invoice->formatted_number, 'message'=>'Thank you'];
});
test('email entry queues one immutable attachment and exact retries create one attempt', function () {
    $url=route('admin.invoices.send', $this->invoice);
    $this->post($url, $this->input)->assertSessionHasNoErrors();
    $this->post($url, $this->input)->assertSessionHasNoErrors();
    expect(InvoiceDelivery::count())->toBe(1);
    Queue::assertPushed(DeliverInvoice::class, 1);
    Mail::assertNothingSent();
    $delivery=InvoiceDelivery::first();
    expect(hash('sha256', Storage::disk('local')->get($delivery->pdf_path)))->toBe($delivery->pdf_hash);
    $this->postJson($url, [...$this->input, 'subject'=>'Different'])->assertJsonValidationErrors('request_key');
    (new DeliverInvoice($delivery->id))->handle(app(EmailConfiguration::class));
    (new DeliverInvoice($delivery->id))->handle(app(EmailConfiguration::class));
    Mail::assertSent(InvoiceEmail::class, 1);
    expect($delivery->fresh()->state)->toBe('sent');
    Mail::assertSent(InvoiceEmail::class, fn ($mail) =>$mail->pdfName === $delivery->pdf_name && hash('sha256', $mail->pdfBytes) === $delivery->pdf_hash && $mail->hasTo('billing@example.test'));
});
test('intentional resends keep separate records and cancelled queued invoices are skipped', function () {
    $one=app(QueueInvoiceDelivery::class)->handle($this->invoice, $this->input, $this->admin);
    $two=app(QueueInvoiceDelivery::class)->handle($this->invoice, [...$this->input, 'request_key'=>(string) Str::uuid()], $this->admin);
    expect($one->id)->not->toBe($two->id);
    $this->invoice->forceFill(['status'=>'cancelled'])->save();
    (new DeliverInvoice($one->id))->handle(app(EmailConfiguration::class));
    expect($one->fresh()->state)->toBe('skipped');
    Mail::assertNothingSent();
});
test('drafts invalid recipients and missing send permission cannot queue email', function () {
    $this->postJson(route('admin.invoices.send', $this->invoice), [...$this->input, 'recipients'=>['invalid']])->assertJsonValidationErrors('recipients.0');
    $this->invoice->forceFill(['status'=>'draft'])->save();
    $this->postJson(route('admin.invoices.send', $this->invoice), $this->input)->assertStatus(409);
    $reader=User::factory()->create()->givePermissionTo('view invoice');
    $this->actingAs($reader)->postJson(route('admin.invoices.send', $this->invoice), $this->input)->assertForbidden();
    expect(InvoiceDelivery::count())->toBe(0);
});
test('missing attachments and uncertain worker recovery never cause blind resends', function () {
    $delivery=app(QueueInvoiceDelivery::class)->handle($this->invoice, $this->input, $this->admin);
    Storage::disk('local')->delete($delivery->pdf_path);
    (new DeliverInvoice($delivery->id))->handle(app(EmailConfiguration::class));
    expect($delivery->fresh()->state)->toBe('failed');
    Mail::assertNothingSent();
    $delivery->update(['state'=>'sending', 'started_at'=>now()->subMinutes(5)]);
    (new DeliverInvoice($delivery->id))->handle(app(EmailConfiguration::class));
    expect($delivery->fresh()->state)->toBe('uncertain');
    Mail::assertNothingSent();
});
test('provider exceptions preserve an uncertain outcome without retries sending again', function () {
    $delivery     =app(QueueInvoiceDelivery::class)->handle($this->invoice, $this->input, $this->admin);
    $configuration=Mockery::mock(EmailConfiguration::class);
    $configuration->shouldReceive('run')->once()->andThrow(new RuntimeException('Private transport detail'));
    (new DeliverInvoice($delivery->id))->handle($configuration);
    (new DeliverInvoice($delivery->id))->handle($configuration);
    expect($delivery->fresh()->state)->toBe('uncertain')->and($delivery->fresh()->error)->not->toContain('Private transport detail');
    Mail::assertNothingSent();
});
