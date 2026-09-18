<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Modules\Auth\Models\User;
use Modules\Projects\Models\Project;
use Modules\Projects\Tables\Projects;
use Modules\Table\Filters\Clause;
use Modules\Table\Filters\TrashedFilter;

uses(RefreshDatabase::class);

function trashTestProject(string $slug): Project
{
    return Project::create(['title' => $slug, 'slug' => $slug, 'description' => 'Keep this content', 'images' => ['existing-image.jpg']]);
}

function trashTestTable(string $clause = 'only_trashed', ?string $search = null): Projects
{
    return Projects::make()->setRequest(Request::create('/', 'GET', [
        'filters' => ['deleted_at' => ['enabled' => true, 'clause' => $clause]],
        'search'  => $search,
    ]));
}

test('trash filters use eloquent macros to include and exclude deleted records', function () {
    $active  = trashTestProject('active');
    $deleted = trashTestProject('deleted');
    $deleted->delete();
    $filter = TrashedFilter::make('deleted_at');

    foreach ([
        [Clause::WithoutTrashed, [$active->id]],
        [Clause::OnlyTrashed, [$deleted->id]],
        [Clause::WithTrashed, [$active->id, $deleted->id]],
    ] as [$clause, $ids]) {
        $query = Project::query();
        $filter->handle($query, $clause, null);
        expect($query->orderBy('id')->pluck('id')->all())->toBe($ids);
    }
});

test('trash filters safely ignore models without soft deletes', function () {
    $user  = User::factory()->create();
    $query = User::query();
    TrashedFilter::make('deleted_at')->handle($query, Clause::OnlyTrashed, null);
    expect($query->pluck('id')->all())->toBe([$user->id]);
});

test('all soft deleted content lists expose trash and restore', function (string $class) {
    $table = $class::make();
    expect(collect($table->filters())->contains(fn ($filter) => $filter instanceof TrashedFilter))->toBeTrue()
        ->and(collect($table->actions())->firstWhere('label', 'Restore')->asBulkAction)->toBeTrue();
})->with([
    Modules\Blog\Tables\Articles::class,
    Modules\Blog\Tables\Categories::class,
    Modules\Photography\Tables\Photos::class,
    Projects::class,
    Modules\Speaking\Tables\SpeakingEvents::class,
    Modules\Tools\Tables\Tools::class,
]);

test('explicit row and bulk restoration preserve content and skip active records', function () {
    $one    = trashTestProject('one');
    $two    = trashTestProject('two');
    $active = trashTestProject('active');
    $one->delete();
    $two->delete();
    $table   = trashTestTable();
    $restore = collect($table->actions())->firstWhere('label', 'Restore')->setTable($table);
    $restore->handle([$one->id]);
    expect($one->fresh()->trashed())->toBeFalse();
    $restore->handle([$two->id, $active->id]);
    expect(Project::count())->toBe(3)
        ->and($two->fresh()->images)->toBe(['existing-image.jpg'])
        ->and($two->fresh()->description)->toBe('Keep this content')
        ->and($restore->isDisabled($active))->toBeTrue();
});

test('restore all respects search and trash filters', function () {
    $matching = trashTestProject('match');
    $other    = trashTestProject('other');
    $matching->delete();
    $other->delete();
    $table = trashTestTable(search: 'match');
    collect($table->actions())->firstWhere('label', 'Restore')->setTable($table)->handle(['*']);
    expect($matching->fresh()->trashed())->toBeFalse()
        ->and(Project::withTrashed()->find($other->id)->trashed())->toBeTrue();
});

test('restore all from the active view never restores unseen trash', function () {
    $deleted = trashTestProject('deleted');
    $deleted->delete();
    $table = trashTestTable('without_trashed');
    collect($table->actions())->firstWhere('label', 'Restore')->setTable($table)->handle(['*']);
    expect(Project::withTrashed()->find($deleted->id)->trashed())->toBeTrue();
});

test('trash remains available when every record is deleted and edit links are removed', function () {
    $deleted = trashTestProject('deleted');
    $deleted->delete();
    $activeData = trashTestTable('without_trashed')->toArray();
    expect($activeData['results']['total'])->toBe(0)
        ->and(collect($activeData['filters'])->contains('type', 'trashed'))->toBeTrue();
    $data = trashTestTable()->toArray();
    $row  = $data['results']['data'][0];
    expect($data['results']['total'])->toBe(1)
        ->and($row['_column_urls'] ?? [])->toBeEmpty()
        ->and($row['deleted_at'])->not->toBeNull();
    $table = trashTestTable();
    foreach ($table->actions() as $action) {
        expect($action->isHidden($deleted))->toBe($action->label !== 'Restore');
    }
});

test('signed restore endpoint requires an authenticated user', function () {
    $deleted = trashTestProject('deleted');
    $deleted->delete();
    $table  = trashTestTable();
    $index  = collect($table->actions())->search(fn ($action) => $action->label === 'Restore');
    $action = $table->getActionById($index);
    $url    = $action->getActionUrl();
    $this->post($url, ['keys' => [$deleted->id]])->assertForbidden();
    $this->actingAs(User::factory()->create())
        ->post($url, ['keys' => [$deleted->id]])->assertRedirect();
    expect($deleted->fresh()->trashed())->toBeFalse();
});

test('deleting an article from its editor preserves tags and comments for restoration', function () {
    $this->actingAs(User::factory()->create());
    $article = Modules\Blog\Models\Article::create(['title' => 'Recoverable', 'slug' => 'recoverable', 'content' => 'Content']);
    $tag     = Modules\Blog\Models\Tag::create(['name' => 'Tag', 'slug' => 'tag']);
    $article->tags()->attach($tag);
    $comment = $article->comments()->create(['author_name' => 'Reader', 'author_email' => 'reader@example.test', 'content' => 'Comment']);
    $this->delete(route('admin.blog.destroy', $article->id))->assertRedirect();
    expect($article->fresh()->trashed())->toBeTrue()
        ->and($article->tags()->count())->toBe(1)
        ->and($comment->fresh()->trashed())->toBeFalse();
    $table = Modules\Blog\Tables\Articles::make();
    collect($table->actions())->firstWhere('label', 'Restore')->setTable($table)->handle([$article->id]);
    expect($article->fresh()->trashed())->toBeFalse()
        ->and($article->tags()->count())->toBe(1)
        ->and($article->comments()->count())->toBe(1);
});

test('deleting a gallery from its editor preserves its categories for restoration', function () {
    $this->actingAs(User::factory()->create());
    $gallery  = Modules\Photography\Models\Photo::create(['title' => 'Gallery', 'slug' => 'gallery']);
    $category = Modules\Blog\Models\Category::create(['name' => 'Travel', 'slug' => 'travel']);
    $gallery->categories()->attach($category);
    $this->delete(route('admin.photography.destroy', $gallery))->assertRedirect();
    expect($gallery->fresh()->trashed())->toBeTrue()->and($gallery->categories()->count())->toBe(1);
    $table = Modules\Photography\Tables\Photos::make();
    collect($table->actions())->firstWhere('label', 'Restore')->setTable($table)->handle([$gallery->id]);
    expect($gallery->fresh()->trashed())->toBeFalse()->and($gallery->categories()->count())->toBe(1);
});
