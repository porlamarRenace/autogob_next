import React, { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import CitizenSearch from '@/components/CitizenSearch';
import CitizenForm from '@/components/CitizenForm';
import CaseHistory from '@/components/CaseHistory';
import CaseForm from '@/components/CaseForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Pencil, AlertTriangle, Link } from 'lucide-react';
import { Citizen } from '@/types/models';
import Swal from 'sweetalert2';
import { FilePlus } from 'lucide-react';

export default function CreateCase() {
    const [citizen, setCitizen] = useState<Citizen | null>(null);
    const [history, setHistory] = useState<any[]>([]);

    // Estado de perfil completo
    const [profileComplete, setProfileComplete] = useState(true);
    const [profileErrors, setProfileErrors] = useState<string[]>([]);
    const [missingSections, setMissingSections] = useState<string[]>([]);

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
    const handleCitizenFound = (data: any, extraData?: any) => {
        setCitizen(data);

        // Guardar estado del perfil
        if (extraData) {
            setProfileComplete(extraData.profile_complete ?? true);
            setProfileErrors(extraData.profile_errors ?? []);
            setMissingSections(extraData.missing_sections ?? []);

            // Si el perfil está incompleto, abrir automáticamente el formulario de edición
            if (!extraData.profile_complete) {
                setIsEditing(true);
            }
        }
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
        setProfileComplete(true);
        setProfileErrors([]);
    };

    // Callback cuando se actualiza el ciudadano
    const handleCitizenUpdated = (updatedCitizen: Citizen) => {
        setCitizen(updatedCitizen);
        setShowRegisterForm(false);
        setIsEditing(false);

        // Verificar si ahora el perfil está completo
        // Llamar al endpoint de profile-status
        if (updatedCitizen.id) {
            fetch(`/api/citizens/${updatedCitizen.id}/profile-status`)
                .then(res => res.json())
                .then(data => {
                    setProfileComplete(data.complete);
                    setProfileErrors(data.errors ?? []);
                    setMissingSections(data.missing_sections ?? []);
                })
                .catch(() => {
                    // Si falla, asumir completo para no bloquear
                    setProfileComplete(true);
                });
        }
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Gestión de Casos', href: '#' }, { title: 'Crear Caso', href: '#' }]}>
    <Head title="Crear Caso" />

    {/* CABECERA: Se mantiene igual */}
    <div className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <FilePlus className="text-blue-600" /> Crear Caso
                </h2>
                <p className="text-sm text-slate-500">Localice al ciudadano para iniciar la atención.</p>
            </div>
        </div>

        {/* CONTENEDOR PRINCIPAL ÚNICO: Esto asegura que todo lo de abajo mida lo mismo */}
        <div className="space-y-8">
            
            {/* 1. BUSCADOR */}
            {!citizen && !showRegisterForm && (
                <div className="animate-in fade-in duration-300">
                    <CitizenSearch
                        onCitizenFound={handleCitizenFound}
                        onReset={() => { setCitizen(null); setShowRegisterForm(false); setProfileComplete(true); }}
                        onNotFound={handleNotFound}
                    />
                </div>
            )}

            {/* 2. FORMULARIO REGISTRO/EDICIÓN (Ahora con el mismo ancho que el buscador) */}
            {(showRegisterForm || isEditing) && (
                <div className="animate-in zoom-in-95 duration-300">
                    <CitizenForm
                        initialIdentificationValue={searchIdentificationValue}
                        initialNationality={searchNac}
                        citizenToEdit={isEditing ? citizen : null}
                        onSuccess={handleCitizenUpdated}
                        onCancel={() => { setShowRegisterForm(false); setIsEditing(false); }}
                    />
                </div>
            )}

            {/* 3. ÁREA DE TRABAJO (SI HAY CIUDADANO) */}
            {citizen && !isEditing && !showRegisterForm && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
                    
                    {/* COLUMNA IZQUIERDA: PERFIL + HISTORIAL */}
                    <div className="lg:col-span-1 space-y-6">
                        <Card className={`px-6 ${!profileComplete ? 'border-amber-400 bg-amber-50/50 dark:border-amber-600 dark:bg-amber-950/20' : 'border-blue-200 bg-blue-50/50 dark:border-blue-600 dark:bg-neutral-950'}`}>
                            <CardHeader className="pb-2 px-0">
                                <CardTitle className={`text-lg flex justify-between items-center ${!profileComplete ? 'text-amber-700 dark:text-amber-200' : 'text-blue-700 dark:text-blue-200'}`}>
                                    <div className="flex items-center gap-2">
                                        <User size={20} /> Beneficiario
                                        {!profileComplete && <AlertTriangle size={18} className="text-amber-500" />}
                                    </div>
                                    <Button variant="outline" size="icon" onClick={() => setIsEditing(true)}><Pencil className="h-4 w-4" /></Button>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 px-0 pb-4">
                                <div className="text-lg font-bold">{citizen.first_name} {citizen.last_name}</div>
                                <div className="font-mono text-slate-600 dark:text-slate-400">{citizen.nationality}-{citizen.identification_value}</div>

                                {!profileComplete && (
                                    <div className="mt-3 p-3 bg-amber-100 dark:bg-amber-900/30 rounded-md text-sm">
                                        <p className="font-semibold text-amber-800 dark:text-amber-200 mb-1">⚠️ Perfil Incompleto</p>
                                        <ul className="text-amber-700 dark:text-amber-300 text-xs space-y-1">
                                            {profileErrors.slice(0, 3).map((err, i) => (
                                                <li key={i}>• {err}</li>
                                            ))}
                                        </ul>
                                        <Button variant="link" className="px-0 mt-2 text-amber-700 dark:text-amber-300 font-semibold h-auto" onClick={() => setIsEditing(true)}>
                                            Completar Datos →
                                        </Button>
                                    </div>
                                )}
                              <Button 
                                  variant="destructive" 
                                  className="bg-[#ED2224] hover:bg-[#D11B1D] text-white px-4 py-2 h-auto shadow-sm transition-all active:scale-95" 
                                  onClick={() => { setCitizen(null); setProfileComplete(true); }}
                                >
                                  Cambiar Beneficiario
                                </Button>
                            </CardContent>
                        </Card>

                        <CaseHistory cases={history.length > 0 ? history : (citizen as any).history || []} />
                    </div>

                    {/* COLUMNA DERECHA: FORMULARIO DE CASO */}
                    <div className="lg:col-span-2">
                        {profileComplete ? (
                            <CaseForm citizen={citizen} onSuccess={handleCaseCreated} />
                        ) : (
                            <Card className="border-amber-300 bg-amber-50 dark:bg-amber-950/20">
                                <CardContent className="py-12 text-center">
                                    <AlertTriangle className="w-16 h-16 mx-auto text-amber-500 mb-4" />
                                    <h3 className="text-xl font-semibold text-amber-800 dark:text-amber-200 mb-2">No se puede crear un caso</h3>
                                    <p className="text-amber-700 dark:text-amber-300 mb-4">El perfil del ciudadano está incompleto. Complete los datos faltantes primero.</p>
                                    <Button onClick={() => setIsEditing(true)} className="bg-amber-600 hover:bg-amber-700">
                                        <Pencil className="w-4 h-4 mr-2" /> Completar Perfil
                                    </Button>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            )}
        </div>
    </div>
</AppLayout>
    );
}
