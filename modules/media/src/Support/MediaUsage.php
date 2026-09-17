<?php

namespace Modules\Media\Support;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Modules\Blog\Models\Article;
use Modules\Media\Models\Media;
use Modules\Media\Models\MediaUrlHistory;
use Modules\Photography\Models\Photo;
use Modules\Projects\Models\Project;
use Modules\Seo\Models\Seo;
use Modules\Settings\Models\SiteSetting;
use Modules\Settings\Settings\SiteSettings;
use Modules\Speaking\Models\SpeakingEvent;
use Modules\Tools\Models\Tool;

class MediaUsage
{
    /** Include drafts and trashed content so restoring an entry cannot restore broken images. */
    public function forMedia(Media $media): array
    {
        $urls = [];
        foreach ([$media, ...$media->variants] as $file) {
            $urls[] = $file->getUrl();
        }
        foreach (MediaUrlHistory::where('media_id', $media->id)->pluck('path') as $path) {
            $urls[] = url($path);
        }
        $forms = [];
        foreach ($urls as $url) {
            $path = parse_url($url, PHP_URL_PATH) ?: '';
            foreach ([$url, $path, preg_replace('~^https?:~', '', $url)] as $form) {
                $forms[] = $form;
                $forms[] = rawurldecode($form);
                $forms[] = str_replace($path, implode('/', array_map('rawurlencode', explode('/', rawurldecode($path)))), $form);
            }
        }
        $forms = array_filter(array_unique($forms));
        usort($forms, fn ($a, $b) => strlen($b) <=> strlen($a));
        $pattern    = '~(?<![\w:/.-])(?:'.implode('|', array_map(fn ($url) => preg_quote($url, '~'), $forms)).')(?=$|[\s\x22\x27<>?#),])~u';
        $imageRoute = '/media/images/'.$media->id.'/';
        $matches    = function (mixed $value) use (&$matches, $pattern, $imageRoute): bool {
            if (is_array($value)) {
                foreach ($value as $item) {
                    if ($matches($item)) {
                        return true;
                    }
                }

                return false;
            }
            if (! is_string($value)) {
                return false;
            }
            $value = html_entity_decode($value, ENT_QUOTES | ENT_HTML5, 'UTF-8');
            if (preg_match($pattern, $value)) {
                return true;
            }
            // Signed, lazily generated thumbnail URLs are also references to the original.
            preg_match_all('~(?:https?://[^\s<>"\x27]+|(?<![\w:/.-])/media/images/[^\s<>"\x27]+)~', $value, $links);
            foreach ($links[0] as $link) {
                $host = parse_url($link, PHP_URL_HOST);
                if ((! $host || in_array($host, [parse_url(url('/'), PHP_URL_HOST), parse_url(Storage::disk('public')->url(''), PHP_URL_HOST)], true))
                    && str_starts_with(parse_url($link, PHP_URL_PATH) ?: '', $imageRoute)) {
                    return true;
                }
            }

            return false;
        };

        $usages = [];
        $add    = function (string $type, string $title, string $field, ?string $url = null) use (&$usages) {
            $usages[] = compact('type', 'title', 'field', 'url');
        };
        foreach (DB::table('mediables')->where('media_id', $media->id)->get() as $pivot) {
            if (in_array($pivot->mediable_type, [Photo::class, (new Photo)->getMorphClass()], true)) {
                $photo = Photo::withoutGlobalScopes()->find($pivot->mediable_id);
                if ($photo) {
                    $add('Gallery'.($photo->deleted_at ? ' (trash)' : ''), $photo->title, ucfirst($pivot->tag), $photo->deleted_at ? null : route('admin.photography.edit', $photo->id));
                }
            } else {
                $add('Content attachment', 'Entry #'.$pivot->mediable_id, $pivot->tag);
            }
        }

        foreach ([
            Article::class       => ['Article', 'admin.blog.edit', ['content', 'featured_image']],
            Photo::class         => ['Gallery', 'admin.photography.edit', ['description']],
            Project::class       => ['Project', 'admin.projects.edit', ['description', 'featured_image', 'images']],
            Tool::class          => ['Tool', 'admin.tools.edit', ['description', 'image']],
            SpeakingEvent::class => ['Speaking event', 'admin.speaking.edit', ['description']],
            Seo::class           => ['SEO', null, ['image', 'schema']],
            SiteSetting::class   => ['Site setting', null, ['value']],
        ] as $model => [$type, $route, $fields]) {
            $model::withoutGlobalScopes()->chunkById(100, function ($records) use ($fields, $matches, $media, $add, $type, $route) {
                foreach ($records as $record) {
                    foreach ($fields as $field) {
                        $value   = $record->$field;
                        $idMatch = $record instanceof Article && $field === 'featured_image' && (string) $value === (string) $media->id;
                        if (! $idMatch && ! $matches($value)) {
                            continue;
                        }
                        $title   = $record->title ?: ($record->key ?: 'Entry #'.$record->id);
                        $editUrl = $route && ! $record->deleted_at ? route($route, $record instanceof Article ? $record->id : $record) : null;
                        if ($record instanceof Seo) {
                            $owner      = $record->seoable;
                            $title      = $owner?->title ?: $title;
                            $ownerRoute = match (get_class($owner ?? $record)) {
                                Article::class => 'admin.blog.edit', Photo::class => 'admin.photography.edit',
                                Project::class => 'admin.projects.edit', SpeakingEvent::class => 'admin.speaking.edit', default => null,
                            };
                            $editUrl = $ownerRoute && ! $owner->deleted_at ? route($ownerRoute, $owner instanceof Article ? $owner->id : $owner) : null;
                        }
                        $add($type.($record->deleted_at ? ' (trash)' : ''), $title, ucfirst(str_replace('_', ' ', $field)), $editUrl);
                    }
                }
            });
        }
        $settings = app(SiteSettings::class);
        foreach (['favicon', 'image'] as $field) {
            if ($matches($settings->$field)) {
                $add('Site settings', 'Site identity', ucfirst($field), route('admin.settings.edit'));
            }
        }

        return ['id' => (string) $media->id, 'title' => $media->title ?: $media->filename, 'usages' => $usages];
    }
}
