<?php

namespace Modules\Tools\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Shared\Http\Controllers\BaseController;
use Modules\Tools\Models\Tool;
use Modules\Tools\Models\ToolCategory;
use Modules\Tools\Tables\Tools;

class AdminToolController extends BaseController
{
    /**
     * Display a listing of tools.
     */
    public function index(Request $request): Response
    {
        return Inertia::render('tools::index', [
            'table' => Tools::make($request->all()),
            'filters' => $request->all(),
        ]);
    }

    /**
     * Show the form for creating a new tool.
     */
    public function create(): Response
    {
        $categories = ToolCategory::active()->ordered()->get();

        return Inertia::render('tools::create', [
            'categories' => $categories,
        ]);
    }

    /**
     * Store a newly created tool in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'tool_category_id' => 'required|exists:tool_categories,id',
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'url' => 'nullable|url|max:255',
            'image' => 'nullable|string|max:255',
            'featured' => 'boolean',
            'status' => 'in:active,inactive',
        ]);

        Tool::create($validated);

        return redirect()
            ->route('admin.tools.index')
            ->with('success', 'Tool created successfully.');
    }

    /**
     * Display the specified tool.
     */
    public function show(Tool $tool): Response
    {
        $tool->load('category');

        return Inertia::render('tools::show', [
            'tool' => $tool,
        ]);
    }

    /**
     * Show the form for editing the specified tool.
     */
    public function edit(Tool $tool): Response
    {
        $categories = ToolCategory::active()->ordered()->get();

        return Inertia::render('tools::edit', [
            'tool' => $tool,
            'categories' => $categories,
        ]);
    }

    /**
     * Update the specified tool in storage.
     */
    public function update(Request $request, Tool $tool): RedirectResponse
    {
        $validated = $request->validate([
            'tool_category_id' => 'required|exists:tool_categories,id',
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'url' => 'nullable|url|max:255',
            'image' => 'nullable|string|max:255',
            'featured' => 'boolean',
            'status' => 'in:active,inactive',
        ]);

        $tool->update($validated);

        return redirect()
            ->route('admin.tools.index')
            ->with('success', 'Tool updated successfully.');
    }

    /**
     * Remove the specified tool from storage.
     */
    public function destroy(Tool $tool): RedirectResponse
    {
        $tool->delete();

        return redirect()
            ->route('admin.tools.index')
            ->with('success', 'Tool deleted successfully.');
    }
}
