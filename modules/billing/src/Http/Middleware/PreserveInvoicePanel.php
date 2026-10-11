<?php

namespace Modules\Billing\Http\Middleware;

use Closure;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class PreserveInvoicePanel
{
    public function handle(Request $request, Closure $next)
    {
        $response=$next($request);
        $id      =$request->header('X-Billing-Invoice-Panel');
        if ($response instanceof RedirectResponse && ! $request->isMethod('GET') && is_string($id) && ctype_digit($id)) {
            $path=parse_url($response->getTargetUrl(), PHP_URL_PATH);
            if (is_string($path) && preg_match('~^/admin/invoices/(\d+)(?:/edit)?$~', $path, $matches) && $matches[1] === $id) {
                return to_route('admin.invoices.index', ['invoice'=>(int) $id]);
            }
        }

        return $response;
    }
}
