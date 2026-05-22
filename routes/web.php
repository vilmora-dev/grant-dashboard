<?php

use App\Http\Controllers\GrantController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\SetPasswordController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin'       => Route::has('login'),
        'laravelVersion' => Application::VERSION,
        'phpVersion'     => PHP_VERSION,
    ]);
});

// Forced first-login password change (auth required, no full.access gate)
Route::get('/set-password',  [SetPasswordController::class, 'create'])->middleware('auth')->name('password.set');
Route::post('/set-password', [SetPasswordController::class, 'store'])->middleware('auth')->name('password.set.update');

// Grants dashboard
Route::get('/dashboard', [GrantController::class, 'index'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard');

// Full-access only pages
Route::middleware(['auth', 'verified', 'full.access'])->group(function () {

    Route::get('/stats', function () {
        return Inertia::render('Stats/Index');
    })->name('stats.index');

    Route::get('/config', function () {
        return Inertia::render('Config/Index', [
            'initiatives' => \App\Models\Initiative::where('is_deleted', false)->orderBy('display_name')->get(),
            'keywords'    => \App\Models\Keyword::with('initiative')->orderBy('priority')->orderBy('keyword')->get()
                ->map(fn ($kw) => array_merge($kw->toArray(), [
                    'initiative_name' => $kw->initiative?->display_name,
                ])),
            'orgProfile'  => \App\Models\OrganizationProfile::first(),
        ]);
    })->name('config.index');

    Route::get('/team', function () {
        return Inertia::render('Team/Index');
    })->name('team.index');

});

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
