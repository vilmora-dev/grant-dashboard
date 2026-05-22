<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RequireFullAccess
{
    /**
     * Reject requests from users who do not have the 'full' role.
     * Returns 403 for API routes, redirects to dashboard for web routes.
     */
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user()?->role !== 'full') {
            if ($request->expectsJson()) {
                return response()->json(['error' => 'Full access required.'], 403);
            }
            return redirect()->route('dashboard');
        }

        return $next($request);
    }
}
