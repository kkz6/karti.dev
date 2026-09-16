<?php

namespace Modules\Settings\Settings;

use Spatie\LaravelSettings\Settings;

class SiteSettings extends Settings
{
    public string $name;

    public string $title;

    public string $description;

    public string $author;

    public string $favicon;

    public string $image;

    public string $twitter_site;

    public static function group(): string
    {
        return 'site';
    }

    public static function defaults(): array
    {
        $name  = config('seo.site_name') ?: config('app.name');
        $name  = ! $name || $name === 'Laravel' ? 'karti.dev' : $name;
        $title = config('seo.title');

        return [
            'name'         => $name,
            'title'        => ! $title || $title === 'Laravel' ? $name : $title,
            'description'  => config('seo.description') ?: '',
            'author'       => config('seo.author') ?: 'Karthick',
            'favicon'      => '/favicon.ico',
            'image'        => config('seo.image') ?: '',
            'twitter_site' => config('seo.twitter.site') ?: '',
        ];
    }
}
