<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reporte de Salida de Stock</title>
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
            background-color: #1e3a8a; /* Azul corporativo */
            color: white;
            padding: 0 1.5cm;
            display: table;
            width: 100%;
        }
        .header-content {
            display: table-cell;
            vertical-align: middle;
        }
        .header-title {
            font-size: 16pt;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin: 0;
        }
        .header-sub {
            font-size: 10pt;
            opacity: 0.9;
            margin-top: 4px;
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

        .period-card {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-left: 4px solid #3b82f6;
            padding: 15px;
            border-radius: 6px;
            margin-bottom: 25px;
            font-size: 10pt;
        }

        .stats-grid {
            display: table;
            width: 100%;
            border-spacing: 15px 0;
            margin-bottom: 30px;
        }
        .stat-box {
            display: table-cell;
            width: 50%;
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        .stat-val {
            font-size: 24pt;
            font-weight: bold;
            color: #1e3a8a;
            display: block;
            margin-bottom: 5px;
        }
        .stat-lbl {
            font-size: 9pt;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 9pt;
        }
        th {
            background-color: #f1f5f9;
            color: #1e3a8a;
            font-weight: bold;
            text-transform: uppercase;
            padding: 12px 10px;
            border-bottom: 2px solid #cbd5e1;
            text-align: left;
            font-size: 8pt;
        }
        td {
            padding: 10px;
            border-bottom: 1px solid #e2e8f0;
            color: #334155;
            vertical-align: middle;
        }
        tr:nth-child(even) { background-color: #f8fafc; }

        .total-row td {
            background-color: #eff6ff;
            font-weight: bold;
            color: #1e3a8a;
            border-top: 2px solid #bfdbfe;
        }

        .badge {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 7pt;
            font-weight: bold;
            text-transform: uppercase;
        }
        .badge-supply { background: #dbeafe; color: #1e40af; }
        .badge-service { background: #f3e8ff; color: #6b21a8; }
        
        .quantity-cell {
            font-family: monospace;
            font-size: 11pt;
            font-weight: bold;
            color: #0f172a;
        }
    </style>
</head>
<body>
    <header>
        <div class="header-content">
            <h1 class="header-title">Reporte de Stock y Entregas</h1>
            <div class="header-sub">Consolidado de Salidas de Almacén</div>
        </div>
        <div style="position: absolute; right: 1.5cm; top: 0.8cm; text-align: right; color: #dbeafe; font-size: 9pt;">
            Generado: {{ now()->format('d/m/Y H:i') }}
        </div>
    </header>

    <footer>
        Sistema de Gestión de Ayudas Sociales — Control de Inventario
    </footer>

    <!-- Información del Periodo -->
    <div class="period-card">
        <strong>PERÍODO ANALIZADO:</strong> &nbsp;
        {{ \Carbon\Carbon::parse($period['start'])->format('d/m/Y') }} 
        &nbsp; <span style="color: #cbd5e1;">|</span> &nbsp; 
        {{ \Carbon\Carbon::parse($period['end'])->format('d/m/Y') }}
    </div>

    <!-- Stats -->
    <div class="stats-grid">
        <div class="stat-box">
            <span class="stat-val">{{ number_format($items->sum('total_delivered'), 0) }}</span>
            <span class="stat-lbl">Unidades Totales Entregadas</span>
        </div>
        <div class="stat-box">
            <span class="stat-val">{{ $items->count() }}</span>
            <span class="stat-lbl">Variedad de Items (SKUs)</span>
        </div>
    </div>

    <!-- Tabla Detalle -->
    @if($items->count() > 0)
        <table>
            <thead>
                <tr>
                    <th width="10%" style="text-align: center;">#</th>
                    <th width="45%">Descripción del Item</th>
                    <th width="20%">Clasificación</th>
                    <th width="25%" style="text-align: right;">Cantidad Saliente</th>
                </tr>
            </thead>
            <tbody>
                @foreach($items as $index => $item)
                <tr>
                    <td style="text-align: center; color: #94a3b8;">{{ $index + 1 }}</td>
                    <td>
                        <strong style="font-size: 10pt;">{{ $item->itemable->name ?? 'Item Eliminado' }}</strong>
                        @if(isset($item->itemable->code))
                        <div style="font-size: 8pt; color: #64748b;">Code: {{ $item->itemable->code }}</div>
                        @endif
                    </td>
                    <td>
                        @if(str_contains($item->itemable_type, 'Supply'))
                            <span class="badge badge-supply">Insumo Físico</span>
                        @else
                            <span class="badge badge-service">Servicio Médico</span>
                        @endif
                    </td>
                    <td style="text-align: right;">
                        <span class="quantity-cell">{{ number_format($item->total_delivered, 0) }}</span>
                    </td>
                </tr>
                @endforeach
                
                <!-- Totales al final de la tabla -->
                <tr class="total-row">
                    <td colspan="3" style="text-align: right;">TOTAL GENERAL DEL PERÍODO:</td>
                    <td style="text-align: right;">{{ number_format($items->sum('total_delivered'), 0) }}</td>
                </tr>
            </tbody>
        </table>
    @else
        <div style="text-align: center; padding: 50px; background: #f8fafc; border: 2px dashed #e2e8f0; border-radius: 8px;">
            <div style="font-size: 12pt; color: #64748b; font-weight: bold;">Sin Movimientos</div>
            <p style="color: #94a3b8;">No se registraron entregas de items en el rango de fechas seleccionado.</p>
        </div>
    @endif

</body>
</html>
