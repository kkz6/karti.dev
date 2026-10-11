<?php

namespace Modules\Billing\Services\Imports;

use Brick\Math\BigDecimal;
use Brick\Math\BigInteger;
use Carbon\CarbonImmutable;
use Illuminate\Support\Arr;
use Modules\Billing\Services\BillingImporter;
use Modules\Billing\Services\InvoiceCalculator;
use Modules\Billing\Support\Currencies;
use RuntimeException;

/** A deliberately strict adapter: unsupported financial history stops the import. */
class PerfexImportPlan
{
    private array $tables;

    private array $options;

    private array $countries;

    private array $currencies;

    private string $timezone;

    private string $defaultCurrency;

    public function build(array $tables, string $source): array
    {
        $this->require((bool) preg_match('/^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,99}$/D', $source), 'Use a stable source name of up to 100 letters, numbers, dots, underscores or hyphens.');
        foreach (['tblclients', 'tblcontacts', 'tblinvoices', 'tblitemable', 'tblinvoicepaymentrecords', 'tblcurrencies', 'tblcountries', 'tbloptions'] as $table) {
            $this->require(array_key_exists($table, $tables), 'Missing required table: '.$table);
        }
        foreach (['tblcreditnotes', 'tblcredits', 'tblcreditnote_refunds', 'tblsubscriptions', 'tblestimates', 'tblproposals', 'tblcontracts', 'tblprojects', 'tblfiles', 'tblproject_files'] as $table) {
            $this->require(empty($tables[$table]), $table.' needs an additional migration adapter. No records were imported.');
        }
        $this->tables   = $tables;
        $this->options  = array_column($tables['tbloptions'], 'value', 'name');
        $this->timezone = $this->options['default_timezone'] ?? '';
        $this->require(in_array($this->timezone, timezone_identifiers_list(), true), 'The source timezone is missing or unsupported.');
        $this->countries  = array_column($tables['tblcountries'], 'iso2', 'country_id');
        $this->currencies = array_column($tables['tblcurrencies'], 'name', 'id');
        $defaults         = array_values(array_filter($tables['tblcurrencies'], fn ($r) => $r['isdefault'] === '1'));
        $this->require(count($defaults) === 1, 'Exactly one source base currency is required.');
        $this->defaultCurrency = $this->currency($defaults[0]['id']);
        $records               = array_fill_keys(['customer', 'contact', 'tax', 'service', 'invoice', 'payment', 'activity'], []);
        $customers             = $this->indexed('tblclients', 'userid');
        $contacts              = $this->indexed('tblcontacts');
        $invoices              = $this->indexed('tblinvoices');
        $staff                 = $this->indexed('tblstaff', 'staffid');
        $modes                 = $this->indexed('tblpayment_modes');
        foreach ($customers as $id => $row) {
            $data = [
                'type'                => 'business', 'display_name' => $this->text($row['company'], 255, true), 'legal_name' => $row['company'],
                'phone'               => $this->text($row['phonenumber'], 50), 'website' => $this->text($row['website'], 500), 'tax_identifier' => $this->text($row['vat'], 100),
                'billing_address'     => $this->text($row['billing_street'] ?: $row['address'], 255),
                'billing_city'        => $this->text($row['billing_city'] ?: $row['city'], 100),
                'billing_state'       => $this->text($row['billing_state'] ?: $row['state'], 100),
                'billing_postal_code' => $this->text($row['billing_zip'] ?: $row['zip'], 30),
                'billing_country'     => $this->country($row['billing_country'] ?: $row['country']),
                'default_currency'    => $row['default_currency'] ? $this->currency($row['default_currency']) : $this->defaultCurrency,
                'internal_notes'      => implode("\n\n", array_map(fn ($n) => $this->plainText($n['description']), $this->related('tblnotes', 'customer', $id))),
                'created_at'          => $this->timestamp($row['datecreated']), 'updated_at' => $this->timestamp($row['datecreated']),
            ];
            $records['customer'][$id] = ['attributes' => $data, 'archive_on_import' => $row['active'] !== '1'];
        }
        $primary = [];
        foreach ($contacts as $id => $row) {
            $this->require(isset($customers[$row['userid']]), 'Contact '.$id.' has no source customer.');
            $isPrimary = $row['is_primary'] === '1' && $row['active'] === '1';
            $this->require(! $isPrimary || empty($primary[$row['userid']]), 'Customer '.$row['userid'].' has multiple active primary contacts.');
            $primary[$row['userid']] = ($primary[$row['userid']] ?? false) || $isPrimary;
            $records['contact'][$id] = ['links' => ['customer_id' => ['customer', $row['userid']]], 'archive_on_import' => $row['active'] !== '1', 'attributes' => [
                'name'         => $this->text(trim($row['firstname'].' '.$row['lastname']), 255, true), 'email' => $this->text($row['email'], 254, true),
                'phone'        => $this->text($row['phonenumber'], 50), 'title' => $this->text($row['title'], 100),
                'primary_slot' => $isPrimary ? 1 : null, 'invoice_emails' => $row['invoice_emails'] === '1',
                'created_at'   => $this->timestamp($row['datecreated']), 'updated_at' => $this->timestamp($row['datecreated']),
            ]];
        }
        foreach ($this->indexed('tbltaxes') as $id => $row) {
            $records['tax'][$id] = ['attributes' => ['name' => $this->text($row['name'], 100, true), 'percentage' => $this->decimal($row['taxrate'], 7, 4)]];
        }
        foreach ($this->indexed('tblitems') as $id => $row) {
            foreach ($this->currencies as $currencyId => $currency) {
                $rate = $currency === $this->defaultCurrency ? $row['rate'] : ($row['rate_currency_'.$currencyId] ?? null);
                if ($rate === null) {
                    continue;
                }
                $taxes = array_values(array_filter([$row['tax'] ?? null, $row['tax2'] ?? null]));
                foreach ($taxes as $tax) {
                    $this->require(isset($records['tax'][$tax]), 'Catalogue item '.$id.' has an unknown tax.');
                }
                $records['service'][$id.':'.$currency] = ['taxes' => array_values(array_unique($taxes)), 'attributes' => [
                    'name' => $this->text($row['description'], 255, true), 'description' => $this->plainText($row['long_description']),
                    'unit' => $this->text($row['unit'], 50) ?? '', 'rate' => $this->decimal($rate, 19, 4), 'currency' => $this->currency($currencyId),
                ]];
            }
        }
        $configuredNext = BigInteger::of($this->options['next_invoice_number'] ?? '1');
        $this->require($configuredNext->isPositive() && $configuredNext->isLessThan(PHP_INT_MAX), 'Invalid configured invoice sequence.');
        $numbers = [];
        $totals  = [];
        foreach ($invoices as $id => $row) {
            $this->require(isset($customers[$row['clientid']]), 'Invoice '.$id.' has no source customer.');
            $this->require(in_array($row['status'], ['1', '2', '3', '4', '5'], true), 'Invoice '.$id.' has an unsupported status.');
            $this->require((int) $row['recurring'] === 0, 'Invoice '.$id.' has a recurring schedule that needs explicit migration.');
            $this->require(BigDecimal::of($row['adjustment'])->isZero(), 'Invoice '.$id.' has an unsupported adjustment.');
            $currency           = $this->currency($row['currency']);
            $number             = $this->number($row);
            $numbers[$number][] = (string) $id;
            $items              = [];
            foreach (collect($this->related('tblitemable', 'invoice', $id))->sortBy('item_order')->values() as $line) {
                $taxes = [];
                foreach ($this->related('tblitem_tax', 'invoice', $id) as $tax) {
                    if ($tax['itemid'] === $line['id']) {
                        $taxes[] = ['name' => $this->text($tax['taxname'], 100, true), 'percentage' => $this->decimal($tax['taxrate'], 7, 4), 'tax_rate_id' => null];
                    }
                }
                $items[] = ['key'            => app(BillingImporter::class)->uuid($source.':item:'.$line['id']), 'description' => $this->text($line['description'], 1000, true),
                    'additional_description' => $this->plainText($line['long_description']), 'unit' => $this->text($line['unit'], 50) ?? '', 'quantity' => $this->decimal($line['qty'], 12, 4),
                    'rate'                   => $this->decimal($line['rate'], 19, 4), 'taxes' => $taxes];
            }
            $this->require(count($items) > 0, 'Invoice '.$id.' has no line items.');
            $input      = ['currency' => $currency, 'discount_mode' => BigDecimal::of($row['discount_total'])->isZero() ? 'none' : 'fixed', 'discount_value' => $this->decimal($row['discount_total'], 14, 4), 'items' => $items];
            $calculated = app(InvoiceCalculator::class)->calculate($input);
            foreach (['subtotal' => 'subtotal', 'discount' => 'discount_total', 'tax' => 'total_tax', 'total' => 'total'] as $native => $legacy) {
                $this->require($this->minor($row[$legacy], $calculated['precision']) === $calculated[$native.'_minor'], 'Invoice '.$id.' '.$native.' does not reconcile exactly.');
            }
            $customer                = $customers[$row['clientid']];
            $cancelEvents            = collect($this->related('tblsales_activity', 'invoice', $id))->where('description', 'invoice_activity_marked_as_cancelled')->sortByDesc('date');
            $cancelled               = $row['status'] === '5';
            $records['invoice'][$id] = ['links' => ['customer_id' => ['customer', $row['clientid']]], 'items' => $items, 'calculated' => $calculated, 'attributes' => [
                'status'        => $cancelled ? 'cancelled' : 'issued', 'formatted_number' => $number, 'number_scope' => 'legacy:'.hash('sha256', $source."\0".$id), 'customer_name' => $customer['company'],
                'invoice_date'  => $this->date($row['date']), 'due_date' => $row['duedate'] ? $this->date($row['duedate']) : null,
                'currency'      => $currency, 'currency_precision' => $calculated['precision'], 'version' => 1,
                'number_prefix' => $this->text($row['prefix'], 20), 'number_padding' => (int) ($this->options['number_padding_prefixes'] ?? 6),
                'discount_mode' => $input['discount_mode'], 'discount_value' => $input['discount_value'],
                ...Arr::only($calculated, ['subtotal_minor', 'discount_minor', 'tax_minor', 'total_minor']),
                'customer_snapshot' => ['display_name' => $customer['company'], 'legal_name' => $customer['company'], 'tax_identifier' => $customer['vat'],
                    'billing_address'                  => $row['billing_street'], 'billing_city' => $row['billing_city'], 'billing_state' => $row['billing_state'],
                    'billing_postal_code'              => $row['billing_zip'], 'billing_country' => $this->country($row['billing_country']), 'phone' => $customer['phonenumber'],
                    'contacts'                         => array_values(array_map(fn ($c) => ['name' => trim($c['firstname'].' '.$c['lastname']), 'email' => $c['email'], 'phone' => $c['phonenumber']], array_filter($contacts, fn ($c) => $c['userid'] === $row['clientid'])))],
                'seller_snapshot' => $this->seller(), 'customer_note' => $this->plainText($row['clientnote']), 'internal_note' => $this->plainText($row['adminnote']), 'terms' => $this->plainText($row['terms']),
                // Historical import must never wake overdue reminders for old invoices.
                'reminders_disabled'  => true,
                'issued_at'           => $this->timestamp($row['datecreated']), 'created_at' => $this->timestamp($row['datecreated']), 'updated_at' => $this->timestamp($row['datecreated']),
                'cancelled_at'        => $cancelEvents->isNotEmpty() ? $this->timestamp($cancelEvents->first()['date']) : null,
                'cancellation_reason' => $cancelled ? 'Cancelled in the source system; see imported activity.' : null,
            ]];
            $state                     = $cancelled ? 'cancelled' : 'issued';
            $totals[$currency][$state] = (string) BigInteger::of($totals[$currency][$state] ?? 0)->plus($calculated['total_minor']);
        }
        $paid = [];
        foreach ($this->indexed('tblinvoicepaymentrecords') as $id => $row) {
            $invoice = $records['invoice'][$row['invoiceid']]['attributes'] ?? null;
            $this->require($invoice !== null, 'Payment '.$id.' has no source invoice.');
            $amount = $this->minor($row['amount'], $invoice['currency_precision']);
            $this->require($amount > 0 && $invoice['status'] === 'issued', 'Payment '.$id.' has an unsupported amount or cancelled invoice.');
            $paid[$row['invoiceid']]              = BigInteger::of($paid[$row['invoiceid']] ?? 0)->plus($amount)->toInt();
            $totals[$invoice['currency']]['paid'] = (string) BigInteger::of($totals[$invoice['currency']]['paid'] ?? 0)->plus($amount);
            $records['payment'][$id]              = ['links' => ['invoice_id' => ['invoice', $row['invoiceid']]], 'attributes' => [
                'request_key'  => app(BillingImporter::class)->uuid($source.':payment:'.$id), 'request_hash' => app(BillingImporter::class)->hash($row),
                'amount_minor' => $amount, 'currency' => $invoice['currency'], 'currency_precision' => $invoice['currency_precision'], 'payment_date' => $this->date($row['date']),
                'method'       => 'imported', 'method_label' => $this->text($modes[$row['paymentmode']]['name'] ?? ucfirst($row['paymentmode']), 255, true),
                'reference'    => $this->text($row['transactionid'], 255), 'notes' => $this->plainText($row['note']), 'actor_name' => 'Imported from Perfex', 'created_at' => $this->timestamp($row['daterecorded']),
            ]];
        }
        foreach ($invoices as $id => $row) {
            $total  = $records['invoice'][$id]['attributes']['total_minor'];
            $amount = $paid[$id] ?? 0;
            $this->require($amount <= $total, 'Invoice '.$id.' is overpaid and needs explicit handling.');
            $this->require(match ($row['status']) {
                '2' => $amount === $total, '3' => $amount > 0 && $amount < $total, default => $amount === 0,
            }, 'Invoice '.$id.' status does not reconcile with its payments.');
        }
        foreach (collect($this->indexed('tblsales_activity'))->sortBy('date') as $id => $row) {
            $this->require($row['rel_type'] === 'invoice' && isset($invoices[$row['rel_id']]), 'Activity '.$id.' has an unsupported relation.');
            $actor                    = $staff[$row['staffid']] ?? null;
            $records['activity'][$id] = ['links' => ['invoice_id' => ['invoice', $row['rel_id']]], 'attributes' => [
                'actor_name' => $this->text($row['full_name'] ?: ($actor ? trim($actor['firstname'].' '.$actor['lastname']) : 'Perfex'), 255, true),
                'event'      => 'legacy_activity', 'description' => $this->activityDescription($row), 'created_at' => $this->timestamp($row['date']),
            ]];
        }
        // Catch dangling line/tax/history references rather than silently losing them.
        foreach (['tblitemable', 'tblitem_tax', 'tbltracked_mails', 'tblviews_tracking'] as $table) {
            foreach ($tables[$table] ?? [] as $row) {
                $this->require($row['rel_type'] === 'invoice' && isset($invoices[$row['rel_id']]), $table.' contains an unsupported relation.');
                if ($table === 'tblitem_tax') {
                    $this->require(collect($this->related('tblitemable', 'invoice', $row['rel_id']))->contains('id', $row['itemid']), 'Tax references a missing invoice item.');
                }
            }
        }
        foreach ($totals as $currency => &$values) {
            $values = array_map(fn ($value) => InvoiceCalculator::money($value, Currencies::DEFINITIONS[$currency]['precision']), $values);
        }
        unset($values);
        $archive = $this->archive();

        return ['format'          => 'perfex-sql-v1', 'source' => $source, 'duplicate_numbers' => array_filter($numbers, fn ($ids) => count($ids) > 1), 'timezone' => $this->timezone, 'records' => $records, 'archive' => $archive,
            'next_number'         => max((int) ($this->options['next_invoice_number'] ?? 1), max(array_column($invoices, 'number') ?: [0]) + 1),
            'totals'              => $totals,
            'inventory'           => array_map('count', $archive),
            'excluded_row_counts' => array_filter(array_map(fn ($name) => count($tables[$name]) - count($archive[$name] ?? []), array_combine(array_keys($tables), array_keys($tables)))),
            'excluded_tables'     => array_keys(array_filter($tables, fn ($rows, $name) => count($rows) > 0 && ! array_key_exists($name, $archive), ARRAY_FILTER_USE_BOTH)),
            'warnings'            => [
                'Source company settings and current customer identity supply historical names; Perfex does not retain immutable identity snapshots. Original invoice address blanks remain blank.',
                'Customer billing addresses fall back to their general address when missing. Source customer types are not recorded; imported customers use Business.',
                'Imported invoices have automated reminders paused. No accounts, emails, payment requests or recurring schedules are created.',
                'Email/view tracking, customer notes, expenses, task details and other supplementary business fields are retained in the encrypted source archive; they do not become live email deliveries, tasks or expenses.',
                'Original HTML is kept in the source archive; native descriptions and notes are converted to readable plain text. Invoice numbering advances above the highest historical number to avoid future collisions.',
                'Inactive flags use the migration time as the archive time because the source has no archive timestamp. Source invoice creation time is retained as issuance time.',
            ]];
    }

