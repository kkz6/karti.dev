<?php

namespace Modules\Frontend\Http\Controllers;

use Inertia\Inertia;
use Illuminate\Http\Request;
use Modules\Shared\Http\Controllers\BaseController;

class PortfolioController extends BaseController
{
    public function home()
    {
        $articles = $this->getLatestArticles(4);
        $roles = $this->getWorkExperience();
        
        return Inertia::render('frontend::home', [
            'articles' => $articles,
            'roles' => $roles,
        ]);
    }

    public function about()
    {
        return Inertia::render('frontend::about', [
            'portraitImage' => '/images/portrait.jpg',
        ]);
    }

    public function projects()
    {
        $projects = $this->getProjects();
        
        return Inertia::render('frontend::projects', [
            'projects' => $projects,
        ]);
    }

    public function articles()
    {
        $articles = $this->getAllArticles();
        
        return Inertia::render('frontend::articles/index', [
            'articles' => $articles,
        ]);
    }

    public function showArticle($slug)
    {
        $article = $this->getArticleBySlug($slug);
        
        if (!$article) {
            abort(404);
        }
        
        return Inertia::render('frontend::articles/show', [
            'article' => $article,
        ]);
    }

    public function speaking()
    {
        $events = $this->getSpeakingEvents();
        
        return Inertia::render('frontend::speaking', [
            'events' => $events,
        ]);
    }

    public function uses()
    {
        $sections = $this->getUsesData();
        
        return Inertia::render('frontend::uses', [
            'sections' => $sections,
        ]);
    }

    public function thankYou(Request $request)
    {
        // Handle newsletter subscription
        $email = $request->input('email');
        
        // TODO: Save email to newsletter list
        
        return Inertia::render('frontend::thank-you');
    }

    // Helper methods for data fetching
    private function getLatestArticles($limit = 4)
    {
        // TODO: Fetch from database or content files
        return [
            [
                'slug' => 'crafting-a-design-system-for-a-multiplanetary-future',
                'title' => 'Crafting a design system for a multiplanetary future',
                'description' => 'Most companies try to stay ahead of the curve when it comes to visual design, but for Planetaria we needed to create a brand that would still inspire us 100 years from now when humanity has spread across our entire solar system.',
                'date' => '2022-09-05',
            ],
            [
                'slug' => 'introducing-animaginary',
                'title' => 'Introducing Animaginary: High performance web animations',
                'description' => "When you're building a website for a company as ambitious as Planetaria, you need to make an impression. I wanted people to visit our website and see animations that looked more realistic than reality itself.",
                'date' => '2022-09-02',
            ],
            [
                'slug' => 'rewriting-the-cosmos-kernel-in-rust',
                'title' => 'Rewriting the cosmOS kernel in Rust',
                'description' => "When we released the first version of cosmOS last year, it was written in Go. Go is a wonderful programming language, but it's been a while since I've seen an article on the front page of Hacker News about rewriting some important tool in Go and I see articles on there about rewriting things in Rust every single week.",
                'date' => '2022-07-14',
            ],
        ];
    }

    private function getAllArticles()
    {
        return $this->getLatestArticles(100); // Get all articles
    }

    private function getArticleBySlug($slug)
    {
        $articles = $this->getAllArticles();
        
        foreach ($articles as $article) {
            if ($article['slug'] === $slug) {
                // Add content to the article
                $article['content'] = $this->getArticleContent($slug);
                return $article;
            }
        }
        
        return null;
    }

    private function getArticleContent($slug)
    {
        // TODO: Load actual content from markdown files or database
        return '<p>Article content goes here...</p>';
    }

    private function getWorkExperience()
    {
        return [
            [
                'company' => 'Planetaria',
                'title' => 'CEO',
                'logo' => '/images/logos/planetaria.svg',
                'start' => '2019',
                'end' => 'Present',
            ],
            [
                'company' => 'Airbnb',
                'title' => 'Product Designer',
                'logo' => '/images/logos/airbnb.svg',
                'start' => '2014',
                'end' => '2019',
            ],
            [
                'company' => 'Facebook',
                'title' => 'iOS Software Engineer',
                'logo' => '/images/logos/facebook.svg',
                'start' => '2011',
                'end' => '2014',
            ],
            [
                'company' => 'Starbucks',
                'title' => 'Shift Supervisor',
                'logo' => '/images/logos/starbucks.svg',
                'start' => '2008',
                'end' => '2011',
            ],
        ];
    }

