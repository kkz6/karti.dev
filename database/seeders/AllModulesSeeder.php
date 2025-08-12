<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Modules\Blog\Models\{Article, Category, Tag};
use Modules\Portfolio\Models\{Project, Technology};
use Modules\Photography\Models\{PhotoCollection, Photo};
use Modules\Profile\Models\{SpeakingEvent, WorkExperience};
use Modules\Tools\Models\{ToolCategory, Tool};
use Modules\Settings\Models\{SiteSetting, SocialLink};

class AllModulesSeeder extends Seeder
{
    public function run(): void
    {
        // Site Settings
        $this->createSiteSettings();
        
        // Categories (shared across modules)
        $categories = $this->createCategories();
        
        // Tags
        $tags = $this->createTags();
        
        // Technologies
        $technologies = $this->createTechnologies();
        
        // Articles
        $this->createArticles($categories, $tags);
        
        // Projects
        $this->createProjects($categories, $technologies);
        
        // Work Experience
        $this->createWorkExperience();
        
        // Speaking Events
        $this->createSpeakingEvents();
        
        // Tool Categories & Tools
        $this->createToolsAndCategories();
        
        // Photo Collections & Photos
        $this->createPhotoCollections($categories);
        
        // Social Links
        $this->createSocialLinks();
    }

    private function createSiteSettings(): void
    {
        $settings = [
            ['key' => 'site_title', 'value' => 'Spencer Sharp - Software Designer & Entrepreneur', 'type' => 'string', 'group' => 'general', 'is_public' => true],
            ['key' => 'site_description', 'value' => 'Software designer, founder, and amateur astronaut based in New York City.', 'type' => 'string', 'group' => 'general', 'is_public' => true],
            ['key' => 'author_name', 'value' => 'Spencer Sharp', 'type' => 'string', 'group' => 'general', 'is_public' => true],
            ['key' => 'author_bio', 'value' => "I'm Spencer, a software designer and entrepreneur based in New York City. I'm the founder and CEO of Planetaria, where we develop technologies that empower regular people to explore space on their own terms.", 'type' => 'text', 'group' => 'general', 'is_public' => true],
            ['key' => 'about_title', 'value' => "I'm Spencer Sharp. I live in New York City, where I design the future.", 'type' => 'string', 'group' => 'about', 'is_public' => true],
            ['key' => 'portrait_image', 'value' => '/images/portrait.jpg', 'type' => 'string', 'group' => 'about', 'is_public' => true],
            ['key' => 'contact_email', 'value' => 'spencer@planetaria.tech', 'type' => 'string', 'group' => 'contact', 'is_public' => true],
        ];

        foreach ($settings as $setting) {
            SiteSetting::updateOrCreate(
                ['key' => $setting['key']],
                $setting
            );
        }
    }

    private function createCategories(): array
    {
        $categoriesData = [
            ['name' => 'Technology', 'slug' => 'technology', 'description' => 'Articles about technology and software development', 'color' => '#3B82F6'],
            ['name' => 'Design', 'slug' => 'design', 'description' => 'UI/UX design and visual design articles', 'color' => '#8B5CF6'],
            ['name' => 'Business', 'slug' => 'business', 'description' => 'Entrepreneurship and business strategy', 'color' => '#10B981'],
            ['name' => 'Space', 'slug' => 'space', 'description' => 'Space exploration and aerospace technology', 'color' => '#F59E0B'],
            ['name' => 'Web Development', 'slug' => 'web-development', 'description' => 'Frontend and backend web development', 'color' => '#EF4444'],
        ];

        $categories = [];
        foreach ($categoriesData as $index => $categoryData) {
            $categoryData['sort_order'] = $index;
            $categories[] = Category::create($categoryData);
        }

        return $categories;
    }

