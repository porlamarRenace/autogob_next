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

            <div className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-w-0 w-full">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div className="text-center md:text-left">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center justify-center md:justify-start gap-2">
                            <Users className="text-purple-600 shrink-0" /> 
                            <span>Usuarios del Sistema</span>
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">
                            Gestione el acceso y roles del personal.
                        </p>
                    </div>

                    <Link href={route('users.create')} className="w-full md:w-auto">
                        <Button className="bg-purple-600 hover:bg-purple-700 w-full md:w-auto justify-center shadow-md transition-transform active:scale-95">
                            <Plus className="mr-2 h-4 w-4" /> Registrar Usuario
                        </Button>
                    </Link>
                </div>

                {/* TABLA DE USUARIOS */}
                <Card className="w-full max-w-[calc(100vw-2rem)] sm:max-w-full shadow-lg border-t-4 border-t-purple-600 overflow-hidden mx-auto">
                    <CardContent className="p-0">
                        <div className="w-full overflow-x-auto min-w-0">
                            <div className="inline-block min-w-full align-middle">
                                <Table className="min-w-[850px]">
                                    <TableHeader className="bg-slate-50 dark:bg-neutral-800">
                                        <TableRow>
                                            <TableHead className="px-4 py-3 text-left whitespace-nowrap">Nombre</TableHead>
                                            <TableHead className="px-4 py-3 text-left whitespace-nowrap">Contacto</TableHead>
                                            <TableHead className="px-4 py-3 text-left whitespace-nowrap">Rol Asignado</TableHead>
                                            <TableHead className="px-4 py-3 text-left whitespace-nowrap">Fecha Registro</TableHead>
                                            <TableHead className="px-4 py-3 text-right whitespace-nowrap">Acciones</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {users.data.map((user) => (
                                            <TableRow key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-neutral-700">
                                                <TableCell className="px-4 py-3 font-medium whitespace-nowrap">
                                                    {user.name}
                                                </TableCell>
                                                <TableCell className="px-4 py-3">
                                                    <div className="flex items-center gap-2 text-sm whitespace-nowrap">
                                                        <Mail className="w-3 h-3 shrink-0" />
                                                        <span className="max-w-[150px] truncate sm:max-w-none">{user.email}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-4 py-3 whitespace-nowrap">
                                                    {user.roles.length > 0 ? (
                                                        <Badge variant="outline" className="bg-slate-100 uppercase dark:bg-neutral-700">
                                                            {user.roles[0].name.replace('_', ' ')}
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="secondary">Sin Rol</Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                                    {new Date(user.created_at).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell className="px-4 py-3 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Link href={route('users.edit', user.id)}>
                                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-600">
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>
                                                        </Link>
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="h-8 w-8 text-red-600"
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
                            </div>
                        </div>
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