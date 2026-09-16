<?php

namespace Modules\Tools\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Shared\Http\Controllers\BaseController;
use Modules\Tools\Models\ToolCategory;

class ToolCategoryController extends BaseController
{
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255', 'unique:tool_categories,slug'],
        ]);

        $category = ToolCategory::create($data);

        return response()->json(['category' => $category->only(['id', 'name', 'slug'])], 201);
    }
}
