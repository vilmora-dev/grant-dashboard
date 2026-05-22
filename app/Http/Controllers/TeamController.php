<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class TeamController extends Controller
{
    /**
     * GET /api/team
     * List all users — never includes password hashes.
     */
    public function index(): JsonResponse
    {
        $users = User::orderBy('name')
            ->get(['id', 'name', 'email', 'role', 'is_active', 'last_login_at', 'created_at']);

        return response()->json($users);
    }

    /**
     * POST /api/team
     * Create a new team member with a temporary password.
     * Returns the plain-text temp password ONCE so the admin can copy it.
     * It is never stored — only the hash is saved.
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|unique:users,email',
            'password' => ['required', 'string', Password::min(8)],
            'role'     => 'sometimes|in:full,standard',
        ]);

        $plain = $data['password'];   // captured before hashing

        $user = User::create([
            'name'                 => $data['name'],
            'email'                => $data['email'],
            'password'             => Hash::make($plain),
            'role'                 => $data['role'] ?? 'standard',
            'must_change_password' => true,
            'is_active'            => true,
        ]);

        return response()->json([
            'user'             => $user->only('id', 'name', 'email', 'role', 'is_active', 'created_at'),
            'temp_password'    => $plain,   // shown once in UI for copy — not stored again
        ], 201);
    }

    /**
     * POST /api/team/{id}/reset-password
     * Generate and set a new temporary password for the user.
     * Returns the plain-text password once so the admin can copy it.
     * Sets must_change_password = true so the user is forced to change on next login.
     */
    public function resetPassword(Request $request, int $id): JsonResponse
    {
        $user = User::findOrFail($id);

        $data = $request->validate([
            'password' => ['required', 'string', Password::min(8)],
        ]);

        $plain = $data['password'];

        $user->update([
            'password'             => Hash::make($plain),
            'must_change_password' => true,
        ]);

        return response()->json([
            'temp_password' => $plain,
            'name'          => $user->name,
            'email'         => $user->email,
        ]);
    }

    /**
     * PATCH /api/team/{id}
     * Update name, role, or is_active.
     * Admins cannot deactivate or demote themselves.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $user = User::findOrFail($id);

        $data = $request->validate([
            'name'      => 'sometimes|string|max:255',
            'role'      => 'sometimes|in:full,standard',
            'is_active' => 'sometimes|boolean',
        ]);

        // Prevent self-lockout
        if ($id === $request->user()->id) {
            unset($data['is_active'], $data['role']);
        }

        if (empty($data)) {
            return response()->json(['error' => 'No valid fields to update.'], 400);
        }

        $user->update($data);

        return response()->json($user->only('id', 'name', 'email', 'role', 'is_active', 'last_login_at'));
    }
}
