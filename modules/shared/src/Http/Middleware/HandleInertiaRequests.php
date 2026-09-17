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
            'name'         => config('app.name'),
            'site'         => config('site.public'),
            'mediaLibrary' => [
                'defaultDisk' => config('mediable.default_disk'),
            ],
            'settingsSaved'  => fn () => $request->session()->get('settings_saved', false),
            'newsletterForm' => fn () => [
                'started_at' => \Illuminate\Support\Facades\Crypt::encryptString((string) now()->timestamp),
            ],
            'newsletterStatus' => fn () => $request->session()->get('newsletter_status'),
            'auth'             => [
                'user' => $request->user(),
            ],
            'route' => [
                'name' => $request->route()?->getName(),
            ],
            'ziggy' => fn (): array => [
                ...(new Ziggy)->toArray(),
                'location' => $request->url(),
            ],
            'sidebarOpen'  => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'translations' => function () {
                $translations = collect();
                $locale       = app()->getLocale();

                // Get main app translations
                $appLangPath = base_path('lang/'.$locale);
                if (File::exists($appLangPath)) {
                    $translations = $translations->merge(
                        collect(File::allFiles($appLangPath))
                            ->flatMap(function ($file) {
                                $translation = File::getRequire($file->getRealPath());

                                return is_array($translation)
                                    ? Arr::dot($translation, $file->getBasename('.'.$file->getExtension()).'.')
                                    : [];
                            })
                    );
                }

                // Get module translations
                $modulesPath = base_path('modules');
                if (File::exists($modulesPath)) {
                    $modules = collect(File::directories($modulesPath));
                    foreach ($modules as $module) {
                        $moduleLangPath = $module.'/resources/lang/'.$locale;
                        if (File::exists($moduleLangPath)) {
                            $translations = $translations->merge(
                                collect(File::allFiles($moduleLangPath))
                                    ->flatMap(function ($file) use ($module) {
                                        $translation = File::getRequire($file->getRealPath());

                                        return is_array($translation)
                                            ? Arr::dot($translation, basename($module).'.'.$file->getBasename('.'.$file->getExtension()).'.')
                                            : [];
                                    })
                            );
                        }
                    }
                }

                return $translations;
            },
        ];
    }
}
