<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Modules\Auth\Models\User;
use Modules\Media\Models\Media;

uses(RefreshDatabase::class);

beforeEach(function () {
    Storage::fake('public');
    config(['mediable.default_disk' => 'public', 'mediable.allowed_disks' => ['public']]);
    Storage::disk('public')->makeDirectory('source');
    Storage::disk('public')->makeDirectory('destination/nested');
    $this->actingAs(User::factory()->create());
});

function movableMedia(string $name, string $directory = 'source'): Media
{
    Storage::disk('public')->put(trim($directory.'/'.$name.'.jpg', '/'), 'original-'.$name);

    return Media::withoutEvents(fn () => Media::forceCreate([
        'disk'              => 'public', 'directory' => $directory, 'filename' => $name, 'extension' => 'jpg',
        'mime_type'         => 'image/jpeg', 'aggregate_type' => 'image', 'size' => 10,
        'custom_properties' => ['focus' => '50-50'],
    ]));
}

it('moves multiple originals preserving IDs metadata and derivatives', function () {
    $first   = movableMedia('first');
    $second  = movableMedia('second');
    $variant = movableMedia('thumb', 'conversions/'.$first->id);
    $variant->forceFill(['original_media_id' => $first->id, 'variant_name' => 'thumb'])->saveQuietly();
    $this->postJson(route('media.move'), ['media_ids' => [$first->id, $second->id], 'destination' => 'destination/nested', 'disk' => 'public'])
        ->assertOk()->assertJsonPath('moved_ids', [(string) $first->id, (string) $second->id]);
    Storage::disk('public')->assertMissing('source/first.jpg');
    Storage::disk('public')->assertExists('destination/nested/first.jpg');
    expect($first->fresh()->directory)->toBe('destination/nested')
        ->and($first->fresh()->custom_properties)->toBe(['focus' => '50-50'])
        ->and($first->fresh()->findVariant('thumb')->id)->toBe($variant->id);
    Storage::disk('public')->assertExists($variant->getDiskPath());
});

it('moves to root and treats the current folder as a safe no-op', function () {
    $media = movableMedia('root');
    $this->postJson(route('media.move'), ['media_ids' => [$media->id], 'destination' => '/'])->assertOk();
    expect($media->fresh()->directory)->toBe('');
    Storage::disk('public')->assertExists('root.jpg');
    $this->postJson(route('media.move'), ['media_ids' => [$media->id], 'destination' => '/'])->assertOk();
});

it('rejects collisions for the whole batch without overwriting anything', function () {
    $first  = movableMedia('first');
    $second = movableMedia('second');
    Storage::disk('public')->put('destination/second.jpg', 'existing');
    $this->postJson(route('media.move'), ['media_ids' => [$first->id, $second->id], 'destination' => 'destination'])->assertConflict();
    Storage::disk('public')->assertExists(['source/first.jpg', 'source/second.jpg']);
    expect(Storage::disk('public')->get('destination/second.jpg'))->toBe('existing');
});

it('rejects traversal reserved and missing folders', function (string $destination) {
    $media = movableMedia('safe');
    $this->postJson(route('media.move'), ['media_ids' => [$media->id], 'destination' => $destination])->assertUnprocessable();
    Storage::disk('public')->assertExists('source/safe.jpg');
})->with(['../outside', 'destination/../source', 'conversions', 'missing', 'destination\\nested']);

it('rejects duplicate IDs variants missing originals and wrong disks', function () {
    $media = movableMedia('safe');
    $this->postJson(route('media.move'), ['media_ids' => [$media->id, $media->id], 'destination' => '/'])->assertUnprocessable();
    $this->postJson(route('media.move'), ['media_ids' => [$media->id], 'destination' => '/', 'disk' => 'private'])->assertUnprocessable();
    $variant = movableMedia('variant');
    $variant->forceFill(['original_media_id' => $media->id])->saveQuietly();
    $this->postJson(route('media.move'), ['media_ids' => [$variant->id], 'destination' => '/'])->assertUnprocessable();
    Storage::disk('public')->delete($media->getDiskPath());
    $this->postJson(route('media.move'), ['media_ids' => [$media->id], 'destination' => '/'])->assertUnprocessable();
});

it('lists destination folders without loading assets or exposing conversions', function () {
    Storage::disk('public')->makeDirectory('conversions/123');
    $this->getJson(route('media.folders'))->assertOk()->assertJsonCount(2, 'folders')
        ->assertJsonPath('folders.0.path', 'destination');
    $this->getJson(route('media.folders', ['path' => 'destination']))->assertOk()->assertJsonPath('folders.0.path', 'destination/nested');
    $this->getJson(route('media.folders', ['path' => '../outside']))->assertUnprocessable();
});

it('preserves existing folder names containing spaces', function () {
    Storage::disk('public')->makeDirectory('Japan photos');
    $media = movableMedia('safe');
    $this->postJson(route('media.move'), ['media_ids' => [$media->id], 'destination' => 'Japan photos'])->assertOk();
    expect($media->fresh()->directory)->toBe('Japan photos');
    Storage::disk('public')->assertExists('Japan photos/safe.jpg');
});

it('requires authentication for moving files and listing destinations', function () {
    auth()->logout();
    $this->getJson(route('media.folders'))->assertUnauthorized();
    $this->postJson(route('media.move'), ['media_ids' => [1], 'destination' => '/'])->assertUnauthorized();
});

