<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ForcePasswordChange
{
    /**
     * If the authenticated user has must_change_password = true,
     * redirect every request to the dedicated set-password screen.
     *
     * Exempt routes: the set-password page itself + logout
     * (so they can never get stuck in a redirect loop).
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (
            $user?->must_change_password
            && ! $request->routeIs('password.set', 'password.set.update', 'logout')
        ) {
            return redirect()->route('password.set');
        }

        return $next($request);
    }
}
