<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>{{ $label }}</title>
    <style>
        @page { margin: 36pt 36pt 48pt; }
        body { font-family: "FreeSans", sans-serif; font-size: 10pt; line-height: 1.0; color: #030712; }
        table { width: 100%; border-collapse: collapse; table-layout: fixed; }
        p { margin: 0; }
        h1 { font-size: 20pt; line-height: 1.1; color: #030712; margin: 0; font-weight: bold; }
        h2 { font-size: 10pt; color: #030712; margin: 22pt 0 4pt; font-weight: bold; page-break-after: avoid; }
        .heading { margin-bottom: 24pt; }
        .heading td { width: 50%; vertical-align: top; }
        .logo { max-width: 155pt; max-height: 58pt; }
        .invoice-heading { text-align: right; }
        .invoice-number { color: #4e4e4e; font-size: 10pt; font-weight: bold; }
        .document-state { font-size: 10pt; color: #727b90; text-transform: uppercase; }
        .state-paid, .state-settled { color: #00bf36; }
        .state-unpaid { color: #fc2d42; }
        .state-partial { color: #ff6f00; }
        .state-cancelled { color: #727b90; }
        .parties { margin-bottom: 17pt; }
        .parties td { width: 50%; vertical-align: top; }
        .parties .seller { width: 60%; padding-right: 18pt; }
        .parties .customer { width: 40%; text-align: right; padding-left: 18pt; }
        .bill-to, .seller .party-name { font-weight: bold; color: #030712; }
        .customer .party-name { font-weight: bold; color: #4e4e4e; }
        .bill-to { margin-bottom: 0; }
        .party-line { margin: 0; color: #424242; }
        .dates { margin-top: 12.5pt; color: #030712; }
        .dates p { margin: 0; }
        .draft-notice { border: 0.5pt solid #d1d5db; padding: 8pt 10pt; margin-bottom: 16pt; font-size: 9pt; color: #4e4e4e; }
        thead { display: table-header-group; }
        .items th { background: #323a45; color: #ffffff; font-size: 10pt; line-height: 1; font-weight: normal; padding: 6pt 8pt; text-align: left; border: 0; }
        .items td { padding: 5pt 8pt; vertical-align: top; color: #030712; }
        .item-row td { border-bottom: none; }
        .number { text-align: center; }
        .description { font-weight: bold; color: #030712; }
        .details { color: #424242; }
        .number-cell { text-align: right; white-space: nowrap; }
        .unit { color: #424242; font-size: 7pt; text-align: right; }
        .taxes { text-align: right; }
        .items .item-continuation td { padding-top: 0; }
        .items .item-open td { padding-bottom: 0; }
        .description-line { line-height: 1.0; }
        .summary { margin-top: 23pt; font-size: 10.5pt; }
        .summary td { padding: 4.5pt 6pt; vertical-align: top; text-align: right; }
        .summary .label { width: 85%; font-weight: bold; color: #030712; }
        .summary .amount { width: 15%; white-space: nowrap; color: #030712; }
        .total td { background: #e5e7eb; color: #030712; }
        .text-line { line-height: 1.0; color: #030712; }
        .words { text-align: center; font-weight: bold; color: #030712; margin: 12pt 0 0; }
        .signature { margin-top: 28pt; page-break-inside: avoid; }
        .signature img { display: block; max-width: 155pt; max-height: 58pt; margin-top: 10pt; }
        .transactions { margin-top: 0; }
        .transactions th { width: 25%; text-align: left; border-bottom: 0.75pt solid #000000; font-weight: normal; color: #000000; padding: 4pt; }
        .transactions td { padding: 4pt; color: #030712; }

    </style>
</head>
<body>
    @php $documentType = $documentType ?? 'invoice'; @endphp
    <table class="heading">
        <tr>
            <td>@if($logo)<img class="logo" src="{{ $logo }}" alt="Company logo">@endif</td>
            <td class="invoice-heading">
                <h1>{{ ($invoice['status'] === 'draft' ? 'DRAFT ' : '').($documentType === 'credit_note' ? 'CREDIT NOTE' : 'INVOICE') }}</h1>
                <p class="invoice-number"># {{ $label }}</p>
                @if($documentType === 'credit_note')<p class="document-state">For invoice {{ $sourceNumber }}</p>@endif
                @if($invoice['status'] === 'cancelled')<p class="document-state state-cancelled">CANCELLED - DO NOT PAY</p>
                @elseif($invoice['status'] === 'issued' && $documentType === 'invoice')<p class="document-state state-{{ in_array($settlement['state'], ['settled', 'paid', 'partial'], true) ? $settlement['state'] : 'unpaid' }}">{{ $settlement['state'] === 'settled' ? 'SETTLED WITH CREDIT' : ($settlement['state'] === 'paid' ? 'PAID' : ($settlement['state'] === 'partial' ? 'PARTIALLY PAID' : 'UNPAID')) }}</p>@endif
            </td>
        </tr>
    </table>
    @if($invoice['status'] === 'draft')
        <div class="draft-notice"><strong>DRAFT - NOT ISSUED</strong><br>This preview contains the last saved draft. No permanent document number has been assigned.</div>
    @endif
    @if(count($sellerLines) <= 18 && count($customerLines) <= 18)
        <table class="parties">
            <tr>
                <td class="seller">
                    @foreach($sellerLines as $line)<div class="party-line {{ $loop->first ? 'party-name' : '' }}">{{ $line }}</div>@endforeach
                </td>
                <td class="customer">
                    <p class="bill-to">Bill To:</p>
                    @foreach($customerLines as $line)<div class="party-line {{ $loop->first ? 'party-name' : '' }}">{{ $line }}</div>@endforeach
                    <div class="dates">
                        <p>{{ $documentType === 'credit_note' ? 'Credit Date:' : 'Invoice Date:' }} {{ $invoice['invoice_date'] }}</p>
                        @if($invoice['due_date'])<p>Due Date: {{ $invoice['due_date'] }}</p>@endif

                    </div>
                </td>
            </tr>
        </table>
    @else
        <h2>Issued by</h2>
        @foreach($sellerLines as $line)<div class="party-line">{{ $line }}</div>@endforeach
        <h2>Bill To:</h2>
        @foreach($customerLines as $line)<div class="party-line">{{ $line }}</div>@endforeach
        <div class="dates" style="margin-bottom:20pt">
            <p>{{ $documentType === 'credit_note' ? 'Credit Date:' : 'Invoice Date:' }} {{ $invoice['invoice_date'] }}</p>
            @if($invoice['due_date'])<p>Due Date: {{ $invoice['due_date'] }}</p>@endif

        </div>
    @endif
    @php
        $hasTax = count($invoice['totals']['tax_groups']) > 0;
        $largeNumbers = collect($invoice['items'])->contains(fn($item) => strlen($item['gross']) > 14 || strlen($item['rate']) > 13);
        $itemWidth = $largeNumbers ? 36 : ($hasTax ? 46 : 58);
        $amountWidth = $largeNumbers ? 20 : 14;
        $rateWidth = $largeNumbers ? 18 : 14;
        $qtyWidth = 9;
        $taxWidth = 100 - 5 - $itemWidth - $amountWidth - $rateWidth - $qtyWidth;
    @endphp
    <table class="items">
        <thead><tr>
            <th style="width:5%;text-align:center">#</th>
            <th style="width:{{ $itemWidth }}%">Item</th>
            <th style="width:{{ $qtyWidth }}%;text-align:right">Qty</th>
            <th style="width:{{ $rateWidth }}%;text-align:right">Rate</th>
            @if($hasTax)<th style="width:{{ $taxWidth }}%;text-align:right">Tax</th>@endif
            <th style="width:{{ $amountWidth }}%;text-align:right">Amount</th>
        </tr></thead>
        <tbody>
            @foreach($rows as $row)
                <tr class="item-row {{ $row['continued'] ? 'item-continuation' : '' }} {{ ! $row['last'] ? 'item-open' : '' }}">
                    <td class="number">{{ $row['continued'] ? '' : $row['number'] }}</td>
                    <td>
                        @foreach($row['content'] as $line)<div class="description-line {{ $line['bold'] ? 'description' : 'details' }}">{{ $line['text'] }}@if($line['text'] === '')&nbsp;@endif</div>@endforeach
                    </td>
                    <td class="number-cell">@unless($row['continued']){{ rtrim(rtrim($row['item']['quantity'], '0'), '.') }}@if($row['item']['unit'] && $row['item']['unit'] !== 'item') {{ $row['item']['unit'] }}@endif @endunless</td>
                    <td class="number-cell">@unless($row['continued']){{ trim(\Modules\Billing\Services\InvoicePdfLayout::amount(\Modules\Billing\Services\InvoicePdfLayout::rate($row['item']['rate'], $invoice['totals']['precision']), '')) }}@endunless</td>
                    @if($hasTax)<td class="taxes">
                        @unless($row['continued'])
                            @forelse($row['item']['taxes'] as $tax)<div>{{ rtrim(rtrim($tax['percentage'], '0'), '.') }}%</div>@empty 0% @endforelse
                        @endunless
                    </td>@endif
                    <td class="number-cell" @if(strlen($row['item']['gross']) > 15)style="font-size:7pt"@endif>@unless($row['continued']){{ trim(\Modules\Billing\Services\InvoicePdfLayout::amount($row['item']['gross'], '')) }}@endunless</td>
                </tr>
            @endforeach
        </tbody>
    </table>
    <table class="summary" @if(count($invoice['totals']['tax_groups']) <= 8)style="page-break-inside:avoid"@endif>
        <tr><td class="label">Sub Total</td><td class="amount">{{ \Modules\Billing\Services\InvoicePdfLayout::amount($invoice['totals']['subtotal'], $invoice['currency']) }}</td></tr>
        @if($invoice['discount_mode'] !== 'none')
            <tr><td class="label">Discount @if($invoice['discount_mode'] === 'percent')({{ rtrim(rtrim($invoice['discount_value'], '0'), '.') }}%)@endif</td><td class="amount">-{{ \Modules\Billing\Services\InvoicePdfLayout::amount($invoice['totals']['discount'], $invoice['currency']) }}</td></tr>
        @endif
        @foreach($invoice['totals']['tax_groups'] as $tax)
            <tr><td class="label">@foreach(\Modules\Billing\Services\InvoicePdfLayout::lines($tax['name'].' ('.rtrim(rtrim($tax['percentage'], '0'), '.').'%)', 55) as $line)<div>{{ $line }}</div>@endforeach</td><td class="amount">{{ \Modules\Billing\Services\InvoicePdfLayout::amount($tax['amount'], $invoice['currency']) }}</td></tr>
        @endforeach
        <tr class="total"><td class="label">Total</td><td class="amount">{{ \Modules\Billing\Services\InvoicePdfLayout::amount($invoice['totals']['total'], $invoice['currency']) }}</td></tr>
        @if($invoice['status'] === 'issued' && $documentType === 'invoice')
            @if($settlement['paid'] !== \Modules\Billing\Services\InvoiceCalculator::money('0', $invoice['totals']['precision']))
                <tr><td class="label">Total Paid</td><td class="amount">-{{ \Modules\Billing\Services\InvoicePdfLayout::amount($settlement['paid'], $invoice['currency']) }}</td></tr>
            @endif
            @if(($settlement['credited'] ?? '0') !== \Modules\Billing\Services\InvoiceCalculator::money('0', $invoice['totals']['precision']))<tr><td class="label">Applied Credits</td><td class="amount">-{{ \Modules\Billing\Services\InvoicePdfLayout::amount($settlement['credited'], $invoice['currency']) }}</td></tr>@endif
            <tr class="total"><td class="label">Amount Due</td><td class="amount">{{ \Modules\Billing\Services\InvoicePdfLayout::amount($settlement['balance'], $invoice['currency']) }}</td></tr>
        @endif
    </table>
    @if($documentType === 'credit_note' && $invoice['status'] === 'issued')
        <table class="summary"><tr><td class="label">Allocated</td><td class="amount">{{ \Modules\Billing\Services\InvoicePdfLayout::amount($creditSettlement['allocated'], $invoice['currency']) }}</td></tr><tr><td class="label">Refunded</td><td class="amount">{{ \Modules\Billing\Services\InvoicePdfLayout::amount($creditSettlement['refunded'], $invoice['currency']) }}</td></tr><tr class="total"><td class="label">Available Credit</td><td class="amount">{{ \Modules\Billing\Services\InvoicePdfLayout::amount($creditSettlement['available'], $invoice['currency']) }}</td></tr></table>
    @endif
    <p class="words">With words: {{ \Modules\Billing\Services\InvoicePdfLayout::words($invoice['totals']['total'], $invoice['currency']) }}</p>
    @if(count($payments))
        <h2 style="margin-bottom:11pt">Transactions:</h2>
        <table class="transactions"><thead><tr><th>Payment #</th><th>Payment Mode</th><th>Date</th><th>Amount</th></tr></thead><tbody>
            @foreach($payments as $payment)<tr><td>{{ $payment['id'] }}</td><td>{{ $payment['method'] }}</td><td>{{ $payment['date'] }}</td><td>{{ \Modules\Billing\Services\InvoicePdfLayout::amount($payment['amount'], $invoice['currency']) }}</td></tr>@endforeach
        </tbody></table>
    @endif
    @foreach(['payment_instructions' => 'Offline Payment:', 'customer_note' => 'Note:', 'terms' => 'Terms & Conditions:'] as $field => $title)
        @if($invoice[$field])
            <h2>{{ $title }}</h2>
            @foreach(\Modules\Billing\Services\InvoicePdfLayout::lines($invoice[$field]) as $line)<div class="text-line">{{ $line }}@if($line === '')&nbsp;@endif</div>@endforeach
        @endif
    @endforeach
    @if($documentType === 'invoice' && ($signature['enabled'] ?? false))
        <div class="signature">
            <strong>Authorized signature</strong>
            @if($signature['image'])<img src="{{ $signature['image'] }}" alt="Authorized signature">@else<div style="margin-top:24pt">_________________________</div>@endif
        </div>
    @endif
</body>
</html>
