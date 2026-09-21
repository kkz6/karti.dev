<?php

namespace Modules\Frontend\Http\Controllers\Admin;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Frontend\Http\Requests\UpdateContactSubmissionRequest;
use Modules\Frontend\Models\ContactSubmission;
use Modules\Frontend\Services\Turnstile;
use Modules\Frontend\Tables\ContactSubmissions;

class ContactSubmissionsController
{
    public function index(Request $request, Turnstile $turnstile): Response
    {
        $request->validate(['search' => ['nullable', 'string', 'max:254']]);

        return Inertia::render('frontend::admin/contact/index', [
            'table'  => ContactSubmissions::make()->setRequest($request),
            'counts' => [
                'new'      => ContactSubmission::query()->where('status', ContactSubmission::STATUS_NEW)->count(),
                'open'     => ContactSubmission::query()->open()->count(),
                'resolved' => ContactSubmission::query()->where('status', ContactSubmission::STATUS_RESOLVED)->count(),
            ],
            'protection' => [
                'turnstileEnabled'    => $turnstile->enabled(),
                'turnstileConfigured' => $turnstile->configured(),
            ],
        ]);
    }

    public function show(ContactSubmission $contactSubmission): Response
    {
        return Inertia::render('frontend::admin/contact/show', [
            'submission' => [
                'id'          => $contactSubmission->id,
                'name'        => $contactSubmission->name,
                'email'       => $contactSubmission->email,
                'topic'       => $contactSubmission->topic,
                'subject'     => $contactSubmission->subject,
                'message'     => $contactSubmission->message,
                'status'      => $contactSubmission->status,
                'sourceUrl'   => $contactSubmission->source_url,
                'userAgent'   => $contactSubmission->user_agent,
                'readAt'      => $contactSubmission->read_at?->toIso8601String(),
                'resolvedAt'  => $contactSubmission->resolved_at?->toIso8601String(),
                'notifiedAt'  => $contactSubmission->notified_at?->toIso8601String(),
                'createdAt'   => $contactSubmission->created_at?->toIso8601String(),
            ],
        ]);
    }

    public function update(UpdateContactSubmissionRequest $request, ContactSubmission $contactSubmission): RedirectResponse
    {
        match ($request->validated('status')) {
            ContactSubmission::STATUS_NEW      => $contactSubmission->markUnread(),
            ContactSubmission::STATUS_READ     => $contactSubmission->status === ContactSubmission::STATUS_RESOLVED
                ? $contactSubmission->reopen()
                : $contactSubmission->markRead(),
            ContactSubmission::STATUS_RESOLVED => $contactSubmission->resolve(),
        };

        return back()->with('contact_updated', true);
    }
}
