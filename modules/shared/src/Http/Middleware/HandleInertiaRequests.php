<?php

namespace Modules\Shared\Http\Middleware;

use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\File;
use Inertia\Middleware;
use Tighten\Ziggy\Ziggy;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $request->user(),
            ],
            'ziggy' => fn(): array => [
                ...(new Ziggy)->toArray(),
                'location' => $request->url(),
            ],
            'sidebarOpen'  => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'translations' => function () {
                $translations = collect();
                $locale       = app()->getLocale();

                // Get main app translations
                $appLangPath = base_path('lang/' . $locale);
                if (File::exists($appLangPath)) {
                    $translations = $translations->merge(
                        collect(File::allFiles($appLangPath))
                            ->flatMap(fn($file) => Arr::dot(
                                File::getRequire($file->getRealPath()),
                                $file->getBasename('.' . $file->getExtension()) . '.'
                            ))
                    );
                }

                // Get module translations
                $modulesPath = base_path('modules');
                if (File::exists($modulesPath)) {
                    $modules = collect(File::directories($modulesPath));
                    foreach ($modules as $module) {
                        $moduleLangPath = $module . '/resources/lang/' . $locale;
                        if (File::exists($moduleLangPath)) {
                            $translations = $translations->merge(
                                collect(File::allFiles($moduleLangPath))
                                    ->flatMap(fn($file) => Arr::dot(
                                        File::getRequire($file->getRealPath()),
                                        basename($module) . '.' . $file->getBasename('.' . $file->getExtension()) . '.'
                                    ))
                            );
                        }
                    }
                }

                return $translations;
            },
        ];
    }
}
