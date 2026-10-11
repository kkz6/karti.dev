<?php

namespace Modules\Billing\Actions;

use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Modules\Auth\Models\User;
use Modules\Billing\Jobs\DeliverInvoice;
use Modules\Billing\Models\Invoice;
use Modules\Billing\Models\InvoiceDelivery;
use Modules\Billing\Services\InvoicePdf;

class QueueInvoiceDelivery
{
    public function handle(Invoice $invoice, array $input, ?User $actor = null): InvoiceDelivery
    {
        $recipients = array_values(array_unique(array_map(fn ($email) => strtolower(trim($email)), $input['recipients'])));
        sort($recipients);
        $hash     = hash('sha256', json_encode([$invoice->id, $recipients, $input['subject'], $input['message'] ?? ''], JSON_THROW_ON_ERROR));
        $existing = InvoiceDelivery::where('request_key', $input['request_key'])->first();
        if ($existing) {
            if (! hash_equals($existing->request_hash, $hash)) {
                throw ValidationException::withMessages(['request_key' => 'This request key belongs to different email details. Reopen the form.']);
            }

            return $existing;
        }
        abort_unless($invoice->status === 'issued', 409, 'Only issued invoices can be emailed.');
        $document = app(InvoicePdf::class)->document($invoice, false);

        return DB::transaction(function () use ($invoice, $input, $actor, $recipients, $hash, $document) {
            if (DB::connection()->getDriverName() === 'sqlite') {
                DB::table('billing_invoices')->where('id', $invoice->id)->update(['version' => DB::raw('version')]);
            }
            $locked   = Invoice::whereKey($invoice->id)->lockForUpdate()->firstOrFail();
            $existing = InvoiceDelivery::where('request_key', $input['request_key'])->first();
            if ($existing) {
                if (! hash_equals($existing->request_hash, $hash)) {
                    throw ValidationException::withMessages(['request_key' => 'Email request key already used.']);
                }

                return $existing;
            }
            if ($input['occurrence_key'] ?? null) {
                $occurrence = InvoiceDelivery::where('occurrence_key', $input['occurrence_key'])->first();
                if ($occurrence) {
                    return $occurrence;
                }
            }
            abort_unless($locked->status === 'issued', 409, 'Only issued invoices can be emailed.');
            $delivery = InvoiceDelivery::create(['invoice_id' => $locked->id, 'request_key' => $input['request_key'], 'request_hash' => $hash, 'recipients' => $recipients,
                'subject'                                     => $input['subject'], 'message' => $input['message'] ?? '', 'pdf_path' => $document['path'], 'pdf_hash' => hash('sha256', $document['bytes']), 'pdf_name' => $document['name'],
                'snapshot_version'                            => $invoice->version, 'kind'                                        => $input['kind'] ?? 'invoice', 'occurrence_key' => $input['occurrence_key'] ?? null, 'actor_id' => $actor?->id, 'actor_name' => $actor?->name ?? 'System']);
            $link = app(ManageInvoiceLinks::class)->create($locked, 90, 'Email #'.$delivery->id, $actor);
            $delivery->update(['invoice_url' => $link['url']]);
            $locked->recordActivity('email_queued', 'Invoice email queued for '.implode(', ', $recipients).'.', $actor);
            DeliverInvoice::dispatch($delivery->id)->onQueue('billing')->afterCommit();

            return $delivery;
        }, 5);
    }
}
