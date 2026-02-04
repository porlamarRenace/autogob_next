<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reporte de Stock</title>
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
        .stat-card {
            display: table-cell;
            width: 50%;
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
            color: #1e40af;
            font-size: 20pt;
            font-weight: bold;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        th {
            background: #1e40af;
            color: white;
            padding: 10px;
            text-align: left;
            font-size: 10pt;
        }
        th.text-right {
            text-align: right;
        }
        td {
            padding: 8px 10px;
            border-bottom: 1px solid #e2e8f0;
        }
        td.text-right {
            text-align: right;
        }
        tr:nth-child(even) {
            background: #f8fafc;
        }
        .footer {
            margin-top: 30px;
            padding-top: 10px;
            border-top: 1px solid #e2e8f0;
            text-align: center;
            color: #64748b;
            font-size: 9pt;
        }
        .badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 3px;
            font-size: 8pt;
            font-weight: bold;
        }
        .badge-supply {
            background: #dbeafe;
            color: #1e40af;
        }
        .badge-service {
            background: #f3e8ff;
            color: #7c3aed;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>REPORTE DE STOCK</h1>
        <p class="subtitle">Items Entregados por Período</p>
    </div>

    <div class="period-box">
        <strong>Período del Reporte:</strong> 
        {{ \Carbon\Carbon::parse($period['start'])->format('d/m/Y') }} - 
        {{ \Carbon\Carbon::parse($period['end'])->format('d/m/Y') }}
    </div>

    <div class="stats-grid">
        <div class="stat-card">
            <div class="stat-label">Total de Items Entregados</div>
            <div class="stat-value">{{ $items->sum('total_delivered') }}</div>
        </div>
        <div class="stat-card">
            <div class="stat-label">Tipos de Items Diferentes</div>
            <div class="stat-value">{{ $items->count() }}</div>
        </div>
    </div>

    @if($items->count() === 0)
        <p style="text-align: center; padding: 40px; color: #64748b;">
            No se encontraron items entregados en este período
        </p>
    @else
        <table>
            <thead>
                <tr>
                    <th style="width: 10%;">#</th>
                    <th style="width: 45%;">Item</th>
                    <th style="width: 20%;">Tipo</th>
                    <th style="width: 25%;" class="text-right">Cantidad Entregada</th>
                </tr>
            </thead>
            <tbody>
                @foreach($items as $index => $item)
                    <tr>
                        <td>{{ $index + 1 }}</td>
                        <td><strong>{{ $item->itemable->name ?? 'N/A' }}</strong></td>
                        <td>
                            @if(str_contains($item->itemable_type, 'Supply'))
                                <span class="badge badge-supply">INSUMO</span>
                            @else
                                <span class="badge badge-service">SERVICIO</span>
                            @endif
                        </td>
                        <td class="text-right">
                            <strong style="color: #1e40af; font-size: 12pt;">{{ number_format($item->total_delivered, 0) }}</strong>
                        </td>
                    </tr>
                @endforeach
            </tbody>
        </table>

        <div style="margin-top: 20px; padding: 15px; background: #f0f9ff; border-left: 4px solid #3b82f6;">
            <strong>Total General:</strong> 
            <span style="color: #1e40af; font-size: 14pt; font-weight: bold;">
                {{ number_format($items->sum('total_delivered'), 0) }} unidades entregadas
            </span>
        </div>
    @endif

    <div class="footer">
        <p>Documento generado el {{ now()->format('d/m/Y H:i:s') }}</p>
        <p>Sistema de Gestión de Ayudas Sociales</p>
    </div>
</body>
</html>
