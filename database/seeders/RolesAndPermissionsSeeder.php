<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Resetear la caché de permisos y roles (Importante)
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // 2. Definir los Permisos del Sistema
        $permissions = [
            // Gestión de Ciudadanos
            'view citizens',
            'create citizens',
            'edit citizens',
            
            // Gestión de Casos (Flujo Básico)
            'view cases',      // Ver la lista y el detalle
            'create cases',    // Crear nuevas solicitudes
            'edit cases',      // Editar datos básicos
            
            // Gestión de Casos (Flujo Gerencial)
            'assign cases',    // Asignar a especialistas
            'review cases',    // Auditar/Aprobar/Rechazar ítems
            'manage assignments',  // Gestionar asignaciones (aprobar/rechazar)
            'view all cases',  // Ver todos los casos en bandeja general
            
            // Stock y Reportes
            'manage stock',
            'view reports',
            'view citizen expedients',  // Ver expedientes de ciudadanos
            'view activity reports',    // Ver reportes de actividad/cierre
            'export aids excel',        // Exportar reporte de ayudas en Excel
            
            // Administración
            'manage users',    // Crear otros usuarios
            'manage roles',
            'manage settings',
            'view dashboard',
        ];

        // 3. Crear Permisos en BD (si no existen)
        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        // 4. Crear Roles
        
        // Rol: Super Admin (Tiene TODO)
        $superAdminRole = Role::firstOrCreate(['name' => 'super_admin']);
        $superAdminRole->syncPermissions(Permission::all());

        // Rol: Operador (Solo carga datos)
        $operatorRole = Role::firstOrCreate(['name' => 'operator']);
        $operatorRole->syncPermissions([
            'view citizens', 'create citizens', 'edit citizens',
            'view cases', 'create cases',
            'view activity reports'  // Puede ver su propio cierre de caja
        ]);

        // Rol: Gerente/Especialista (Revisa y Asigna)
        $managerRole = Role::firstOrCreate(['name' => 'manager']);
        $managerRole->syncPermissions([
            'view citizens', 
            'view cases', 
            'assign cases', 
            'review cases',
            'manage assignments',
            'view all cases',
            'view dashboard',
            'manage stock',
            'view reports',
            'view citizen expedients',
            'view activity reports',
            'export aids excel'
        ]);

        // 5. Crear Usuario Super Admin por defecto
        $adminUser = User::firstOrCreate(
            ['email' => 'admin@admin.com'], // Buscamos por email para no duplicar
            [
                'name' => 'Super Administrador',
                'password' => Hash::make('password'), // Contraseña: password
                'email_verified_at' => now(),
            ]
        );

        // 6. Asignar Rol al Usuario
        $adminUser->assignRole($superAdminRole);

        // Opcional: Crear un Operador de prueba
        $opUser = User::firstOrCreate(
            ['email' => 'operador@admin.com'],
            [
                'name' => 'Operador de Taquilla',
                'password' => Hash::make('password'),
            ]
        );
        $opUser->assignRole($operatorRole);

        // Opcional: Crear un Gerente de prueba
        $managerUser = User::firstOrCreate(
            ['email' => 'gerente@admin.com'],
            [
                'name' => 'Gerente de Salud',
                'password' => Hash::make('password'),
            ]
        );
        $managerUser->assignRole($managerRole);
    }
}