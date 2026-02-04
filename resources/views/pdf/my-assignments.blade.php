<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mis Asignaciones - {{ $user->name }}</title>
    <style>
        @page {
            margin: 0cm 0cm;
        }
        body {
            font-family: 'DejaVu Sans', sans-serif;
            font-size: 10pt;
            color: #1e293b;
            background-color: #ffffff;
            margin-top: 3cm;
            margin-left: 2cm;
            margin-right: 2cm;
            margin-bottom: 2cm;
            line-height: 1.5;
        }
        
        /** Header con estilo **/
        header {
            position: fixed;
            top: 0cm;
            left: 0cm;
            right: 0cm;
            height: 3cm;
            background-color: #1e3a8a; /* Azul corporativo */
            color: white;
            padding: 0 2cm;
            display: table;
            width: 100%;
        }
        .header-content {
            display: table-cell;
            vertical-align: middle;
            width: 60%;
        }
        .header-meta {
            display: table-cell;
            vertical-align: middle;
            text-align: right;
            font-size: 9pt;
            color: #bfdbfe;
        }
        h1 {
            font-size: 18pt;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin: 0;
            font-weight: 700;
        }
        .subtitle {
            font-size: 10pt;
            margin-top: 5px;
            opacity: 0.9;
        }

        /** Footer **/
        footer {
            position: fixed; 
            bottom: 0cm; 
            left: 0cm; 
            right: 0cm;
            height: 1.5cm;
            background-color: #f8fafc;
            border-top: 1px solid #e2e8f0;
            line-height: 1.5cm;
            font-size: 8pt;
            color: #64748b;
            text-align: center;
        }

        /** Secciones **/
        .section-title {
            color: #1e3a8a;
            font-size: 12pt;
            font-weight: bold;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 5px;
            margin-top: 30px;
            margin-bottom: 15px;
            text-transform: uppercase;
        }

        /** Stats Cards **/
        .stats-container {
            width: 100%;
            margin-bottom: 30px;
        }
        .stats-row {
            display: table;
            width: 100%;
            border-spacing: 10px 0; /* Espacio entre columnas */
        }
        .stat-card {
            display: table-cell;
            width: 25%;
            background-color: #f1f5f9;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #3b82f6;
            vertical-align: middle;
        }
        .stat-number {
            font-size: 20pt;
            font-weight: bold;
            color: #0f172a;
            display: block;
        }
        .stat-label {
            font-size: 8pt;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-top: 5px;
            display: block;
        }

        /** Info Box **/
        .info-box {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 15px;
            margin-bottom: 20px;
            font-size: 9pt;
        }
        .info-row {
            margin-bottom: 5px;
        }
        .label {
            font-weight: bold;
            color: #475569;
            width: 120px;
            display: inline-block;
        }

        /** Tablas **/
        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 9pt;
        }
        th {
            background-color: #f1f5f9;
            color: #334155;
            font-weight: bold;
            text-transform: uppercase;
            font-size: 8pt;
            padding: 10px 8px;
            border-bottom: 2px solid #cbd5e1;
            text-align: left;
        }
        td {
            padding: 10px 8px;
            border-bottom: 1px solid #e2e8f0;
            color: #334155;
            vertical-align: top;
        }
        tr:nth-child(even) {
            background-color: #f8fafc;
        }
        
        /** Badges **/
        .badge {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 7pt;
            font-weight: bold;
            text-transform: uppercase;
            display: inline-block;
        }
        .bg-pending { background: #fef9c3; color: #854d0e; }
        .bg-approved { background: #dcfce7; color: #166534; }
        .bg-rejected { background: #fee2e2; color: #991b1b; }
        .bg-closed { background: #f1f5f9; color: #475569; }
        .bg-fulfilled { background: #f3e8ff; color: #6b21a8; }
        .bg-open { background: #dbeafe; color: #1e40af; }
        .bg-in_progress { background: #fff7ed; color: #9a3412; }

    </style>
</head>
<body>
    <header>
        <div class="header-content">
            <h1>Mis Asignaciones</h1>
            <div class="subtitle">Reporte de Gestión Individual</div>
        </div>
        <div class="header-meta">
            <div>Fecha: {{ now()->format('d/m/Y') }}</div>
            <div>Usuario: {{ $user->name }}</div>
        </div>
    </header>

    <footer>
        Sistema de Gestión de Ayudas Sociales - Documento Confidencial - Página <span class="pagenum"></span>
    </footer>

    <!-- Resumen de Filtros -->
    <div class="info-box">
        <div class="info-row">
            <span class="label">Período:</span>
            {{ \Carbon\Carbon::parse($period['start'])->format('d/m/Y') }} — {{ \Carbon\Carbon::parse($period['end'])->format('d/m/Y') }}
        </div>
        @if($filters['status'])
        <div class="info-row">
            <span class="label">Filtro Estado:</span>
            {{ ucfirst($filters['status']) }}
        </div>
        @endif
        <div class="info-row">
            <span class="label">Email:</span>
            {{ $user->email }}
        </div>
    </div>

    <!-- Estadísticas -->
    <div class="stats-container">
        <div class="stats-row">
            <div class="stat-card">
                <span class="stat-number">{{ $stats['total_cases'] }}</span>
                <span class="stat-label">Casos Asignados</span>
            </div>
            <div class="stat-card" style="border-left-color: #8b5cf6;">
                <span class="stat-number">{{ $stats['total_items'] }}</span>
                <span class="stat-label">Items Individuales</span>
            </div>
            <div class="stat-card" style="border-left-color: #f59e0b;">
                <span class="stat-number">{{ $stats['pending_cases'] + $stats['pending_items'] }}</span>
                <span class="stat-label">Pendientes Totales</span>
            </div>
            <div class="stat-card" style="border-left-color: #10b981;">
                <span class="stat-number">{{ $stats['approved_rate'] }}%</span>
                <span class="stat-label">Tasa Aprobación</span>
            </div>
        </div>
    </div>

    <!-- Casos Completos -->
    @if($assignedCases->count() > 0)
        <div class="section-title">Casos Completos Asignados ({{ $assignedCases->count() }})</div>
        <table>
            <thead>
                <tr>
                    <th width="15%">Folio</th>
                    <th width="25%">Beneficiario</th>
                    <th width="25%">Categoría</th>
                    <th width="10%">Items</th>
                    <th width="15%">Fecha</th>
                    <th width="10%">Estado</th>
                </tr>
            </thead>
            <tbody>
                @foreach($assignedCases as $case)
                <tr>
                    <td><strong>{{ $case->case_number }}</strong></td>
                    <td>{{ $case->beneficiary->first_name }} {{ $case->beneficiary->last_name }}</td>
                    <td>{{ $case->category->name }}</td>
                    <td style="text-align: center;">{{ $case->items->count() }}</td>
                    <td>{{ \Carbon\Carbon::parse($case->created_at)->format('d/m/Y') }}</td>
                    <td>
                        <span class="badge bg-{{ $case->status }}">
                            {{ strtoupper(str_replace('_', ' ', $case->status)) }}
                        </span>
                    </td>
                </tr>
                @endforeach
            </tbody>
        </table>
    @endif

    <!-- Items Individuales -->
    @if($assignedItems->count() > 0)
        <div class="section-title">Items Asignados ({{ $assignedItems->count() }})</div>
        <table>
            <thead>
                <tr>
                    <th width="15%">Caso Maestro</th>
                    <th width="30%">Descripción del Item</th>
                    <th width="10%">Cant.</th>
                    <th width="15%">Fecha</th>
                    <th width="15%">Estado</th>
                    <th width="15%">Notas</th>
                </tr>
            </thead>
            <tbody>
                @foreach($assignedItems as $item)
                <tr>
                    <td>{{ $item->socialCase->case_number ?? 'N/A' }}</td>
                    <td>
                        <strong>{{ $item->itemable->name ?? 'N/A' }}</strong>
                        <div style="font-size: 7pt; color: #64748b; margin-top: 2px;">
                            {{ $item->socialCase->beneficiary->first_name ?? '' }} {{ $item->socialCase->beneficiary->last_name ?? '' }}
                        </div>
                    </td>
                    <td style="text-align: center;">{{ $item->quantity }}</td>
                    <td>{{ \Carbon\Carbon::parse($item->created_at)->format('d/m/Y') }}</td>
                    <td>
                        <span class="badge bg-{{ $item->status }}">
                            {{ strtoupper(str_replace('_', ' ', $item->status)) }}
                        </span>
                    </td>
                    <td style="font-size: 8pt; font-style: italic;">
                        {{ \Illuminate\Support\Str::limit($item->notes, 30) ?: '-' }}
                    </td>
                </tr>
                @endforeach
            </tbody>
        </table>
    @endif

    @if($assignedCases->count() === 0 && $assignedItems->count() === 0)
        <div style="text-align: center; margin-top: 50px; padding: 40px; background-color: #f8fafc; border-radius: 8px; border: 1px dashed #cbd5e1;">
            <p style="color: #64748b; font-size: 11pt;">No se encontraron asignaciones para los filtros seleccionados.</p>
        </div>
    @endif

</body>
</html>
