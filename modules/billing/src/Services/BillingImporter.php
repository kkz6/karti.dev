<?php

namespace Modules\Billing\Services;

use Brick\Math\BigDecimal;
use Brick\Math\BigInteger;
use Carbon\CarbonImmutable;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;
use Modules\Auth\Models\User;
use Modules\Billing\Http\Requests\SaveCustomerRequest;
use Modules\Billing\Http\Requests\SaveInvoiceRequest;
use Modules\Billing\Models\Contact;
use Modules\Billing\Models\Customer;
use Modules\Billing\Models\ImportBatch;
use Modules\Billing\Models\Invoice;
use Modules\Billing\Models\Payment;
use Modules\Billing\Support\Currencies;

class BillingImporter
{
    private function rejectCredentialKeys(array $data): void
    {
        foreach ($data as $key => $value) {
            if (is_string($key) && preg_match('/password|passwd|credential|api[_-]?key|secret|(?:access|refresh|portal)[_-]?token/i', $key)) {
                throw new \InvalidArgumentException('Unsupported fields: credential keys must be removed before staging an import.');
            }
            if (is_array($value)) {
                $this->rejectCredentialKeys($value);
            }
        }
    }

    public function canonical(mixed $data): mixed
    {
        if (! is_array($data)) {
            return $data;
        }if (! array_is_list($data)) {
            ksort($data);
        }

        return array_map(fn ($v) =>$this->canonical($v), $data);
    }

    public function hash(array $data): string
    {
        return hash('sha256', json_encode($this->canonical($data), JSON_THROW_ON_ERROR));
    }

    private function mapping(string $source, string $kind, string $external)
    {
        return DB::table('billing_import_mappings')->where(compact('source', 'kind'))->where('external_id', $external)->first();
    }

    private function id(array $row, string $path): string
    {
        $id=$row['external_id'] ?? null;
        if (! is_string($id) || $id === '' || strlen($id) > 100) {
            throw new \InvalidArgumentException($path.' needs a string external_id up to 100 characters.');
        }

        return $id;
    }

    private function shape(array $row, array $allowed): void
    {
        $extra=array_diff(array_keys($row), $allowed);
        if ($extra) {
            throw new \InvalidArgumentException('Unsupported fields: '.implode(', ', $extra).'. Portal accounts, credentials and unrelated CRM data are not accepted.');
        }
    }

    private function checkMapped(string $source, string $kind, array $row): bool
    {
        $map=$this->mapping($source, $kind, $row['external_id']);
        if (! $map) {
            return false;
        }if (! hash_equals($map->source_hash, $this->hash($row))) {
            throw new \InvalidArgumentException('This mapped record changed since import. Resolve the mapping explicitly; existing records are never overwritten.');
        }$model=match ($kind) {
            'customer'=> Customer::class,'invoice'=>Invoice::class,'payment'=>Payment::class
        };
        if (! $model::find($map->destination_id)) {
            throw new \InvalidArgumentException('Mapped destination record is missing.');
        }

        return true;
    }

    private function money(string $amount, int $precision): int
    {
        try {
            $minor=BigDecimal::of($amount)->multipliedBy(10 ** $precision)->toBigInteger();
        } catch (\Throwable) {
            throw new \InvalidArgumentException('Amount is not representable in the supported currency precision.');
        }if ($minor->isNegative() || $minor->isGreaterThan(InvoiceCalculator::MAX_MINOR)) {
            throw new \InvalidArgumentException('Amount is outside the supported range.');
        }

        return $minor->toInt();
    }

