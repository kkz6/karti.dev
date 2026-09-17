<?php

namespace Modules\Media\Support;

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

class MediaReferences
{
    /** Called in the same transaction as the media location update. */
    public function moved(Media $media, string $oldUrl): void
    {
        $newUrl = $media->getUrl();
        if ($newUrl === $oldUrl) {
            return;
        }
        $oldPath = rawurldecode(parse_url($oldUrl, PHP_URL_PATH) ?: '');
        if ($media->disk === 'public' && $media->isVisible()) {
            MediaUrlHistory::updateOrCreate(
                ['path_hash' => hash('sha256', $oldPath)],
                ['path' => $oldPath, 'media_id' => $media->id],
            );
        }

        $mapping = [$oldUrl => $newUrl];
        if (parse_url($oldUrl, PHP_URL_HOST)) {
            $mapping[preg_replace('~^https?:~', '', $oldUrl)] = preg_replace('~^https?:~', '', $newUrl);
        }
        $mapping[parse_url($oldUrl, PHP_URL_PATH)] = parse_url($newUrl, PHP_URL_PATH);
        foreach ($mapping as $from => $to) {
            $mapping[rawurldecode($from)]                 = rawurldecode($to);
            $mapping[$this->encodePath($from)]            = $this->encodePath($to);
            $mapping[htmlspecialchars($from, ENT_QUOTES)] = htmlspecialchars($to, ENT_QUOTES);
        }

        // Only content/image fields are touched; IDs, pivot order and unrelated URLs stay intact.
        foreach ([
            Article::class       => ['content'],
            Photo::class         => ['description'],
            Project::class       => ['description', 'featured_image', 'images'],
            Tool::class          => ['description', 'image'],
            SpeakingEvent::class => ['description'],
            Seo::class           => ['image', 'schema'],
            SiteSetting::class   => ['value'],
        ] as $model => $fields) {
            $model::withoutGlobalScopes()->select(['id', ...$fields])
                ->where(function ($query) use ($fields, $oldPath) {
                    foreach ($fields as $field) {
                        foreach (array_unique([basename($oldPath), rawurlencode(basename($oldPath)), htmlspecialchars(basename($oldPath), ENT_QUOTES), trim(json_encode(basename($oldPath)), '"')]) as $filename) {
                            $query->orWhere($field, 'like', '%'.$filename.'%');
                        }
                    }
                })->chunkById(100, function ($records) use ($fields, $mapping) {
                    foreach ($records as $record) {
                        foreach ($fields as $field) {
                            $record->$field = $this->replace($record->$field, $mapping);
                        }
                        if ($record->isDirty($fields)) {
                            $record->timestamps = false;
                            $record->saveQuietly();
                        }
                    }
                });
        }

        $settings = app(SiteSettings::class);
        $changed  = false;
        foreach (['favicon', 'image'] as $field) {
            $value            = $this->replace($settings->$field, $mapping);
            $changed          = $changed || $value !== $settings->$field;
            $settings->$field = $value;
        }
        if ($changed) {
            $settings->save();
        }
    }

    private function encodePath(string $url): string
    {
        $path = parse_url($url, PHP_URL_PATH) ?: '';

        return str_replace($path, implode('/', array_map('rawurlencode', explode('/', rawurldecode($path)))), $url);
    }

    private function replace(mixed $value, array $mapping): mixed
    {
        if (is_array($value)) {
            return array_map(fn ($item) => $this->replace($item, $mapping), $value);
        }
        if (! is_string($value)) {
            return $value;
        }
        // One pass, longest URL first. Do not replace filename prefixes or another site's URL.
        uksort($mapping, fn ($a, $b) => strlen($b) <=> strlen($a));
        $pattern = '~(?<![\w:/.-])(?:'.implode('|', array_map(fn ($url) => preg_quote($url, '~'), array_keys($mapping))).')(?=$|[\s\x22\x27<>?#)]|&(?:quot|apos);)~u';

        return preg_replace_callback($pattern, fn ($match) => $mapping[$match[0]], $value);
    }
}
