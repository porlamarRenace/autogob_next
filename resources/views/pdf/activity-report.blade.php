<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $is_manager ? 'Reporte de Actividad' : 'Cierre de Caja' }}</title>
    <style>
        @page { margin: 0cm; }
        body {
            font-family: 'DejaVu Sans', sans-serif;
            font-size: 9pt;
            color: #1e293b;
            background-color: #ffffff;
            margin-top: 3.5cm;
            margin-left: 1.5cm;
            margin-right: 1.5cm;
            margin-bottom: 2cm;
            line-height: 1.4;
        }

        header {
            position: fixed;
            top: 0cm;
            left: 0cm;
            right: 0cm;
            height: 2.8cm;
            background-color: #1e3a8a;
            color: white;
            padding: 0 1.5cm;
            display: table;
            width: 100%;
        }
        .header-left {
            display: table-cell;
            vertical-align: middle;
            width: 70%;
        }
        .header-right {
            display: table-cell;
            vertical-align: middle;
            text-align: right;
            font-size: 8pt;
            color: #dbeafe;
        }
        h1 {
            font-size: 16pt;
            text-transform: uppercase;
            font-weight: bold;
            letter-spacing: 0.5px;
            margin: 0;
            padding: 0;
        }
        .subtitle {
            font-size: 10pt;
            margin-top: 5px;
            opacity: 0.9;
        }

        footer {
            position: fixed; 
            bottom: 0px; 
            left: 0cm; 
            right: 0cm;
            height: 1.2cm;
            background-color: #f1f5f9;
            border-top: 1px solid #e2e8f0;
            line-height: 1.2cm;
            text-align: center;
            font-size: 8pt;
            color: #64748b;
        }

        .section-header {
            color: #1e3a8a;
            font-size: 11pt;
            font-weight: bold;
            border-bottom: 2px solid #cbd5e1;
            padding-bottom: 5px;
            margin-top: 25px;
            margin-bottom: 10px;
            text-transform: uppercase;
        }

        .info-panel {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 12px;
            margin-bottom: 20px;
            font-size: 9pt;
        }
        .info-row { margin-bottom: 4px; }
        .info-label { font-weight: bold; color: #475569; width: 140px; display: inline-block; }

        .stats-grid {
            display: table;
            width: 100%;
            border-spacing: 10px 0;
            margin-bottom: 25px;
        }
        .stat-box {
            display: table-cell;
            vertical-align: middle;
            width: 33%;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 12px;
            border-left: 4px solid #3b82f6;
        }
        .stat-value {
            font-size: 16pt;
            font-weight: bold;
            color: #1e3a8a;
            display: block;
        }
        .stat-title {
            font-size: 8pt;
            color: #64748b;
            text-transform: uppercase;
            margin-top: 4px;
            display: block;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 8pt;
        }
        th {
            background-color: #e2e8f0;
            color: #334155;
            font-weight: bold;
            padding: 8px;
            text-align: left;
            text-transform: uppercase;
            border-bottom: 2px solid #94a3b8;
        }
        td {
            padding: 7px 8px;
            border-bottom: 1px solid #f1f5f9;
            vertical-align: top;
            color: #334155;
        }
        tr:nth-child(even) { background-color: #f8fafc; }

        .badge {
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 7pt;
            font-weight: bold;
            text-transform: uppercase;
        }
        .bg-pending { background: #fef9c3; color: #854d0e; }
        .bg-approved { background: #dcfce7; color: #166534; }
        .bg-rejected { background: #fee2e2; color: #991b1b; }
        .bg-closed { background: #f1f5f9; color: #475569; }
    </style>
</head>
<body>
    <header>
        <div class="header-left">
            <h1>{{ $is_manager ? 'Reporte de Actividad Gerencial' : 'Reporte de Cierre Operativo' }}</h1>
            <div class="subtitle">{{ $is_manager ? 'Auditoría General de Casos' : 'Mis Casos Gestionados' }}</div>
        </div>
        <div class="header-right">
            <div>Generado: {{ now()->format('d/m/Y H:i') }}</div>
            <div>Usuario: {{ $user->name }}</div>
        </div>
    </header>

    <footer>
        Sistema de Gestión de Ayudas Sociales — Reporte Oficial
    </footer>

    <div class="info-panel">
        <div class="info-row">
            <span class="info-label">Rango de Fechas:</span>
            {{ \Carbon\Carbon::parse($period['start'])->format('d/m/Y') }} — {{ \Carbon\Carbon::parse($period['end'])->format('d/m/Y') }}
        </div>
        <div class="info-row">
            <span class="info-label">Total Casos:</span>
            {{ $stats['total'] }} registrados en el período
        </div>
    </div>

    <!-- Stats -->
    <div class="stats-grid">
        <div class="stat-box">
            <span class="stat-value">{{ $stats['total'] }}</span>
            <span class="stat-title">Total Casos</span>
        </div>
        
        @php
            $approved = $stats['by_status']->where('status', 'approved')->first();
            $approvedCount = $approved ? $approved->total : 0;
            
            $cat = $stats['by_category']->sortByDesc('total')->first();
            $topCat = $cat ? $cat->name : 'N/A';
            $topCatCount = $cat ? $cat->total : 0;
        @endphp

        <div class="stat-box" style="border-left-color: #10b981;">
            <span class="stat-value">{{ $approvedCount }}</span>
            <span class="stat-title">Aprobados</span>
        </div>
        <div class="stat-box" style="border-left-color: #8b5cf6;">
            <span class="stat-value">{{ $topCatCount }}</span>
            <span class="stat-title">Top: {{ \Illuminate\Support\Str::limit($topCat, 15) }}</span>
        </div>
    </div>

    <!-- Tabla -->
    @if($cases->count() > 0)
        <div class="section-header">Listado de Casos</div>
        <table>
            <thead>
                <tr>
                    <th width="15%">Folio</th>
                    <th width="25%">Beneficiario</th>
                    <th width="25%">Categoría</th>
                    <th width="15%">Estado</th>
                    <th width="20%">Fecha</th>
                </tr>
            </thead>
            <tbody>
                @foreach($cases as $case)
                <tr>
                    <td><strong>{{ $case->case_number }}</strong></td>
                    <td>{{ $case->beneficiary->first_name ?? '' }} {{ $case->beneficiary->last_name ?? '' }}</td>
                    <td>{{ $case->category->name ?? 'Sin categoría' }}</td>
                    <td>
                        <span class="badge bg-{{ $case->status }}">
                            {{ strtoupper(str_replace('_', ' ', $case->status)) }}
                        </span>
                    </td>
                    <td>{{ \Carbon\Carbon::parse($case->created_at)->format('d/m/Y H:i') }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>
    @else
        <div style="text-align: center; padding: 40px; color: #94a3b8; font-style: italic;">
            No hay casos registrados en este período.
        </div>
    @endif

</body>
</html>
