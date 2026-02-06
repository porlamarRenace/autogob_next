import React, { FormEventHandler } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, useForm, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Save, ArrowLeft, UserPlus } from 'lucide-react';
import Swal from 'sweetalert2';

interface Props {
    user?: any;
    roles: any[];
}

export default function UserForm({ user, roles }: Props) {
    // Obtenemos el ID del primer rol del usuario si existe
    const currentRoleId = user?.roles?.[0]?.id?.toString() || '';

    const { data, setData, post, put, processing, errors } = useForm({
        name: user?.name || '',
        email: user?.email || '',
        password: '', // Vacío por seguridad
        role_id: currentRoleId
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        const action = user ? put : post;
        const url = user ? route('users.update', user.id) : route('users.store');

        action(url, {
            onSuccess: () => Swal.fire('Éxito', `Usuario ${user ? 'actualizado' : 'creado'} correctamente`, 'success')
        });
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Usuarios', href: route('users.index') }, { title: user ? 'Editar' : 'Crear', href: '#' }]}>
            <Head title={user ? 'Editar Usuario' : 'Nuevo Usuario'} />

            <div className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-w-0 w-full">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <UserPlus /> {user ? 'Editar Usuario' : 'Nuevo Usuario'}
                    </h2>
                    <Link href={route('users.index')}>
                        <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" /> Volver</Button>
                    </Link>
                </div>

                <form onSubmit={submit}>
                    <Card>
                        <CardHeader>
                            <CardTitle>Credenciales y Acceso</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">

                            <div>
                                <Label>Nombre Completo</Label>
                                <Input value={data.name} onChange={e => setData('name', e.target.value)} required />
                                {errors.name && <span className="text-red-500 text-xs">{errors.name}</span>}
                            </div>

                            <div>
                                <Label>Correo Electrónico</Label>
                                <Input type="email" value={data.email} onChange={e => setData('email', e.target.value)} required />
                                {errors.email && <span className="text-red-500 text-xs">{errors.email}</span>}
                            </div>

                            <div>
                                <Label>Rol de Sistema</Label>
                                <Select value={data.role_id} onValueChange={(val) => setData('role_id', val)}>
                                    <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Seleccione un rol" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {roles
                                            .filter((r) => r.name.toLowerCase() !== 'super_admin')
                                            .map((r) => (
                                                <SelectItem key={r.id} value={r.id.toString()}>
                                                    {r.name.toUpperCase().replace('_', ' ')}
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                                {errors.role_id && <span className="text-red-500 text-xs">{errors.role_id}</span>}
                            </div>

                            <div className="pt-2">
                                <Label>{user ? 'Nueva Contraseña (Dejar en blanco para mantener)' : 'Contraseña'}</Label>
                                <Input
                                    type="password"
                                    value={data.password}
                                    onChange={e => setData('password', e.target.value)}
                                    required={!user} // Obligatorio solo al crear
                                    placeholder={user ? "********" : ""}
                                />
                                {errors.password && <span className="text-red-500 text-xs">{errors.password}</span>}
                            </div>

                        </CardContent>
                    </Card>

                    <div className="flex justify-end mt-6">
                        <Button type="submit" disabled={processing} className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
                            <Save className="mr-2 h-4 w-4" /> {user ? 'Actualizar Usuario' : 'Crear Usuario'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}