<?php

namespace Modules\Frontend\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;
use Modules\Projects\Models\Project;
use Modules\Seo\Support\SEOData;
use Modules\Shared\Http\Controllers\BaseController;

class ProjectsController extends BaseController
{
    private function getSeoArray(SEOData $seoData): array
    {
        return [
            'title'           => $seoData->title,
            'description'     => $seoData->description,
            'author'          => $seoData->author,
            'image'           => $seoData->image ? url($seoData->image) : null,
            'url'             => $seoData->url,
            'type'            => $seoData->type,
            'site_name'       => $seoData->site_name,
            'twitter_card'    => $seoData->twitter_card,
            'twitter_site'    => $seoData->twitter_site,
            'twitter_creator' => $seoData->twitter_creator,
            'robots'          => $seoData->robots,
            'locale'          => $seoData->locale,
        ];
    }

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

        $seoData = new SEOData(
            title: 'Projects - ' . config('seo.site_name', config('app.name')),
            description: 'Things I\'ve made trying to put my dent in the universe. Explore open-source projects and software I\'ve built.',
            author: config('seo.author', 'Karthick'),
            image: config('seo.image'),
            url: url('/projects'),
            type: 'website',
            site_name: config('seo.site_name', config('app.name')),
            twitter_card: config('seo.twitter.card', 'summary_large_image'),
            twitter_site: config('seo.twitter.site'),
            twitter_creator: config('seo.twitter.creator'),
            robots: config('seo.robots', 'index,follow'),
            locale: config('seo.locale', 'en_US'),
        );

        return Inertia::render('frontend::projects', [
            'projects' => $projects,
            'seo'      => $this->getSeoArray($seoData),
        ]);
    }
}