    private function createTags(): array
    {
        $tagsData = [
            ['name' => 'React', 'slug' => 'react', 'color' => '#61DAFB'],
            ['name' => 'JavaScript', 'slug' => 'javascript', 'color' => '#F7DF1E'],
            ['name' => 'Laravel', 'slug' => 'laravel', 'color' => '#FF2D20'],
            ['name' => 'PHP', 'slug' => 'php', 'color' => '#777BB4'],
            ['name' => 'UI/UX', 'slug' => 'ui-ux', 'color' => '#FF6B6B'],
            ['name' => 'Startup', 'slug' => 'startup', 'color' => '#4ECDC4'],
            ['name' => 'Leadership', 'slug' => 'leadership', 'color' => '#45B7D1'],
        ];

        $tags = [];
        foreach ($tagsData as $tagData) {
            $tags[] = Tag::create($tagData);
        }

        return $tags;
    }

    private function createTechnologies(): array
    {
        $technologiesData = [
            ['name' => 'React', 'slug' => 'react', 'description' => 'JavaScript library for building user interfaces', 'color' => '#61DAFB', 'website_url' => 'https://reactjs.org'],
            ['name' => 'Laravel', 'slug' => 'laravel', 'description' => 'PHP web application framework', 'color' => '#FF2D20', 'website_url' => 'https://laravel.com'],
            ['name' => 'TypeScript', 'slug' => 'typescript', 'description' => 'Typed superset of JavaScript', 'color' => '#3178C6', 'website_url' => 'https://typescriptlang.org'],
            ['name' => 'Tailwind CSS', 'slug' => 'tailwind-css', 'description' => 'Utility-first CSS framework', 'color' => '#06B6D4', 'website_url' => 'https://tailwindcss.com'],
            ['name' => 'Node.js', 'slug' => 'nodejs', 'description' => 'JavaScript runtime built on Chrome\'s V8 engine', 'color' => '#339933', 'website_url' => 'https://nodejs.org'],
            ['name' => 'PostgreSQL', 'slug' => 'postgresql', 'description' => 'Advanced open source relational database', 'color' => '#336791', 'website_url' => 'https://postgresql.org'],
        ];

        $technologies = [];
        foreach ($technologiesData as $index => $techData) {
            $techData['sort_order'] = $index;
            $technologies[] = Technology::create($techData);
        }

        return $technologies;
    }

    private function createArticles(array $categories, array $tags): void
    {
        $articlesData = [
            [
                'title' => 'Crafting a design system for a multiplanetary future',
                'slug' => 'crafting-a-design-system-for-a-multiplanetary-future',
                'content' => '<p>Most companies try to stay ahead of the curve when it comes to visual design, but for Planetaria we needed to create a brand that would still inspire us 100 years from now when humanity has spread across our entire solar system.</p><p>Lorem ipsum dolor sit amet, consectetur adipiscing elit...</p>',
                'excerpt' => 'Most companies try to stay ahead of the curve when it comes to visual design, but for Planetaria we needed to create a brand that would still inspire us 100 years from now when humanity has spread across our entire solar system.',
                'status' => 'published',
                'published_at' => now()->subDays(5),
                'author_name' => 'Spencer Sharp',
                'reading_time_minutes' => 8,
            ],
            [
                'title' => 'Introducing Animaginary: High performance web animations',
                'slug' => 'introducing-animaginary',
                'content' => '<p>When you\'re building a website for a company as ambitious as Planetaria, you need to make an impression. I wanted people to visit our website and see animations that looked more realistic than reality itself.</p>',
                'excerpt' => 'When you\'re building a website for a company as ambitious as Planetaria, you need to make an impression.',
                'status' => 'published',
                'published_at' => now()->subDays(8),
                'author_name' => 'Spencer Sharp',
                'reading_time_minutes' => 12,
            ],
            [
                'title' => 'Rewriting the cosmOS kernel in Rust',
                'slug' => 'rewriting-the-cosmos-kernel-in-rust',
                'content' => '<p>When we released the first version of cosmOS last year, it was written in Go. Go is a wonderful programming language, but it\'s been a while since I\'ve seen an article on the front page of Hacker News about rewriting some important tool in Go and I see articles on there about rewriting things in Rust every single week.</p>',
                'excerpt' => 'When we released the first version of cosmOS last year, it was written in Go.',
                'status' => 'published',
                'published_at' => now()->subDays(15),
                'author_name' => 'Spencer Sharp',
                'reading_time_minutes' => 15,
            ],
        ];

        foreach ($articlesData as $articleData) {
            $article = Article::create($articleData);
            
            // Attach random categories and tags
            $article->categories()->attach($categories[array_rand($categories)]->id);
            
            // Attach 2 unique random tags
            $randomTags = collect($tags)->random(2);
            foreach ($randomTags as $tag) {
                $article->tags()->attach($tag->id);
            }
        }
    }

