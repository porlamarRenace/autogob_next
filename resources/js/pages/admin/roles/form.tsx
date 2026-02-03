import React, { FormEventHandler } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, useForm, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Save, ArrowLeft, Shield } from 'lucide-react';
import Swal from 'sweetalert2';

interface Props {
    role?: any;
    groupedPermissions: Record<string, any[]>;
    currentPermissions?: string[];
}

export default function RoleForm({ role, groupedPermissions, currentPermissions = [] }: Props) {
    const { data, setData, post, put, processing, errors } = useForm({
        name: role?.name || '',
        permissions: currentPermissions // Array de strings ['view cases', 'create users']
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        const action = role ? put : post;
        const url = role ? route('roles.update', role.id) : route('roles.store');

        action(url, {
            onSuccess: () => Swal.fire('Éxito', `Rol ${role ? 'actualizado' : 'creado'} correctamente`, 'success')
        });
    };

    // Manejar Checkbox
    const togglePermission = (permName: string) => {
        if (data.permissions.includes(permName)) {
            setData('permissions', data.permissions.filter(p => p !== permName));
        } else {
            setData('permissions', [...data.permissions, permName]);
        }
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Roles', href: route('roles.index') }, { title: role ? 'Editar' : 'Crear', href: '#' }]}>
            <Head title={role ? 'Editar Rol' : 'Crear Rol'} />

            <div className="py-8 max-w-5xl mx-auto px-4">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Shield /> {role ? 'Editar Rol' : 'Nuevo Rol'}
                    </h2>
                    <Link href={route('roles.index')}>
                        <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" /> Volver</Button>
                    </Link>
                </div>

                <form onSubmit={submit}>
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle>Información Básica</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="max-w-md">
                                <Label>Nombre del Rol</Label>
                                <Input
                                    value={data.name}
                                    onChange={e => setData('name', e.target.value)}
                                    placeholder="Ej: Gerente de Salud"
                                    className="mt-1"
                                />
                                {errors.name && <div className="text-red-500 text-sm mt-1">{errors.name}</div>}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Permisos del Sistema</CardTitle>
                            <p className="text-sm text-slate-500">Seleccione las acciones que este rol puede realizar.</p>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {Object.keys(groupedPermissions).map((group) => (
                                    <div key={group} className="border rounded-lg p-4 bg-slate-50 dark:bg-neutral-900 dark:border-neutral-800">
                                        <h3 className="font-bold text-slate-700 dark:text-slate-300 mb-3 uppercase text-sm border-b dark:border-neutral-700 pb-1">
                                            Módulo: {group}
                                        </h3>
                                        <div className="space-y-3">
                                            {groupedPermissions[group].map((perm: any) => (
                                                <div key={perm.id} className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id={`perm_${perm.id}`}
                                                        checked={data.permissions.includes(perm.name)}
                                                        onCheckedChange={() => togglePermission(perm.name)}
                                                    />
                                                    <label
                                                        htmlFor={`perm_${perm.id}`}
                                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer text-slate-700 dark:text-slate-300"
                                                    >
                                                        {perm.name}
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end mt-6">
                        <Button type="submit" disabled={processing} className="bg-blue-600 hover:bg-blue-700 min-w-[150px]">
                            <Save className="mr-2 h-4 w-4" /> Guardar Rol
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}