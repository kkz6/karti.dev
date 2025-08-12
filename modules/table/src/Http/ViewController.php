<?php

declare(strict_types=1);

namespace Modules\Table\Http;

use Illuminate\Http\JsonResponse;

class ViewController
{
    /**
     * Store a view for the table.
     */
    public function store(StoreViewRequest $request): JsonResponse
    {
        $table = $request->ensureTableHasViews()->getTable();

        ($views = $table->buildViews())->store(
            $request->validated('name'),
            $request->validated('title'),
            $request->validated('query'),
        );

        return response()->json($views->toArray());
    }

    /**
     * Destroy a view for the table.
     */
    public function destroy(DeleteViewRequest $request): JsonResponse
    {
        $table = $request->ensureTableHasViews()->getTable();

        $views = $table->buildViews();
        $views->delete($request->route('key'));

        return response()->json($views->toArray());
    }
}