    private function createProjects(array $categories, array $technologies): void
    {
        $projectsData = [
            [
                'name' => 'Planetaria',
                'slug' => 'planetaria',
                'description' => 'Creating technology to empower civilians to explore space on their own terms.',
                'link_url' => 'http://planetaria.tech',
                'link_label' => 'planetaria.tech',
                'logo' => '/images/logos/planetaria.svg',
                'status' => 'active',
                'featured' => true,
                'sort_order' => 1,
            ],
            [
                'name' => 'Animaginary',
                'slug' => 'animaginary',
                'description' => 'High performance web animation library, hand-written in optimized WASM.',
                'link_url' => '#',
                'link_label' => 'github.com',
                'logo' => '/images/logos/animaginary.svg',
                'status' => 'active',
                'sort_order' => 2,
            ],
            [
                'name' => 'HelioStream',
                'slug' => 'heliostream',
                'description' => 'Real-time video streaming library, optimized for interstellar transmission.',
                'link_url' => '#',
                'link_label' => 'github.com',
                'logo' => '/images/logos/helio-stream.svg',
                'status' => 'active',
                'sort_order' => 3,
            ],
            [
                'name' => 'cosmOS',
                'slug' => 'cosmos',
                'description' => 'The operating system that powers our Planetaria space shuttles.',
                'link_url' => '#',
                'link_label' => 'github.com',
                'logo' => '/images/logos/cosmos.svg',
                'status' => 'active',
                'sort_order' => 4,
            ],
            [
                'name' => 'OpenShuttle',
                'slug' => 'openshuttle',
                'description' => 'The schematics for the first rocket I designed that successfully made it to orbit.',
                'link_url' => '#',
                'link_label' => 'github.com',
                'logo' => '/images/logos/open-shuttle.svg',
                'status' => 'active',
                'sort_order' => 5,
            ],
        ];

        foreach ($projectsData as $projectData) {
            $project = Project::create($projectData);
            
            // Attach random categories and technologies
            $project->categories()->attach($categories[array_rand($categories)]->id);
            
            // Attach 2 unique random technologies
            $randomTechs = collect($technologies)->random(min(2, count($technologies)));
            foreach ($randomTechs as $tech) {
                $project->technologies()->attach($tech->id);
            }
        }
    }

    private function createWorkExperience(): void
    {
        $experienceData = [
            [
                'company' => 'Planetaria',
                'position' => 'CEO',
                'description' => 'Leading the development of civilian space exploration technologies.',
                'logo' => '/images/logos/planetaria.svg',
                'company_url' => 'https://planetaria.tech',
                'start_date' => '2019-01-01',
                'current' => true,
                'featured' => true,
                'sort_order' => 1,
            ],
            [
                'company' => 'Airbnb',
                'position' => 'Product Designer',
                'description' => 'Designed user experiences for millions of travelers worldwide.',
                'logo' => '/images/logos/airbnb.svg',
                'company_url' => 'https://airbnb.com',
                'start_date' => '2014-01-01',
                'end_date' => '2019-01-01',
                'featured' => true,
                'sort_order' => 2,
            ],
            [
                'company' => 'Facebook',
                'position' => 'iOS Software Engineer',
                'description' => 'Built mobile experiences for billions of users.',
                'logo' => '/images/logos/facebook.svg',
                'company_url' => 'https://facebook.com',
                'start_date' => '2011-01-01',
                'end_date' => '2014-01-01',
                'featured' => true,
                'sort_order' => 3,
            ],
            [
                'company' => 'Starbucks',
                'position' => 'Shift Supervisor',
                'description' => 'Managed daily operations and team coordination.',
                'logo' => '/images/logos/starbucks.svg',
                'company_url' => 'https://starbucks.com',
                'start_date' => '2008-01-01',
                'end_date' => '2011-01-01',
                'featured' => true,
                'sort_order' => 4,
            ],
        ];

        foreach ($experienceData as $experience) {
            WorkExperience::create($experience);
        }
    }

