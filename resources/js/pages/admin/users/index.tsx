import React from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Users, Plus, Pencil, Trash2, Mail } from 'lucide-react';
import Swal from 'sweetalert2';

interface User {
    id: number;
    name: string;
    email: string;
    roles: { id: number; name: string }[];
    created_at: string;
}

interface Props {
    users: {
        data: User[];
        links: any[];
        total: number;
    };
}

export default function UserIndex({ users }: Props) {

    const handleDelete = (id: number, name: string) => {
        Swal.fire({
            title: '¿Eliminar Usuario?',
            text: `Se eliminará el acceso a "${name}".`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Sí, eliminar'
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete(route('users.destroy', id), {
                    onSuccess: () => Swal.fire('Eliminado', 'Usuario eliminado correctamente.', 'success')
                });
            }
        });
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Administración', href: '#' }, { title: 'Usuarios', href: route('users.index') }]}>
            <Head title="Gestión de Usuarios" />

            <div className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Users className="text-purple-600" /> Usuarios del Sistema
                        </h2>
                        <p className="text-sm text-slate-500">Gestione el acceso y roles del personal.</p>
                    </div>
                    <Link href={route('users.create')}>
                        <Button className="bg-purple-600 hover:bg-purple-700">
                            <Plus className="mr-2 h-4 w-4" /> Registrar Usuario
                        </Button>
                    </Link>
                </div>

                <Card className="shadow-lg border-t-4 border-t-purple-600">
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-slate-50 dark:bg-neutral-800">
                                <TableRow>
                                    <TableHead>Nombre</TableHead>
                                    <TableHead>Contacto</TableHead>
                                    <TableHead>Rol Asignado</TableHead>
                                    <TableHead>Fecha Registro</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.data.map((user) => (
                                    <TableRow key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-neutral-700">
                                        <TableCell className="font-medium text-slate-900 dark:text-slate-200">
                                            {user.name}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2 text-slate-500 text-sm dark:text-slate-400">
                                                <Mail className="w-3 h-3" /> {user.email}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {user.roles.length > 0 ? (
                                                <Badge variant="outline" className="bg-slate-100 uppercase border-slate-300 dark:bg-neutral-700 dark:border-neutral-600">
                                                    {user.roles[0].name.replace('_', ' ')}
                                                </Badge>
                                            ) : (
                                                <Badge variant="secondary" className="text-slate-400 dark:text-slate-200">Sin Rol</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-xs text-slate-500 dark:text-slate-400">
                                            {new Date(user.created_at).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Link href={route('users.edit', user.id)}>
                                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-600 hover:bg-blue-50">
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-8 w-8 text-red-600 hover:bg-red-50 dark:hover:bg-red-500"
                                                    onClick={() => handleDelete(user.id, user.name)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>

                    {/* PAGINACIÓN */}
                    {users.total > 10 && (
                        <div className="flex items-center justify-between p-4 border-t bg-slate-50/50 dark:bg-neutral-700">
                            <div className="text-sm text-slate-500 dark:text-slate-400">
                                Total: {users.total} usuarios
                            </div>
                            <div className="flex gap-1">
                                {users.links.map((link, i) => (
                                    <Link
                                        key={i}
                                        href={link.url || '#'}
                                        preserveState
                                        preserveScroll
                                        className={`px-3 py-1 text-sm rounded border ${link.active
                                            ? 'bg-purple-600 text-white border-purple-600'
                                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100 dark:bg-neutral-700 dark:border-neutral-600 dark:text-slate-200'
                                            } ${!link.url && 'opacity-50 pointer-events-none'}`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </Card>
            </div>
        </AppLayout>
    );
}