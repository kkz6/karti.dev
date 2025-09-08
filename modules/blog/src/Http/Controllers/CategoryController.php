<?php

namespace Modules\Blog\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Blog\Models\Category;
use Modules\Blog\Tables\Categories;
use Modules\Shared\Http\Controllers\BaseController;

class CategoryController extends BaseController
{
    /**
     * Display a listing of categories.
     */
    public function index(): Response
    {
        return Inertia::render('blog::categories/index', [
            'categories' => Categories::make(),
        ]);
    }

    /**
     * Show the form for creating a new category.
     */
    public function create(): Response
    {
        return Inertia::render('blog::categories/create');
    }

    /**
     * Store a newly created category in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name'             => 'required|string|max:255|unique:categories,name',
            'slug'             => 'required|string|max:255|unique:categories,slug',
            'description'      => 'nullable|string|max:500',
            'meta_title'       => 'nullable|string|max:60',
            'meta_description' => 'nullable|string|max:160',
        ]);

        Category::create($validated);

        return redirect()
            ->route('admin.categories.index')
            ->with('success', 'Category created successfully.');
    }

    /**
     * Display the specified category.
     */
    public function show(Category $category): Response
    {
        $category->load(['articles' => function ($query) {
            $query->with('user')->latest()->take(10);
        }]);

        return Inertia::render('blog::categories/show', [
            'category' => $category,
        ]);
    }

    /**
     * Show the form for editing the specified category.
     */
    public function edit(Category $category): Response
    {
        return Inertia::render('blog::categories/edit', [
            'category' => $category,
        ]);
    }

    /**
     * Update the specified category in storage.
     */
    public function update(Request $request, Category $category): RedirectResponse
    {
        $validated = $request->validate([
            'name'             => 'required|string|max:255|unique:categories,name,'.$category->id,
            'slug'             => 'required|string|max:255|unique:categories,slug,'.$category->id,
            'description'      => 'nullable|string|max:500',
            'meta_title'       => 'nullable|string|max:60',
            'meta_description' => 'nullable|string|max:160',
        ]);

        $category->update($validated);

        return redirect()
            ->route('admin.categories.index')
            ->with('success', 'Category updated successfully.');
    }

    /**
     * Remove the specified category from storage.
     */
    public function destroy(Category $category): RedirectResponse
    {
        // Check if category has articles
        if ($category->articles()->exists()) {
            return redirect()
                ->route('admin.categories.index')
                ->with('error', 'Cannot delete category with existing articles.');
        }

        $category->delete();

        return redirect()
            ->route('admin.categories.index')
            ->with('success', 'Category deleted successfully.');
    }
}
