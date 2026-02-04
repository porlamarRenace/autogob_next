<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mis Asignaciones - {{ $user->name }}</title>
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
            color: #2563eb;
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
        <h1>MIS ASIGNACIONES</h1>
        <p class="subtitle">Reporte de Casos e Items Asignados</p>
    </div>

    <div class="user-box">
        <strong>Usuario:</strong> {{ $user->name }}<br>
        <strong>Email:</strong> {{ $user->email }}
    </div>

    <div class="period-box">
        <strong>Período del Reporte:</strong> 
        {{ \Carbon\Carbon::parse($period['start'])->format('d/m/Y') }} - 
        {{ \Carbon\Carbon::parse($period['end'])->format('d/m/Y') }}
        @if($filters['status'])
            <br><strong>Filtro de Status:</strong> {{ ucfirst($filters['status']) }}
        @endif
        @if($filters['type'])
            <br><strong>Tipo:</strong> {{ $filters['type'] === 'cases' ? 'Solo Casos' : 'Solo Items' }}
        @endif
    </div>

    <div class="stats-grid">
        <div class="stat-row">
            <div class="stat-card">
                <div class="stat-label">Casos Asignados</div>
                <div class="stat-value">{{ $stats['total_cases'] }}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Items Asignados</div>
                <div class="stat-value">{{ $stats['total_items'] }}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Casos Pendientes</div>
                <div class="stat-value">{{ $stats['pending_cases'] }}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Items Pendientes</div>
                <div class="stat-value">{{ $stats['pending_items'] }}</div>
            </div>
        </div>
    </div>

    @if($assignedCases->count() > 0)
        <div class="section-title">CASOS COMPLETOS ASIGNADOS ({{ $assignedCases->count() }})</div>
        <table>
            <thead>
                <tr>
                    <th style="width: 15%;">Caso</th>
                    <th style="width: 25%;">Beneficiario</th>
                    <th style="width: 25%;">Categoría</th>
                    <th style="width: 10%;">Items</th>
                    <th style="width: 15%;">Fecha</th>
                    <th style="width: 10%;">Estado</th>
                </tr>
            </thead>
            <tbody>
                @foreach($assignedCases as $case)
                    <tr>
                        <td><strong>{{ $case->case_number }}</strong></td>
                        <td>{{ $case->beneficiary->first_name ?? '' }} {{ $case->beneficiary->last_name ?? '' }}</td>
                        <td>{{ $case->category->name ?? '' }}</td>
                        <td>{{ $case->items->count() }}</td>
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

    @if($assignedItems->count() > 0)
        <div class="section-title">ITEMS INDIVIDUALES ASIGNADOS ({{ $assignedItems->count() }})</div>
        <table>
            <thead>
                <tr>
                    <th style="width: 15%;">Caso</th>
                    <th style="width: 30%;">Item</th>
                    <th style="width: 10%;">Cantidad</th>
                    <th style="width: 15%;">Fecha</th>
                    <th style="width: 15%;">Estado</th>
                    <th style="width: 15%;">Notas</th>
                </tr>
            </thead>
            <tbody>
                @foreach($assignedItems as $item)
                    <tr>
                        <td><strong>{{ $item->socialCase->case_number ?? 'N/A' }}</strong></td>
                        <td>{{ $item->itemable->name ?? 'N/A' }}</td>
                        <td>{{ $item->quantity }}</td>
                        <td>{{ \Carbon\Carbon::parse($item->created_at)->format('d/m/Y') }}</td>
                        <td>
                            @php
                                $statusClass = 'badge-' . str_replace(' ', '_', $item->status);
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
                                {{ $statusLabels[$item->status] ?? $item->status }}
                            </span>
                        </td>
                        <td>{{ $item->notes ?? '-' }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    @endif

    @if($assignedCases->count() === 0 && $assignedItems->count() === 0)
        <div class="section-title">SIN ASIGNACIONES</div>
        <p style="text-align: center; padding: 20px; color: #64748b;">
            No tienes casos ni items asignados en el período seleccionado.
        </p>
    @endif

    <div class="footer">
        <p>Documento generado el {{ now()->format('d/m/Y H:i:s') }}</p>
        <p>Sistema de Gestión de Ayudas Sociales - {{ $user->name }}</p>
    </div>
</body>
</html>
