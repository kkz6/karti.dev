<?php

namespace Modules\Billing\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Modules\Billing\Models\ImportBatch;
use Modules\Billing\Services\BillingImporter;
use Modules\Shared\Http\Controllers\BaseController;

class BillingImportsController extends BaseController
{
    private function access(Request $request): void
    {
        abort_unless($request->user()->hasRole('super-admin') || $request->user()->can('import billing data'), 403);
    }

    public function index(Request $request)
    {
        $this->access($request);

        return Inertia::render('billing::imports/index', ['table'=>\Modules\Billing\Tables\ImportBatches::make()->setRequest($request)]);
    }

    public function stage(Request $request, BillingImporter $importer)
    {
        $this->access($request);
        $data=$request->validate(['file'=>['required', 'file', 'max:2048']]);
        try {
            $manifest=json_decode(file_get_contents($data['file']->getRealPath()), true, 64, JSON_THROW_ON_ERROR);
            if (! is_array($manifest) || array_is_list($manifest)) {
                throw new \RuntimeException;
            }
        } catch (\Throwable) {
            throw \Illuminate\Validation\ValidationException::withMessages(['file'=>'Upload a valid normalized billing JSON object.']);
        }$batch=$importer->stage($manifest, $request->user());

        return to_route('admin.billing.imports.show', $batch);
    }

    public function show(Request $request, ImportBatch $batch, BillingImporter $importer)
    {
        $this->access($request);
        $report=$importer->review($batch->manifest);

        return Inertia::render('billing::imports/show', ['batch'=>$batch->only(['id', 'source', 'state', 'created_at', 'imported_at']), 'report'=>$report, 'reviewToken'=>$importer->token($batch), 'message'=>$request->session()->get('billing_message')]);
    }

    public function commit(Request $request, ImportBatch $batch, BillingImporter $importer)
    {
        $this->access($request);
        $data=$request->validate(['review_token'=>['required', 'string', 'size:64'], 'confirmed'=>['required', 'accepted']]);
        $importer->commit($batch, $data['review_token'], $request->user());

        return back()->with('billing_message', 'Reviewed billing import completed. Existing source mappings were retained without duplicate records.');
    }
}
