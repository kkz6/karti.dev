<?php

namespace Modules\Frontend\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;
use Modules\Projects\Models\Project;
use Modules\Shared\Http\Controllers\BaseController;

class ProjectsController extends BaseController
{
    public function index(): Response
    {
        $projects = Project::published()
            ->featured()
            ->ordered()
            ->get()
            ->map(function ($project) {
                return [
                    'name'        => $project->title,
                    'description' => $project->short_description ?? $project->description,
                    'link'        => [
                        'href'  => $project->project_url ?? $project->github_url ?? '#',
                        'label' => $project->project_url ? 'View project' : ($project->github_url ? 'View on GitHub' : 'View project'),
                    ],
                    'logo'        => $project->logo ?? $project->featured_image,
                    'technologies' => $project->technologies ?? [],
                ];
            })->toArray();

        return Inertia::render('frontend::projects', [
            'projects' => $projects,
        ]);
    }
}
