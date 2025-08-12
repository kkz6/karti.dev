<?php

namespace Modules\Table\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Modules\Shared\Http\Controllers\BaseController;
use Modules\Table\Examples\UsersTable;

class DemoController extends BaseController
{
    public function users(Request $request)
    {
        $table = UsersTable::make();
        
        return Inertia::render('table::demo/users', [
            'table' => $table->toArray(),
        ]);
    }
}
