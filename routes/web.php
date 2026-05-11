<?php

use App\Http\Controllers\GrantController;
use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin'       => Route::has('login'),
        'canRegister'    => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion'     => PHP_VERSION,
    ]);
});

// Grants dashboard — replaces the Breeze stub
Route::get('/dashboard', [GrantController::class, 'index'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard');

// Config page — data passed inline, mutations go through /api/
Route::get('/config', function () {
    return Inertia::render('Config/Index', [
        'initiatives' => \App\Models\Initiative::where('is_deleted', false)->orderBy('display_name')->get(),
        'keywords'    => \App\Models\Keyword::with('initiative')->orderBy('priority')->orderBy('keyword')->get()
            ->map(fn ($kw) => array_merge($kw->toArray(), [
                'initiative_name' => $kw->initiative?->display_name,
            ])),
        'orgProfile'  => \App\Models\OrganizationProfile::first(),
    ]);
})->middleware(['auth', 'verified'])->name('config.index');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
