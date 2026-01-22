import React, { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import CitizenSearch from '@/components/CitizenSearch';
import CitizenForm from '@/components/CitizenForm'; // <--- Usaremos el nuevo con Tabs
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, FileText, CheckCircle2, UserPlus } from 'lucide-react';
import { Citizen } from '@/types/models';

export default function CreateCase() {
    const [citizen, setCitizen] = useState<Citizen | null>(null);
    const [showRegisterForm, setShowRegisterForm] = useState(false);

    // Estado para pre-llenar datos si no existe
    const [searchIdentificationValue, setSearchIdentificationValue] = useState('');
    const [searchNac, setSearchNac] = useState('V');

    const breadcrumbs = [
        { title: 'Gestión de Casos', href: '#' },
        { title: 'Nuevo Caso', href: '#' }
    ];

    // ESTA ES LA FUNCIÓN QUE SE DEBE PASAR
    const handleNotFound = (identification_value: string, nationality: string) => {
        setSearchIdentificationValue(identification_value);
        setSearchNac(nationality);
        setCitizen(null);
        setShowRegisterForm(true); // <--- ESTO ACTIVA EL FORMULARIO AUTOMÁTICAMENTE
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Nuevo Caso" />

            <div className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* BUSCADOR */}
                {!citizen && !showRegisterForm && (
                    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Identificar Beneficiario</h2>
                            <p className="text-gray-500">Busque por documento de identidad.</p>
                        </div>

                        <CitizenSearch
                            onCitizenFound={(c) => setCitizen(c)}
                            onReset={() => { setCitizen(null); setShowRegisterForm(false); }}
                            onNotFound={handleNotFound}
                        />
                    </div>
                )}

                {/* FORMULARIO DE REGISTRO (CON TABS) */}
                {showRegisterForm && !citizen && (
                    <div className="max-w-5xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
                        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-800 text-sm flex items-center shadow-sm">
                            <UserPlus className="h-4 w-4 mr-2" />
                            <span>El ciudadano <strong>{searchNac}-{searchIdentificationValue}</strong> no existe. Complete el registro para continuar.</span>
                        </div>

                        <CitizenForm
                            initialIdentificationValue={searchIdentificationValue}
                            initialNationality={searchNac}
                            onSuccess={(newCitizen) => {
                                setCitizen(newCitizen);
                                setShowRegisterForm(false);
                            }}
                            onCancel={() => setShowRegisterForm(false)}
                        />
                    </div>
                )}

                {/* VISUALIZACIÓN DE ÉXITO (CIUDADANO SELECCIONADO) */}
                {citizen && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <Card className="md:col-span-1 h-fit border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center text-blue-700 dark:text-blue-400">
                                    <User className="mr-2 h-5 w-5" />
                                    Beneficiario Seleccionado
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div>
                                    <div className="text-xs text-gray-500 uppercase font-bold">Nombre Completo</div>
                                    <div className="text-lg font-medium">{citizen.first_name} {citizen.last_name}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500 uppercase font-bold">Identificación</div>
                                    <div className="font-mono text-base">{citizen.nationality}-{citizen.identification_value}</div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full mt-4 text-red-600 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => { setCitizen(null); setShowRegisterForm(false); }}
                                >
                                    Cambiar Beneficiario
                                </Button>
                            </CardContent>
                        </Card>

                        <Card className="md:col-span-2 shadow-lg border-2 border-primary/20">
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <FileText className="mr-2 h-5 w-5" />
                                    Detalles de la Solicitud
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex flex-col items-center justify-center h-64 text-center space-y-4">
                                <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-full">
                                    <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-medium">Listo para procesar</h3>
                                    <p className="text-gray-500 max-w-sm mx-auto">
                                        Se cargará el formulario para seleccionar la categoría de ayuda (Salud, Insumos, etc).
                                    </p>
                                </div>
                                <Button size="lg" className="mt-4">
                                    Continuar y Cargar Caso
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}