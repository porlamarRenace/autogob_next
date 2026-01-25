<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Supply;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Category;

class SupplyController extends Controller
{
    public function index(Request $request)
    {
        $query = Supply::query()
        ->with('category');
        if ($request->search) {
            $query->where('name', 'ILIKE', "%{$request->search}%");
        }

        return Inertia::render('admin/masters/supplies', [
            'supplies' => $query->orderBy('name')->paginate(10)->withQueryString(),
            'categories' => Category::where('parent_id',null)->get(),
            'filters' => $request->only(['search'])
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string',
            'unit' => 'required|string', // Ej: Caja, Blister, Unidad
            'concentration' => 'nullable|string', // Ej: 500mg
        ]);

        Supply::create($request->all());
        return back()->with('success', 'Insumo creado.');
    }

    public function update(Request $request, Supply $supply)
    {
        $request->validate([
            'name' => 'required|string',
            'unit' => 'required|string',
        ]);
        
        $supply->update($request->all());
        return back()->with('success', 'Actualizado.');
    }

    public function destroy(Supply $supply)
    {
        $supply->delete();
        return back()->with('success', 'Eliminado.');
    }
}