    private function snapshots(array $row): void
    {
        $seller  =$row['seller_snapshot'] ?? [];
        $customer=$row['customer_snapshot'] ?? [];
        $this->shape($seller, ['display_name', 'legal_name', 'address', 'address_line_2', 'city', 'state', 'postal_code', 'country', 'tax_identifier', 'email', 'phone']);
        $this->shape($customer, ['display_name', 'legal_name', 'billing_address', 'billing_address_line_2', 'billing_city', 'billing_state', 'billing_postal_code', 'billing_country', 'tax_identifier', 'phone', 'contacts']);
        Validator::make($seller, ['legal_name'=>['required', 'string', 'max:255'], 'address'=>['required', 'string', 'max:255'], 'country'=>['required', 'regex:/^[A-Z]{2}$/'], 'email'=>['nullable', 'email:rfc', 'max:254']])->validate();
        Validator::make($customer, ['display_name'=>['required', 'string', 'max:255'], 'billing_address'=>['required', 'string', 'max:255'], 'billing_country'=>['required', 'regex:/^[A-Z]{2}$/'], 'contacts'=>['sometimes', 'array', 'max:100'], 'contacts.*.name'=>['required', 'string', 'max:255'], 'contacts.*.email'=>['required', 'email:rfc', 'max:254']])->validate();
        foreach ([$seller, $customer] as $snapshot) {
            foreach ($snapshot as $key=>$value) {
                if ($key === 'contacts') {
                    continue;
                }if ($value !== null && ! is_string($value)) {
                    throw new \InvalidArgumentException('Snapshot identity values must be strings.');
                }if (is_string($value) && mb_strlen($value) > 500) {
                    throw new \InvalidArgumentException('Snapshot identity exceeds supported length.');
                }
            }
        }
        foreach ($customer['contacts'] ?? [] as $contact) {
            $this->shape($contact, ['name', 'email', 'phone', 'primary_slot']);
        }
    }

    private function invoiceInput(array $row): array
    {
        $data=Arr::only($row, ['currency', 'invoice_date', 'due_date', 'discount_mode', 'discount_value', 'customer_note', 'internal_note', 'terms', 'payment_instructions', 'items']);
        $data['discount_mode'] ??= 'none';
        $data['discount_value'] ??= '0';
        $data['items'] ??= [];
        foreach ($data['items'] as $i=>&$item) {
            $this->shape($item, ['description', 'additional_description', 'unit', 'quantity', 'rate', 'taxes']);
            $item['key']       =$this->uuid($row['external_id'].':item:'.$i);
            $item['service_id']=null;
            foreach ($item['taxes'] as &$tax) {
                $this->shape($tax, ['name', 'percentage']);
                $tax['tax_rate_id']=null;
            }unset($tax);
        }unset($item);
        $request=new SaveInvoiceRequest;
        $request->merge($data);
        $rules=$request->rules();
        unset($rules['customer_id'],$rules['version']);
        Validator::make($data, $rules)->validate();

        return $data;
    }

    public function uuid(string $key): string
    {
        $h=hash('sha256', $key);

        return substr($h, 0, 8).'-'.substr($h, 8, 4).'-4'.substr($h, 13, 3).'-8'.substr($h, 17, 3).'-'.substr($h, 20, 12);
    }