    private function archive(): array
    {
        $tables  = ['tblclients', 'tblcontacts', 'tblcontact_permissions', 'tblcustomer_admins', 'tblinvoices', 'tblinvoicepaymentrecords', 'tblitemable', 'tblitem_tax', 'tblitems', 'tblitems_groups', 'tbltaxes', 'tblcurrencies', 'tblcountries', 'tblpayment_modes', 'tblsales_activity', 'tbltracked_mails', 'tblviews_tracking', 'tblnotes', 'tblexpenses', 'tblexpenses_categories', 'tbltasks', 'tbltask_assigned', 'tbltask_followers', 'tbltask_comments', 'tbltask_checklist_items', 'tbltaskstimers', 'tbltags', 'tbltaggables', 'tblcustomfields', 'tblcustomfieldsvalues'];
        $archive = Arr::only($this->tables, $tables);
        // Authentication and share-link secrets are deliberately not portable.
        $archive['tblcontacts']      = array_map(fn ($r) => Arr::only($r, ['id', 'userid', 'is_primary', 'firstname', 'lastname', 'email', 'phonenumber', 'title', 'datecreated', 'active', 'direction', 'invoice_emails', 'estimate_emails', 'credit_note_emails', 'contract_emails', 'task_emails', 'project_emails', 'ticket_emails']), $archive['tblcontacts']);
        $archive['tblinvoices']      = array_map(fn ($r) => Arr::except($r, ['hash', 'token', 'short_link']), $archive['tblinvoices']);
        $archive['tbltracked_mails'] = array_map(fn ($r) => Arr::except($r, ['uid']), $archive['tbltracked_mails'] ?? []);
        $archive['tblnotifications'] = array_values(array_filter($this->tables['tblnotifications'] ?? [], fn ($r) => preg_match('~^invoices/list_invoices/[0-9]+$~D', $r['link']) || preg_match('~^#taskid=[0-9]+$~D', $r['link'])));
        $archive['tblstaff']         = array_map(fn ($r) => Arr::only($r, ['staffid', 'firstname', 'lastname']), $this->tables['tblstaff'] ?? []);
        $archive['tbloptions']       = array_values(array_filter($this->tables['tbloptions'], fn ($r) => in_array($r['name'], ['companyname', 'default_timezone', 'invoice_company_name', 'invoice_company_address', 'invoice_company_city', 'invoice_company_country_code', 'invoice_company_postal_code', 'invoice_company_phonenumber', 'company_vat', 'next_invoice_number', 'number_padding_prefixes', 'invoice_prefix', 'invoice_number_format', 'predefined_terms_invoice', 'predefined_clientnote_invoice'], true)));

        foreach ($archive as &$rows) {
            $rows = array_map(fn ($row) => array_filter($row, fn ($key) => ! preg_match('/password|passwd|secret|api[_-]?key|(?:access|refresh|portal)[_-]?token|verification_key|new_pass/i', $key), ARRAY_FILTER_USE_KEY), $rows);
        }
        unset($rows);

        return $archive;
    }

