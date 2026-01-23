import React, { useState } from 'react';
import axios from 'axios';
import { Search, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Citizen } from '@/types/models';

interface Props {
    onCitizenFound: (citizen: Citizen) => void;
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

            // Validación de caso activo
            if (response.data.active_case) {
                setError(`El ciudadano ya tiene un caso activo: ${response.data.active_case.category.name}`);
            }

            onCitizenFound({
                ...response.data.citizen,
                history: response.data.history // <--- INYECTAMOS EL HISTORIAL QUE VIENE DE SEARCHAPI
            });

        } catch (err: any) {
            // CASO 2: El backend devuelve 404 (Lo estándar)
            if (err.response && err.response.status === 404) {
                if (onNotFound) {
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
        <Card className="w-full mb-6 shadow-sm">
            <CardContent className="pt-6">
                <form onSubmit={handleSearch} className="flex gap-4 items-end">
                    <div className="w-24">
                        <label className="text-sm font-medium mb-1 block">Nac.</label>
                        <Select value={nationality} onValueChange={setNationality}>
                            <SelectTrigger><SelectValue placeholder="Nac" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="V">V</SelectItem>
                                <SelectItem value="E">E</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex-1">
                        <label className="text-sm font-medium mb-1 block">Documento de Identidad</label>
                        <Input
                            type="text"
                            value={identificationValue}
                            onChange={(e) => setIdentificationValue(e.target.value)}
                            placeholder="Ej: 12345678"
                            className="text-lg"
                            autoFocus
                        />
                    </div>
                    <Button type="submit" disabled={loading} className="mb-[2px]">
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                        Buscar
                    </Button>
                </form>
                {error && (
                    <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md flex items-center text-sm">
                        <AlertCircle className="w-4 h-4 mr-2" />
                        {error}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}