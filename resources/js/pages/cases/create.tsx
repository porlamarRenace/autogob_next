import React, { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import CitizenSearch from '@/components/CitizenSearch';
import CitizenForm from '@/components/CitizenForm';
import CaseHistory from '@/components/CaseHistory'; // <--- NUEVO
import CaseForm from '@/components/CaseForm';       // <--- NUEVO
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Pencil } from 'lucide-react';
import { Citizen } from '@/types/models';

export default function CreateCase() {
    const [citizen, setCitizen] = useState<Citizen | null>(null);
    const [history, setHistory] = useState<any[]>([]); // <--- Estado para historial

    const [showRegisterForm, setShowRegisterForm] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    const [searchIdentificationValue, setSearchIdentificationValue] = useState('');
    const [searchNac, setSearchNac] = useState('V');

    // ... handleNotFound igual ...
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
        // El backend ahora nos devuelve 'history' en searchApi (si hiciste el paso 1)
        // Pero el componente CitizenSearch devuelve data.citizen. 
        // NECESITAMOS modificar CitizenSearch para devolver toda la respuesta o manejarlo aquí.
        // Haremos un pequeño ajuste: asumir que 'data' es el ciudadano, pero necesitamos el historial.
        // TRUCO: Modifica CitizenSearch para que devuelva todo el objeto response.data
    };

    // Callback cuando se crea un caso exitosamente
    const handleCaseCreated = () => {
        alert("Caso creado exitosamente.");
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
                            // Modificamos esto: CitizenSearch debe pasar {citizen, history}
                            // Si no quieres tocar CitizenSearch, tendrás que hacer otra llamada aquí.
                            // Pero asumamos que CitizenSearch ahora pasa el objeto completo.
                            onCitizenFound={(res: any) => {
                                // Aquí 'res' debería ser el ciudadano
                                // PERO en CitizenSearch.tsx llamabas onCitizenFound(response.data.citizen)
                                // MODIFICA CitizenSearch para pasar (response.data)
                                // Si no puedes ahora, el historial vendrá vacío por ahora.
                                setCitizen(res);
                                // temporal hack si el historial no viene
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
                            <Card className="border-blue-200 bg-blue-50/50">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-lg flex justify-between items-center text-blue-700">
                                        <div className="flex items-center gap-2"><User size={20} /> Beneficiario</div>
                                        <Button variant="outline" size="icon" onClick={() => setIsEditing(true)}><Pencil className="h-4 w-4" /></Button>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <div className="text-lg font-bold">{citizen.first_name} {citizen.last_name}</div>
                                    <div className="font-mono text-slate-600">{citizen.nationality}-{citizen.identification_value}</div>
                                    <Button variant="link" className="px-0 text-red-600" onClick={() => setCitizen(null)}>Cambiar Beneficiario</Button>
                                </CardContent>
                            </Card>

                            {/* HISTORIAL (Nuevo Componente) */}
                            {/* Pasamos 'history' que vendría del backend. Si no, pasamos citizen.cases si la relación vino cargada */}
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