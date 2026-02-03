<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <title>Reporte de Ayudas Aprobadas</title>
    <style>
        body { font-family: sans-serif; font-size: 12px; color: #333; }
        .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #ddd; padding-bottom: 10px; }
        .header h1 { margin: 0; font-size: 18px; color: #2c3e50; }
        .header p { margin: 2px 0; font-size: 10px; color: #7f8c8d; }
        .footer { position: fixed; bottom: 0; left: 0; right: 0; text-align: center; font-size: 9px; color: #999; padding: 10px; border-top: 1px solid #eee; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
        th { background-color: #f3f4f6; font-weight: bold; color: #374151; }
        .total { margin-top: 10px; text-align: right; font-weight: bold; }
    </style>
</head>
<body>
    <div class="header">
        <img src="{{ public_path('logo.png') }}" alt="Logo" style="height: 60px; margin-bottom: 5px;">
        <h1>Sistema de Gestión de Ayudas Sociales</h1>
        <p>Alcaldía de Mariño - Estado Nueva Esparta</p>
        <h2 style="font-size: 14px; margin-top: 5px;">Reporte de Ayudas Aprobadas</h2>
        <p>Periodo: {{ $period['start'] }} al {{ $period['end'] }}</p>
    </div>

    <div class="footer">
        Reporte emitido por el Departamento de Desarrollo y Administración de Sistemas de la Alcaldía del Municipio Mariño - {{ date('Y') }}
    </div>

    <table>
        <thead>
            <tr>
                <th>Fecha</th>
                <th>Caso</th>
                <th>Beneficiario</th>
                <th>Ítem / Ayuda</th>
                <th>Cant.</th>
                <th>Estado</th>
            </tr>
        </thead>
        <tbody>
            @php $totalItems = 0; @endphp
            @forelse($items as $item)
                @php $totalItems += $item->approved_quantity ?? $item->quantity; @endphp
                <tr>
                    <td>{{ $item->created_at->format('d/m/Y') }}</td>
                    <td>{{ $item->socialCase->case_number }}</td>
                    <td>
                        {{ $item->socialCase->beneficiary ? $item->socialCase->beneficiary->first_name . ' ' . $item->socialCase->beneficiary->last_name : 'N/A' }}
                    </td>
                    <td>{{ $item->itemable ? $item->itemable->name : 'N/A' }}</td>
                    <td>{{ $item->approved_quantity ?? $item->quantity }}</td>
                    <td>
                        {{ $item->status === 'fulfilled' ? 'Entregado' : 'Aprobado' }}
                    </td>
                </tr>
            @empty
                <tr><td colspan="6" style="text-align:center">No se encontraron registros en este período.</td></tr>
            @endforelse
            
            @if(count($items) > 0)
                <tr class="total-row">
                    <td colspan="4" style="text-align:right">TOTAL AYUDAS:</td>
                    <td>{{ $totalItems }}</td>
                    <td></td>
                </tr>
            @endif
        </tbody>
    </table>
</body>
</html>
