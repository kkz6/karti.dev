<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Modules\Projects\Models\Project;
use Modules\Speaking\Models\SpeakingEvent;

class PortfolioSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function () {
            foreach ($this->projects() as $index => $project) {
                // Include deleted records so a repeat import respects editorial changes and removals.
                $exists = Project::withTrashed()->where('slug', $project['slug'])
                    ->orWhereRaw('LOWER(title) = ?', [strtolower($project['title'])])->exists();

                if (! $exists) {
                    Project::create([
                        ...$project,
                        'description' => $project['short_description'],
                        'status'      => 'published',
                        'featured'    => true,
                        'sort_order'  => $index + 1,
                    ]);
                }
            }

            foreach ($this->talks() as $talk) {
                $exists = SpeakingEvent::withTrashed()->where('slug', $talk['slug'])
                    ->orWhere(fn ($query) => $query
                        ->whereRaw('LOWER(title) = ?', [strtolower($talk['title'])])
                        ->whereDate('event_date', $talk['event_date']))->exists();

                if (! $exists) {
                    SpeakingEvent::create([
                        ...$talk,
                        'event_type' => 'conference',
                        'status'     => 'published',
                        'featured'   => true,
                        'cta_text'   => 'View event',
                    ]);
                }
            }
        });
    }

    private function projects(): array
    {
        return [
            // https://zonebar.karti.dev/ and kkz6/ZoneBar README.
            [
                'title'             => 'ZoneBar',
                'slug'              => 'zonebar',
                'short_description' => 'A native macOS menu bar app for world clocks and timezone coordination. Compare times across cities, find overlapping working hours, and keep your team’s time close at hand.',
                'project_url'       => 'https://zonebar.karti.dev',
                'github_url'        => 'https://github.com/kkz6/ZoneBar',
                'technologies'      => ['Swift', 'SwiftUI', 'AppKit'],
                'featured_image'    => '/images/projects/zonebar.png',
            ],
            // https://launchctl.io and kkz6/launch-go README.
            [
                'title'             => 'launchctl',
                'slug'              => 'launchctl',
                'short_description' => 'A server management and deployment platform for running applications on your own infrastructure. Deploy from Git and manage servers, domains, SSL certificates, databases, backups, and queues from one place.',
                'project_url'       => 'https://launchctl.io',
                'github_url'        => 'https://github.com/kkz6/launch-go',
                'technologies'      => ['Go', 'Nuxt', 'Vue', 'Redis'],
                'featured_image'    => '/images/projects/launchctl.png',
            ],
            // User-supplied URL; description verified against the Scouted workspace and homepage source.
            [
                'title'             => 'Scouted',
                'slug'              => 'scouted',
                'short_description' => 'Travel discovery and visa preparation in one place. Explore destinations and travel stories, then work through the forms and documents needed for your next trip.',
                'project_url'       => 'https://scouted.life',
                'technologies'      => ['Nuxt', 'Vue', 'NestJS', 'TypeScript', 'PostgreSQL'],
                'featured_image'    => '/images/projects/scouted.svg',
            ],
            // Public support site and the Walkero landing-page source. The application repository is private.
            [
                'title'             => 'Walkero',
                'slug'              => 'walkero',
                'short_description' => 'An iPhone app for controlling a compatible WalkingPad treadmill and tracking your walks. Follow live workout stats and use the Apple Watch companion to keep your walking routine within reach.',
                'project_url'       => 'https://kkz6.github.io/walkero-support/',
                'technologies'      => ['Swift', 'SwiftUI', 'Bluetooth', 'watchOS'],
                'featured_image'    => '/images/projects/walkero.png',
            ],
            // https://github.com/kkz6/Morrow and its documentation.
            [
                'title'             => 'Morrow',
                'slug'              => 'morrow',
                'short_description' => 'A native macOS menu bar app and CLI for local development. Manage database instances, language runtimes, local sites, test email, and S3-compatible storage through native processes.',
                'project_url'       => 'https://kkz6.github.io/Morrow/',
                'github_url'        => 'https://github.com/kkz6/Morrow',
                'technologies'      => ['Swift', 'SwiftUI', 'Homebrew', 'launchd'],
                'featured_image'    => '/images/projects/morrow.svg',
            ],
        ];
    }

    private function talks(): array
    {
        return [
            // The organizer's agenda and structured event data confirm 28 March 2026.
            // https://luma.com/tdvqg5ml
            [
                'title'       => 'Upwork: Beginners Freelancing Guide',
                'slug'        => 'upwork-beginners-freelancing-guide-laravel-bengaluru-2026',
                'description' => 'A beginner’s guide to freelancing on Upwork, presented at the Laravel Bengaluru March meetup. An introduction for developers exploring freelance work alongside their technical careers.',
                'event_name'  => 'Laravel Bengaluru — March Meetup',
                'event_date'  => '2026-03-28',
                'location'    => 'GeekyAnts, Bengaluru, India',
                'url'         => 'https://luma.com/tdvqg5ml',
            ],
            // https://luma.com/l9ivwpl7
            // https://meetups.laracon.in/meetups/9fb44427-034e-41a2-a53f-34315288c8b6
            [
                'title'       => 'Are we developers or problem solvers?',
                'slug'        => 'developers-or-problem-solvers-laravel-bengaluru-2025',
                'description' => 'A talk about the role of developers as problem solvers, presented at Laravel Bengaluru’s September meetup. A chance to step back from frameworks and think about the problems our work is meant to solve.',
                'event_name'  => 'Laravel Bengaluru — September Meetup',
                'event_date'  => '2025-09-13',
                'location'    => 'Clayworks Opus, Bengaluru, India',
                'url'         => 'https://luma.com/l9ivwpl7',
            ],
            // The full English/Japanese agenda names Karthick K and the talk at 14:10–14:20 JST.
            // https://www.meetup.com/phpxtky/events/307317783/
            [
                'title'       => 'Make development faster with Cursor AI',
                'slug'        => 'make-development-faster-with-cursor-ai-phpxtky-2025',
                'description' => 'A lightning talk on using Cursor AI to make development faster, presented at PHPxTKY’s June 2025 meetup in Tokyo. Part of an international PHP and Laravel community event with live Japanese–English translation.',
                'event_name'  => 'PHPxTKY — June 2025',
                'event_date'  => '2025-06-08',
                'location'    => 'BEENOS Inc., Tokyo, Japan',
                'url'         => 'https://www.meetup.com/phpxtky/events/307317783/',
            ],
        ];
    }
}