    private function seller(): array
    {
        $o = $this->options;

        return ['display_name' => $o['invoice_company_name'] ?? $o['companyname'] ?? '', 'legal_name' => $o['invoice_company_name'] ?? $o['companyname'] ?? '',
            'address'          => $o['invoice_company_address'] ?? '', 'city' => $o['invoice_company_city'] ?? '', 'country' => $o['invoice_company_country_code'] ?? '',
            'postal_code'      => $o['invoice_company_postal_code'] ?? '', 'phone' => $o['invoice_company_phonenumber'] ?? '', 'tax_identifier' => $o['company_vat'] ?? ''];
    }

    private function indexed(string $table, string $key = 'id'): array
    {
        $result = [];
        foreach ($this->tables[$table] ?? [] as $row) {
            $id = $row[$key] ?? '';
            $this->require((bool) preg_match('/^[1-9][0-9]*$/D', $id) && ! isset($result[$id]), 'Missing or duplicate source ID in '.$table.'.');
            $result[$id] = $row;
        }

        return $result;
    }

    private function related(string $table, string $type, int|string $id): array
    {
        return array_values(array_filter($this->tables[$table] ?? [], fn ($r) => $r['rel_type'] === $type && (string) $r['rel_id'] === (string) $id));
    }

    private function number(array $row): string
    {
        $sequence = BigInteger::of($row['number']);
        $this->require($sequence->isPositive() && $sequence->isLessThan(PHP_INT_MAX), 'Invalid source invoice sequence.');
        $padding = (int) ($this->options['number_padding_prefixes'] ?? 6);
        $this->require($padding >= 1 && $padding <= 20, 'Invalid invoice number padding.');
        $date   = $this->date($row['date']);
        $n      = str_pad($row['number'], $padding, '0', STR_PAD_LEFT);
        $number = $row['prefix'].match ($row['number_format']) {
            '1'     => $n, '2' => substr($date, 0, 4).'/'.$n, '3' => $n.'-'.substr($date, 2, 2), '4' => $n.'/'.substr($date, 5, 2).'/'.substr($date, 0, 4),
            default => throw new RuntimeException('Unsupported invoice number format.'),
        };
        $this->require(empty($row['formatted_number']) || $row['formatted_number'] === $number, 'Source cached invoice number differs from its numbering rules at invoice '.$row['id'].'.');

        return $this->text($number, 255, true);
    }

