<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class SetPasswordController extends Controller
{
    /**
     * GET /set-password
     * Show the forced first-login password screen.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/SetPassword');
    }

    /**
     * POST /set-password
     * Validate, hash, save new password — clear the must_change_password flag.
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'confirmed', Password::min(8)],
        ]);

        $request->user()->update([
            'password'             => Hash::make($request->password),
            'must_change_password' => false,
        ]);

        // Regenerate session so old session tokens are invalidated
        $request->session()->regenerate();

        return redirect()->route('dashboard');
    }
}
