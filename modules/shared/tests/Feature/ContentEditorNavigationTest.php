<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Auth\Models\User;
use Modules\Blog\Models\Article;
use Modules\Blog\Models\Category;
use Modules\Blog\Models\Tag;
use Modules\Projects\Models\Project;
use Modules\Projects\Tables\Projects;
use Modules\Speaking\Models\SpeakingEvent;
use Modules\Speaking\Tables\SpeakingEvents;
use Modules\Tools\Models\Tool;
use Modules\Tools\Models\ToolCategory;
use Modules\Tools\Tables\Tools;

uses(RefreshDatabase::class);

test('content table IDs and titles open the editor directly', function (string $model, string $table, string $module) {
    $record     = new $model(['title' => 'Example entry', 'slug' => 'example-entry']);
    $record->id = 42;
    $listing    = $table::make();

    foreach (['id', 'title'] as $column) {
        expect($listing->getColumnByAttribute($column)->resolveUrl($record))
            ->toBe(route("admin.{$module}.edit", $record));
    }

    expect($listing->actions())->toHaveCount(2);
})->with([
    [Project::class, Projects::class, 'projects'],
    [SpeakingEvent::class, SpeakingEvents::class, 'speaking'],
    [Tool::class, Tools::class, 'tools'],
]);

test('tool creation and updates stay in the editor and legacy views redirect there', function () {
    $this->actingAs(User::factory()->create());
    $category = ToolCategory::create(['name' => 'Development', 'slug' => 'development']);
    $data     = ['title' => 'Editor', 'description' => 'Daily editor', 'tool_category_id' => $category->id, 'status' => 'active'];

    $response = $this->post(route('admin.tools.store'), $data);
    $tool     = Tool::firstOrFail();
    $response->assertRedirect(route('admin.tools.edit', $tool));

    $this->get(route('admin.tools.show', $tool))->assertRedirect(route('admin.tools.edit', $tool));
    $this->get(route('admin.tools.edit', $tool))->assertOk();
    $this->put(route('admin.tools.update', $tool), [...$data, 'title' => 'Updated editor'])
        ->assertRedirect(route('admin.tools.edit', $tool));
    expect($tool->fresh()->title)->toBe('Updated editor');
});

test('legacy views still require authentication', function () {
    $this->get(route('admin.tools.show', 42))->assertRedirect(route('login'));
});

test('article creation and updates keep the saved record open in the editor', function () {
    $this->actingAs(User::factory()->create());
    $category = Category::create(['name' => 'Travel', 'slug' => 'travel']);
    $data     = [
        'title'            => 'Japan', 'slug' => 'japan', 'content' => '<p>A journey.</p>',
        'category_id'      => $category->id, 'status' => 'draft', 'tags' => [],
        'excerpt'          => null, 'featured_image' => [], 'meta_title' => null,
        'meta_description' => null, 'seo' => [], 'published_at' => null,
    ];

    $response = $this->post(route('admin.blog.store'), $data);
    $article  = Article::firstOrFail();
    $response->assertRedirect(route('admin.blog.edit', $article->id));
    $this->put(route('admin.blog.update', $article->id), [...$data, 'title' => 'Updated journey'])
        ->assertRedirect(route('admin.blog.edit', $article->id));
    expect($article->fresh()->title)->toBe('Updated journey');

    $tag = Tag::create(['name' => 'Japan', 'slug' => 'japan']);
    $this->put(route('admin.blog.update', $article->id), [...$data, 'tags' => [$tag->id]])->assertSessionHasNoErrors();
    expect($article->fresh()->tags->pluck('id')->all())->toBe([$tag->id]);
    $this->put(route('admin.blog.update', $article->id), [...$data, 'tags' => []])->assertSessionHasNoErrors();
    expect($article->fresh()->tags)->toBeEmpty();

    $this->travelTo(now()->startOfSecond());
    $this->put(route('admin.blog.update', $article->id), [...$data, 'status' => 'published', 'published_at' => now()->addDay()->toIso8601String()])
        ->assertSessionHasNoErrors();
    expect($article->fresh()->published_at->isFuture())->toBeTrue();
    $this->put(route('admin.blog.update', $article->id), [...$data, 'status' => 'published', 'published_at' => null])
        ->assertSessionHasNoErrors();
    expect($article->fresh()->published_at->equalTo(now()))->toBeTrue();
});
