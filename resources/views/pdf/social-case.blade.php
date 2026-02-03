<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <title>Caso Social #{{ $case->case_number }}</title>
    <style>
        body { font-family: sans-serif; font-size: 12px; color: #333; }
        .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #ddd; padding-bottom: 10px; }
        .header h1 { margin: 0; font-size: 18px; color: #2c3e50; }
        .header p { margin: 2px 0; font-size: 10px; color: #7f8c8d; }
        .footer { position: fixed; bottom: 0; left: 0; right: 0; text-align: center; font-size: 9px; color: #999; padding: 10px; border-top: 1px solid #eee; }
        .section { margin-bottom: 20px; }
        .section-title { background-color: #f0f2f5; padding: 5px; font-weight: bold; margin-top: 15px; margin-bottom: 10px; border-left: 4px solid #3b82f6; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
        th, td { padding: 6px; text-align: left; border-bottom: 1px solid #eee; }
        th { background-color: #f9fafb; color: #555; }
        .label { font-weight: bold; color: #555; display: block; font-size: 10px; }
        .highlight { color: #2563eb; font-weight: bold; }
        .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 10px; color: white; background-color: #6b7280; }
        .badge-approved { background-color: #10b981; }
        .badge-rejected { background-color: #ef4444; }
        .badge-pending { background-color: #f59e0b; }
        /* Original styles not overwritten by new ones */
        .bg-blue { background-color: #2563eb; }
        .bg-green { background-color: #10b981; }
        .bg-red { background-color: #ef4444; }
        .bg-gray { background-color: #6b7280; }
        .info-grid { display: table; width: 100%; margin-bottom: 10px; }
        .info-row { display: table-row; }
        .info-cell { display: table-cell; width: 50%; padding: 4px; vertical-align: top; }
    </style>
</head>
<body>
    <div class="header">
        <img src="{{ public_path('logo.png') }}" alt="Logo" style="height: 60px; margin-bottom: 5px;">
        <h1>Sistema de Gestión de Ayudas Sociales</h1>
        <p>Alcaldía de Mariño - Estado Nueva Esparta</p>
    </div>

    <div class="footer">
        Reporte emitido por el Departamento de Desarrollo y Administración de Sistemas de la Alcaldía del Municipio Mariño - {{ date('Y') }}
    </div>

    <div style="float: right; text-align: right;">
        <span style="font-size: 14px; font-weight: bold; color: #555;">FOLIO: {{ $case->case_number }}</span><br>
        <span style="font-size: 10px;">Fecha: {{ $case->created_at->format('d/m/Y h:i A') }}</span>
    </div>

    <div style="clear: both;"></div>

    <div class="section">
        <div class="section-title">DETALLES DEL CASO</div>
        <div class="info-grid">
            <div class="info-row">
                <div class="info-cell">
                    <span class="label">ESTADO ACTUAL</span>
                    @php
                        $statusColors = [
                            'open' => 'bg-blue', 'in_review' => 'bg-gray', 'approved' => 'bg-green',
                            'rejected' => 'bg-red', 'closed' => 'bg-gray'
                        ];
                        $statusLabels = [
                            'open' => 'ABIERTO', 'in_review' => 'EN REVISIÓN', 'approved' => 'APROBADO',
                            'rejected' => 'RECHAZADO', 'closed' => 'CERRADO'
                        ];
                    @endphp
                    <span class="badge {{ $statusColors[$case->status] ?? 'bg-gray' }}">
                        {{ $statusLabels[$case->status] ?? strtoupper($case->status) }}
                    </span>
                </div>
                <div class="info-cell">
                    <span class="label">CREADO POR</span>
                    {{ $case->creator ? $case->creator->name : 'N/A' }}
                </div>
            </div>
            <div class="info-row">
                <div class="info-cell">
                    <span class="label">CATEGORÍA</span>
                    {{ $case->category ? $case->category->name : '-' }}
                    @if($case->subcategory) / {{ $case->subcategory->name }} @endif
                </div>
                <div class="info-cell">
                    <span class="label">DESCRIPCIÓN</span>
                    {{ $case->description }}
                </div>
            </div>
        </div>
    </div>

    <div class="section">
        <div class="section-title">BENEFICIARIO</div>
        @if($case->beneficiary)
            <div class="info-grid">
                <div class="info-row">
                    <div class="info-cell">
                        <span class="label">NOMBRE COMPLETO</span>
                        {{ $case->beneficiary->first_name }} {{ $case->beneficiary->last_name }}
                    </div>
                    <div class="info-cell">
                        <span class="label">IDENTIFICACIÓN</span>
                        {{ $case->beneficiary->nationality }}-{{ $case->beneficiary->identification_value }}
                    </div>
                </div>
                <div class="info-row">
                    <div class="info-cell">
                        <span class="label">TELÉFONO</span>
                        {{ $case->beneficiary->phone }}
                    </div>
                    <div class="info-cell">
                        <span class="label">DIRECCIÓN</span>
                        @if($case->beneficiary->street)
                            {{ $case->beneficiary->street->name }}, 
                            {{ $case->beneficiary->street->community->name ?? '' }}
                        @else
                            No registrada
                        @endif
                    </div>
                </div>
            </div>
        @else
            <p>No hay beneficiario asignado.</p>
        @endif
    </div>

    @if($case->applicant && $case->applicant_id !== $case->beneficiary_id)
    <div class="section">
        <div class="section-title">SOLICITANTE</div>
        <div class="info-grid">
            <div class="info-row">
                <div class="info-cell">
                    <span class="label">NOMBRE</span>
                    {{ $case->applicant->first_name }} {{ $case->applicant->last_name }}
                </div>
                <div class="info-cell">
                    <span class="label">IDENTIFICACIÓN</span>
                    {{ $case->applicant->nationality }}-{{ $case->applicant->identification_value }}
                </div>
            </div>
        </div>
    </div>
    @endif

    <div class="section">
        <div class="section-title">ÍTEMS / AYUDAS SOLICITADAS</div>
        <table>
            <thead>
                <tr>
                    <th>Ítem</th>
                    <th>Cantidad</th>
                    <th>Estado</th>
                </tr>
            </thead>
            <tbody>
                @forelse($case->items as $item)
                    <tr>
                        <td>
                            {{ $item->itemable ? $item->itemable->name : 'N/A' }} <br>
                            <small style="color:#666">{{ $item->description }}</small>
                        </td>
                        <td>
                            {{ $item->quantity }} 
                            <small>{{ $item->itemable ? $item->itemable->unit : '' }}</small>
                            @if($item->approved_quantity && $item->approved_quantity != $item->quantity)
                                <br><small>Aprobadas: <strong>{{ $item->approved_quantity }}</strong></small>
                            @endif
                        </td>
                        <td>
                            @php
                                $itemStatusMap = [
                                    'approved' => 'Aprobado', 'fulfilled' => 'Entregado',
                                    'rejected' => 'Rechazado', 'open' => 'Pendiente'
                                ];
                            @endphp
                            {{ $itemStatusMap[$item->status] ?? ucfirst($item->status) }}
                            @if($item->fulfilled_at)
                                <br><small>Entregado: {{ $item->fulfilled_at->format('d/m/Y') }}</small>
                            @endif
                        </td>
                    </tr>
                @empty
                    <tr><td colspan="3" style="text-align:center">No hay ítems registrados</td></tr>
                @endforelse
            </tbody>
        </table>
    </div>

    <div style="margin-top: 50px; text-align: center; color: #888; font-size: 10px;">
        <p>Documento generado el {{ date('d/m/Y H:i') }} por {{ auth()->user()->name }}</p>
    </div>
</body>
</html>