    private function getProjects()
    {
        return [
            [
                'name' => 'Planetaria',
                'description' => 'Creating technology to empower civilians to explore space on their own terms.',
                'link' => [
                    'href' => 'http://planetaria.tech',
                    'label' => 'planetaria.tech',
                ],
                'logo' => '/images/logos/planetaria.svg',
            ],
            [
                'name' => 'Animaginary',
                'description' => 'High performance web animation library, hand-written in optimized WASM.',
                'link' => [
                    'href' => '#',
                    'label' => 'github.com',
                ],
                'logo' => '/images/logos/animaginary.svg',
            ],
            [
                'name' => 'HelioStream',
                'description' => 'Real-time video streaming library, optimized for interstellar transmission.',
                'link' => [
                    'href' => '#',
                    'label' => 'github.com',
                ],
                'logo' => '/images/logos/helio-stream.svg',
            ],
            [
                'name' => 'cosmOS',
                'description' => 'The operating system that powers our Planetaria space shuttles.',
                'link' => [
                    'href' => '#',
                    'label' => 'github.com',
                ],
                'logo' => '/images/logos/cosmos.svg',
            ],
            [
                'name' => 'OpenShuttle',
                'description' => 'The schematics for the first rocket I designed that successfully made it to orbit.',
                'link' => [
                    'href' => '#',
                    'label' => 'github.com',
                ],
                'logo' => '/images/logos/open-shuttle.svg',
            ],
        ];
    }

    private function getSpeakingEvents()
    {
        return [
            [
                'title' => 'In space, no one can watch you stream — until now',
                'description' => 'A technical deep-dive into HelioStream, the real-time streaming library I wrote for transmitting live video back to Earth.',
                'event' => 'SysConf 2021',
                'cta' => 'Watch video',
                'href' => '#',
            ],
            [
                'title' => 'Lessons learned from our first product recall',
                'description' => "They say that if you're not embarrassed by your first version, you're doing it wrong. Well when you're selling DIY space shuttle kits it turns out it's a bit more complicated.",
                'event' => 'Business of Startups 2020',
                'cta' => 'Watch video',
                'href' => '#',
            ],
        ];
    }

    private function getUsesData()
    {
        return [
            [
                'title' => 'Workstation',
                'tools' => [
                    [
                        'title' => '16" MacBook Pro, M1 Max, 64GB RAM (2021)',
                        'description' => "I was using an Intel-based 16\" MacBook Pro prior to this and the difference is night and day.",
                    ],
                    [
                        'title' => 'Apple Pro Display XDR (Standard Glass)',
                        'description' => "The only display on the market if you want something HiDPI and bigger than 27\".",
                    ],
                    [
                        'title' => 'IBM Model M SSK Industrial Keyboard',
                        'description' => "They don't make keyboards the way they used to.",
                    ],
                    [
                        'title' => 'Apple Magic Trackpad',
                        'description' => 'Something about all the gestures makes me feel like a wizard with special powers.',
                    ],
                    [
                        'title' => 'Herman Miller Aeron Chair',
                        'description' => "If I'm going to slouch in the worst ergonomic position imaginable all day, I might as well do it in an expensive chair.",
                    ],
                ],
            ],
            [
                'title' => 'Development tools',
                'tools' => [
                    [
                        'title' => 'Sublime Text 4',
                        'description' => "I don't care if it's missing all of the fancy IDE features everyone else relies on, Sublime Text is still the best text editor ever made.",
                    ],
                    [
                        'title' => 'iTerm2',
                        'description' => "I'm honestly not even sure what features I get with this that aren't just part of the macOS Terminal but it's what I use.",
                    ],
                    [
                        'title' => 'TablePlus',
                        'description' => 'Great software for working with databases.',
                    ],
                ],
            ],
        ];
    }
}