<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Modules\Auth\Models\User;
use Modules\Blog\Models\Category;
use Modules\Photography\Models\Photo;
use Modules\Photography\Tables\Photos;

uses(RefreshDatabase::class);

function permanentPhotoTable(string $clause = 'only_trashed', ?string $search = null): Photos
{
    return Photos::make()->setRequest(Request::create('/', 'GET', [
        'filters' => ['deleted_at' => ['enabled' => true, 'clause' => $clause]],
        'search'  => $search,
    ]));
}

test('permanent gallery deletion removes relationships and seo but preserves library media', function () {
    Illuminate\Support\Facades\Queue::fake();
    $gallery  = Photo::create(['title' => 'Gallery', 'slug' => 'gallery']);
    $category = Category::create(['name' => 'Travel', 'slug' => 'travel']);
    $gallery->categories()->attach($category);
    $gallery->updateSeo(['title' => 'Gallery SEO']);
    $media = Modules\Media\Models\Media::forceCreate([
        'disk'      => 'public', 'directory' => 'photos', 'filename' => 'shared', 'extension' => 'jpg',
        'mime_type' => 'image/jpeg', 'aggregate_type' => 'image', 'size' => 100,
    ]);
    $gallery->attachMedia($media, 'gallery');
    $other = Photo::create(['title' => 'Other', 'slug' => 'other']);
    $other->attachMedia($media, 'gallery');
    $gallery->delete();
    $table  = permanentPhotoTable();
    $action = collect($table->actions())->firstWhere('label', 'Delete permanently')->setTable($table);
    expect($action->confirmationRequired)->toBeTrue()->and($action->isHidden($gallery))->toBeFalse();
    $action->handle([$gallery->id]);
    expect(Photo::withTrashed()->find($gallery->id))->toBeNull()
        ->and($gallery->categories()->count())->toBe(0)
        ->and($gallery->seo()->count())->toBe(0)
        ->and($gallery->media()->count())->toBe(0)
        ->and($media->fresh())->not->toBeNull()
        ->and($other->media()->count())->toBe(1)
        ->and($category->fresh())->not->toBeNull();
});

test('bulk permanent deletion skips active galleries even with explicit mixed keys', function () {
    $active  = Photo::create(['title' => 'Active', 'slug' => 'active']);
    $trashed = Photo::create(['title' => 'Trashed', 'slug' => 'trashed']);
    $trashed->delete();
    $table  = permanentPhotoTable('with_trashed');
    $action = collect($table->actions())->firstWhere('label', 'Delete permanently')->setTable($table);
    expect($action->isDisabled($active))->toBeTrue()->and($action->isHidden($active))->toBeTrue();
    $action->handle([$active->id, $trashed->id]);
    expect($active->fresh())->not->toBeNull()->and(Photo::withTrashed()->find($trashed->id))->toBeNull();
});

test('permanent delete all respects the current search and trash view', function () {
    $match = Photo::create(['title' => 'Matching', 'slug' => 'matching']);
    $other = Photo::create(['title' => 'Other', 'slug' => 'other']);
    $match->delete();
    $other->delete();
    $table = permanentPhotoTable(search: 'Matching');
    collect($table->actions())->firstWhere('label', 'Delete permanently')->setTable($table)->handle(['*']);
    expect(Photo::withTrashed()->find($match->id))->toBeNull()->and($other->fresh()->trashed())->toBeTrue();
    $table = permanentPhotoTable('without_trashed');
    collect($table->actions())->firstWhere('label', 'Delete permanently')->setTable($table)->handle(['*']);
    expect($other->fresh()->trashed())->toBeTrue();
});

test('the signed permanent delete endpoint requires authentication', function () {
    $gallery = Photo::create(['title' => 'Gallery', 'slug' => 'gallery']);
    $gallery->delete();
    $table = permanentPhotoTable();
    $index = collect($table->actions())->search(fn ($action) => $action->label === 'Delete permanently');
    $url   = $table->getActionById($index)->getActionUrl();
    $this->post($url, ['keys' => [$gallery->id]])->assertForbidden();
    expect($gallery->fresh()->trashed())->toBeTrue();
    $this->actingAs(User::factory()->create())->post($url, ['keys' => [$gallery->id]])->assertRedirect();
    expect(Photo::withTrashed()->find($gallery->id))->toBeNull();
});

test('shared table routes retain session csrf and signature middleware', function () {
    app(Illuminate\Contracts\Http\Kernel::class);
    $router = app('router');

    foreach (['action', 'export', 'async-export', 'view.store', 'view.destroy'] as $name) {
        $route      = $router->getRoutes()->getByName('inertia-tables.'.$name);
        $middleware = $router->gatherRouteMiddleware($route);

        expect($middleware)->toContain(
            Illuminate\Cookie\Middleware\EncryptCookies::class,
            Illuminate\Session\Middleware\StartSession::class,
            Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class,
        );
        expect(collect($middleware)->contains(fn ($class) => str_starts_with(
            $class, Illuminate\Routing\Middleware\ValidateSignature::class
        )))->toBeTrue();
    }
});

test('permanent deletion authenticates the browser session on the shared table endpoint', function () {
    $user    = User::factory()->create();
    $gallery = Photo::create(['title' => 'Session gallery', 'slug' => 'session-gallery']);
    $gallery->delete();
    $table = permanentPhotoTable();
    $index = collect($table->actions())->search(fn ($action) => $action->label === 'Delete permanently');
    $url   = $table->getActionById($index)->getActionUrl();

    // Do not use actingAs: it bypasses the browser's session authentication path.
    $this->withSession([auth('web')->getName() => $user->getAuthIdentifier()]);
    $session = app('session')->driver();
    $session->save();
    $this->withCookie($session->getName(), $session->getId());
    $session->flush();
    app('auth')->forgetGuards();

    $this->withCredentials()->from('/admin/photography')->postJson($url, [
        'keys' => [$gallery->id],
        'json' => true,
    ])->assertOk()->assertJsonPath('targetUrl', url('/admin/photography'));

    expect(Photo::withTrashed()->find($gallery->id))->toBeNull();
});
