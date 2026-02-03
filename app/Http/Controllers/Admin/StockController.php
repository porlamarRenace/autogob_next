<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Supply;
use App\Models\StockMovement;
use Illuminate\Http\Request;
use Inertia\Inertia;

class StockController extends Controller
{
    /**
     * Vista principal del inventario
     */
    public function index(Request $request)
    {
        if (!auth()->user()->can('manage stock')) abort(403);
        
        $query = Supply::query()
            ->with('category.parent')
            ->withCount('movements');

        // Filtros
        if ($request->search) {
            $query->where('name', 'ILIKE', "%{$request->search}%");
        }

        if ($request->category) {
            $query->where('category_id', $request->category);
        }

        if ($request->low_stock === 'true') {
            $query->whereRaw('current_stock <= min_stock');
        }

        $supplies = $query->orderBy('name')->paginate(15)->withQueryString();

        return Inertia::render('admin/stock/index', [
            'supplies' => $supplies,
            'filters' => $request->only(['search', 'category', 'low_stock']),
            'stats' => [
                'total_items' => Supply::count(),
                'low_stock_count' => Supply::whereRaw('current_stock <= min_stock')->count(),
                'out_of_stock' => Supply::where('current_stock', 0)->count(),
            ]
        ]);
    }

    /**
     * Historial de movimientos de un insumo
     */
    public function movements(Supply $supply)
    {
        $movements = $supply->movements()
            ->with('user')
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return Inertia::render('admin/stock/movements', [
            'supply' => $supply->load('category'),
            'movements' => $movements,
        ]);
    }

    /**
     * Registrar entrada de stock
     */
    public function entry(Request $request)
    {
        $request->validate([
            'supply_id' => 'required|exists:supplies,id',
            'quantity' => 'required|integer|min:1',
            'reason' => 'required|in:purchase,donation,return,adjustment',
            'notes' => 'nullable|string|max:500',
        ]);

        $supply = Supply::findOrFail($request->supply_id);
        
        $supply->addStock(
            $request->quantity,
            $request->reason,
            auth()->id(),
            $request->notes
        );

        return back()->with('success', "Se agregaron {$request->quantity} unidades al inventario de {$supply->name}");
    }

    /**
     * Registrar salida manual de stock
     */
    public function exit(Request $request)
    {
        $request->validate([
            'supply_id' => 'required|exists:supplies,id',
            'quantity' => 'required|integer|min:1',
            'reason' => 'required|in:loss,adjustment,other',
            'notes' => 'nullable|string|max:500',
        ]);

        $supply = Supply::findOrFail($request->supply_id);

        if ($supply->current_stock < $request->quantity) {
            return back()->withErrors(['quantity' => 'No hay suficiente stock disponible.']);
        }
        
        $supply->removeStock(
            $request->quantity,
            $request->reason,
            auth()->id(),
            $request->notes
        );

        return back()->with('success', "Se retiraron {$request->quantity} unidades del inventario de {$supply->name}");
    }

    /**
     * API para obtener movimientos recientes (para modal)
     */
    public function recentMovements(Supply $supply)
    {
        return response()->json([
            'movements' => $supply->movements()
                ->with('user:id,name')
                ->orderBy('created_at', 'desc')
                ->limit(10)
                ->get()
        ]);
    }
}
