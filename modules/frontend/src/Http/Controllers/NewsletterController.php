<?php

namespace Modules\Frontend\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Frontend\Http\Requests\SubscribeToNewsletterRequest;
use Modules\Frontend\Jobs\SendNewsletterConfirmation;
use Modules\Frontend\Models\NewsletterSubscriber;
use Throwable;

class NewsletterController extends Controller
{
    public function store(SubscribeToNewsletterRequest $request): RedirectResponse
    {
        $subscriber = NewsletterSubscriber::query()->firstOrCreate(['email' => $request->validated('email')], [
            'confirmation_key' => Str::random(64),
        ]);

        $key = DB::transaction(function () use ($subscriber): ?string {
            $subscriber = NewsletterSubscriber::query()->lockForUpdate()->findOrFail($subscriber->id);
            if (($subscriber->confirmed_at && ! $subscriber->unsubscribed_at)
                || $subscriber->confirmation_requested_at?->gt(now()->subMinutes(config('newsletter.resend_minutes')))) {
                return null;
            }

            $key = Str::random(64);
            $subscriber->update([
                'confirmation_key'          => $key,
                'confirmation_requested_at' => now(),
                'confirmation_sent_at'      => null,
                'confirmed_at'              => null,
                'unsubscribed_at'           => null,
            ]);

            return $key;
        });

        if ($key) {
            try {
                SendNewsletterConfirmation::dispatch($subscriber->id, $key);
            } catch (Throwable $exception) {
                report($exception);
                NewsletterSubscriber::whereKey($subscriber->id)->where('confirmation_key', $key)
                    ->update(['confirmation_requested_at' => null]);
                throw ValidationException::withMessages(['email' => 'We could not send the confirmation email. Please try again shortly.']);
            }
        }

        return redirect()->back(fallback: route('home'))->with('newsletter_status', 'If this address is not already subscribed, check your inbox for a confirmation link.');
    }

    public function confirm(Request $request, NewsletterSubscriber $subscriber, string $key): Response
    {
        abort_unless(hash_equals($subscriber->confirmation_key, $key) && ! $subscriber->unsubscribed_at, 403);
        if ($request->isMethod('POST')) {
            NewsletterSubscriber::whereKey($subscriber->id)->where('confirmation_key', $key)->whereNull('unsubscribed_at')
                ->whereNull('confirmed_at')->update(['confirmed_at' => now()]);
            $subscriber->refresh();
        }

        return Inertia::render('frontend::newsletter', [
            'mode'      => $subscriber->confirmed_at ? 'confirmed' : 'confirm',
            'actionUrl' => $request->fullUrl(),
        ]);
    }

    public function unsubscribe(Request $request, NewsletterSubscriber $subscriber, string $key): Response
    {
        abort_unless(hash_equals($subscriber->confirmation_key, $key), 403);
        if ($request->isMethod('POST')) {
            NewsletterSubscriber::whereKey($subscriber->id)->where('confirmation_key', $key)
                ->update(['unsubscribed_at' => now()]);
            $subscriber->refresh();
        }

        return Inertia::render('frontend::newsletter', [
            'mode'      => $subscriber->unsubscribed_at ? 'unsubscribed' : 'unsubscribe',
            'actionUrl' => $request->fullUrl(),
        ]);
    }
}
