<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;
use App\Http\Controllers\CitizenController;
use App\Http\Controllers\CaseController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\Admin\CategoryController;
use App\Http\Controllers\Admin\SupplyController;
use App\Http\Controllers\Admin\MedicalServiceController;
use App\Models\SocialCase;
use App\Models\Citizen;

Route::get('/', function () {
    return redirect('/dashboard');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', function () {
        $user = Auth::user();
        $isManager = $user->can('review cases') || $user->can('manage users');
        $caseQuery = SocialCase::query();
        
        if (!$isManager) {
            $caseQuery->where('user_id', $user->id);
        }

        // --- ESTADÍSTICAS ---
        if ($isManager) {
            // KPI GLOBALES (Sensibles)
            $stats = [
                'label_pending' => 'Solicitudes Nuevas (Global)',
                'pending' => SocialCase::where('status', 'open')->count(),
                
                'label_progress' => 'En Proceso (Global)',
                'in_progress' => SocialCase::where('status', 'in_progress')->count(),
                
                'label_approved' => 'Aprobados Hoy (Total)',
                'approved_today' => SocialCase::where('status', 'approved')->whereDate('updated_at', now())->count(),
                
                'label_total' => 'Base de Datos Ciudadanos',
                'total_citizens' => Citizen::count(), 
                'show_citizens' => true,
            ];
        } else {
            // KPI PERSONALES (Productividad)
            $stats = [
                'label_pending' => 'Mis Casos Pendientes',
                'pending' => (clone $caseQuery)->where('status', 'open')->count(),
                
                'label_progress' => 'Mis Casos en Revisión',
                'in_progress' => (clone $caseQuery)->where('status', 'in_progress')->count(),
                
                'label_approved' => 'Mis Cargas Aprobadas Hoy',
                'approved_today' => (clone $caseQuery)->where('status', 'approved')->whereDate('updated_at', now())->count(),
                
                'label_total' => 'Total Casos Creados (Histórico)',
                'total_citizens' => (clone $caseQuery)->count(), 
                'show_citizens' => false, 
            ];
        }

        // --- ACTIVIDAD RECIENTE ---
        $recentCases = $caseQuery->with(['citizen', 'category'])
            ->latest()
            ->take(5)
            ->get()
            ->map(fn($c) => [
                'id' => $c->id,
                'case_number' => $c->case_number,
                'citizen' => $c->citizen->first_name . ' ' . $c->citizen->last_name,
                'category' => $c->category->name,
                'status' => $c->status,
                'date' => $c->created_at->diffForHumans(),
            ]);

        return Inertia::render('dashboard', [
            'stats' => $stats,
            'recent_cases' => $recentCases,
            'is_manager' => $isManager 
        ]);
    })->middleware(['auth', 'verified'])->name('dashboard');
    Route::get('/api/citizens/search', [CitizenController::class, 'searchApi'])->name('citizens.search');
    Route::get('/api/geo/municipalities', [CitizenController::class, 'getMunicipalities'])->name('geo.municipalities');
    Route::get('/api/geo/communities/{municipality}', [CitizenController::class, 'getCommunities'])->name('geo.communities');
    Route::get('/api/geo/streets/{community}', [CitizenController::class, 'getStreets'])->name('geo.streets');

    Route::post('/api/citizens', [CitizenController::class, 'store'])->name('citizens.store');
    
    Route::get('/cases/create', [CitizenController::class, 'index'])->name('cases.create');
    Route::put('/api/citizens/{id}', [CitizenController::class, 'update'])->name('citizens.update');
    
    // Citizen photo and profile validation routes
    Route::post('/api/citizens/{id}/photo', [CitizenController::class, 'uploadPhoto'])->name('citizens.upload-photo');
    Route::delete('/api/citizens/{id}/photo', [CitizenController::class, 'deletePhoto'])->name('citizens.delete-photo');
    Route::get('/api/citizens/{id}/profile-status', [CitizenController::class, 'getProfileStatus'])->name('citizens.profile-status');
    
    // External person lookup (searches local first, then external API)
    Route::post('/api/citizens/lookup', [CitizenController::class, 'lookupExternal'])->name('citizens.lookup-external');

    Route::get('/api/cases/categories', [CaseController::class, 'getCategories'])->name('cases.categories');
    Route::get('/api/cases/search-items', [CaseController::class, 'searchItems'])->name('cases.search-items');
    Route::post('/api/cases', [CaseController::class, 'store'])->name('cases.store');
    
    // Case attachments routes
    Route::post('/api/cases/{id}/attachments', [CaseController::class, 'uploadAttachment'])->name('cases.upload-attachment');
    Route::delete('/api/cases/{caseId}/attachments/{mediaId}', [CaseController::class, 'deleteAttachment'])->name('cases.delete-attachment');
    Route::get('/api/cases/{caseId}/attachments/{mediaId}/download', [CaseController::class, 'downloadAttachment'])->name('cases.download-attachment');

    Route::get('/cases/{id}/review', [CaseController::class, 'show'])->name('cases.show');
    Route::post('/api/cases/{id}/review', [CaseController::class, 'review'])->name('cases.review');
    Route::get('/cases', [CaseController::class, 'index'])->name('cases.index');
    Route::put('/api/cases/{id}/assign', [CaseController::class, 'assign'])->name('cases.assign');
    Route::post('/api/cases/{caseId}/items/{itemId}/fulfill', [CaseController::class, 'fulfillItem'])->name('cases.items.fulfill');

    Route::group(['middleware' => ['can:manage users']], function () {
        Route::resource('users', UserController::class);
        Route::resource('roles', RoleController::class);
    });

    Route::group(['prefix' => 'admin', 'middleware' => ['can:manage settings']], function () {
        Route::resource('categories',CategoryController::class);
        Route::resource('supplies', SupplyController::class);
        Route::resource('services', MedicalServiceController::class);
    });
});

require __DIR__.'/settings.php';
