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

// TEMP DEBUG: Quitar después de debuggear
Route::get('/api/debug/aids-excel', [\App\Http\Controllers\Admin\ReportController::class, 'aidsExcelDebug'])->name('debug.aids-excel');

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
    
    // Expediente del ciudadano (Historial)
    Route::get('/citizens/{citizen}/expedient', [CitizenController::class, 'expedient'])->name('citizens.expedient');
    
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
        
        // Stock management
        Route::get('stock', [\App\Http\Controllers\Admin\StockController::class, 'index'])->name('stock.index');
        Route::get('stock/{supply}/movements', [\App\Http\Controllers\Admin\StockController::class, 'movements'])->name('stock.movements');
        Route::post('stock/entry', [\App\Http\Controllers\Admin\StockController::class, 'entry'])->name('stock.entry');
        Route::post('stock/exit', [\App\Http\Controllers\Admin\StockController::class, 'exit'])->name('stock.exit');
        Route::get('stock/{supply}/recent', [\App\Http\Controllers\Admin\StockController::class, 'recentMovements'])->name('stock.recent');

        // Reports
        Route::get('reports', [\App\Http\Controllers\Admin\ReportController::class, 'index'])->name('reports.index');
        Route::get('reports/citizen/{citizen}/expedient-pdf', [\App\Http\Controllers\Admin\ReportController::class, 'citizenExpedient'])->name('reports.citizen.pdf');
        Route::get('reports/approved-aids', [\App\Http\Controllers\Admin\ReportController::class, 'approvedAids'])->name('reports.approved-aids');
        Route::get('reports/aids-excel', [\App\Http\Controllers\Admin\ReportController::class, 'aidsExcel'])->name('reports.aids-excel');
        
        // Expedientes de Ciudadanos
        Route::get('reports/citizens', [\App\Http\Controllers\Admin\ReportController::class, 'citizensList'])->name('reports.citizens')->middleware('can:view citizen expedients');
        Route::get('reports/citizens/{citizen}/expedient', [\App\Http\Controllers\Admin\ReportController::class, 'showExpedient'])->name('reports.citizens.expedient')->middleware('can:view citizen expedients');

        // Reporte de Stock
        Route::get('reports/stock', [\App\Http\Controllers\Admin\ReportController::class, 'stockReport'])->name('reports.stock');
        Route::get('reports/stock/pdf', [\App\Http\Controllers\Admin\ReportController::class, 'stockReportPdf'])->name('reports.stock.pdf');
    });
    Route::get('admin/reports/case/{case}/pdf', [\App\Http\Controllers\Admin\ReportController::class, 'caseDetail'])->name('reports.case.pdf');
    // Reportes de actividad - accesibles para operadores también (fuera del middleware admin)
    Route::get('reports/activity', [\App\Http\Controllers\Admin\ReportController::class, 'activityReport'])
        ->name('reports.activity')
        ->middleware('can:view activity reports');
    Route::get('reports/activity/pdf', [\App\Http\Controllers\Admin\ReportController::class, 'activityReportPdf'])
        ->name('reports.activity.pdf')
        ->middleware('can:view activity reports');
    
    // Mis Asignaciones - Gestión de casos e items asignados
    Route::middleware('can:manage assignments')->group(function () {
        Route::get('assignments', [\App\Http\Controllers\Admin\ReportController::class, 'myAssignments'])->name('assignments.index');
        Route::get('assignments/pdf', [\App\Http\Controllers\Admin\ReportController::class, 'myAssignmentsPdf'])->name('assignments.pdf');
        
        // Acciones sobre items
        Route::post('assignments/items/{item}/approve', [\App\Http\Controllers\Admin\ReportController::class, 'approveItem'])->name('assignments.items.approve');
        Route::post('assignments/items/{item}/reject', [\App\Http\Controllers\Admin\ReportController::class, 'rejectItem'])->name('assignments.items.reject');
        Route::post('assignments/items/{item}/fulfill', [\App\Http\Controllers\Admin\ReportController::class, 'fulfillItem'])->name('assignments.items.fulfill');
        
        // Acciones sobre casos
        Route::post('assignments/cases/{case}/approve', [\App\Http\Controllers\Admin\ReportController::class, 'approveCase'])->name('assignments.cases.approve');
        Route::post('assignments/cases/{case}/reject', [\App\Http\Controllers\Admin\ReportController::class, 'rejectCase'])->name('assignments.cases.reject');
    });
});

require __DIR__.'/settings.php';
