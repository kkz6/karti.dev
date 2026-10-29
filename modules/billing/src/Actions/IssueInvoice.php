<?php

namespace Modules\Billing\Actions;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Modules\Auth\Models\User;
use Modules\Billing\Models\Invoice;
use Modules\Billing\Services\InvoiceIssueReview;

class IssueInvoice
{
    public function handle(Invoice $invoice, array $input, User $actor): Invoice
    {
        $copies = [];
        try {
            $result = DB::transaction(function () use ($invoice, $input, $actor, &$copies) {
                // SQLite WAL cannot upgrade competing read snapshots to writers. Acquire
                // its writer reservation before reading; the counter does not advance here.
                if (DB::connection()->getDriverName() === 'sqlite') {
                    DB::table('billing_invoice_sequences')->where('scope', 'invoices')->update(['next_number' => DB::raw('next_number')]);
                }
                $locked   = Invoice::whereKey($invoice->id)->lockForUpdate()->firstOrFail();
                $customer = $locked->customer()->lockForUpdate()->firstOrFail();
                if ($locked->status === 'issued') {
                    return $locked;
                }
                abort_unless($locked->status === 'draft', 409, 'Cancelled invoices cannot be issued again.');
                if ($locked->version !== (int) $input['version']) {
                    throw ValidationException::withMessages(['review' => 'The draft changed. Review it again before issuing.']);
                }
                $review = app(InvoiceIssueReview::class)->prepare($locked, $input['refresh_seller'], $input['refresh_customer'], $customer);
                if ($review['errors']) {
                    throw ValidationException::withMessages(['review' => $review['errors']]);
                }
                if (! hash_equals($review['token'], $input['review_token'])) {
                    throw ValidationException::withMessages(['review' => 'Reviewed details changed. Reload the review before issuing.']);
                }
                $sequence = DB::table('billing_invoice_sequences')->where('scope', 'invoices')->lockForUpdate()->first();
                abort_unless($sequence && $sequence->next_number < PHP_INT_MAX, 409, 'Invoice numbering is unavailable.');
                $number          = (int) $sequence->next_number;
                $formattedNumber = $review['prefix'].str_pad((string) $number, $review['padding'], '0', STR_PAD_LEFT);
                if (Invoice::where('formatted_number', $formattedNumber)->where('number_scope', '!=', 'native')->exists()) {
                    throw ValidationException::withMessages(['review' => 'This number is already used by a historical invoice. Advance the invoice sequence before issuing.']);
                }
                DB::table('billing_invoice_sequences')->where('scope', 'invoices')->update(['next_number' => $number + 1]);
                $seller = $review['seller'];
                if ($logo = $review['logo']) {
                    $path     = 'billing/invoices/'.$locked->id.'/logo-'.Str::uuid().'.'.$logo['extension'];
                    $copies[] = $path;
                    if (! Storage::disk('local')->put($path, $logo['bytes'], ['visibility' => 'private'])) {
                        throw new \RuntimeException('Could not preserve the invoice logo.');
                    }
                    $seller['logo_file'] = ['disk' => 'local', 'path' => $path, 'sha256' => $logo['hash'], 'mime_type' => $logo['mime']];
                }
                $locked->seller_snapshot   = $seller;
                $locked->customer_snapshot = $review['customer'];
                $locked->customer_name     = $review['customer']['display_name'];
                $locked->sequence_number   = $number;
                $locked->number_prefix     = $review['prefix'];
                $locked->number_padding    = $review['padding'];
                $locked->number_scope      = 'native';
                $locked->formatted_number  = $formattedNumber;
                $locked->status            = 'issued';
                $locked->issued_at         = now();
                $locked->version++;
                $locked->save();
                $locked->recordActivity('issued', 'Invoice '.$locked->formatted_number.' issued.', $actor);

                return $locked;
            }, 5);
            $keep = $result->seller_snapshot['logo_file']['path'] ?? null;
            foreach ($copies as $path) {
                if ($path !== $keep) {
                    Storage::disk('local')->delete($path);
                }
            }

            return $result;
        } catch (\Throwable $exception) {
            // Never remove a copy referenced by a committed result after an uncertain commit.
            try {
                $keep = $invoice->fresh()?->seller_snapshot['logo_file']['path'] ?? null;
                foreach ($copies as $path) {
                    if ($path !== $keep) {
                        Storage::disk('local')->delete($path);
                    }
                }
            } catch (\Throwable) {
            }
            throw $exception;
        }
    }
}