it('keeps gallery attachments and article featured images selected after a move', function () {
    $media = movableMedia('attached');
    $photo = \Modules\Photography\Models\Photo::create(['title' => 'Japan', 'slug' => 'japan']);
    $photo->syncMedia([$media->id], 'gallery');
    $photo->syncMedia([$media->id], 'cover');
    $article = \Modules\Blog\Database\Factories\ArticleFactory::new()->create(['featured_image' => $media->id]);
    $this->postJson(route('media.move'), ['media_ids' => [$media->id], 'destination' => 'destination'])->assertOk();
    expect($photo->fresh()->images->pluck('id')->all())->toBe([$media->id])
        ->and($photo->fresh()->cover_image->id)->toBe($media->id)
        ->and((int) $article->fresh()->featured_image)->toBe($media->id)
        ->and($article->fresh()->featured_image_url)->toBe($media->fresh()->getUrl());
});

it('updates embedded URLs project images SEO and site settings without changing other URLs', function () {
    $media   = movableMedia('linked');
    $old     = $media->getUrl();
    $path    = parse_url($old, PHP_URL_PATH);
    $article = \Modules\Blog\Database\Factories\ArticleFactory::new()->create([
        'content' => '<img src="'.$old.'?v=1"><a href="'.$path.'">Photo</a><img src="https://external.test'.$path.'"><img src="'.$old.'.backup">',
    ]);
    $project = \Modules\Projects\Models\Project::create([
        'title'          => 'Project', 'slug' => 'project', 'description' => 'Description',
        'featured_image' => $old, 'images' => [$path, ['url' => $old, 'alt' => 'Photo']],
    ]);
    $seo               = $article->seo()->create(['image' => $old, 'schema' => ['image' => $old]]);
    $settings          = app(\Modules\Settings\Settings\SiteSettings::class);
    $settings->favicon = $path;
    $settings->image   = $old;
    $settings->save();
    $this->postJson(route('media.move'), ['media_ids' => [$media->id], 'destination' => 'destination'])->assertOk();
    $new     = $media->fresh()->getUrl();
    $newPath = parse_url($new, PHP_URL_PATH);
    expect($article->fresh()->content)->toBe('<img src="'.$new.'?v=1"><a href="'.$newPath.'">Photo</a><img src="https://external.test'.$path.'"><img src="'.$old.'.backup">')
        ->and($project->fresh()->featured_image)->toBe($new)
        ->and($project->fresh()->images)->toBe([$newPath, ['url' => $new, 'alt' => 'Photo']])
        ->and($seo->fresh()->image)->toBe($new)
        ->and($seo->fresh()->schema)->toBe(['image' => $new])
        ->and(app(\Modules\Settings\Settings\SiteSettings::class)->favicon)->toBe($newPath)
        ->and(app(\Modules\Settings\Settings\SiteSettings::class)->image)->toBe($new);
});

it('updates encoded paths and soft deleted content without matching filename prefixes', function () {
    $media = movableMedia('my photo');
    Storage::disk('public')->makeDirectory('New photos');
    $article = \Modules\Blog\Database\Factories\ArticleFactory::new()->create(['content' => '<img src="/storage/source/my%20photo.jpg">']);
    $article->delete();
    $this->postJson(route('media.move'), ['media_ids' => [$media->id], 'destination' => 'New photos'])->assertOk();
    expect($article->fresh()->content)->toBe('<img src="/storage/New%20photos/my%20photo.jpg">');
});

it('redirects old public links directly to the latest location and resolves old thumbnail references', function () {
    $media = movableMedia('linked');
    $old   = $media->getUrl();
    $this->postJson(route('media.move'), ['media_ids' => [$media->id], 'destination' => 'destination'])->assertOk();
    $intermediate = $media->fresh()->getUrl();
    $this->postJson(route('media.move'), ['media_ids' => [$media->id], 'destination' => 'destination/nested'])->assertOk();
    auth()->logout();
    foreach ([$old, $intermediate] as $url) {
        $this->get($url)->assertRedirect($media->fresh()->getUrl())->assertHeader('Cache-Control', 'no-store, private');
        expect(app(\Modules\Media\Support\PublicImageSources::class)->mediaForUrls([$url])[$url]->id)->toBe($media->id);
    }
    $media->fresh()->delete();
    $this->get($old)->assertNotFound();
});

it('never redirects unknown files or a formerly public image that has become private', function () {
    $media = movableMedia('linked');
    $old   = $media->getUrl();
    $this->postJson(route('media.move'), ['media_ids' => [$media->id], 'destination' => 'destination'])->assertOk();
    $media->fresh()->forceFill(['disk' => 'private'])->saveQuietly();
    auth()->logout();
    $this->get($old)->assertNotFound();
    $this->get('/storage/unknown.jpg')->assertNotFound();
});

it('rolls back file and database changes if updating references fails', function () {
    $media = movableMedia('rollback');
    $this->mock(\Modules\Media\Support\MediaReferences::class)->shouldReceive('moved')->once()->andThrow(new RuntimeException('Reference update failed'));
    $this->postJson(route('media.move'), ['media_ids' => [$media->id], 'destination' => 'destination'])->assertConflict()->assertJsonPath('moved_ids', []);
    expect($media->fresh()->directory)->toBe('source');
    Storage::disk('public')->assertExists('source/rollback.jpg');
    Storage::disk('public')->assertMissing('destination/rollback.jpg');
});