    private function currency(string $id): string
    {
        $code = $this->currencies[$id] ?? '';
        $this->require(isset(Currencies::DEFINITIONS[$code]), 'Unsupported source currency ID '.$id.'.');

        return $code;
    }

    private function country(?string $id): ?string
    {
        if (! $id) {
            return null;
        }
        $this->require(isset($this->countries[$id]), 'Unknown source country ID '.$id.'.');

        return $this->countries[$id];
    }

    private function timestamp(string $value): string
    {
        $this->require((bool) preg_match('/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/D', $value), 'Invalid source timestamp.');
        $date = CarbonImmutable::createFromFormat('!Y-m-d H:i:s', $value, $this->timezone);
        $this->require($date->format('Y-m-d H:i:s') === $value, 'Invalid calendar timestamp.');

        return $date->utc()->format('Y-m-d H:i:s');
    }

    private function date(string $value): string
    {
        $date = CarbonImmutable::createFromFormat('!Y-m-d', $value, $this->timezone);
        $this->require($date->format('Y-m-d') === $value, 'Invalid calendar date.');

        return $value;
    }

    private function decimal(string $value, int $digits, int $scale): string
    {
        $decimal = BigDecimal::of($value)->toScale($scale);
        $this->require(! $decimal->isNegative() && $decimal->isLessThan(BigDecimal::of(10)->power($digits - $scale)), 'Source decimal exceeds destination precision.');

        return (string) $decimal;
    }