    public function review(array $manifest): array
    {
        $report=['errors'=>[], 'warnings'=>[], 'counts'=>['customers'=>['new'=>0, 'existing'=>0], 'invoices'=>['new'=>0, 'existing'=>0], 'payments'=>['new'=>0, 'existing'=>0]], 'mapping'=>$manifest['mapping'] ?? []];
        try {
            $this->rejectCredentialKeys($manifest);
            $this->shape($manifest, ['version', 'source', 'mapping', 'customers', 'invoices', 'payments']);
            Validator::make($manifest, ['version'=>['required', 'integer', 'in:1'], 'source'=>['required', 'string', 'max:100'], 'mapping'=>['required', 'array'], 'mapping.rounding_policy'=>['required', 'in:verify'], 'mapping.timezone'=>['required', 'timezone'], 'customers'=>['present', 'array', 'list', 'max:500'], 'invoices'=>['present', 'array', 'list', 'max:500'], 'payments'=>['present', 'array', 'list', 'max:1000']])->validate();
        } catch (\Throwable $e) {
            $report['errors'][]=['path'=>'manifest', 'message'=>$e->getMessage()];

            return $report;
        }
        $source      =$manifest['source'];
        $customerRefs=[];
        $invoiceRefs =[];
        $seen        =[];
        $numbers     =[];
        $projected   =[];
        $timezone    =$manifest['mapping']['timezone'];
        foreach ($manifest['customers'] as $index=>$row) {
            $path='customers.'.$index;
            try {
                $id=$this->id($row, $path);
                if (isset($seen['customer:'.$id])) {
                    throw new \InvalidArgumentException('Duplicate source customer ID.');
                }$seen['customer:'.$id]=true;
                $this->shape($row, [...array_keys((new SaveCustomerRequest)->rules()), 'external_id', 'contacts', 'archived_at']);
                $data=Arr::except($row, ['external_id', 'contacts', 'archived_at']);
                Validator::make($data, (new SaveCustomerRequest)->rules())->validate();
                foreach ($row['contacts'] ?? [] as $contact) {
                    $this->shape($contact, ['name', 'email', 'phone', 'title', 'is_primary', 'invoice_emails', 'archived_at']);
                    Validator::make($contact, ['name'=>['required', 'string', 'max:255'], 'email'=>['nullable', 'email:rfc', 'max:254'], 'phone'=>['nullable', 'string', 'max:50'], 'title'=>['nullable', 'string', 'max:100'], 'is_primary'=>['sometimes', 'boolean'], 'invoice_emails'=>['sometimes', 'boolean'], 'archived_at'=>['nullable', 'date']])->validate();
                }if (collect($row['contacts'] ?? [])->filter(fn ($c) =>($c['is_primary'] ?? false) && empty($c['archived_at']))->count() > 1) {
                    throw new \InvalidArgumentException('Multiple active primary contacts.');
                }if (! empty($row['archived_at'])) {
                    CarbonImmutable::parse($row['archived_at'], $timezone);
                }$existing        =$this->checkMapped($source, 'customer', $row);
                $customerRefs[$id]=true;
                $report['counts']['customers'][$existing ? 'existing' : 'new']++;
            } catch (\Throwable $e) {
                $report['errors'][]=['path'=>$path, 'message'=>$e->getMessage()];
            }
        }
        foreach ($manifest['invoices'] as $index=>$row) {
            $path='invoices.'.$index;
            try {
                $id=$this->id($row, $path);
                if (isset($seen['invoice:'.$id])) {
                    throw new \InvalidArgumentException('Duplicate source invoice ID.');
                }$seen['invoice:'.$id]=true;
                $this->shape($row, ['external_id', 'customer_external_id', 'number', 'status', 'currency', 'currency_precision', 'invoice_date', 'due_date', 'issued_at', 'cancelled_at', 'cancellation_reason', 'discount_mode', 'discount_value', 'customer_note', 'internal_note', 'terms', 'payment_instructions', 'items', 'subtotal', 'discount', 'tax', 'total', 'seller_snapshot', 'customer_snapshot']);
                Validator::make($row, ['customer_external_id'=>['required', 'string'], 'number'=>['required', 'string', 'max:100'], 'status'=>['required', 'in:issued,cancelled'], 'issued_at'=>['required', 'date'], 'cancelled_at'=>['required_if:status,cancelled', 'nullable', 'date'], 'cancellation_reason'=>['required_if:status,cancelled', 'nullable', 'string', 'min:3', 'max:2000'], 'subtotal'=>['required', 'string'], 'discount'=>['required', 'string'], 'tax'=>['required', 'string'], 'total'=>['required', 'string']])->validate();
                if (! isset($customerRefs[$row['customer_external_id']]) && ! $this->mapping($source, 'customer', $row['customer_external_id'])) {
                    throw new \InvalidArgumentException('Customer source ID is not mapped or present.');
                }
                $this->snapshots($row);
                $input =$this->invoiceInput($row);
                $totals=app(InvoiceCalculator::class)->calculate($input);
                if (isset($row['currency_precision']) && (int) $row['currency_precision'] !== $totals['precision']) {
                    throw new \InvalidArgumentException('Historical precision differs from supported currency metadata; mapping requires review.');
                }foreach (['subtotal', 'discount', 'tax', 'total'] as $field) {
                    if ($this->money($row[$field], $totals['precision']) !== $totals[$field.'_minor']) {
                        throw new \InvalidArgumentException('Source '.$field.' differs from native calculated totals. Resolve rounding or unsupported adjustments before import.');
                    }
                }
                if (isset($numbers[$row['number']])) {
                    throw new \InvalidArgumentException('Duplicate original invoice number.');
                }$numbers[$row['number']]=true;
                $existing                =$this->checkMapped($source, 'invoice', $row);
                if (! $existing && Invoice::where('formatted_number', $row['number'])->exists()) {
                    throw new \InvalidArgumentException('Original invoice number already exists in this database.');
                }
                if (preg_match('/(\d+)$/', $row['number'], $match) && BigInteger::of($match[1])->isGreaterThanOrEqualTo(PHP_INT_MAX)) {
                    throw new \InvalidArgumentException('Original numeric suffix exceeds the sequence limit.');
                }
                $map             =$this->mapping($source, 'invoice', $id);
                $invoiceRefs[$id]=['currency'=>$row['currency'], 'precision'=>$totals['precision'], 'total'=>$totals['total_minor'], 'status'=>$row['status'], 'date'=>$row['invoice_date'], 'destination_id'=>$map?->destination_id];
                $projected[$id]  =BigInteger::zero();
                if ($map) {
                    foreach (Payment::where('invoice_id', $map->destination_id)->whereNull('reversed_at')->get() as $payment) {
                        $projected[$id]=$projected[$id]->plus($payment->amount_minor);
                    }
                } $report['counts']['invoices'][$existing ? 'existing' : 'new']++;
            } catch (\Throwable $e) {
                $report['errors'][]=['path'=>$path, 'message'=>$e->getMessage()];
            }
        }
        foreach ($manifest['payments'] as $index=>$row) {
            $path='payments.'.$index;
            try {
                $id=$this->id($row, $path);
                if (isset($seen['payment:'.$id])) {
                    throw new \InvalidArgumentException('Duplicate source payment ID.');
                }$seen['payment:'.$id]=true;
                $this->shape($row, ['external_id', 'invoice_external_id', 'amount', 'currency', 'payment_date', 'method_label', 'reference', 'notes', 'actor_name', 'created_at', 'reversed_at', 'reversal_date', 'reversal_reason']);
                Validator::make($row, ['invoice_external_id'=>['required', 'string'], 'amount'=>['required', 'string'], 'currency'=>['required', \Illuminate\Validation\Rule::in(Currencies::codes())], 'payment_date'=>['required', 'date_format:Y-m-d'], 'method_label'=>['required', 'string', 'max:100'], 'reference'=>['nullable', 'string', 'max:255'], 'notes'=>['nullable', 'string', 'max:2000'], 'actor_name'=>['nullable', 'string', 'max:255'], 'created_at'=>['required', 'date'], 'reversed_at'=>['nullable', 'date'], 'reversal_date'=>['required_with:reversed_at', 'nullable', 'date_format:Y-m-d'], 'reversal_reason'=>['required_with:reversed_at', 'nullable', 'string', 'min:3', 'max:2000']])->validate();
                $ref=$row['invoice_external_id'];
                if (! isset($invoiceRefs[$ref])) {
                    $map    =$this->mapping($source, 'invoice', $ref);
                    $invoice=$map ? Invoice::find($map->destination_id) : null;
                    if (! $invoice) {
                        throw new \InvalidArgumentException('Invoice source ID is not mapped or present.');
                    }$invoiceRefs[$ref]=['currency'=>$invoice->currency, 'precision'=>$invoice->currency_precision, 'total'=>$invoice->total_minor, 'status'=>$invoice->status, 'date'=>$invoice->invoice_date->format('Y-m-d'), 'destination_id'=>$invoice->id];
                    $projected[$ref]   =BigInteger::zero();
                    foreach (Payment::where('invoice_id', $invoice->id)->whereNull('reversed_at')->get() as $payment) {
                        $projected[$ref]=$projected[$ref]->plus($payment->amount_minor);
                    }
                }
                $invoice=$invoiceRefs[$ref];
                $minor  =$this->money($row['amount'], $invoice['precision']);
                if ($minor <= 0 || $row['currency'] !== $invoice['currency'] || $row['payment_date'] < $invoice['date'] || $row['payment_date'] > now($timezone)->format('Y-m-d')) {
                    throw new \InvalidArgumentException('Payment amount, currency or date does not match its invoice.');
                }$existing=$this->checkMapped($source, 'payment', $row);
                if (! $existing && empty($row['reversed_at'])) {
                    if ($invoice['status'] !== 'issued') {
                        throw new \InvalidArgumentException('Cancelled invoice has an active payment.');
                    }$projected[$ref]=$projected[$ref]->plus($minor);
                    if ($projected[$ref]->isGreaterThan($invoice['total'])) {
                        throw new \InvalidArgumentException('Source payments exceed the supported invoice balance. Map overpayment handling explicitly.');
                    }
                }if (! empty($row['reversal_date']) && $row['reversal_date'] < $row['payment_date']) {
                    throw new \InvalidArgumentException('Reversal precedes the payment.');
                }$report['counts']['payments'][$existing ? 'existing' : 'new']++;
            } catch (\Throwable $e) {
                $report['errors'][]=['path'=>$path, 'message'=>$e->getMessage()];
            }
        }
        $report['warnings'][]='This importer accepts explicitly mapped customer, issued/cancelled invoice and payment data only. Credit notes, credits, adjustments, provider charges and unsupported precision must be reconciled separately; they are never silently discarded.';

        return $report;
    }

