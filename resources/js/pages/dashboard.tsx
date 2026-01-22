import { Head } from '@inertiajs/react';
import CitizenSearch from '@/components/CitizenSearch';
import { useState } from 'react';
import { Citizen } from '@/types/models';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';

export default function Dashboard() {
    const [citizen, setCitizen] = useState<Citizen | null>(null);

    // Definimos los breadcrumbs para que el layout se vea bien
    const breadcrumbs = [
        {
            title: 'Dashboard',
            href: '/dashboard',
        },
    ];

    return (
        // 2. USO DEL COMPONENTE CORREGIDO
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">

                    <CitizenSearch
                        onCitizenFound={setCitizen}
                        onReset={() => setCitizen(null)}
                    />

                    {citizen && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <Card className="md:col-span-1">
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center">
                                        <User className="mr-2 h-5 w-5" />
                                        Datos del Ciudadano
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between border-b pb-1">
                                            <span className="text-muted-foreground">Nombre:</span>
                                            <span className="font-medium">{citizen.first_name} {citizen.last_name}</span>
                                        </div>
                                        <div className="flex justify-between border-b pb-1">
                                            <span className="text-muted-foreground">Cédula:</span>
                                            <span className="font-medium">{citizen.nationality}-{citizen.dni}</span>
                                        </div>
                                        <div className="pt-4">
                                            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md transition text-sm font-medium">
                                                Iniciar Nuevo Caso
                                            </button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="md:col-span-2 border-dashed border-2 border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                                <CardContent className="h-64 flex items-center justify-center text-muted-foreground">
                                    <p>Selecciona "Iniciar Nuevo Caso" para cargar categorías</p>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}