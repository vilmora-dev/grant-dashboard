<?php

use App\Http\Controllers\GrantController;
use App\Http\Controllers\ConfigController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
*/

// ── Grants dashboard ────────────────────────────────────────────────────
Route::get('/', [GrantController::class, 'index'])->name('grants.index');

// Grant status patches (applied / ignore / starred / amount / deadline / notes)
Route::patch('/grants/{id}',     [GrantController::class, 'patchDdg'])->name('grants.patch');
Route::patch('/grants-gov/{id}', [GrantController::class, 'patchGov'])->name('grants-gov.patch');

// ── Config ──────────────────────────────────────────────────────────────
Route::get('/config', [ConfigController::class, 'index'])->name('config.index');

// Initiatives
Route::post  ('/initiatives',     [ConfigController::class, 'storeInitiative'])->name('initiatives.store');
Route::patch ('/initiatives/{id}',[ConfigController::class, 'updateInitiative'])->name('initiatives.update');
Route::delete('/initiatives/{id}',[ConfigController::class, 'destroyInitiative'])->name('initiatives.destroy');

// Keywords
Route::post  ('/keywords',     [ConfigController::class, 'storeKeyword'])->name('keywords.store');
Route::patch ('/keywords/{id}',[ConfigController::class, 'updateKeyword'])->name('keywords.update');
Route::delete('/keywords/{id}',[ConfigController::class, 'destroyKeyword'])->name('keywords.destroy');

// Organization profile
Route::put('/organization', [ConfigController::class, 'upsertOrganization'])->name('organization.upsert');
