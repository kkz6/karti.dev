<?php

// Keep the installed Horizon defaults and include the billing queue in every default supervisor.
$config = require base_path('vendor/laravel/horizon/config/horizon.php');
foreach ($config['defaults'] as &$supervisor) {
    $supervisor['queue'] = ['billing', 'default'];
}
unset($supervisor);

return $config;
