import React, { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import CitizenSearch from '@/components/CitizenSearch';
import CitizenForm from '@/components/CitizenForm';
import CaseHistory from '@/components/CaseHistory';
import CaseForm from '@/components/CaseForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Pencil } from 'lucide-react';
import { Citizen } from '@/types/models';
import Swal from 'sweetalert2';

export default function CreateCase() {
    const [citizen, setCitizen] = useState<Citizen | null>(null);
    const [history, setHistory] = useState<any[]>([]);

    const [showRegisterForm, setShowRegisterForm] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    const [searchIdentificationValue, setSearchIdentificationValue] = useState('');
    const [searchNac, setSearchNac] = useState('V');

    const handleNotFound = (identification_value: string, nationality: string) => {
        setSearchIdentificationValue(identification_value);
        setSearchNac(nationality);
        setCitizen(null);
        setIsEditing(false);
        setShowRegisterForm(true);
    };

    // Handler al encontrar ciudadano
    const handleCitizenFound = (data: any) => {
        setCitizen(data);
    };

    // Callback cuando se crea un caso exitosamente
    const handleCaseCreated = () => {
        Swal.fire({
            icon: 'success',
            title: 'Caso creado exitosamente',
            showConfirmButton: false,
            timer: 1500
        });
        setCitizen(null); // Reiniciar flujo
        setHistory([]);
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Gestión de Casos', href: '#' }, { title: 'Nuevo Caso', href: '#' }]}>
            <Head title="Nuevo Caso" />

            <div className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* 1. BUSCADOR */}
                {!citizen && !showRegisterForm && (
                    <div className="max-w-2xl mx-auto space-y-6">
                        <CitizenSearch
                            onCitizenFound={(res: any) => {
                                setCitizen(res);
                                setHistory(res.cases || []);
                            }}
                            onReset={() => { setCitizen(null); setShowRegisterForm(false); }}
                            onNotFound={handleNotFound}
                        />
                    </div>
                )}

                {/* 2. FORMULARIO REGISTRO/EDICION ... (Igual que antes) ... */}
                {(showRegisterForm || isEditing) && (
                    <div className="max-w-5xl mx-auto mb-8">
                        <CitizenForm
                            initialIdentificationValue={searchIdentificationValue}
                            initialNationality={searchNac}
                            citizenToEdit={isEditing ? citizen : null}
                            onSuccess={(newCitizen) => {
                                setCitizen(newCitizen);
                                setShowRegisterForm(false);
                                setIsEditing(false);
                            }}
                            onCancel={() => { setShowRegisterForm(false); setIsEditing(false); }}
                        />
                    </div>
                )}

                {/* 3. ÁREA DE TRABAJO (SI HAY CIUDADANO) */}
                {citizen && !isEditing && !showRegisterForm && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in">

                        {/* COLUMNA IZQUIERDA: PERFIL + HISTORIAL */}
                        <div className="lg:col-span-1 space-y-6">
                            {/* Tarjeta Perfil */}
                            <Card className="border-blue-200 bg-blue-50/50 px-6 dark:border-blue-600 dark:bg-neutral-950">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-lg flex justify-between items-center text-blue-700 dark:text-blue-200">
                                        <div className="flex items-center gap-2"><User size={20} /> Beneficiario</div>
                                        <Button variant="outline" size="icon" onClick={() => setIsEditing(true)} className="ml-2"><Pencil className="h-4 w-4" /></Button>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <div className="text-lg font-bold">{citizen.first_name} {citizen.last_name}</div>
                                    <div className="font-mono text-slate-600 dark:text-slate-400">{citizen.nationality}-{citizen.identification_value}</div>
                                    <Button variant="link" className="px-0 text-red-600 dark:text-red-400" onClick={() => setCitizen(null)}>Cambiar Beneficiario</Button>
                                </CardContent>
                            </Card>

                            {/* HISTORIAL (Nuevo Componente) */}
                            <CaseHistory cases={history.length > 0 ? history : (citizen as any).history || []} />
                        </div>

                        {/* COLUMNA DERECHA: FORMULARIO DE CASO */}
                        <div className="lg:col-span-2">
                            <CaseForm citizen={citizen} onSuccess={handleCaseCreated} />
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}