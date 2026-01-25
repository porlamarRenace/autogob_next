import React from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Shield, Plus, Pencil, Trash2, Lock } from 'lucide-react';
import Swal from 'sweetalert2';

interface Role {
    id: number;
    name: string;
    users_count: number;
    permissions_count: number;
}

interface Props {
    roles: Role[];
}

export default function RoleIndex({ roles }: Props) {

    const handleDelete = (id: number, name: string) => {
        Swal.fire({
            title: '¿Eliminar Rol?',
            text: `Se eliminará el rol "${name}". Esta acción no se puede deshacer.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete(route('roles.destroy', id), {
                    onSuccess: () => Swal.fire('Eliminado', 'El rol ha sido eliminado.', 'success'),
                    onError: () => Swal.fire('Error', 'No se puede eliminar un rol con usuarios asignados.', 'error')
                });
            }
        });
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Administración', href: '#' }, { title: 'Roles y Permisos', href: route('roles.index') }]}>
            <Head title="Gestión de Roles" />

            <div className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Shield className="text-blue-600" /> Roles del Sistema
                        </h2>
                        <p className="text-sm text-slate-500">Defina qué pueden hacer los usuarios en la plataforma.</p>
                    </div>
                    <Link href={route('roles.create')}>
                        <Button className="bg-blue-600 hover:bg-blue-700">
                            <Plus className="mr-2 h-4 w-4" /> Crear Nuevo Rol
                        </Button>
                    </Link>
                </div>

                <Card className="shadow-lg border-t-4 border-t-blue-600">
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-slate-50 dark:bg-neutral-800">
                                <TableRow>
                                    <TableHead className="w-[50px]">ID</TableHead>
                                    <TableHead>Nombre del Rol</TableHead>
                                    <TableHead className="text-center">Usuarios Asignados</TableHead>
                                    <TableHead className="text-center">Permisos Activos</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {roles.map((role) => (
                                    <TableRow key={role.id} className="hover:bg-slate-50/50 dark:hover:bg-neutral-700">
                                        <TableCell className="font-mono text-xs text-slate-500 dark:text-slate-400">#{role.id}</TableCell>
                                        <TableCell className="dark:text-slate-200">
                                            <div className="font-bold text-slate-800 uppercase flex items-center gap-2 dark:text-slate-200">
                                                {role.name.replace('_', ' ')}
                                                {role.name === 'super_admin' && <Badge variant="secondary" className="text-[10px]"><Lock className="w-3 h-3 mr-1" /> Sistema</Badge>}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant="outline" className="bg-slate-100 dark:bg-neutral-700">
                                                {role.users_count} Usuarios
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center text-slate-600 dark:text-slate-400">
                                            {role.permissions_count} permisos
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {role.name !== 'super_admin' ? (
                                                <div className="flex justify-end gap-2">
                                                    <Link href={route('roles.edit', role.id)}>
                                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-600 hover:bg-blue-50">
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-8 w-8 text-red-600 hover:bg-red-500 dark:hover:bg-red-500"
                                                        onClick={() => handleDelete(role.id, role.name)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-slate-400 italic pr-2">Protegido</span>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}