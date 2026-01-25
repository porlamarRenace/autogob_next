<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CategoryController extends Controller
{
    public function index()
    {
        // Traemos categorías con su padre para mostrar "Salud > Medicamentos"
        $categories = Category::with('parent')->orderBy('id')->paginate(10);
        
        // Traemos solo las padres para el select del formulario
        $parents = Category::whereNull('parent_id')->get();

        return Inertia::render('admin/masters/categories', [
            'categories' => $categories,
            'parents' => $parents
        ]);
    }

    public function store(Request $request)
    {
        $request->validate(['name' => 'required|string|max:255']);
        Category::create($request->all());
        return back()->with('success', 'Categoría creada.');
    }

    public function update(Request $request, Category $category)
    {
        $request->validate(['name' => 'required|string|max:255']);
        $category->update($request->all());
        return back()->with('success', 'Categoría actualizada.');
    }

    public function destroy(Category $category)
    {
        // Validar que no tenga hijos ni casos asociados antes de borrar
        if($category->children()->exists()) return back()->withErrors('No puedes borrar una categoría que tiene subcategorías.');
        
        $category->delete();
        return back()->with('success', 'Eliminada.');
    }
}