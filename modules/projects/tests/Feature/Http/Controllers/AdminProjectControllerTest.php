<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Auth\Models\User;
use Modules\Projects\Models\Project;

uses(RefreshDatabase::class);

function authenticatedUser(): User
{
    $user = User::factory()->create();
    test()->actingAs($user);

    return $user;
}

function validProjectData(array $overrides = []): array
{
    return array_merge([
        'title' => 'Test Project',
        'slug' => 'test-project',
        'description' => 'A test project description.',
        'short_description' => 'Short desc',
        'client' => 'Test Client',
        'project_url' => 'https://example.com',
        'github_url' => 'https://github.com/test/project',
        'technologies' => ['Laravel', 'React'],
        'start_date' => '2026-01-01',
        'end_date' => '2026-06-01',
        'status' => 'published',
        'featured' => true,
        'meta_title' => 'Test SEO Title',
        'meta_description' => 'Test SEO Description',
    ], $overrides);
}

// --- Authentication ---

test('unauthenticated users cannot access projects index', function () {
    $this->get(route('admin.projects.index'))
        ->assertRedirect(route('login'));
});

test('unauthenticated users cannot access create form', function () {
    $this->get(route('admin.projects.create'))
        ->assertRedirect(route('login'));
});

test('unauthenticated users cannot store a project', function () {
    $this->post(route('admin.projects.store'), validProjectData())
        ->assertRedirect(route('login'));
});

// --- Index ---

test('authenticated users can view the projects index', function () {
    authenticatedUser();

    $this->get(route('admin.projects.index'))
        ->assertStatus(200)
        ->assertInertia(fn ($page) => $page->component('projects::index'));
});

// --- Create ---

test('authenticated users can view the create form', function () {
    authenticatedUser();

    $this->get(route('admin.projects.create'))
        ->assertStatus(200)
        ->assertInertia(fn ($page) => $page->component('projects::create'));
});

// --- Store ---

test('authenticated users can create a project', function () {
    authenticatedUser();

    $data = validProjectData();

    $this->post(route('admin.projects.store'), $data)
        ->assertRedirect(route('admin.projects.index'));

    $this->assertDatabaseHas('projects', [
        'title' => 'Test Project',
        'slug' => 'test-project',
        'description' => 'A test project description.',
        'client' => 'Test Client',
        'status' => 'published',
        'featured' => true,
    ]);
});

test('project creation requires title', function () {
    authenticatedUser();

    $data = validProjectData(['title' => '']);

    $this->post(route('admin.projects.store'), $data)
        ->assertSessionHasErrors('title');
});

test('project creation requires slug', function () {
    authenticatedUser();

    $data = validProjectData(['slug' => '']);

    $this->post(route('admin.projects.store'), $data)
        ->assertSessionHasErrors('slug');
});

test('project creation requires description', function () {
    authenticatedUser();

    $data = validProjectData(['description' => '']);

    $this->post(route('admin.projects.store'), $data)
        ->assertSessionHasErrors('description');
});

test('project creation requires unique slug', function () {
    authenticatedUser();

    Project::create(validProjectData());

    $this->post(route('admin.projects.store'), validProjectData())
        ->assertSessionHasErrors('slug');
});

test('project creation requires valid status', function () {
    authenticatedUser();

    $data = validProjectData(['status' => 'invalid']);

    $this->post(route('admin.projects.store'), $data)
        ->assertSessionHasErrors('status');
});

test('project creation validates url fields', function () {
    authenticatedUser();

    $data = validProjectData(['project_url' => 'not-a-url']);

    $this->post(route('admin.projects.store'), $data)
        ->assertSessionHasErrors('project_url');
});

test('project creation accepts nullable optional fields', function () {
    authenticatedUser();

    $data = validProjectData([
        'short_description' => null,
        'client' => null,
        'project_url' => null,
        'github_url' => null,
        'technologies' => null,
        'start_date' => null,
        'end_date' => null,
        'meta_title' => null,
        'meta_description' => null,
    ]);

    $this->post(route('admin.projects.store'), $data)
        ->assertRedirect(route('admin.projects.index'));

    $this->assertDatabaseHas('projects', [
        'title' => 'Test Project',
        'slug' => 'test-project',
    ]);
});

