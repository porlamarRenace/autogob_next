<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SocialCase;
use App\Models\Citizen;
use App\Models\CaseItem;
use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;

use Inertia\Inertia;

class ReportController extends Controller
{
    /**
     * Dashboard de reportes
     */
    public function index()
    {
        if (!auth()->user()->can('view reports') && !auth()->user()->can('manage settings')) {
            abort(403);
        }
        return Inertia::render('admin/reports/index');
    }

    /**
     * PDF detallado de un caso social
     */
    public function caseDetail(SocialCase $case)
    {
        $case->load([
            'citizen.street.community.municipality.state',
            'applicant',
            'beneficiary',
            'creator',
            'items.itemable',
            'category',
            'subcategory'
        ]);

        $pdf = Pdf::loadView('pdf.social-case', compact('case'));
        return $pdf->stream("Caso-{$case->case_number}.pdf");
    }

    /**
     * PDF del expediente de un ciudadano
     */
    public function citizenExpedient(Citizen $citizen)
    {
        $citizen->load(['street.community.municipality.state', 'healthProfile']);
        
        // Cargar casos
        $beneficiaryCases = $citizen->beneficiaryCases()
            ->with(['items.itemable', 'category', 'subcategory'])
            ->orderBy('created_at', 'desc')
            ->get();

        $pdf = Pdf::loadView('pdf.citizen-expedient', compact('citizen', 'beneficiaryCases'));
        return $pdf->stream("Expediente-{$citizen->identification_value}.pdf");
    }

    /**
     * Formulario para reporte de ayudas aprobadas
     */
    public function approvedAids(Request $request)
    {
        // Verificar permiso
        if (!auth()->user()->can('view reports') && !auth()->user()->can('manage settings')) {
            abort(403, 'No tiene permiso para generar reportes.');
        }

        $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
        ]);

        $items = CaseItem::whereHas('socialCase', function ($query) {
                // Filtrar por casos que no estén rechazados si es necesario, 
                // pero aquí nos interesan items aprobados o cumplidos
            })
            ->whereIn('status', ['approved', 'fulfilled'])
            ->whereBetween('created_at', [
                Carbon::parse($request->start_date)->startOfDay(),
                Carbon::parse($request->end_date)->endOfDay()
            ])
            ->with(['socialCase.beneficiary', 'itemable', 'socialCase.category'])
            ->orderBy('created_at', 'desc')
            ->get();

        $pdf = Pdf::loadView('pdf.approved-aids', [
            'items' => $items,
            'period' => [
                'start' => $request->start_date,
                'end' => $request->end_date
            ]
        ]);

        return $pdf->stream("Ayudas-Aprobadas-{$request->start_date}-{$request->end_date}.pdf");
    }
}
