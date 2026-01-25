<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class RoleController extends Controller
{
    public function index()
    {
        return Inertia::render('admin/roles/index', [
            'roles' => Role::withCount('users', 'permissions')->get()
        ]);
    }

    public function create()
    {
        // Agrupamos permisos por la segunda palabra (ej: "create cases" -> "cases")
        // para mostrar una UI ordenada.
        $permissions = Permission::all()->groupBy(function($perm) {
            $parts = explode(' ', $perm->name);
            return isset($parts[1]) ? ucfirst($parts[1]) : 'Otros';
        });

        return Inertia::render('admin/roles/form', [
            'groupedPermissions' => $permissions
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|unique:roles,name',
            'permissions' => 'array'
        ]);

        $role = Role::create(['name' => $request->name]);
        
        if($request->permissions) {
            $role->syncPermissions($request->permissions); // Enviamos nombres de permisos
        }

        return redirect()->route('roles.index')->with('success', 'Rol creado.');
    }

    public function edit(Role $role)
    {
        // No permitir editar Super Admin para evitar bloqueos accidentales
        if ($role->name === 'super_admin') {
            abort(403, 'No puedes editar el rol Super Admin.');
        }

        $permissions = Permission::all()->groupBy(function($perm) {
            $parts = explode(' ', $perm->name);
            return isset($parts[1]) ? ucfirst($parts[1]) : 'Otros';
        });

        return Inertia::render('admin/roles/form', [
            'role' => $role,
            'groupedPermissions' => $permissions,
            'currentPermissions' => $role->permissions->pluck('name')
        ]);
    }

    public function update(Request $request, Role $role)
    {
        if ($role->name === 'super_admin') abort(403);

        $request->validate([
            'name' => ['required', Rule::unique('roles', 'name')->ignore($role->id)],
            'permissions' => 'array'
        ]);

        $role->update(['name' => $request->name]);
        $role->syncPermissions($request->permissions);

        return redirect()->route('roles.index')->with('success', 'Rol actualizado.');
    }

    public function destroy(Role $role)
    {
        if ($role->name === 'super_admin') abort(403);
        
        if ($role->users()->count() > 0) {
            return back()->withErrors(['error' => 'No se puede eliminar un rol asignado a usuarios.']);
        }

        $role->delete();
        return back();
    }
}