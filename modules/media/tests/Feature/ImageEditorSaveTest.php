<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Modules\Auth\Models\User;
use Modules\Media\Models\Media;

uses(RefreshDatabase::class);

function editorTestPng(int $width, int $height): string
{
    $image = imagecreatetruecolor($width, $height);
    ob_start();
    imagepng($image);
    $bytes = ob_get_clean();
    imagedestroy($image);

    return $bytes;
}

beforeEach(function () {
    $this->actingAs(User::factory()->create()->assignRole('admin'));
    Storage::fake('public');
    Queue::fake();
    config(['mediable.default_disk' => 'public']);
    $this->original = editorTestPng(8, 6);
    $this->edited   = editorTestPng(3, 4);
    Storage::disk('public')->put('logo.png', $this->original);
    $this->media   = Media::withoutEvents(fn () => Media::forceCreate(['disk' => 'public', 'directory' => '', 'filename' => 'logo', 'extension' => 'png', 'mime_type' => 'image/png', 'aggregate_type' => 'image', 'size' => strlen($this->original)]));
    $this->payload = ['data' => 'data:image/png;base64,'.base64_encode($this->edited), 'path' => '', 'name' => 'logo', 'mime_type' => 'image/png', 'overwrite' => true, 'asset_id' => (string) $this->media->id];
});

test('edited image replacement keeps the asset identity and saves the exported pixels', function () {
    $this->postJson(route('media.image-editor.save'), $this->payload)->assertOk()->assertJsonPath('success', true)->assertJsonPath('asset.id', (string) $this->media->id);
    expect(Media::count())->toBe(1)
        ->and(Storage::disk('public')->get('logo.png'))->toBe($this->edited)
        ->and($this->media->fresh()->size)->toBe(strlen($this->edited));
});

test('failed image writes preserve the original file and media record', function () {
    $disk    = Storage::disk('public');
    $failing = Mockery::mock($disk);
    $failing->shouldReceive('put')->once()->andReturn(false);
    $failing->shouldNotReceive('delete');
    Storage::shouldReceive('disk')->with('public')->andReturn($failing);
    $this->postJson(route('media.image-editor.save'), $this->payload)->assertStatus(503)->assertJsonPath('success', false);
    expect($disk->get('logo.png'))->toBe($this->original)
        ->and($this->media->fresh()->size)->toBe(strlen($this->original));
    Queue::assertNothingPushed();
});

test('saving an edited copy preserves the original file', function () {
    config(['mediable.default_disk' => 'local']);
    $response = $this->postJson(route('media.image-editor.save'), [...$this->payload, 'overwrite' => false, 'name' => 'logo_copy.png'])->assertOk()->assertJsonPath('success', true)->assertJsonPath('asset.extension', 'png');
    expect($response->json('asset.id'))->not->toBe((string) $this->media->id)
        ->and(Storage::disk('public')->get('logo.png'))->toBe($this->original)
        ->and(Storage::disk('public')->get('logo_copy.png'))->toBe($this->edited);
});
