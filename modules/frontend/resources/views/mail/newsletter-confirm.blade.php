<x-mail::message>
# Confirm your subscription

You requested occasional updates from {{ config('app.name') }}. Confirm your email address to join the newsletter.

<x-mail::button :url="$confirmationUrl">
Confirm subscription
</x-mail::button>

This link expires in {{ (int) (config('newsletter.confirmation_minutes') / 60) }} hours. If you did not request this, ignore this message. You will not be subscribed without confirmation.

[Cancel this request or unsubscribe]({{ $unsubscribeUrl }})
</x-mail::message>
