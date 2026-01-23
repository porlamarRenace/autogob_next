<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;
use App\Http\Controllers\CitizenController;
use App\Http\Controllers\CaseController;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
    Route::get('/api/citizens/search', [CitizenController::class, 'searchApi'])->name('citizens.search');
    Route::get('/api/geo/municipalities', [CitizenController::class, 'getMunicipalities'])->name('geo.municipalities');
    Route::get('/api/geo/communities/{municipality}', [CitizenController::class, 'getCommunities'])->name('geo.communities');
    Route::get('/api/geo/streets/{community}', [CitizenController::class, 'getStreets'])->name('geo.streets');

    Route::post('/api/citizens', [CitizenController::class, 'store'])->name('citizens.store');
    
    Route::get('/cases/create', [CitizenController::class, 'index'])->name('cases.create');
    Route::put('/api/citizens/{id}', [CitizenController::class, 'update'])->name('citizens.update');

    Route::get('/api/cases/categories', [CaseController::class, 'getCategories'])->name('cases.categories');
    Route::get('/api/cases/search-items', [CaseController::class, 'searchItems'])->name('cases.search-items');
    Route::post('/api/cases', [CaseController::class, 'store'])->name('cases.store');
});

require __DIR__.'/settings.php';
