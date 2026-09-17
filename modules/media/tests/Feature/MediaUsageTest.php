<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Modules\Auth\Models\User;
use Modules\Blog\Database\Factories\ArticleFactory;
use Modules\Media\Models\Media;
use Modules\Media\Models\MediaUrlHistory;
use Modules\Media\Support\MediaUsage;
use Modules\Photography\Models\Photo;
use Modules\Projects\Models\Project;
use Modules\Settings\Settings\SiteSettings;

uses(RefreshDatabase::class);

beforeEach(function () {
    Storage::fake('public');
    config(['mediable.default_disk' => 'public', 'mediable.allowed_disks' => ['public']]);
    $this->actingAs(User::factory()->create());
});

function deletableMedia(string $name, string $directory = 'delete_test'): Media
{
    Storage::disk('public')->put($directory.'/'.$name.'.jpg', 'original-'.$name);

    return Media::withoutEvents(fn () => Media::forceCreate([
        'disk'      => 'public', 'directory' => $directory, 'filename' => $name, 'extension' => 'jpg',
        'mime_type' => 'image/jpeg', 'aggregate_type' => 'image', 'size' => 10,
    ]));
}

it('reports gallery attachments and featured images with working editor links', function () {
    $media   = deletableMedia('used');
    $gallery = Photo::create(['title' => 'Japan', 'slug' => 'japan']);
    $gallery->syncMedia([$media->id], 'gallery');
    $gallery->syncMedia([$media->id], 'cover');
    $article  = ArticleFactory::new()->create(['featured_image' => $media->id]);
    $response = $this->getJson(route('media.usage', ['media_ids' => [$media->id]]))
        ->assertOk()->assertJsonCount(3, 'assets.0.usages');
    $usages = collect($response->json('assets.0.usages'));
    expect($usages->pluck('field')->all())->toEqualCanonicalizing(['Gallery', 'Cover', 'Featured image'])
        ->and($usages->last()['url'])->toBe(route('admin.blog.edit', $article->id));
    $this->deleteJson(route('media.destroy', $media->id))->assertConflict();
    expect($media->fresh())->not->toBeNull()
        ->and($gallery->fresh()->images->pluck('id')->all())->toBe([$media->id]);
    Storage::disk('public')->assertExists($media->getDiskPath());
});

it('checks content nested image arrays SEO and site settings including trash', function () {
    $media   = deletableMedia('embedded');
    $url     = $media->getUrl();
    $article = ArticleFactory::new()->create(['content' => '<img src="'.$url.'?v=1">']);
    $article->delete();
    Project::create(['title' => 'Project', 'slug' => 'project', 'description' => 'Example', 'images' => [['image' => $url]]]);
    $article->seo()->create(['image' => $url, 'schema' => ['image' => ['url' => $url]]]);
    $settings          = app(SiteSettings::class);
    $settings->favicon = parse_url($url, PHP_URL_PATH);
    $settings->save();
    $usages = collect(app(MediaUsage::class)->forMedia($media)['usages']);
    expect($usages)->toHaveCount(5)
        ->and($usages->firstWhere('type', 'Article (trash)')['url'])->toBeNull()
        ->and($usages->pluck('field')->all())->toContain('Images', 'Image', 'Schema', 'Favicon');
});

it('recognizes encoded paths aliases generated variants and signed thumbnails', function (string $reference) {
    $media   = deletableMedia('my photo');
    $variant = deletableMedia('preview', 'conversions/'.$media->id);
    $variant->forceFill(['original_media_id' => $media->id, 'variant_name' => 'thumb'])->saveQuietly();
    MediaUrlHistory::create(['media_id' => $media->id, 'path' => '/storage/old/photo.jpg', 'path_hash' => hash('sha256', '/storage/old/photo.jpg')]);
    $url = match ($reference) {
        'encoded'         => '/storage/delete_test/my%20photo.jpg',
        'alias'           => '/storage/old/photo.jpg',
        'variant'         => $variant->getUrl(),
        'signed'          => url('/media/images/'.$media->id.'/thumb').'?signature=test',
        'relative signed' => '/media/images/'.$media->id.'/thumb?signature=test',
    };
    ArticleFactory::new()->create(['content' => '<img src="'.$url.'">']);
    expect(app(MediaUsage::class)->forMedia($media)['usages'])->toHaveCount(1);
})->with(['encoded', 'alias', 'variant', 'signed', 'relative signed']);

it('does not confuse external URLs or filename prefixes with usage', function () {
    $media = deletableMedia('unused');
    ArticleFactory::new()->create(['content' => '<img src="https://external.test/storage/delete_test/unused.jpg"><img src="'.$media->getUrl().'.backup"><img src="https://external.test/media/images/'.$media->id.'/thumb">']);
    expect(app(MediaUsage::class)->forMedia($media)['usages'])->toBe([]);
});

