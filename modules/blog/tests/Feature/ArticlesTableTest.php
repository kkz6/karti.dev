<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Modules\Auth\Models\User;
use Modules\Blog\Models\Article;
use Modules\Blog\Tables\Articles;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->actingAs(User::factory()->create());
});

test('articles default to a compact table with newest first and an author fallback', function () {
    $old     = Article::factory()->create(['created_at' => '2024-01-01', 'author_name' => 'Guest author']);
    $new     = Article::factory()->create(['created_at' => '2026-01-01', 'author_name' => null, 'user_id' => auth()->id()]);
    $trashed = Article::factory()->create();
    $trashed->delete();
    $table = Articles::make()->setRequest(Request::create('/'))->toArray();
    expect(array_keys(array_filter($table['state']['columns'])))->toBe(['title', 'author_name', 'created_at', '_actions'])
        ->and(array_column($table['columns'], 'attribute'))->not->toContain('updated_at', 'deleted_at')
        ->and(array_column($table['results']['data'], 'id'))->toBe([$new->id, $old->id])
        ->and($table['results']['data'][0]['author_name']['value'])->toBe(auth()->user()->name);
});

test('deleted date is available only when the active trash filter includes deleted articles', function (string $clause, bool $enabled, bool $showDeleted) {
    $live    = Article::factory()->create();
    $trashed = Article::factory()->create();
    $trashed->delete();
    $request = Request::create('/', 'GET', [
        'filters' => ['deleted_at' => ['clause' => $clause, 'enabled' => $enabled]],
        'columns' => ['title', 'author_name', 'created_at'],
    ]);
    $table = Articles::make()->setRequest($request)->toArray();
    expect(in_array('deleted_at', array_column($table['columns'], 'attribute')))->toBe($showDeleted);
    if ($showDeleted) {
        expect($table['state']['columns']['deleted_at'])->toBeTrue();
    }
    $ids = array_column($table['results']['data'], 'id');
    if ($enabled && $clause === 'only_trashed') {
        expect($ids)->toBe([$trashed->id]);
    } elseif ($enabled && $clause === 'with_trashed') {
        expect($ids)->toContain($live->id, $trashed->id);
    } else {
        expect($ids)->toBe([$live->id]);
    }
})->with([
    ['only_trashed', true, true],
    ['with_trashed', true, true],
    ['without_trashed', true, false],
    ['only_trashed', false, false],
]);