    private function minor(string $value, int $precision): int
    {
        $integer = BigDecimal::of($value)->withPointMovedRight($precision)->toBigInteger();
        $this->require(! $integer->isNegative() && $integer->isLessThanOrEqualTo(InvoiceCalculator::MAX_MINOR), 'Source amount exceeds supported precision or range.');

        return $integer->toInt();
    }

    private function text(?string $value, int $length, bool $required = false): ?string
    {
        $this->require((! $required || trim($value ?? '') !== '') && mb_strlen($value ?? '') <= $length, 'A source text field is blank or exceeds the destination limit of '.$length.'.');

        return $value === '' ? null : $value;
    }

    private function plainText(?string $value): string
    {
        $value = preg_replace('~<br\s*/?>|</(?:p|div|li|h[1-6])>~i', "\n", $value ?? '');

        return trim(html_entity_decode(strip_tags($value), ENT_QUOTES | ENT_HTML5, 'UTF-8'));
    }

    private function activityDescription(array $row): string
    {
        $label = ucfirst(str_replace('_', ' ', preg_replace('/^(invoice_estimate_activity_|invoice_activity_|user_)/', '', $row['description'])));
        $raw   = $row['additional_data'] ?? '';
        // PHP serialization is decoded as data only; no classes may be instantiated.
        $values  = $raw ? @unserialize($raw, ['allowed_classes' => false, 'max_depth' => 16]) : [];
        $details = [];
        if (is_array($values)) {
            array_walk_recursive($values, function ($v) use (&$details) {
                if (is_scalar($v)) {
                    $details[] = $this->plainText((string) $v);
                }
            });
        }

        return $label.($details ? ': '.implode(' · ', $details) : '').' [Perfex]';
    }

    private function require(bool $condition, string $message): void
    {
        if (! $condition) {
            throw new RuntimeException($message);
        }
    }
}