it('deletes only unused files in a mixed batch and cleans up their variants and history', function () {
    $used    = deletableMedia('used');
    $unused  = deletableMedia('unused');
    $variant = deletableMedia('thumb', 'conversions/'.$unused->id);
    $variant->forceFill(['original_media_id' => $unused->id, 'variant_name' => 'thumb'])->saveQuietly();
    MediaUrlHistory::create(['media_id' => $unused->id, 'path' => '/storage/old/unused.jpg', 'path_hash' => hash('sha256', '/storage/old/unused.jpg')]);
    $gallery = Photo::create(['title' => 'Japan', 'slug' => 'japan']);
    $gallery->syncMedia([$used->id], 'gallery');
    $this->postJson(route('media.delete-unused'), ['media_ids' => [$used->id, $unused->id]])
        ->assertOk()->assertJsonPath('deleted_ids', [(string) $unused->id])
        ->assertJsonPath('kept.0.id', (string) $used->id)->assertJsonPath('errors', []);
    expect($used->fresh())->not->toBeNull()
        ->and($unused->fresh())->toBeNull()
        ->and($variant->fresh())->toBeNull()
        ->and($gallery->fresh()->images->pluck('id')->all())->toBe([$used->id]);
    Storage::disk('public')->assertExists($used->getDiskPath());
    Storage::disk('public')->assertMissing([$unused->getDiskPath(), $variant->getDiskPath()]);
    $this->assertDatabaseMissing('media_url_histories', ['media_id' => $unused->id]);
});

it('rechecks usage at deletion even after an unused preflight result', function () {
    $media = deletableMedia('new-use');
    $this->getJson(route('media.usage', ['media_ids' => [$media->id]]))->assertJsonPath('assets.0.usages', []);
    ArticleFactory::new()->create(['featured_image' => $media->id]);
    $this->postJson(route('media.delete-unused'), ['media_ids' => [$media->id]])->assertOk()
        ->assertJsonPath('deleted_ids', [])->assertJsonCount(1, 'kept');
    Storage::disk('public')->assertExists($media->getDiskPath());
});

it('keeps files when usage checking fails and reports successful deletions separately', function () {
    $failed = deletableMedia('failed');
    $unused = deletableMedia('unused');
    $this->mock(MediaUsage::class, function ($mock) use ($failed, $unused) {
        $mock->shouldReceive('forMedia')->withArgs(fn ($file) => $file->id === $failed->id)->andThrow(new RuntimeException('Usage check unavailable'));
        $mock->shouldReceive('forMedia')->withArgs(fn ($file) => $file->id === $unused->id)->andReturn(['id' => (string) $unused->id, 'title' => 'Unused', 'usages' => []]);
    });
    $this->postJson(route('media.delete-unused'), ['media_ids' => [$failed->id, $unused->id]])->assertOk()
        ->assertJsonPath('deleted_ids', [(string) $unused->id])->assertJsonPath('errors.0.id', (string) $failed->id);
    Storage::disk('public')->assertExists($failed->getDiskPath());
    expect($failed->fresh())->not->toBeNull();
});

it('blocks a folder containing used media before deleting any file', function () {
    $unused = deletableMedia('unused');
    $used   = deletableMedia('used', 'delete_test/nested');
    ArticleFactory::new()->create(['featured_image' => $used->id]);
    $this->deleteJson(route('media-manager.destroy'), ['path' => 'delete_test'])->assertConflict();
    Storage::disk('public')->assertExists([$unused->getDiskPath(), $used->getDiskPath()]);
});

it('handles literal folder underscores and removes unused variants using model events', function () {
    $original = deletableMedia('unused');
    $variant  = deletableMedia('preview', 'conversions/'.$original->id);
    $variant->forceFill(['original_media_id' => $original->id, 'variant_name' => 'thumb'])->saveQuietly();
    $other = deletableMedia('other', 'deleteXtest');
    $this->deleteJson(route('media-manager.destroy'), ['path' => 'delete_test'])->assertOk();
    expect($original->fresh())->toBeNull()->and($variant->fresh())->toBeNull()->and($other->fresh())->not->toBeNull();
    Storage::disk('public')->assertMissing($variant->getDiskPath());
    Storage::disk('public')->assertExists($other->getDiskPath());
});

it('validates delete targets and requires authentication for usage and bulk deletion', function () {
    $media   = deletableMedia('original');
    $variant = deletableMedia('variant');
    $variant->forceFill(['original_media_id' => $media->id])->saveQuietly();
    $this->deleteJson(route('media.destroy', $variant->id))->assertUnprocessable();
    $this->postJson(route('media.delete-unused'), ['media_ids' => [$media->id, $variant->id]])->assertUnprocessable();
    $this->postJson(route('media.delete-unused'), ['media_ids' => [$media->id, $media->id]])->assertUnprocessable();
    $this->deleteJson(route('media-manager.destroy'), ['path' => '/'])->assertUnprocessable();
    $this->deleteJson(route('media-manager.destroy'), ['path' => '../outside'])->assertUnprocessable();
    auth()->logout();
    $this->getJson(route('media.usage', ['media_ids' => [$media->id]]))->assertUnauthorized();
    $this->postJson(route('media.delete-unused'), ['media_ids' => [$media->id]])->assertUnauthorized();
});
