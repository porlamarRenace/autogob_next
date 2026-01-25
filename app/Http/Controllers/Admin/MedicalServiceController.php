<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\MedicalService;
use App\Models\Institution; // Asegúrate de tener este modelo o crear uno simple
use Illuminate\Http\Request;
use Inertia\Inertia;

class MedicalServiceController extends Controller
{
    public function index(Request $request)
    {
        $query = MedicalService::with('institution');
        
        if ($request->search) {
            $query->where('name', 'ILIKE', "%{$request->search}%");
        }

        return Inertia::render('admin/masters/services', [
            'services' => $query->orderBy('name')->paginate(10)->withQueryString(),
            'institutions' => Institution::all(),
            'filters' => $request->only(['search'])
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string',
            'institution_id' => 'required|exists:institutions,id',
            'specialties' => 'nullable|array' // Esperamos un array de objetos
        ]);

        // Laravel cast automático a JSON si en el modelo pusiste 'casts' => ['specialties' => 'array']
        // Si no, usa json_encode($request->specialties)
        MedicalService::create($data);

        return back()->with('success', 'Servicio creado.');
    }

    public function update(Request $request, MedicalService $service)
    {
        $data = $request->validate([
            'name' => 'required|string',
            'institution_id' => 'required|exists:institutions,id',
            'specialties' => 'nullable|array'
        ]);

        $service->update($data);
        return back()->with('success', 'Servicio actualizado.');
    }
    
}