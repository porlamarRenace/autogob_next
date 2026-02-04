<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $is_manager ? 'Reporte de Actividad' : 'Cierre de Caja' }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'DejaVu Sans', sans-serif;
            font-size: 10pt;
            color: #333;
            line-height: 1.4;
        }
        .header {
            text-align: center;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #2563eb;
        }
        .header h1 {
            color: #1e40af;
            font-size: 20pt;
            margin-bottom: 5px;
        }
        .header .subtitle {
            color: #64748b;
            font-size: 11pt;
        }
        .user-box {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            padding: 10px;
            margin: 15px 0;
            border-radius: 4px;
        }
        .period-box {
            background: #eff6ff;
            border: 1px solid #bfdbfe;
            padding: 10px;
            margin: 15px 0;
            border-radius: 4px;
        }
        .period-box strong {
            color: #1e40af;
        }
        .stats-grid {
            display: table;
            width: 100%;
            margin: 20px 0;
            border-collapse: collapse;
        }
        .stat-row {
            display: table-row;
        }
        .stat-card {
            display: table-cell;
            width: 25%;
            padding: 12px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            text-align: center;
        }
        .stat-label {
            color: #64748b;
            font-size: 9pt;
            margin-bottom: 5px;
        }
        .stat-value {
            font-size: 18pt;
            font-weight: bold;
        }
        .stat-value.total {
            color: #2563eb;
        }
        .stat-value.approved {
            color: #16a34a;
        }
        .stat-value.in-progress {
            color: #ca8a04;
        }
        .stat-value.rejected {
            color: #dc2626;
        }
        .section-title {
            background: #1e40af;
            color: white;
            padding: 8px 10px;
            margin-top: 20px;
            margin-bottom: 10px;
            font-weight: bold;
            font-size: 11pt;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }
        th {
            background: #1e40af;
            color: white;
            padding: 8px;
            text-align: left;
            font-size: 9pt;
        }
        td {
            padding: 6px 8px;
            border-bottom: 1px solid #e2e8f0;
            font-size: 9pt;
        }
        tr:nth-child(even) {
            background: #f8fafc;
        }
        .badge {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 8pt;
            font-weight: bold;
            color: white;
        }
        .badge-open { background: #3b82f6; }
        .badge-pending { background: #eab308; }
        .badge-in_progress { background: #eab308; }
        .badge-approved { background: #22c55e; }
        .badge-rejected { background: #ef4444; }
        .badge-fulfilled { background: #a855f7; }
        .badge-closed { background: #6b7280; }
        .category-item {
            margin-bottom: 10px;
        }
        .category-bar {
            background: #e2e8f0;
            height: 20px;
            border-radius: 3px;
            overflow: hidden;
            margin-top: 3px;
        }
        .category-fill {
            background: #3b82f6;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: flex-end;
            padding-right: 5px;
            color: white;
            font-size: 8pt;
            font-weight: bold;
        }
        .signature-box {
            margin-top: 40px;
            padding: 20px;
            border: 1px dashed #94a3b8;
        }
        .signature-line {
            border-top: 1px solid #333;
            margin-top: 60px;
            padding-top: 5px;
            text-align: center;
        }
        .footer {
            margin-top: 20px;
            padding-top: 10px;
            border-top: 1px solid #e2e8f0;
            text-align: center;
            color: #64748b;
            font-size: 9pt;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>{{ $is_manager ? 'REPORTE DE ACTIVIDAD' : 'CIERRE DE CAJA' }}</h1>
        <p class="subtitle">{{ $is_manager ? 'Estadísticas Generales del Sistema' : 'Resumen de Actividad Personal' }}</p>
    </div>

    @if(!$is_manager)
        <div class="user-box">
            <strong>Operador:</strong> {{ $user->name }}<br>
            <strong>Email:</strong> {{ $user->email }}
        </div>
    @endif

    <div class="period-box">
        <strong>Período del Reporte:</strong> 
        {{ \Carbon\Carbon::parse($period['start'])->format('d/m/Y') }} - 
        {{ \Carbon\Carbon::parse($period['end'])->format('d/m/Y') }}
    </div>

    <div class="stats-grid">
        <div class="stat-row">
            <div class="stat-card">
                <div class="stat-label">Total de Casos</div>
                <div class="stat-value total">{{ $stats['total'] }}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Aprobados</div>
                <div class="stat-value approved">{{ $stats['by_status']->where('status', 'approved')->first()->total ?? 0 }}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">En Revisión</div>
                <div class="stat-value in-progress">{{ $stats['by_status']->where('status', 'in_progress')->first()->total ?? 0 }}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Rechazados</div>
                <div class="stat-value rejected">{{ $stats['by_status']->where('status', 'rejected')->first()->total ?? 0 }}</div>
            </div>
        </div>
    </div>

    <div class="section-title">DESGLOSE POR CATEGORÍA</div>
    
    @if($stats['by_category']->count() === 0)
        <p style="text-align: center; padding: 20px; color: #64748b;">No hay datos para mostrar</p>
    @else
        @foreach($stats['by_category'] as $category)
            <div class="category-item">
                <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
                    <span style="font-weight: bold;">{{ $category->name }}</span>
                    <span style="color: #64748b;">{{ $category->total }} casos ({{ round(($category->total / $stats['total']) * 100, 1) }}%)</span>
                </div>
                <div class="category-bar">
                    <div class="category-fill" style="width: {{ ($category->total / $stats['total']) * 100 }}%;">
                        &nbsp;
                    </div>
                </div>
            </div>
        @endforeach
    @endif

    <div class="section-title">LISTADO DE CASOS ({{ $cases->count() }})</div>

    @if($cases->count() === 0)
        <p style="text-align: center; padding: 30px; color: #64748b;">
            No se crearon casos en este período
        </p>
    @else
        <table>
            <thead>
                <tr>
                    <th style="width: 20%;">Caso</th>
                    <th style="width: 30%;">Beneficiario</th>
                    <th style="width: 25%;">Categoría</th>
                    <th style="width: 15%;">Fecha</th>
                    <th style="width: 10%;">Estado</th>
                </tr>
            </thead>
            <tbody>
                @foreach($cases as $case)
                    <tr>
                        <td><strong>{{ $case->case_number }}</strong></td>
                        <td>{{ $case->beneficiary->first_name ?? '' }} {{ $case->beneficiary->last_name ?? '' }}</td>
                        <td>{{ $case->category->name ?? '' }}</td>
                        <td>{{ \Carbon\Carbon::parse($case->created_at)->format('d/m/Y') }}</td>
                        <td>
                            @php
                                $statusClass = 'badge-' . str_replace(' ', '_', $case->status);
                                $statusLabels = [
                                    'open' => 'Abierto',
                                    'pending' => 'En proceso',
                                    'in_progress' => 'En Revisión',
                                    'approved' => 'Aprobado',
                                    'rejected' => 'Rechazado',
                                    'fulfilled' => 'Entregado',
                                    'closed' => 'Cerrado'
                                ];
                            @endphp
                            <span class="badge {{ $statusClass }}">
                                {{ $statusLabels[$case->status] ?? $case->status }}
                            </span>
                        </td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    @endif

    @if(!$is_manager)
        <div class="signature-box">
            <p style="margin-bottom: 10px;"><strong>Observaciones:</strong></p>
            <p style="color: #64748b; font-size: 9pt; margin-bottom: 20px;">
                _______________________________________________________________________________
            </p>
            <p style="color: #64748b; font-size: 9pt;">
                _______________________________________________________________________________
            </p>

            <div class="signature-line">
                Firma del Operador
            </div>
        </div>
    @endif

    <div class="footer">
        <p>Documento generado el {{ now()->format('d/m/Y H:i:s') }}</p>
        <p>Sistema de Gestión de Ayudas Sociales</p>
    </div>
</body>
</html>
