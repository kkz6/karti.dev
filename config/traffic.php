<?php

return [
    'enabled'        => env('TRAFFIC_ENABLED', true),
    'retention_days' => 90,
    // Repeated requests for the same page/IP in a fixed one-minute bucket count once.
    'deduplicate_seconds' => 60,
    'routes'              => ['home', 'articles.index', 'articles.show', 'projects', 'photography', 'photography.show', 'consulting', 'about', 'uses', 'speaking'],
];