    private function createSpeakingEvents(): void
    {
        $eventsData = [
            [
                'title' => 'In space, no one can watch you stream — until now',
                'slug' => 'sysconf-2021-streaming',
                'description' => 'A technical deep-dive into HelioStream, the real-time streaming library I wrote for transmitting live video back to Earth.',
                'event_name' => 'SysConf 2021',
                'event_date' => '2021-09-15 14:00:00',
                'type' => 'conference',
                'cta_text' => 'Watch video',
                'cta_url' => '#',
                'featured' => true,
                'sort_order' => 1,
                'status' => 'completed',
            ],
            [
                'title' => 'Lessons learned from our first product recall',
                'slug' => 'business-startups-2020',
                'description' => "They say that if you're not embarrassed by your first version, you're doing it wrong. Well when you're selling DIY space shuttle kits it turns out it's a bit more complicated.",
                'event_name' => 'Business of Startups 2020',
                'event_date' => '2020-03-20 16:30:00',
                'type' => 'conference',
                'cta_text' => 'Watch video',
                'cta_url' => '#',
                'sort_order' => 2,
                'status' => 'completed',
            ],
            [
                'title' => 'Using design as a competitive advantage',
                'slug' => 'encoding-design-podcast',
                'description' => 'How we used world-class visual design to attract a great team, win over customers, and get more press for Planetaria.',
                'event_name' => 'Encoding Design',
                'event_date' => '2022-07-15 10:00:00',
                'type' => 'podcast',
                'cta_text' => 'Listen to podcast',
                'cta_url' => '#',
                'sort_order' => 3,
                'status' => 'completed',
            ],
        ];

        foreach ($eventsData as $event) {
            SpeakingEvent::create($event);
        }
    }

    private function createToolsAndCategories(): void
    {
        $categoriesData = [
            ['name' => 'Workstation', 'slug' => 'workstation', 'description' => 'Hardware and peripherals'],
            ['name' => 'Development tools', 'slug' => 'development-tools', 'description' => 'Software for coding'],
            ['name' => 'Design', 'slug' => 'design', 'description' => 'Design software and tools'],
            ['name' => 'Productivity', 'slug' => 'productivity', 'description' => 'Productivity applications'],
        ];

        $categories = [];
        foreach ($categoriesData as $index => $categoryData) {
            $categoryData['sort_order'] = $index;
            $categories[] = ToolCategory::create($categoryData);
        }

        $toolsData = [
            // Workstation
            [
                'tool_category_id' => $categories[0]->id,
                'title' => '16" MacBook Pro, M1 Max, 64GB RAM (2021)',
                'slug' => 'macbook-pro-m1-max',
                'description' => "I was using an Intel-based 16\" MacBook Pro prior to this and the difference is night and day. I've never heard the fans turn on a single time, even under the incredibly heavy loads I put it through with our various launch simulations.",
                'sort_order' => 1,
            ],
            [
                'tool_category_id' => $categories[0]->id,
                'title' => 'Apple Pro Display XDR (Standard Glass)',
                'slug' => 'apple-pro-display-xdr',
                'description' => "The only display on the market if you want something HiDPI and bigger than 27\". When you're working at planetary scale, every pixel you can get counts.",
                'sort_order' => 2,
            ],
            // Development tools
            [
                'tool_category_id' => $categories[1]->id,
                'title' => 'Sublime Text 4',
                'slug' => 'sublime-text-4',
                'description' => "I don't care if it's missing all of the fancy IDE features everyone else relies on, Sublime Text is still the best text editor ever made.",
                'url' => 'https://sublimetext.com',
                'sort_order' => 1,
            ],
            [
                'tool_category_id' => $categories[1]->id,
                'title' => 'TablePlus',
                'slug' => 'tableplus',
                'description' => 'Great software for working with databases. Has saved me from building about a thousand admin interfaces for my various projects over the years.',
                'url' => 'https://tableplus.com',
                'sort_order' => 2,
            ],
            // Design
            [
                'tool_category_id' => $categories[2]->id,
                'title' => 'Figma',
                'slug' => 'figma',
                'description' => 'We started using Figma as just a design tool but now it\'s become our virtual whiteboard for the entire company. Never would have expected the collaboration features to be the real hook.',
                'url' => 'https://figma.com',
                'sort_order' => 1,
            ],
        ];

        foreach ($toolsData as $tool) {
            Tool::create($tool);
        }
    }

