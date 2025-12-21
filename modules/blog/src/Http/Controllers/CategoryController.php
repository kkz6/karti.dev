<?php

namespace Modules\Blog\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Blog\DTO\CategoryData;
use Modules\Blog\Interfaces\CategoryServiceInterface;
use Modules\Blog\Models\Category;
use Modules\Blog\Tables\Categories;
use Modules\Shared\Http\Controllers\BaseController;

class CategoryController extends BaseController
{
    public function __construct(
        private readonly CategoryServiceInterface $categoryService,
    ) {}
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
    public function store(CategoryData $dto): RedirectResponse
    {
        $this->categoryService->create($dto->except('seo', 'category_id', 'meta_title', 'meta_description')->toArray());

        return redirect()
            ->route('admin.categories.index')
            ->with('success', 'Category created successfully.');
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
    public function update(CategoryData $dto, Category $category): RedirectResponse
    {
        $this->categoryService->update($category->id, $dto->except('seo', 'category_id', 'meta_title', 'meta_description')->toArray());

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

        $this->categoryService->delete($category->id);

        return redirect()
            ->route('admin.categories.index')
            ->with('success', 'Category deleted successfully.');
    }
}