// --- Show ---

test('authenticated users can view a project', function () {
    authenticatedUser();

    $project = Project::create(validProjectData());

    $this->get(route('admin.projects.show', $project))
        ->assertStatus(200)
        ->assertInertia(fn ($page) => $page
            ->component('projects::show')
            ->has('project')
        );
});

// --- Edit ---

test('authenticated users can view the edit form', function () {
    authenticatedUser();

    $project = Project::create(validProjectData());

    $this->get(route('admin.projects.edit', $project))
        ->assertStatus(200)
        ->assertInertia(fn ($page) => $page
            ->component('projects::edit')
            ->has('project')
        );
});

// --- Update ---

test('authenticated users can update a project', function () {
    authenticatedUser();

    $project = Project::create(validProjectData());

    $updatedData = validProjectData([
        'title' => 'Updated Project Title',
        'slug' => 'test-project',
        'description' => 'Updated description.',
    ]);

    $this->put(route('admin.projects.update', $project), $updatedData)
        ->assertRedirect(route('admin.projects.index'));

    $this->assertDatabaseHas('projects', [
        'id' => $project->id,
        'title' => 'Updated Project Title',
        'description' => 'Updated description.',
    ]);
});

test('project update allows same slug for same project', function () {
    authenticatedUser();

    $project = Project::create(validProjectData());

    $updatedData = validProjectData(['title' => 'New Title']);

    $this->put(route('admin.projects.update', $project), $updatedData)
        ->assertRedirect(route('admin.projects.index'));

    $this->assertDatabaseHas('projects', [
        'id' => $project->id,
        'title' => 'New Title',
        'slug' => 'test-project',
    ]);
});

test('project update rejects duplicate slug from another project', function () {
    authenticatedUser();

    Project::create(validProjectData());
    $project2 = Project::create(validProjectData(['slug' => 'other-project', 'title' => 'Other']));

    $this->put(route('admin.projects.update', $project2), validProjectData(['slug' => 'test-project']))
        ->assertSessionHasErrors('slug');
});

// --- Destroy ---

test('authenticated users can delete a project', function () {
    authenticatedUser();

    $project = Project::create(validProjectData());

    $this->delete(route('admin.projects.destroy', $project))
        ->assertRedirect(route('admin.projects.index'));

    $this->assertSoftDeleted('projects', ['id' => $project->id]);
});

// --- Model ---

test('project uses slug as route key', function () {
    $project = new Project();

    expect($project->getRouteKeyName())->toBe('slug');
});

test('project casts technologies to array', function () {
    authenticatedUser();

    $project = Project::create(validProjectData(['technologies' => ['PHP', 'Laravel']]));

    expect($project->fresh()->technologies)->toBeArray()->toContain('PHP', 'Laravel');
});

test('project scope published returns only published projects', function () {
    authenticatedUser();

    Project::create(validProjectData(['slug' => 'published-one']));
    Project::create(validProjectData(['slug' => 'draft-one', 'title' => 'Draft', 'status' => 'draft']));
    Project::create(validProjectData(['slug' => 'archived-one', 'title' => 'Archived', 'status' => 'archived']));

    $published = Project::published()->get();

    expect($published)->toHaveCount(1);
    expect($published->first()->slug)->toBe('published-one');
});

test('project scope featured returns only featured projects', function () {
    authenticatedUser();

    Project::create(validProjectData(['slug' => 'featured-one', 'featured' => true]));
    Project::create(validProjectData(['slug' => 'not-featured', 'title' => 'Not Featured', 'featured' => false]));

    $featured = Project::featured()->get();

    expect($featured)->toHaveCount(1);
    expect($featured->first()->slug)->toBe('featured-one');
});