    private function createPhotoCollections(array $categories): void
    {
        $collectionsData = [
            [
                'title' => 'Street Photography',
                'slug' => 'street-photography',
                'description' => 'Capturing the raw energy and authentic moments of urban life across different cities.',
                'cover_image' => '/images/photos/image-1.jpg',
                'status' => 'published',
                'published_at' => now()->subDays(10),
                'featured' => true,
                'sort_order' => 1,
            ],
            [
                'title' => 'Landscapes & Nature',
                'slug' => 'landscapes',
                'description' => 'Exploring the breathtaking beauty of natural landscapes from mountains to coastlines.',
                'cover_image' => '/images/photos/image-2.jpg',
                'status' => 'published',
                'published_at' => now()->subDays(20),
                'sort_order' => 2,
            ],
            [
                'title' => 'Architecture',
                'slug' => 'architecture',
                'description' => 'Geometric patterns and striking structures from modern and classical architecture.',
                'cover_image' => '/images/photos/image-4.jpg',
                'status' => 'published',
                'published_at' => now()->subDays(30),
                'sort_order' => 3,
            ],
        ];

        foreach ($collectionsData as $collectionData) {
            $collection = PhotoCollection::create($collectionData);
            
            // Add some sample photos to each collection
            for ($i = 1; $i <= 5; $i++) {
                Photo::create([
                    'photo_collection_id' => $collection->id,
                    'title' => "Photo {$i}",
                    'description' => "Description for photo {$i} in {$collection->title}",
                    'image_path' => "/images/photos/image-{$i}.jpg",
                    'alt_text' => "Photo {$i}",
                    'sort_order' => $i,
                    'width' => 1200,
                    'height' => 800,
                ]);
            }
            
            // Attach category
            $collection->categories()->attach($categories[array_rand($categories)]->id);
        }
    }

    private function createSocialLinks(): void
    {
        $linksData = [
            [
                'platform' => 'twitter',
                'label' => 'Follow on X',
                'url' => 'https://twitter.com/spencersharp',
                'icon' => 'x',
                'sort_order' => 1,
            ],
            [
                'platform' => 'instagram',
                'label' => 'Follow on Instagram',
                'url' => 'https://instagram.com/spencersharp',
                'icon' => 'instagram',
                'sort_order' => 2,
            ],
            [
                'platform' => 'github',
                'label' => 'Follow on GitHub',
                'url' => 'https://github.com/spencersharp',
                'icon' => 'github',
                'sort_order' => 3,
            ],
            [
                'platform' => 'linkedin',
                'label' => 'Follow on LinkedIn',
                'url' => 'https://linkedin.com/in/spencersharp',
                'icon' => 'linkedin',
                'sort_order' => 4,
            ],
            [
                'platform' => 'email',
                'label' => 'spencer@planetaria.tech',
                'url' => 'mailto:spencer@planetaria.tech',
                'icon' => 'mail',
                'sort_order' => 5,
                'show_in_header' => false,
            ],
        ];

        foreach ($linksData as $link) {
            SocialLink::create($link);
        }
    }
}
