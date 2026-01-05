<?php

namespace Modules\Tools\Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use Modules\Tools\Models\Tool;
use Modules\Tools\Models\ToolCategory;

class ToolsSeeder extends Seeder
{
    public function run(): void
    {
        $categoriesData = [
            [
                'name'        => 'Computers',
                'slug'        => 'computers',
                'description' => 'Primary machines used for development and production workloads.',
                'sort_order'  => 10,
            ],
            [
                'name'        => 'Mobile & Testing',
                'slug'        => 'mobile-and-testing',
                'description' => 'Phones and devices used for app testing and daily use.',
                'sort_order'  => 20,
            ],
            [
                'name'        => 'Storage & Docking',
                'slug'        => 'storage-and-docking',
                'description' => 'Docks and storage gear that tie the setup together.',
                'sort_order'  => 30,
            ],
            [
                'name'        => 'Input Devices',
                'slug'        => 'input-devices',
                'description' => 'Pointing devices and keyboards I rely on daily.',
                'sort_order'  => 40,
            ],
            [
                'name'        => 'Displays',
                'slug'        => 'displays',
                'description' => 'Monitors tuned for clarity, color, and comfort.',
                'sort_order'  => 50,
            ],
            [
                'name'        => 'Printers & Scanners',
                'slug'        => 'printers-and-scanners',
                'description' => 'Reliable printing for docs and labels.',
                'sort_order'  => 60,
            ],
            [
                'name'        => 'Audio',
                'slug'        => 'audio',
                'description' => 'Headsets and headphones for calls and focus.',
                'sort_order'  => 70,
            ],
        ];

        $slugToCategoryId = [];
        foreach ($categoriesData as $categoryData) {
            $category = ToolCategory::firstOrCreate(
                ['slug' => $categoryData['slug']],
                [
                    'name'        => $categoryData['name'],
                    'description' => $categoryData['description'],
                    'sort_order'  => $categoryData['sort_order'],
                    'is_active'   => true,
                ]
            );
            $slugToCategoryId[$categoryData['slug']] = $category->id;
        }

        $toolsData = [
            // Computers
            [
                'category_slug' => 'computers',
                'title'         => 'Mac Studio — M1 Max (32GB, 1TB)',
                'url'           => 'https://www.apple.com/mac-studio/',
                'sort_order'    => 10,
                'description'   => implode(' ', [
                    'My desktop workhorse. The M1 Max handles heavy local builds, photo workflows, and Docker without breaking a sweat.',
                    'The latest Mac Studio generation offers notable gains over M1 Max — roughly 20–30% faster CPU and 25–50% faster GPU depending on workload —',
                    'so build times and exports get noticeably shorter. When I outgrow this config, that’s my upgrade path.',
                ]),
            ],
            [
                'category_slug' => 'computers',
                'title'         => 'MacBook Pro — M3 Pro (18GB, 512GB)',
                'url'           => 'https://www.apple.com/macbook-pro-14-and-16/',
                'sort_order'    => 20,
                'description'   => implode(' ', [
                    'Portable dev machine with great battery life and the Liquid Retina XDR display.',
                    'Perfect for coding sessions on the go, quick edits, and travel.',
                ]),
            ],

            // Storage & Docking
            [
                'category_slug' => 'storage-and-docking',
                'title'         => 'CalDigit TS4 (Thunderbolt Dock)',
                'url'           => 'https://www.caldigit.com/ts4/',
                'sort_order'    => 10,
                'description'   => implode(' ', [
                    'One-cable desktop dock with plenty of USB-A/C, 2.5GbE, UHS-II SD, and audio I/O.',
                    'Keeps the desk clean and powers the laptop with stable throughput.',
                ]),
            ],

            // Mobile & Testing
            [
                'category_slug' => 'mobile-and-testing',
                'title'         => 'iPhone 15 Pro',
                'url'           => 'https://www.apple.com/iphone-15-pro/',
                'sort_order'    => 10,
                'description'   => implode(' ', [
                    'Primary personal device and iOS test phone.',
                    'Great performance for TestFlight builds, camera testing, and Safari checks.',
                ]),
            ],
            [
                'category_slug' => 'mobile-and-testing',
                'title'         => 'Samsung Galaxy S24 FE 5G',
                'url'           => null,
                'sort_order'    => 20,
                'description'   => implode(' ', [
                    'Android test device to validate UI, performance, and push notifications on Android.',
                    'Covers mid/high-tier Android hardware behavior.',
                ]),
            ],

            // Input Devices
            [
                'category_slug' => 'input-devices',
                'title'         => 'Logitech MX Master 3',
                'url'           => 'https://www.logitech.com/products/mice/mx-master-3.html',
                'sort_order'    => 10,
                'description'   => implode(' ', [
                    'Ergonomic mouse with MagSpeed scroll.',
                    'Reliable, comfortable, and programmable — still a favorite for long sessions.',
                ]),
            ],
            [
                'category_slug' => 'input-devices',
                'title'         => 'Logitech MX Master 3S',
                'url'           => 'https://www.logitech.com/products/mice/mx-master-3s.html',
                'sort_order'    => 20,
                'description'   => implode(' ', [
                    'Quieter clicks and a higher precision sensor versus MX Master 3.',
                    'Great when I need silent inputs during calls.',
                ]),
            ],
            [
                'category_slug' => 'input-devices',
                'title'         => 'Logitech MX Mechanical',
                'url'           => 'https://www.logitech.com/products/keyboards/mx-mechanical.html',
                'sort_order'    => 30,
                'description'   => implode(' ', [
                    'Low-profile mechanical keyboard with excellent switch feel and multi-device pairing.',
                    'Solid travel and steady deck for typing all day.',
                ]),
            ],
            [
                'category_slug' => 'input-devices',
                'title'         => 'Logitech MX Keys',
                'url'           => 'https://www.logitech.com/products/keyboards/mx-keys.html',
                'sort_order'    => 40,
                'description'   => implode(' ', [
                    'Silent, comfortable scissor switches and smart backlighting.',
                    'Pairs well with the MX mice when I want a quieter setup.',
                ]),
            ],

            // Displays
            [
                'category_slug' => 'displays',
                'title'         => 'BenQ EW2880U',
                'url'           => 'https://www.benq.com/en-us/monitor/entertainment/ew2880u.html',
                'sort_order'    => 10,
                'description'   => implode(' ', [
                    '28-inch 4K display with HDR support and solid built-in speakers.',
                    'Good all-rounder for code, content, and media.',
                ]),
            ],
            [
                'category_slug' => 'displays',
                'title'         => 'BenQ PD2705U',
                'url'           => 'https://www.benq.com/en-us/monitor/designer/pd2705u.html',
                'sort_order'    => 20,
                'description'   => implode(' ', [
                    '27-inch 4K with factory-calibrated color and USB-C.',
                    'My pick for design work and color-sensitive tasks.',
                ]),
            ],

            // Printers & Scanners
            [
                'category_slug' => 'printers-and-scanners',
                'title'         => 'Brother T530DW',
                'url'           => 'https://www.brother.in/en/support/dcp-t530w',
                'sort_order'    => 10,
                'description'   => implode(' ', [
                    'Dependable ink tank printer for home/office documents.',
                    'Wireless printing with low per-page cost.',
                ]),
            ],

            // Audio
            [
                'category_slug' => 'audio',
                'title'         => 'Beats EP',
                'url'           => null,
                'sort_order'    => 10,
                'description'   => implode(' ', [
                    'Wired on-ear headphones that are lightweight and durable.',
                    'Simple, reliable audio for focused work sessions.',
                ]),
            ],
            [
                'category_slug' => 'audio',
                'title'         => 'Shokz OpenComm2',
                'url'           => 'https://shokz.com/products/opencomm2-uc',
                'sort_order'    => 20,
                'description'   => implode(' ', [
                    'Bone-conduction headset with a noise-canceling boom mic.',
                    'Great for long calls while keeping situational awareness.',
                ]),
            ],
        ];

        foreach ($toolsData as $toolData) {
            $categoryId = $slugToCategoryId[$toolData['category_slug']] ?? null;
            if (!$categoryId) {
                continue;
            }

            Tool::updateOrCreate(
                [
                    'tool_category_id' => $categoryId,
                    'title'            => $toolData['title'],
                ],
                [
                    'description' => $toolData['description'],
                    'url'         => $toolData['url'],
                    'image'       => null,
                    'sort_order'  => $toolData['sort_order'],
                    'featured'    => false,
                    'status'      => 'active',
                ]
            );
        }
    }
}


