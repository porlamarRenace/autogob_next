import React, { useState, useCallback } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Loader2, X, User, AlertTriangle } from 'lucide-react';
import { Citizen } from '@/types/models';
import { useDebounce } from '@/hooks/useDebounce';
import Swal from 'sweetalert2';

interface Props {
    applicant: Citizen;
    onBeneficiarySelected: (beneficiary: Citizen | null) => void;
    selectedBeneficiary: Citizen | null;
}

export default function BeneficiarySearch({ applicant, onBeneficiarySelected, selectedBeneficiary }: Props) {
    const [isSameAsApplicant, setIsSameAsApplicant] = useState(true);
    const [nationality, setNationality] = useState('V');
    const [cedula, setCedula] = useState('');
    const [loading, setLoading] = useState(false);
    const [searchResult, setSearchResult] = useState<Citizen | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSearch = async () => {
        if (!cedula || cedula.length < 5) {
            setError('Ingrese al menos 5 caracteres');
            return;
        }

        setLoading(true);
        setError(null);
        setSearchResult(null);

        try {
            // Reutilizamos el mismo endpoint de búsqueda
            const response = await axios.get(route('citizens.search'), {
                params: { nationality, identification_value: cedula }
            });

            const data = response.data;

            if (!data.found) {
                setError('Beneficiario no encontrado');
                return;
            }

            // Advertir si el perfil está incompleto
            if (!data.profile_complete) {
                await Swal.fire({
                    icon: 'warning',
                    title: 'Perfil del Beneficiario Incompleto',
                    html: `
                        <p class="mb-2">El beneficiario tiene datos faltantes:</p>
                        <ul class="text-left text-sm list-disc ml-6">
                            ${data.profile_errors?.slice(0, 3).map((err: string) => `<li>${err}</li>`).join('') || ''}
                        </ul>
                        <p class="mt-3 text-sm text-gray-600">Debe completar el perfil antes de crear el caso.</p>
                    `,
                    confirmButtonText: 'Entendido'
                });
            }

            setSearchResult(data.citizen);

        } catch (err: any) {
            if (err.response?.status === 404) {
                const shouldRegister = await Swal.fire({
                    icon: 'question',
                    title: 'Beneficiario No Encontrado',
                    text: '¿Desea registrar a esta persona como nuevo ciudadano?',
                    showCancelButton: true,
                    confirmButtonText: 'Sí, Registrar',
                    cancelButtonText: 'Cancelar'
                });

                if (shouldRegister.isConfirmed) {
                    setError('Por favor use el formulario de registro para crear el beneficiario primero.');
                } else {
                    setError('Beneficiario no encontrado');
                }
            } else {
                setError('Error al buscar');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSelectBeneficiary = () => {
        if (searchResult) {
            onBeneficiarySelected(searchResult);
            setIsSameAsApplicant(false);
        }
    };

    const handleUseSameAsApplicant = () => {
        setIsSameAsApplicant(true);
        onBeneficiarySelected(null);
        setSearchResult(null);
        setCedula('');
        setError(null);
    };

    const handleClear = () => {
        setSearchResult(null);
        setCedula('');
        setError(null);
        onBeneficiarySelected(null);
    };

    // Si se selecciona "mismo que solicitante", mostrar info del solicitante
    if (isSameAsApplicant && !selectedBeneficiary) {
        return (
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Beneficiario</Label>
                    <Button
                        type="button"
                        variant="link"
                        size="sm"
                        className="text-blue-600 px-0"
                        onClick={() => setIsSameAsApplicant(false)}
                    >
                        Buscar beneficiario diferente
                    </Button>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-blue-600" />
                        <span className="font-medium">{applicant.first_name} {applicant.last_name}</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {applicant.nationality}-{applicant.identification_value}
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                        ✓ El solicitante es también el beneficiario
                    </p>
                </div>
            </div>
        );
    }

    // Si ya hay un beneficiario seleccionado (diferente al solicitante)
    if (selectedBeneficiary) {
        return (
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Beneficiario</Label>
                    <Button
                        type="button"
                        variant="link"
                        size="sm"
                        className="text-gray-500 px-0"
                        onClick={handleUseSameAsApplicant}
                    >
                        Usar solicitante
                    </Button>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-md border border-green-200 dark:border-green-800 relative">
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6"
                        onClick={handleClear}
                    >
                        <X className="w-4 h-4" />
                    </Button>
                    <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-green-600" />
                        <span className="font-medium">{selectedBeneficiary.first_name} {selectedBeneficiary.last_name}</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {selectedBeneficiary.nationality}-{selectedBeneficiary.identification_value}
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                        ✓ Beneficiario diferente al solicitante
                    </p>
                </div>
            </div>
        );
    }

    // Formulario de búsqueda
    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Buscar Beneficiario</Label>
                <Button
                    type="button"
                    variant="link"
                    size="sm"
                    className="text-gray-500 px-0"
                    onClick={handleUseSameAsApplicant}
                >
                    Usar solicitante
                </Button>
            </div>

            <div className="flex gap-2">
                <Select value={nationality} onValueChange={setNationality}>
                    <SelectTrigger className="w-20">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="V">V</SelectItem>
                        <SelectItem value="E">E</SelectItem>
                    </SelectContent>
                </Select>
                <Input
                    type="text"
                    placeholder="Cédula del beneficiario"
                    value={cedula}
                    onChange={(e) => setCedula(e.target.value)}
                    className="flex-1"
                />
                <Button
                    type="button"
                    onClick={handleSearch}
                    disabled={loading}
                    size="sm"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </Button>
            </div>

            {error && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" /> {error}
                </p>
            )}

            {/* Resultado de búsqueda */}
            {searchResult && (
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md border">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium">{searchResult.first_name} {searchResult.last_name}</p>
                            <p className="text-sm text-gray-500">{searchResult.nationality}-{searchResult.identification_value}</p>
                        </div>
                        <Button
                            type="button"
                            size="sm"
                            onClick={handleSelectBeneficiary}
                        >
                            Seleccionar
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
