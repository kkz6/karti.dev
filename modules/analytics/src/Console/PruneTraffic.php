<?php

namespace Modules\Analytics\Console;

use Illuminate\Console\Command;
use Modules\Analytics\Models\PageView;

class PruneTraffic extends Command
{
    protected $signature = 'traffic:prune';

    protected $description = 'Remove local page views outside the configured retention window';

    public function handle(): int
    {
        $cutoff  = now('UTC')->startOfDay()->subDays(max(1, (int) config('traffic.retention_days', 90)) - 1);
        $deleted = PageView::where('viewed_on', '<', $cutoff->toDateString())->delete();
        $this->info("Removed {$deleted} expired page views.");

        return self::SUCCESS;
    }
}
