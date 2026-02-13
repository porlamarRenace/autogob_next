<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SocialCase;
use App\Models\Citizen;
use App\Models\CaseItem;
use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Rap2hpoutre\FastExcel\FastExcel;

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
        // Optimized eager loading with specific column selection
        $case->load([
            'citizen:id,first_name,last_name,nationality,identification_value,phone,street_id',
            'citizen.street:id,name,community_id',
            'citizen.street.community:id,name,municipality_id',
            'citizen.street.community.municipality:id,name,state_id',
            'citizen.street.community.municipality.state:id,name',
            'applicant:id,first_name,last_name,nationality,identification_value,phone',
            'applicant.street:id,name,community_id',
            'applicant.street.community:id,name',
            'beneficiary:id,first_name,last_name,nationality,identification_value,phone,street_id,birth_date',
            'beneficiary.street:id,name,community_id',
            'beneficiary.street.community:id,name',
            'creator:id,name',
            'assignee:id,name', // Case assignee
            'items:id,social_case_id,itemable_id,itemable_type,quantity,approved_quantity,status,description,fulfilled_at,assigned_to,reviewed_by,fulfilled_by,review_note',
            'items.itemable',
            'items.assignedTo:id,name', // Item assignee
            'items.reviewer:id,name', // Item reviewer
            'items.fulfilledBy:id,name', // Who fulfilled the item
            'category:id,name',
            'subcategory:id,name'
        ]);

        $pdf = Pdf::loadView('pdf.social-case', compact('case'));
        $pdf->setPaper('a4');
        
        return $pdf->stream("Caso-{$case->case_number}.pdf");
    }

    /**
     * PDF del expediente de un ciudadano
     */
    public function citizenExpedient(Citizen $citizen)
    {
        // Optimized eager loading with specific columns
        $citizen->load([
            'street:id,name,community_id',
            'street.community:id,name,municipality_id',
            'street.community.municipality:id,name',
            'healthProfile:id,citizen_id,is_disabled,disability_type,has_diabetes,has_hypertension,has_cancer,blood_type,weight,height,notes'
        ]);
        
        // Optimized beneficiary cases query with selective loading
        $beneficiaryCases = $citizen->beneficiaryCases()
            ->select('id', 'case_number', 'created_at', 'category_id', 'subcategory_id', 'beneficiary_id')
            ->with([
                'items:id,social_case_id,itemable_id,itemable_type,quantity,status,fulfilled_at',
                'items.itemable:id,name',
                'category:id,name',
                'subcategory:id,name'
            ])
            ->orderBy('created_at', 'desc')
            ->limit(50) // Limit to last 50 cases for performance
            ->get();

        $pdf = Pdf::loadView('pdf.citizen-expedient', compact('citizen', 'beneficiaryCases'));
        $pdf->setPaper('a4');
        
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

        $startDate = Carbon::parse($request->start_date)->startOfDay();
        $endDate = Carbon::parse($request->end_date)->endOfDay();

        // Optimized query with selective column loading and indexed filtering
        $items = CaseItem::select([
                'case_items.id',
                'case_items.social_case_id',
                'case_items.itemable_id',
                'case_items.itemable_type',
                'case_items.quantity',
                'case_items.approved_quantity',
                'case_items.status',
                'case_items.created_at'
            ])
            ->whereIn('status', ['approved', 'fulfilled'])
            ->whereBetween('created_at', [$startDate, $endDate])
            ->with([
                'socialCase:id,case_number,beneficiary_id,category_id',
                'socialCase.beneficiary:id,first_name,last_name',
                'socialCase.category:id,name',
                'itemable' // Load only necessary itemable fields
            ])
            ->orderBy('created_at', 'desc')
            ->limit(1000) // Prevent memory overflow with very large reports
            ->get();

        $pdf = Pdf::loadView('pdf.approved-aids', [
            'items' => $items,
            'period' => [
                'start' => $request->start_date,
                'end' => $request->end_date
            ]
        ]);

        // Set options for better performance
        $pdf->setPaper('a4');
        $pdf->setOption('enable_php', false);
        $pdf->setOption('isHtml5ParserEnabled', true);
        $pdf->setOption('isRemoteEnabled', false);

        return $pdf->stream("Ayudas-Aprobadas-{$request->start_date}-{$request->end_date}.pdf");
    }

    /**
     * Excel de ayudas sociales por período (estilizado con PhpSpreadsheet)
     */
    public function aidsExcel(Request $request)
    {
        if (!auth()->user()->can('export aids excel')) {
            abort(403, 'No tiene permiso para exportar este reporte.');
        }

        $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
        ]);

        $startDate = Carbon::parse($request->start_date)->startOfDay();
        $endDate = Carbon::parse($request->end_date)->endOfDay();

        $rows = $this->buildAidsExcelData($startDate, $endDate);
        $filename = "Reporte-Ayudas-{$request->start_date}-a-{$request->end_date}.xlsx";

        return $this->generateStyledExcel($rows, $filename, $startDate, $endDate);
    }

    /**
     * TEMP DEBUG: Excel sin auth para debuggear con Bruno
     */
    public function aidsExcelDebug(Request $request)
    {
        $startDate = Carbon::parse($request->get('start_date', '2024-01-01'))->startOfDay();
        $endDate = Carbon::parse($request->get('end_date', '2027-12-31'))->endOfDay();

        if ($request->get('debug')) {
            dd([
                'total_in_db' => SocialCase::count(),
                'min_date' => SocialCase::min('created_at'),
                'max_date' => SocialCase::max('created_at'),
                'cases_in_range' => SocialCase::whereBetween('created_at', [$startDate, $endDate])->count(),
            ]);
        }

        $rows = $this->buildAidsExcelData($startDate, $endDate);
        return $this->generateStyledExcel($rows, 'debug-ayudas.xlsx', $startDate, $endDate);
    }

    /**
     * Construir datos para el Excel de ayudas
     */
    private function buildAidsExcelData(Carbon $startDate, Carbon $endDate): array
    {
        $cases = SocialCase::with([
                'applicant:id,first_name,last_name,nationality,identification_value,phone',
                'beneficiary:id,first_name,last_name,birth_date,street_id',
                'beneficiary.street:id,name,community_id',
                'beneficiary.street.community:id,name',
                'category:id,name',
                'items.itemable',
            ])
            ->whereBetween('created_at', [$startDate, $endDate])
            ->orderBy('created_at', 'asc')
            ->get();

        $rowNumber = 0;
        $rows = [];

        foreach ($cases as $case) {
            $rowNumber++;
            $applicant = $case->applicant;
            $beneficiary = $case->beneficiary;

            $ageCategory = 'N/A';
            $ageYears = 'N/A';
            if ($beneficiary && $beneficiary->birth_date) {
                $age = $beneficiary->birth_date->diffInYears(Carbon::now());
                $ageCategory = $age >= 18 ? 'Adulto' : 'Niño';
                $ageYears = (int) $age;
            }

            $address = '';
            if ($beneficiary && $beneficiary->street) {
                $address = $beneficiary->street->name;
                if ($beneficiary->street->community) {
                    $address .= ', ' . $beneficiary->street->community->name;
                }
            }

            $sector = ($beneficiary && $beneficiary->street && $beneficiary->street->community)
                ? $beneficiary->street->community->name
                : '';

            $itemDescriptions = $case->items->map(function ($item) {
                return $item->itemable ? $item->itemable->name : 'Item sin nombre';
            })->implode(' - ');

            $rows[] = [
                $rowNumber,
                $case->created_at->format('d/m/Y'),
                $applicant ? trim("{$applicant->first_name} {$applicant->last_name}") : 'N/A',
                $applicant ? "{$applicant->nationality}-{$applicant->identification_value}" : 'N/A',
                $ageCategory,
                $ageYears,
                $address,
                $sector,
                $case->category ? $case->category->name : 'N/A',
                $itemDescriptions ?: 'Sin items',
                $applicant ? ($applicant->phone ?: 'N/A') : 'N/A',
            ];
        }

        return $rows;
    }

    /**
     * Generar Excel estilizado profesionalmente con PhpSpreadsheet
     */
    private function generateStyledExcel(array $rows, string $filename, Carbon $startDate, Carbon $endDate)
    {
        $spreadsheet = new \PhpOffice\PhpSpreadsheet\Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Reporte de Ayudas');

        $headers = [
            'N', 'Fecha', 'Nombre y Apellido Solicitante', 'Numero de Cedula',
            'Categoria (Adulto/Nino)', 'Edad', 'Direccion', 'Sector',
            'Tipos de Ayudas (Categoria)', 'Descripcion', 'Telefono'
        ];

        $lastCol = 'K';

        // ── Fila 1: Título ──
        $sheet->mergeCells("A1:{$lastCol}1");
        $sheet->setCellValue('A1', 'REPORTE DE AYUDAS SOCIALES');
        $sheet->getStyle('A1')->applyFromArray([
            'font' => ['bold' => true, 'size' => 14, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID, 'startColor' => ['rgb' => '1B3A5C']],
            'alignment' => ['horizontal' => \PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER, 'vertical' => \PhpOffice\PhpSpreadsheet\Style\Alignment::VERTICAL_CENTER],
        ]);
        $sheet->getRowDimension(1)->setRowHeight(30);

        // ── Fila 2: Período ──
        $sheet->mergeCells("A2:{$lastCol}2");
        $sheet->setCellValue('A2', "Periodo: {$startDate->format('d/m/Y')} - {$endDate->format('d/m/Y')}");
        $sheet->getStyle('A2')->applyFromArray([
            'font' => ['italic' => true, 'size' => 10, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID, 'startColor' => ['rgb' => '2C5F8A']],
            'alignment' => ['horizontal' => \PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER],
        ]);
        $sheet->getRowDimension(2)->setRowHeight(22);

        // ── Fila 3: Encabezados ──
        $columns = range('A', $lastCol);
        foreach ($columns as $i => $col) {
            $sheet->setCellValue("{$col}3", $headers[$i]);
        }
        $sheet->getStyle("A3:{$lastCol}3")->applyFromArray([
            'font' => ['bold' => true, 'size' => 10, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID, 'startColor' => ['rgb' => '2E75B6']],
            'alignment' => ['horizontal' => \PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER, 'vertical' => \PhpOffice\PhpSpreadsheet\Style\Alignment::VERTICAL_CENTER, 'wrapText' => true],
            'borders' => ['allBorders' => ['borderStyle' => \PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN, 'color' => ['rgb' => '000000']]],
        ]);
        $sheet->getRowDimension(3)->setRowHeight(28);

        // ── Datos ──
        $dataStart = 4;
        if (empty($rows)) {
            $sheet->mergeCells("A{$dataStart}:{$lastCol}{$dataStart}");
            $sheet->setCellValue("A{$dataStart}", 'No se encontraron registros en el periodo seleccionado.');
            $sheet->getStyle("A{$dataStart}")->applyFromArray([
                'font' => ['italic' => true, 'size' => 11, 'color' => ['rgb' => '888888']],
                'alignment' => ['horizontal' => \PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER],
            ]);
        } else {
            foreach ($rows as $idx => $row) {
                $r = $dataStart + $idx;
                foreach ($columns as $i => $col) {
                    $val = $row[$i] ?? '';
                    if (is_string($val)) {
                        $val = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', '', $val);
                    }
                    $sheet->setCellValue("{$col}{$r}", $val);
                }

                $bgColor = ($idx % 2 === 0) ? 'D6E4F0' : 'FFFFFF';
                $sheet->getStyle("A{$r}:{$lastCol}{$r}")->applyFromArray([
                    'fill' => ['fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID, 'startColor' => ['rgb' => $bgColor]],
                    'borders' => ['allBorders' => ['borderStyle' => \PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN, 'color' => ['rgb' => '000000']]],
                    'alignment' => ['vertical' => \PhpOffice\PhpSpreadsheet\Style\Alignment::VERTICAL_CENTER],
                    'font' => ['size' => 10],
                ]);
            }

            // Centrar columnas cortas
            $lastRow = $dataStart + count($rows) - 1;
            foreach (['A', 'B', 'D', 'E', 'F', 'K'] as $cc) {
                $sheet->getStyle("{$cc}{$dataStart}:{$cc}{$lastRow}")->getAlignment()
                    ->setHorizontal(\PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER);
            }
        }

        // ── Anchos de columna ──
        $widths = ['A' => 5, 'B' => 12, 'C' => 30, 'D' => 18, 'E' => 18, 'F' => 7, 'G' => 30, 'H' => 20, 'I' => 22, 'J' => 40, 'K' => 16];
        foreach ($widths as $col => $w) {
            $sheet->getColumnDimension($col)->setWidth($w);
        }

        // Congelar encabezados
        $sheet->freezePane("A{$dataStart}");

        // ── Descargar ──
        $writer = new \PhpOffice\PhpSpreadsheet\Writer\Xlsx($spreadsheet);
        $tempFile = tempnam(sys_get_temp_dir(), 'excel_');
        $writer->save($tempFile);

        return response()->download($tempFile, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ])->deleteFileAfterSend(true);
    }


    /**
     * Lista de ciudadanos para expedientes
     */
    public function citizensList(Request $request)
    {
        if (!auth()->user()->can('view citizen expedients')) {
            abort(403);
        }

        $search = $request->get('search', '');
        
        $query = Citizen::select([
            'id', 'first_name', 'last_name', 'nationality', 
            'identification_value', 'phone'
        ]);

        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%")
                  ->orWhere('identification_value', 'like', "%{$search}%");
            });
        }

        $citizens = $query->withCount('beneficiaryCases')
            ->orderBy('last_name')
            ->paginate(50);

        return Inertia::render('reports/citizens/index', [
            'citizens' => $citizens,
            'search' => $search
        ]);
    }

    /**
     * Vista web del expediente de un ciudadano
     */
    public function showExpedient(Citizen $citizen)
    {
        if (!auth()->user()->can('view citizen expedients')) {
            abort(403);
        }

        $citizen->load([
            'street:id,name,community_id',
            'street.community:id,name,municipality_id',
            'street.community.municipality:id,name',
            'healthProfile:id,citizen_id,is_disabled,disability_type,has_diabetes,has_hypertension,has_cancer,blood_type,weight,height,notes'
        ]);
        
        $beneficiaryCases = $citizen->beneficiaryCases()
            ->select('id', 'case_number', 'created_at', 'category_id', 'subcategory_id', 'beneficiary_id', 'status')
            ->with([
                'items:id,social_case_id,itemable_id,itemable_type,quantity,status,fulfilled_at',
                'items.itemable',
                'category:id,name',
                'subcategory:id,name'
            ])
            ->orderBy('created_at', 'desc')
            ->limit(50)
            ->get();

        return Inertia::render('reports/citizens/expedient', [
            'citizen' => $citizen,
            'beneficiaryCases' => $beneficiaryCases
        ]);
    }

    /**
     * Reporte de stock (vista web)
     */
    public function stockReport(Request $request)
    {
        if (!auth()->user()->can('view reports')) {
            abort(403);
        }

        $request->validate([
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        $startDate = $request->start_date ? Carbon::parse($request->start_date)->startOfDay() : Carbon::now()->startOfMonth();
        $endDate = $request->end_date ? Carbon::parse($request->end_date)->endOfDay() : Carbon::now()->endOfDay();

        $items = CaseItem::select([
                'itemable_id',
                'itemable_type',
                \DB::raw('SUM(COALESCE(approved_quantity, quantity)) as total_delivered'),
                \DB::raw('MAX(fulfilled_at) as last_delivery')
            ])
            ->where('status', 'fulfilled')
            ->whereBetween('fulfilled_at', [$startDate, $endDate])
            ->with('itemable')
            ->groupBy('itemable_id', 'itemable_type')
            ->orderByDesc('total_delivered')
            ->get();

        return Inertia::render('reports/stock', [
            'items' => $items,
            'filters' => [
                'start_date' => $request->start_date ?? $startDate->format('Y-m-d'),
                'end_date' => $request->end_date ?? $endDate->format('Y-m-d')
            ]
        ]);
    }

    /**
     * PDF del reporte de stock
     */
    public function stockReportPdf(Request $request)
    {
        if (!auth()->user()->can('view reports')) {
            abort(403);
        }

        $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
        ]);

        $startDate = Carbon::parse($request->start_date)->startOfDay();
        $endDate = Carbon::parse($request->end_date)->endOfDay();

        $items = CaseItem::select([
                'itemable_id',
                'itemable_type',
                \DB::raw('SUM(COALESCE(approved_quantity, quantity)) as total_delivered')
            ])
            ->where('status', 'fulfilled')
            ->whereBetween('fulfilled_at', [$startDate, $endDate])
            ->with('itemable')
            ->groupBy('itemable_id', 'itemable_type')
            ->orderByDesc('total_delivered')
            ->get();

        $pdf = Pdf::loadView('pdf.stock-report', [
            'items' => $items,
            'period' => [
                'start' => $request->start_date,
                'end' => $request->end_date
            ]
        ]);

        $pdf->setPaper('a4');
        return $pdf->stream("Reporte-Stock-{$request->start_date}-{$request->end_date}.pdf");
    }

    /**
     * Reporte de actividad/cierre (vista web)
     */
    public function activityReport(Request $request)
    {
        if (!auth()->user()->can('view activity reports')) {
            abort(403);
        }

        $user = auth()->user();
        $isManager = $user->can('review cases') || $user->can('manage users');
        
        $request->validate([
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        // Default: hoy
        $startDate = $request->start_date ? Carbon::parse($request->start_date)->startOfDay() : Carbon::today();
        $endDate = $request->end_date ? Carbon::parse($request->end_date)->endOfDay() : Carbon::today()->endOfDay();

        $query = SocialCase::query();
        
        // Operador solo ve sus casos
        if (!$isManager) {
            $query->where('user_id', $user->id);
        }

        $query->whereBetween('social_cases.created_at', [$startDate, $endDate]);

        // Estadísticas
        $totalCases = (clone $query)->count();
        $byStatus = (clone $query)->select('status', \DB::raw('count(*) as total'))
            ->groupBy('status')
            ->get()
            ->pluck('total', 'status')
            ->toArray();
        
        $byCategory = (clone $query)->select('categories.name', \DB::raw('count(*) as total'))
            ->join('categories', 'social_cases.category_id', '=', 'categories.id')
            ->groupBy('categories.name')
            ->get();

        // Lista de casos
        $cases = $query->with(['beneficiary:id,first_name,last_name', 'category:id,name'])
            ->select('id', 'case_number', 'beneficiary_id', 'category_id', 'status', 'created_at')
            ->orderBy('social_cases.created_at', 'desc')
            ->get();

        return Inertia::render('reports/activity', [
            'stats' => [
                'total' => $totalCases,
                'by_status' => $byStatus,
                'by_category' => $byCategory
            ],
            'cases' => $cases,
            'filters' => [
                'start_date' => $request->start_date ?? $startDate->format('Y-m-d'),
                'end_date' => $request->end_date ?? $endDate->format('Y-m-d')
            ],
            'is_manager' => $isManager
        ]);
    }

    /**
     * PDF del reporte de actividad/cierre
     */
    public function activityReportPdf(Request $request)
    {
        if (!auth()->user()->can('view activity reports')) {
            abort(403);
        }

        $user = auth()->user();
        $isManager = $user->can('review cases') || $user->can('manage users');
        
        $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
        ]);

        $startDate = Carbon::parse($request->start_date)->startOfDay();
        $endDate = Carbon::parse($request->end_date)->endOfDay();

        $query = SocialCase::query();
        
        if (!$isManager) {
            $query->where('user_id', $user->id);
        }

        $query->whereBetween('social_cases.created_at', [$startDate, $endDate]);

        $totalCases = (clone $query)->count();
        $byStatus = (clone $query)->select('status', \DB::raw('count(*) as total'))
            ->groupBy('status')
            ->get();
        
        $byCategory = (clone $query)->select('categories.name', \DB::raw('count(*) as total'))
            ->join('categories', 'social_cases.category_id', '=', 'categories.id')
            ->groupBy('categories.name')
            ->get();

        $cases = $query->with(['beneficiary:id,first_name,last_name', 'category:id,name'])
            ->select('id', 'case_number', 'beneficiary_id', 'category_id', 'status', 'created_at')
            ->orderBy('social_cases.created_at', 'desc')
            ->get();

        $pdf = Pdf::loadView('pdf.activity-report', [
            'stats' => [
                'total' => $totalCases,
                'by_status' => $byStatus,
                'by_category' => $byCategory
            ],
            'cases' => $cases,
            'period' => [
                'start' => $request->start_date,
                'end' => $request->end_date
            ],
            'user' => $user,
            'is_manager' => $isManager
        ]);

        $pdf->setPaper('a4');
        $type = $isManager ? 'Actividad' : 'Cierre';
        return $pdf->stream("Reporte-{$type}-{$request->start_date}-{$request->end_date}.pdf");
    }

    /**
     * Mis Asignaciones - Vista principal
     */
    public function myAssignments(Request $request)
    {
        if (!auth()->user()->can('manage assignments')) {
            abort(403);
        }

        $user = auth()->user();
        
        // Filtros
        $statusFilter = $request->status;
        $typeFilter = $request->type; // 'cases', 'items', null (todos)
        $startDate = $request->start_date ? Carbon::parse($request->start_date)->startOfDay() : Carbon::now()->subMonths(3)->startOfDay();
        $endDate = $request->end_date ? Carbon::parse($request->end_date)->endOfDay() : Carbon::now()->endOfDay();

        // Casos asignados completos
        $assignedCasesQuery = SocialCase::with(['beneficiary:id,first_name,last_name', 'category:id,name', 'items'])
            ->where('assigned_to', $user->id)
            ->whereBetween('created_at', [$startDate, $endDate])
            ->when($statusFilter, fn($q) => $q->where('status', $statusFilter));

        $assignedCases = (!$typeFilter || $typeFilter === 'cases') 
            ? $assignedCasesQuery->orderBy('created_at', 'desc')->paginate(15, ['*'], 'cases_page')
            : collect();

        // Items asignados individuales
        $assignedItemsQuery = CaseItem::with([
                'socialCase:id,case_number,beneficiary_id,status,created_at', 
                'socialCase.beneficiary:id,first_name,last_name',
                'itemable'
            ])
            ->where('assigned_to', $user->id)
            ->whereBetween('created_at', [$startDate, $endDate])
            ->when($statusFilter, fn($q) => $q->where('status', $statusFilter));

        $assignedItems = (!$typeFilter || $typeFilter === 'items')
            ? $assignedItemsQuery->orderBy('created_at', 'desc')->paginate(15, ['*'], 'items_page')
            : collect();

        // Estadísticas
        $stats = [
            'total_cases' => SocialCase::where('assigned_to', $user->id)->count(),
            'total_items' => CaseItem::where('assigned_to', $user->id)->count(),
            'pending_cases' => SocialCase::where('assigned_to', $user->id)->whereIn('status', ['open', 'pending', 'in_progress'])->count(),
            'pending_items' => CaseItem::where('assigned_to', $user->id)->whereIn('status', ['open', 'pending', 'in_progress'])->count(),
            'approved_rate' => $this->calculateApprovalRate($user->id),
        ];

        return Inertia::render('assignments/index', [
            'assignedCases' => $assignedCases,
            'assignedItems' => $assignedItems,
            'stats' => $stats,
            'filters' => [
                'status' => $statusFilter,
                'type' => $typeFilter,
                'start_date' => $startDate->format('Y-m-d'),
                'end_date' => $endDate->format('Y-m-d'),
            ]
        ]);
    }

    /**
     * PDF de mis asignaciones
     */
    public function myAssignmentsPdf(Request $request)
    {
        if (!auth()->user()->can('manage assignments')) {
            abort(403);
        }

        $user = auth()->user();
        
        $statusFilter = $request->status;
        $typeFilter = $request->type;
        $startDate = $request->start_date ? Carbon::parse($request->start_date)->startOfDay() : Carbon::now()->subMonths(3)->startOfDay();
        $endDate = $request->end_date ? Carbon::parse($request->end_date)->endOfDay() : Carbon::now()->endOfDay();

        $assignedCases = SocialCase::with(['beneficiary:id,first_name,last_name', 'category:id,name', 'items'])
            ->where('assigned_to', $user->id)
            ->whereBetween('created_at', [$startDate, $endDate])
            ->when($statusFilter, fn($q) => $q->where('status', $statusFilter))
            ->when($typeFilter === 'cases', fn($q) => $q)
            ->orderBy('created_at', 'desc')
            ->get();

        $assignedItems = CaseItem::with(['socialCase:id,case_number', 'itemable'])
            ->where('assigned_to', $user->id)
            ->whereBetween('created_at', [$startDate, $endDate])
            ->when($statusFilter, fn($q) => $q->where('status', $statusFilter))
            ->when($typeFilter === 'items', fn($q) => $q)
            ->orderBy('created_at', 'desc')
            ->get();

        $stats = [
            'total_cases' => $assignedCases->count(),
            'total_items' => $assignedItems->count(),
            'pending_cases' => $assignedCases->whereIn('status', ['open', 'pending', 'in_progress'])->count(),
            'pending_items' => $assignedItems->whereIn('status', ['open', 'pending', 'in_progress'])->count(),
            'approved_rate' => $this->calculateApprovalRate($user->id)
        ];

        $pdf = Pdf::loadView('pdf.my-assignments', [
            'user' => $user,
            'assignedCases' => $assignedCases,
            'assignedItems' => $assignedItems,
            'stats' => $stats,
            'period' => ['start' => $startDate, 'end' => $endDate],
            'filters' => ['status' => $statusFilter, 'type' => $typeFilter]
        ]);

        $pdf->setPaper('a4');
        return $pdf->stream("Mis-Asignaciones-{$startDate->format('Y-m-d')}-{$endDate->format('Y-m-d')}.pdf");
    }

    /**
     * Aprobar item individual
     */
    public function approveItem(CaseItem $item)
    {
        if (!auth()->user()->can('manage assignments')) {
            abort(403);
        }

        if ($item->assigned_to !== auth()->id()) {
            return response()->json(['message' => 'No tienes permiso para modificar este item'], 403);
        }

        $item->update(['status' => 'approved']);

        // Activity log
        activity()
            ->performedOn($item->socialCase)
            ->causedBy(auth()->user())
            ->withProperties(['item_id' => $item->id, 'item_name' => $item->itemable->name])
            ->log("Item '{$item->itemable->name}' aprobado");

        // Verificar si todos items están aprobados/cerrados
        $this->checkAndUpdateCaseStatus($item->socialCase);

        return back()->with('success', 'Item aprobado exitosamente');
    }

    /**
     * Rechazar item individual
     */
    public function rejectItem(Request $request, CaseItem $item)
    {
        if (!auth()->user()->can('manage assignments')) {
            abort(403);
        }

        if ($item->assigned_to !== auth()->id()) {
            return response()->json(['message' => 'No tienes permiso para modificar este item'], 403);
        }

        $request->validate([
            'reason' => 'required|string|min:10|max:500'
        ]);

        $item->update([
            'status' => 'rejected',
            'notes' => $request->reason
        ]);

        // Activity log
        activity()
            ->performedOn($item->socialCase)
            ->causedBy(auth()->user())
            ->withProperties([
                'item_id' => $item->id, 
                'item_name' => $item->itemable->name,
                'reason' => $request->reason
            ])
            ->log("Item '{$item->itemable->name}' rechazado: {$request->reason}");

        return back()->with('success', 'Item rechazado exitosamente');
    }

    /**
     * Marcar item como entregado (Fulfilled)
     */
    public function fulfillItem(CaseItem $item)
    {
        if (!auth()->user()->can('manage assignments')) {
            abort(403);
        }

        if ($item->assigned_to !== auth()->id()) {
            return response()->json(['message' => 'No tienes permiso para modificar este item'], 403);
        }

        if ($item->status !== 'approved') {
            return response()->json(['message' => 'El item debe estar aprobado para ser entregado'], 422);
        }

        $item->update([
            'status' => 'fulfilled',
            'fulfilled_at' => now()
        ]);

        // Activity log
        activity()
            ->performedOn($item->socialCase)
            ->causedBy(auth()->user())
            ->withProperties(['item_id' => $item->id, 'item_name' => $item->itemable->name])
            ->log("Item '{$item->itemable->name}' entregado/cumplido");

        // Verificar si todos items están cerrados
        $this->checkAndUpdateCaseStatus($item->socialCase);

        return back()->with('success', 'Item marcado como entregado');
    }

    /**
     * Aprobar caso completo
     */
    public function approveCase(SocialCase $case)
    {
        if (!auth()->user()->can('manage assignments')) {
            abort(403);
        }

        if ($case->assigned_to !== auth()->id()) {
            return response()->json(['message' => 'No tienes permiso para modificar este caso'], 403);
        }

        $case->update(['status' => 'approved']);
        $case->items()->update(['status' => 'approved']);

        // Activity log
        activity()
            ->performedOn($case)
            ->causedBy(auth()->user())
            ->log("Caso {$case->case_number} aprobado completamente");

        return back()->with('success', 'Caso aprobado exitosamente');
    }

    /**
     * Rechazar caso completo
     */
    public function rejectCase(Request $request, SocialCase $case)
    {
        if (!auth()->user()->can('manage assignments')) {
            abort(403);
        }

        if ($case->assigned_to !== auth()->id()) {
            return response()->json(['message' => 'No tienes permiso para modificar este caso'], 403);
        }

        $request->validate([
            'reason' => 'required|string|min:10|max:500'
        ]);

        $case->update([
            'status' => 'rejected',
            'rejection_reason' => $request->reason
        ]);

        // Activity log
        activity()
            ->performedOn($case)
            ->causedBy(auth()->user())
            ->withProperties(['reason' => $request->reason])
            ->log("Caso {$case->case_number} rechazado: {$request->reason}");

        return back()->with('success', 'Caso rechazado exitosamente');
    }

    /**
     * Lógica inteligente para cerrar caso automáticamente
     */
    private function checkAndUpdateCaseStatus(SocialCase $case)
    {
        $items = $case->items;
        $totalItems = $items->count();
        
        if ($totalItems === 0) {
            return;
        }

        $approvedItems = $items->where('status', 'approved')->count();
        $rejectedItems = $items->where('status', 'rejected')->count();
        $fulfilledItems = $items->where('status', 'fulfilled')->count();
        $closedItems = $approvedItems + $rejectedItems + $fulfilledItems;
        
        // Si todos los items están cerrados (aprobados/rechazados/entregados)
        if ($closedItems === $totalItems) {
            $case->update(['status' => 'closed']);
            
            activity()
                ->performedOn($case)
                ->causedBy(auth()->user())
                ->log("Caso cerrado automáticamente (todos los items procesados)");
        }
        // Si mayoría aprobada (más del 50%), marcar caso como aprobado
        elseif ($approvedItems / $totalItems > 0.5 && $case->status !== 'approved') {
            $case->update(['status' => 'approved']);
            
            activity()
                ->performedOn($case)
                ->causedBy(auth()->user())
                ->withProperties(['approved_items' => $approvedItems, 'total_items' => $totalItems])
                ->log("Caso aprobado automáticamente (mayoría de items aprobados: {$approvedItems}/{$totalItems})");
        }
    }

    /**
     * Calcular tasa de aprobación
     */
    private function calculateApprovalRate($userId)
    {
        $totalItems = CaseItem::where('assigned_to', $userId)->count();
        if ($totalItems === 0) {
            return 0;
        }

        $approvedItems = CaseItem::where('assigned_to', $userId)->where('status', 'approved')->count();
        return round(($approvedItems / $totalItems) * 100, 1);
    }
}

