import React, { useState } from 'react';
import axios from 'axios';
import { Search, Loader2, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Citizen } from '@/types/models';
import Swal from 'sweetalert2';

interface Props {
    onCitizenFound: (citizen: Citizen, extraData?: any) => void;
    onReset: () => void;
    onNotFound: (identification_value: string, nationality: string) => void;
}

export default function CitizenSearch({ onCitizenFound, onReset, onNotFound }: Props) {
    const [nationality, setNationality] = useState('V');
    const [identificationValue, setIdentificationValue] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        onReset();

        try {
            const response = await axios.get(route('citizens.search'), {
                params: { nationality, identification_value: identificationValue }
            });

            // CASO 1: El backend devuelve 200 pero dice que no lo encontró (Lógica defensiva)
            if (response.data.found === false) {
                if (onNotFound) onNotFound(identificationValue, nationality);
                return;
            }

            const data = response.data;

            // Validación de caso activo
            if (data.active_case) {
                setError(`El ciudadano ya tiene un caso activo: ${data.active_case.category.name}`);
            }

            // ALERTA: Ciudadano creado desde sistema externo
            if (data.was_created) {
                await Swal.fire({
                    icon: 'info',
                    title: 'Nuevo Ciudadano Registrado',
                    text: 'Este ciudadano fue registrado automáticamente desde el sistema externo. Por favor complete los datos faltantes antes de crear un caso.',
                    confirmButtonText: 'Entendido'
                });
            }

            // ALERTA: Perfil incompleto
            if (!data.profile_complete && !data.was_created) {
                await Swal.fire({
                    icon: 'warning',
                    title: 'Perfil Incompleto',
                    html: `
                        <p class="mb-2">El ciudadano tiene información faltante:</p>
                        <ul class="text-left text-sm list-disc ml-6">
                            ${data.profile_errors?.map((err: string) => `<li>${err}</li>`).join('') || ''}
                        </ul>
                        <p class="mt-3 font-semibold">Complete los datos antes de crear un caso.</p>
                    `,
                    confirmButtonText: 'Ir a Completar Datos'
                });
            }

            onCitizenFound({
                ...data.citizen,
                history: data.history
            }, {
                profile_complete: data.profile_complete,
                profile_errors: data.profile_errors,
                missing_sections: data.missing_sections,
                was_created: data.was_created,
                source: data.source
            });

        } catch (err: any) {
            // CASO 2: El backend devuelve 404 (Lo estándar)
            if (err.response && err.response.status === 404) {
                // Mostrar mensaje de que no se encontró en ningún sistema
                const message = err.response.data?.message || 'Ciudadano no encontrado';

                if (err.response.data?.source === 'none') {
                    Swal.fire({
                        icon: 'question',
                        title: 'Ciudadano No Encontrado',
                        text: 'No se encontró en la base de datos local ni en el sistema externo. ¿Desea registrarlo manualmente?',
                        showCancelButton: true,
                        confirmButtonText: 'Sí, Registrar',
                        cancelButtonText: 'Cancelar'
                    }).then((result) => {
                        if (result.isConfirmed && onNotFound) {
                            onNotFound(identificationValue, nationality);
                        }
                    });
                } else if (onNotFound) {
                    onNotFound(identificationValue, nationality);
                } else {
                    setError('Ciudadano no encontrado y no se ha definido acción de registro.');
                }
            } else {
                console.error(err);
                setError('Error de conexión o servidor.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        /* Eliminamos max-w-7xl y los paddings excesivos para que el padre decida el ancho */
        <Card className="w-full shadow-sm border-slate-200">
            <CardContent className="p-6"> {/* Padding uniforme */}
                <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-end gap-4">
                    
                    {/* Selector de Nacionalidad */}
                    <div className="w-full sm:w-24">
                        <label className="text-sm font-medium mb-1.5 block text-slate-700">
                            Nac.
                        </label>
                        <Select value={nationality} onValueChange={setNationality}>
                            <SelectTrigger className="bg-white">
                                <SelectValue placeholder="Nac" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="V">V</SelectItem>
                                <SelectItem value="E">E</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Input de Documento */}
                    <div className="flex-1 w-full">
                        <label className="text-sm font-medium mb-1.5 block text-slate-700">
                            Documento de Identidad
                        </label>
                        <Input
                            type="text"
                            value={identificationValue}
                            onChange={(e) => setIdentificationValue(e.target.value)}
                            placeholder="Ej: 12345678"
                            className="text-base bg-white focus-visible:ring-[#005BBB]/30 focus-visible:border-[#005BBB]"
                            autoFocus
                        />
                    </div>

                    {/* Botón de búsqueda - Sin mb-[2px], ahora alineado por el gap del form */}
                    <Button 
                        type="submit" 
                        disabled={loading || !identificationValue} 
                        className="w-full sm:w-auto px-8 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        {loading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Search className="mr-2 h-4 w-4" />
                        )}
                        Buscar
                    </Button>
                </form>

                {error && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center text-sm animate-in fade-in slide-in-from-top-1">
                        <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                        {error}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
