<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Expediente: {{ $citizen->identification_value }}</title>
    <style>
        body { font-family: sans-serif; font-size: 12px; color: #333; }
        .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #ddd; padding-bottom: 10px; }
        .header h1 { margin: 0; font-size: 20px; color: #2c3e50; }
        .header p { margin: 2px 0; font-size: 10px; color: #7f8c8d; }
        .photo { width: 100px; height: 100px; border-radius: 5px; object-fit: cover; margin: 0 auto; display: block; border: 1px solid #ccc; margin-bottom: 10px; }
        .section-title { background-color: #f3f4f6; padding: 5px; font-weight: bold; border-left: 4px solid #3b82f6; margin-top: 20px; margin-bottom: 10px; }
        .grid { display: table; width: 100%; }
        .row { display: table-row; }
        .col { display: table-cell; padding: 4px; width: 50%; border-bottom: 1px solid #f0f0f0; }
        .label { font-weight: bold; color: #555; width: 120px; display: inline-block; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
        th { background-color: #f9fafb; font-size: 11px; }
    </style>
</head>
<body>
    <div class="header">
        <img src="{{ public_path('logo.png') }}" alt="Logo" style="height: 60px; margin-bottom: 5px;">
        @if($citizen->photo_url)
            <img src="{{ public_path($citizen->photo_url) }}" class="photo" alt="Foto">
        @endif
        <h2>EXPEDIENTE DEL CIUDADANO</h2>
        <h3 style="margin:0; color:#1d4ed8">{{ $citizen->first_name }} {{ $citizen->last_name }}</h3>
        <p>{{ $citizen->nationality }}-{{ $citizen->identification_value }}</p>
    </div>

    <div class="footer">
        Reporte emitido por el Departamento de Desarrollo y Administración de Sistemas de la Alcaldía del Municipio Mariño - {{ date('Y') }}
    </div>

    <div class="section-title">INFORMACIÓN PERSONAL</div>
    <div class="grid">
        <div class="row">
            <div class="col"><span class="label">Fecha Nacimiento:</span> {{ $citizen->birth_date ? $citizen->birth_date->format('d/m/Y') : 'N/A' }}</div>
            <div class="col"><span class="label">Edad:</span> {{ $citizen->age ? $citizen->age . ' años' : 'N/A' }}</div>
        </div>
        <div class="row">
            <div class="col"><span class="label">Género:</span> {{ $citizen->gender === 'M' ? 'Masculino' : 'Femenino' }}</div>
            <div class="col"><span class="label">Teléfono:</span> {{ $citizen->phone }}</div>
        </div>
        @if($citizen->street)
        <div class="row">
            <div class="col" style="width:100%"><span class="label">Dirección:</span> 
                {{ $citizen->street->name }}, {{ $citizen->street->community->name ?? '' }}, 
                {{ $citizen->street->community->municipality->name ?? '' }}
            </div>
        </div>
        @endif
    </div>

    @if($citizen->healthProfile)
    <div class="section-title">PERFIL DE SALUD</div>
    <div class="grid">
        <div class="row">
            <div class="col"><span class="label">Discapacidad:</span> {{ $citizen->healthProfile->has_disability ? 'SÍ - ' . $citizen->healthProfile->disability_type : 'NO' }}</div>
            <div class="col"><span class="label">Condición Crónica:</span> {{ $citizen->healthProfile->has_chronic_condition ? 'SÍ - ' . $citizen->healthProfile->chronic_condition_type : 'NO' }}</div>
        </div>
        <div class="row">
            <div class="col"><span class="label">Embarazo:</span> {{ $citizen->healthProfile->is_pregnant ? 'SÍ' : 'NO' }}</div>
            <div class="col"><span class="label">Medicamentos:</span> {{ $citizen->healthProfile->requires_medication ? 'SÍ' : 'NO' }}</div>
        </div>
    </div>
    @endif

    <div class="section-title">HISTORIAL DE AYUDAS RECIBIDAS</div>
    <table>
        <thead>
            <tr>
                <th>Caso</th>
                <th>Fecha</th>
                <th>Ayuda</th>
                <th>Estado</th>
            </tr>
        </thead>
        <tbody>
            @forelse($beneficiaryCases as $case)
                @foreach($case->items as $item)
                    <tr>
                        <td>{{ $case->case_number }}</td>
                        <td>{{ $case->created_at->format('d/m/Y') }}</td>
                        <td>
                            <strong>{{ $item->itemable ? $item->itemable->name : 'N/A' }}</strong>
                            <br>Cant: {{ $item->quantity }}
                        </td>
                        <td>
                            @if($item->status == 'fulfilled')
                                <span style="color:green; font-weight:bold">ENTREGADO</span>
                                <br><small>{{ $item->fulfilled_at ? $item->fulfilled_at->format('d/m/Y') : '' }}</small>
                            @elseif($item->status == 'approved')
                                <span style="color:blue">APROBADO</span>
                            @elseif($item->status == 'rejected')
                                <span style="color:red">RECHAZADO</span>
                            @else
                                <span>{{ strtoupper($item->status) }}</span>
                            @endif
                        </td>
                    </tr>
                @endforeach
            @empty
                <tr><td colspan="4" style="text-align:center">No ha recibido ayudas registradas.</td></tr>
            @endforelse
        </tbody>
    </table>

    <div style="margin-top: 30px; border-top: 1px solid #ccc; padding-top: 10px; font-size: 10px; color: #777;">
        Reporte generado el {{ date('d/m/Y H:i:s') }}
    </div>
</body>
</html>
