<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;
use Modules\Auth\Models\User;
use Modules\Blog\Models\Article;
use Modules\Photography\Models\Photo;
use Modules\Settings\Settings\SiteSettings;

uses(RefreshDatabase::class);

function siteSettingsPayload(): array
{
    return [
        'name'        => 'Field Notes', 'title' => 'Notes from Karthick',
        'description' => 'Writing about software and travel.', 'author' => 'Karthick',
        'favicon'     => '/images/site-icon.png', 'image' => 'https://example.com/share.jpg', 'twitter_site' => '@ikkarti',
    ];
}

test('site settings require authentication', function () {
    $this->get(route('admin.settings.edit'))->assertRedirect(route('login'));
    $this->putJson(route('admin.settings.update'), siteSettingsPayload())->assertUnauthorized();
});

test('site settings render with the saved values and shared public identity', function () {
    $this->actingAs(User::factory()->create());
    $this->get(route('admin.settings.edit'))->assertOk()->assertInertia(fn (Assert $page) => $page
        ->component('settings/site')->has('settings.name')->has('settings.favicon')->has('site.name'));
});

test('settings persist and flow into admin identity and public HTML without rebuilding', function () {
    $this->actingAs(User::factory()->create());
    $this->put(route('admin.settings.update'), [...siteSettingsPayload(), 'mail_password' => 'never-store-this'])
        ->assertRedirect(route('admin.settings.edit'))->assertSessionHas('settings_saved', true);

    expect(json_decode(DB::table('settings')->where('group', 'site')->where('name', 'name')->value('payload'), true))->toBe('Field Notes');
    $this->assertDatabaseMissing('settings', ['name' => 'mail_password']);
    app()->forgetInstance(SiteSettings::class);

    $this->get(route('admin.settings.edit'))->assertInertia(fn (Assert $page) => $page
        ->where('site.name', 'Field Notes')->where('site.favicon', '/images/site-icon.png')->missing('site.mail_password'));
    $this->get('/')->assertOk()
        ->assertSee('<title inertia>Notes from Karthick</title>', false)
        ->assertSee('content="Writing about software and travel."', false)
        ->assertSee('href="/images/site-icon.png" sizes="any" inertia="site-favicon"', false)
        ->assertSee('content="Field Notes" inertia="og:site_name"', false);
    $this->get('/photography')->assertInertia(fn (Assert $page) => $page->where('seo.title', 'Photography - Field Notes'));
});

test('settings validate before saving and reject unsafe image URLs', function (string $field, mixed $value) {
    $this->actingAs(User::factory()->create());
    $before = DB::table('settings')->pluck('payload', 'name')->all();
    $this->putJson(route('admin.settings.update'), [...siteSettingsPayload(), $field => $value])
        ->assertUnprocessable()->assertJsonValidationErrors($field);
    expect(DB::table('settings')->pluck('payload', 'name')->all())->toBe($before);
})->with([
    ['name', ''], ['title', ''], ['author', str_repeat('x', 101)], ['description', str_repeat('x', 501)],
    ['favicon', 'javascript:alert(1)'], ['favicon', '//example.com/icon.png'],
    ['image', 'data:image/svg+xml,unsafe'], ['twitter_site', 'invalid handle'],
]);

test('optional defaults can be cleared', function () {
    $this->actingAs(User::factory()->create());
    $this->put(route('admin.settings.update'), [...siteSettingsPayload(), 'description' => '', 'image' => '', 'twitter_site' => ''])
        ->assertSessionHasNoErrors();
    app()->forgetInstance(SiteSettings::class);
    expect(app(SiteSettings::class)->description)->toBe('')
        ->and(app(SiteSettings::class)->image)->toBe('')
        ->and(app(SiteSettings::class)->twitter_site)->toBe('');
});

test('page-specific SEO continues to override global defaults', function () {
    app(SiteSettings::class)->fill(siteSettingsPayload())->save();
    $article = Article::factory()->published()->create(['slug' => 'custom-seo-settings']);
    $article->updateSeo(['title' => 'Custom page title', 'description' => 'Custom page description']);
    $this->get('/articles/custom-seo-settings')->assertOk()->assertInertia(fn (Assert $page) => $page
        ->where('seo.title', 'Custom page title')->where('seo.description', 'Custom page description')->where('seo.site_name', 'Field Notes'));
});

test('gallery SEO uses the gallery title and site defaults when optional fields are empty', function () {
    app(SiteSettings::class)->fill(siteSettingsPayload())->save();
    $photo = Photo::create(['title' => 'Japan', 'slug' => 'japan-settings-test', 'description' => '', 'status' => 'published', 'published_at' => now()->subDay()]);
    $photo->updateSeo(['title' => '', 'description' => '', 'author' => '']);
    $this->get('/photography/japan-settings-test')->assertOk()->assertInertia(fn (Assert $page) => $page
        ->where('seo.title', 'Japan')->where('seo.description', 'Writing about software and travel.')
        ->where('seo.image', 'https://example.com/share.jpg')->where('seo.author', 'Karthick'));
});
