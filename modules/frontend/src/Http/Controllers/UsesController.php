<?php

namespace Modules\Frontend\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;
use Modules\Shared\Http\Controllers\BaseController;
use Modules\Tools\Models\ToolCategory;

class UsesController extends BaseController
{
    public function index(): Response
    {
        $sections = ToolCategory::active()
            ->with(['tools' => function ($query) {
                $query->active()->ordered();
            }])
            ->ordered()
            ->get()
            ->map(function ($category) {
                return [
                    'title' => $category->name,
                    'tools' => $category->tools->map(function ($tool) {
                        return [
                            'title'       => $tool->title,
                            'description' => $tool->description,
                            'href'        => $tool->url,
                        ];
                    }),
                ];
            });

        return Inertia::render('frontend::uses', [
            'sections' => $sections,
        ]);
    }
}