    public function stage(array $manifest, User $actor): ImportBatch
    {
        $report=$this->review($manifest);
        foreach ($report['errors'] as $error) {
            if (str_contains($error['message'], 'Unsupported fields:')) {
                throw ValidationException::withMessages(['file' => $error['path'].': '.$error['message']]);
            }
        }
        $source=is_string($manifest['source'] ?? null) ? substr($manifest['source'], 0, 100) : 'invalid';

        return ImportBatch::firstOrCreate(['source'=>$source, 'input_hash'=>$this->hash($manifest)], ['manifest'=>$manifest, 'report'=>$report, 'actor_id'=>$actor->id]);
    }

    public function token(ImportBatch $batch): string
    {
        return hash_hmac('sha256', $batch->id.'|'.$batch->input_hash, config('app.key'));
    }

    private function remember(string $source, string $kind, array $row, int $id): void
    {
        DB::table('billing_import_mappings')->insert(['source'=>$source, 'kind'=>$kind, 'external_id'=>$row['external_id'], 'destination_id'=>$id, 'source_hash'=>$this->hash($row), 'created_at'=>now(), 'updated_at'=>now()]);
    }

    public function commit(ImportBatch $batch, string $token, User $actor): ImportBatch
    {
        if (! hash_equals($this->token($batch), $token)) {
            throw ValidationException::withMessages(['token'=>'The reviewed import token is invalid.']);
        }

        return DB::transaction(function () use ($batch, $actor) {
            if (DB::connection()->getDriverName() === 'sqlite') {
                DB::table('billing_import_batches')->where('id', $batch->id)->update(['state'=>DB::raw('state')]);
            }$batch=ImportBatch::whereKey($batch->id)->lockForUpdate()->firstOrFail();
            if ($batch->state === 'imported') {
                return $batch;
            }$manifest=$batch->manifest;
            $report   =$this->review($manifest);
            if ($report['errors']) {
                throw ValidationException::withMessages(['import'=>'Dry-run validation failed. Reconcile the reported source rows first.']);
            }$source =$manifest['source'];
            $timezone=$manifest['mapping']['timezone'];
            $archives=[];
            foreach ($manifest['customers'] as $row) {
                if ($this->mapping($source, 'customer', $row['external_id'])) {
                    continue;
                }$data   =Arr::except($row, ['external_id', 'contacts', 'archived_at']);
                $customer=Customer::create($data);
                foreach ($row['contacts'] ?? [] as $contact) {
                    $primary=($contact['is_primary'] ?? false) && empty($contact['archived_at']);
                    (new Contact)->forceFill([...Arr::except($contact, ['is_primary', 'archived_at']), 'customer_id'=>$customer->id, 'primary_slot'=>$primary ? 1 : null, 'archived_at'=>empty($contact['archived_at']) ? null : CarbonImmutable::parse($contact['archived_at'], $timezone)->utc()])->save();
                }if (! empty($row['archived_at'])) {
                    $archives[]=[$customer, CarbonImmutable::parse($row['archived_at'], $timezone)->utc()];
                }$this->remember($source, 'customer', $row, $customer->id);
            }
            foreach ($manifest['invoices'] as $row) {
                if ($this->mapping($source, 'invoice', $row['external_id'])) {
                    continue;
                }$input    =$this->invoiceInput($row);
                $totals    =app(InvoiceCalculator::class)->calculate($input);
                $customerId=$this->mapping($source, 'customer', $row['customer_external_id'])->destination_id;
                $invoice   =new Invoice;
                $invoice->forceFill([...Arr::except($input, ['items']), 'customer_id'=>$customerId, 'customer_name'=>$row['customer_snapshot']['display_name'], 'seller_snapshot'=>$row['seller_snapshot'], 'customer_snapshot'=>$row['customer_snapshot'], 'status'=>$row['status'], 'formatted_number'=>$row['number'], 'currency_precision'=>$totals['precision'], 'version'=>1, 'subtotal_minor'=>$totals['subtotal_minor'], 'discount_minor'=>$totals['discount_minor'], 'tax_minor'=>$totals['tax_minor'], 'total_minor'=>$totals['total_minor'], 'issued_at'=>CarbonImmutable::parse($row['issued_at'], $timezone)->utc(), 'cancelled_at'=>empty($row['cancelled_at']) ? null : CarbonImmutable::parse($row['cancelled_at'], $timezone)->utc(), 'cancellation_reason'=>$row['cancellation_reason'] ?? null]);
                $invoice->save();
                foreach ($input['items'] as $position=>$line) {
                    $t   =$totals['lines'][$position];
                    $item=$invoice->items()->create([...Arr::except($line, ['taxes']), 'position'=>$position, ...Arr::only($t, ['gross_minor', 'discount_minor', 'net_minor', 'tax_minor', 'total_minor'])]);
                    foreach ($line['taxes'] as $n=>$tax) {
                        $item->taxes()->create([...$tax, 'amount_minor'=>$t['taxes'][$n]['amount_minor']]);
                    }
                }$invoice->recordActivity('imported', 'Imported from '.$source.' invoice '.$row['external_id'].'.', $actor);
                $this->remember($source, 'invoice', $row, $invoice->id);
            }
            foreach ($manifest['payments'] as $row) {
                if ($this->mapping($source, 'payment', $row['external_id'])) {
                    continue;
                }$invoice=Invoice::findOrFail($this->mapping($source, 'invoice', $row['invoice_external_id'])->destination_id);
                $minor   =$this->money($row['amount'], $invoice->currency_precision);
                $key     =$this->uuid($source.':payment:'.$row['external_id']);
                $payment =Payment::create(['invoice_id'=>$invoice->id, 'request_key'=>$key, 'request_hash'=>$this->hash($row), 'amount_minor'=>$minor, 'currency'=>$invoice->currency, 'currency_precision'=>$invoice->currency_precision, 'payment_date'=>$row['payment_date'], 'method'=>'imported', 'method_label'=>$row['method_label'], 'reference'=>$row['reference'] ?? null, 'notes'=>$row['notes'] ?? null, 'actor_id'=>$actor->id, 'actor_name'=>$row['actor_name'] ?? 'Imported record', 'created_at'=>CarbonImmutable::parse($row['created_at'], $timezone)->utc(), 'reversed_at'=>empty($row['reversed_at']) ? null : CarbonImmutable::parse($row['reversed_at'], $timezone)->utc(), 'reversal_date'=>$row['reversal_date'] ?? null, 'reversal_reason'=>$row['reversal_reason'] ?? null, 'reversed_by'=>empty($row['reversed_at']) ? null : $actor->id, 'reversed_by_name'=>empty($row['reversed_at']) ? null : 'Imported reversal']);
                $this->remember($source, 'payment', $row, $payment->id);
                $invoice->increment('version');
            }
            foreach ($archives as [$customer,$date]) {
                $customer->forceFill(['archived_at'=>$date])->save();
            }
            $seq =DB::table('billing_invoice_sequences')->where('scope', 'invoices')->lockForUpdate()->firstOrFail();
            $next=BigInteger::of($seq->next_number);
            foreach (Invoice::whereNotNull('formatted_number')->pluck('formatted_number') as $number) {
                if (preg_match('/(\d+)$/', $number, $match)) {
                    $next=BigInteger::max($next, BigInteger::of($match[1])->plus(1));
                }
            }DB::table('billing_invoice_sequences')->where('scope', 'invoices')->update(['next_number'=>$next->toInt()]);
            $batch->update(['state'=>'imported', 'imported_at'=>now(), 'report'=>$report, 'actor_id'=>$actor->id]);

            return $batch;
        }, 5);
    }
}
