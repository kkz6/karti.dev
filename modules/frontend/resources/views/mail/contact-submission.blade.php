<x-mail::message>
# New contact message

**From:** {{ $submission->name }} ({{ $submission->email }})

**Topic:** {{ str($submission->topic)->headline() }}
**Subject:** {{ $submission->subject }}

{{ $submission->message }}

<x-mail::button :url="$adminUrl">
View in contact inbox
</x-mail::button>

You can reply directly to this email to contact {{ $submission->name }}.
</x-mail::message>
