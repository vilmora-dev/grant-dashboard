<?php

use App\Http\Controllers\DdgSearchComboController;
use App\Http\Controllers\GrantDataController;
use App\Http\Controllers\InitiativeController;
use App\Http\Controllers\KeywordController;
use App\Http\Controllers\OrganizationProfileController;
use App\Http\Controllers\RescoreController;
use App\Http\Controllers\StatsController;
use App\Http\Controllers\TeamController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes — Grants Manager
|--------------------------------------------------------------------------
|
| All routes are prefixed with /api automatically by Laravel's routing.
| Auth is enforced via the 'auth:sanctum' guard configured in bootstrap/app.php.
|
*/

// Standard access (any authenticated user)
Route::middleware('auth:web')->group(function () {
    Route::get('/data',              [GrantDataController::class, 'index']);
    Route::get('/count',             [GrantDataController::class, 'count']);
    Route::patch('/grants/{id}',     [GrantDataController::class, 'updateGrant']);
    Route::patch('/grants_gov/{id}', [GrantDataController::class, 'updateGrantGov']);

    // Grant action log — full access users see all entries, standard users see their own
    Route::get('/grants/{id}/logs',  [GrantDataController::class, 'logs']);
});

// Full access only
Route::middleware(['auth:web', 'full.access'])->group(function () {

    // Keywords
    Route::get('/keywords',              [KeywordController::class, 'index']);
    Route::post('/keywords',             [KeywordController::class, 'store']);
    Route::patch('/keywords/{id}',       [KeywordController::class, 'update']);
    Route::delete('/keywords/{id}',      [KeywordController::class, 'destroy']);

    // Initiatives
    Route::get('/initiatives',           [InitiativeController::class, 'index']);
    Route::post('/initiatives',          [InitiativeController::class, 'store']);
    Route::patch('/initiatives/{id}',    [InitiativeController::class, 'update']);
    Route::delete('/initiatives/{id}',   [InitiativeController::class, 'destroy']);

    // Organization profile
    Route::get('/organization',          [OrganizationProfileController::class, 'show']);
    Route::put('/organization',          [OrganizationProfileController::class, 'upsert']);

    // DDG search combos
    Route::get('/ddg-combos',            [DdgSearchComboController::class, 'index']);
    Route::patch('/ddg-combos/{id}',     [DdgSearchComboController::class, 'update']);

    // Rescore
    Route::post('/rescore',              RescoreController::class);

    // Stats / dashboard
    Route::get('/stats',                 [StatsController::class, 'index']);

    // Team management
    Route::get('/team',                       [TeamController::class, 'index']);
    Route::post('/team',                      [TeamController::class, 'store']);
    Route::patch('/team/{id}',                [TeamController::class, 'update']);
    Route::post('/team/{id}/reset-password',  [TeamController::class, 'resetPassword']);
});
