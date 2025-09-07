<?php

namespace Modules\Projects\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Projects\Models\Project;
use Modules\Projects\Tables\Projects;
use Modules\Shared\Http\Controllers\BaseController;

class AdminProjectController extends BaseController
{
    /**
     * Display a listing of projects.
     */
    public function index(Request $request): Response
    {
        return Inertia::render('projects::index', [
            'table' => Projects::make($request->all()),
            'filters' => $request->all(),
        ]);
    }

    /**
     * Show the form for creating a new project.
     */
    public function create(): Response
    {
        return Inertia::render('projects::create');
    }

    /**
     * Store a newly created project in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:projects,slug',
            'description' => 'required|string',
            'short_description' => 'nullable|string|max:500',
            'client' => 'nullable|string|max:255',
            'project_url' => 'nullable|url|max:255',
            'github_url' => 'nullable|url|max:255',
            'technologies' => 'nullable|array',
            'technologies.*' => 'string|max:50',
            'featured_image' => 'nullable|string|max:255',
            'images' => 'nullable|array',
            'images.*' => 'string|max:255',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'status' => 'in:draft,published,archived',
            'featured' => 'boolean',
            'meta_title' => 'nullable|string|max:60',
            'meta_description' => 'nullable|string|max:160',
        ]);

        Project::create($validated);

        return redirect()
            ->route('admin.projects.index')
            ->with('success', 'Project created successfully.');
    }

    /**
     * Display the specified project.
     */
    public function show(Project $project): Response
    {
        return Inertia::render('projects::show', [
            'project' => $project,
        ]);
    }

    /**
     * Show the form for editing the specified project.
     */
    public function edit(Project $project): Response
    {
        return Inertia::render('projects::edit', [
            'project' => $project,
        ]);
    }

    /**
     * Update the specified project in storage.
     */
    public function update(Request $request, Project $project): RedirectResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:projects,slug,' . $project->id,
            'description' => 'required|string',
            'short_description' => 'nullable|string|max:500',
            'client' => 'nullable|string|max:255',
            'project_url' => 'nullable|url|max:255',
            'github_url' => 'nullable|url|max:255',
            'technologies' => 'nullable|array',
            'technologies.*' => 'string|max:50',
            'featured_image' => 'nullable|string|max:255',
            'images' => 'nullable|array',
            'images.*' => 'string|max:255',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'status' => 'in:draft,published,archived',
            'featured' => 'boolean',
            'meta_title' => 'nullable|string|max:60',
            'meta_description' => 'nullable|string|max:160',
        ]);

        $project->update($validated);

        return redirect()
            ->route('admin.projects.index')
            ->with('success', 'Project updated successfully.');
    }

    /**
     * Remove the specified project from storage.
     */
    public function destroy(Project $project): RedirectResponse
    {
        $project->delete();

        return redirect()
            ->route('admin.projects.index')
            ->with('success', 'Project deleted successfully.');
    }
}
