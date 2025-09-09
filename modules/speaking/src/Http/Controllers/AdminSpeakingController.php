<?php

namespace Modules\Speaking\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Shared\Http\Controllers\BaseController;
use Modules\Speaking\Interfaces\SpeakingEventServiceInterface;
use Modules\Speaking\Models\SpeakingEvent;
use Modules\Speaking\Tables\SpeakingEvents;

class AdminSpeakingController extends BaseController
{
    public function __construct(
        private readonly SpeakingEventServiceInterface $speakingEventService
    ) {}

    /**
     * Display a listing of speaking events.
     */
    public function index(Request $request): Response
    {
        return Inertia::render('speaking::index', [
            'table' => SpeakingEvents::make($request->all()),
            'filters' => $request->all(),
        ]);
    }

    /**
     * Show the form for creating a new speaking event.
     */
    public function create(): Response
    {
        return Inertia::render('speaking::create');
    }

    /**
     * Store a newly created speaking event in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:speaking_events,slug',
            'description' => 'required|string',
            'event_name' => 'required|string|max:255',
            'event_date' => 'nullable|date',
            'event_type' => 'required|in:conference,podcast,workshop,webinar',
            'location' => 'nullable|string|max:255',
            'url' => 'nullable|url|max:255',
            'cta_text' => 'required|string|max:50',
            'featured' => 'boolean',
            'status' => 'in:draft,published,archived',
            'meta_title' => 'nullable|string|max:60',
            'meta_description' => 'nullable|string|max:160',
        ]);

        SpeakingEvent::create($validated);

        return redirect()
            ->route('admin.speaking.index')
            ->with('success', 'Speaking event created successfully.');
    }

    /**
     * Display the specified speaking event.
     */
    public function show(SpeakingEvent $speaking): Response
    {
        return Inertia::render('speaking::show', [
            'event' => $speaking,
        ]);
    }

    /**
     * Show the form for editing the specified speaking event.
     */
    public function edit(SpeakingEvent $speaking): Response
    {
        return Inertia::render('speaking::edit', [
            'event' => $speaking,
        ]);
    }

    /**
     * Update the specified speaking event in storage.
     */
    public function update(Request $request, SpeakingEvent $speaking): RedirectResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:speaking_events,slug,' . $speaking->id,
            'description' => 'required|string',
            'event_name' => 'required|string|max:255',
            'event_date' => 'nullable|date',
            'event_type' => 'required|in:conference,podcast,workshop,webinar',
            'location' => 'nullable|string|max:255',
            'url' => 'nullable|url|max:255',
            'cta_text' => 'required|string|max:50',
            'featured' => 'boolean',
            'status' => 'in:draft,published,archived',
            'meta_title' => 'nullable|string|max:60',
            'meta_description' => 'nullable|string|max:160',
        ]);

        $speaking->update($validated);

        return redirect()
            ->route('admin.speaking.index')
            ->with('success', 'Speaking event updated successfully.');
    }

    /**
     * Remove the specified speaking event from storage.
     */
    public function destroy(SpeakingEvent $speaking): RedirectResponse
    {
        $speaking->delete();

        return redirect()
            ->route('admin.speaking.index')
            ->with('success', 'Speaking event deleted successfully.');
    }
}
