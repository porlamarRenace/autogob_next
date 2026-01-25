import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, Search, Loader2, Save, ShoppingCart, Pill, Building2, Stethoscope, X } from 'lucide-react';
import { Citizen } from '@/types/models';
import Swal from 'sweetalert2';
import { useDebounce } from '@/hooks/useDebounce';

interface Props {
    citizen: Citizen;
    onSuccess: () => void;
}

interface CartItem {
    id: number;
    name: string;
    unique_id: string;
    details?: string;
    selection_detail?: string;
    type: 'supply' | 'service';
    quantity: number;
    unit: string;
}

const Toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 2000,
    timerProgressBar: true,
});

export default function CaseForm({ citizen, onSuccess }: Props) {
    const searchContainerRef = useRef<HTMLDivElement>(null);

    // Estados de Formulario
    const [categories, setCategories] = useState<any[]>([]);
    const [subcategories, setSubcategories] = useState<any[]>([]);
    const [categoryId, setCategoryId] = useState('');
    const [subcategoryId, setSubcategoryId] = useState('');
    const [channel, setChannel] = useState('Presencial');
    const [description, setDescription] = useState('');

    // --- ESTADOS DE BÚSQUEDA ---
    const [searchType, setSearchType] = useState<'supply' | 'service'>('supply');
    const [searchTerm, setSearchTerm] = useState('');
    // Usamos el hook: espera 350ms después de que el usuario deja de escribir
    const debouncedSearchTerm = useDebounce(searchTerm, 350);

    const [items, setItems] = useState<CartItem[]>([]);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Carga inicial
    useEffect(() => {
        axios.get(route('cases.categories')).then(res => setCategories(res.data));
    }, []);

    // --- EFECTO: BÚSQUEDA AUTOMÁTICA ---
    useEffect(() => {
        if (debouncedSearchTerm.length >= 2) {
            setIsSearching(true);
            setShowResults(true);

            axios.get(route('cases.search-items'), {
                params: { query: debouncedSearchTerm, type: searchType }
            })
                .then(res => setSearchResults(res.data))
                .catch(() => setSearchResults([]))
                .finally(() => setIsSearching(false));
        } else {
            setSearchResults([]);
            setShowResults(false);
        }
    }, [debouncedSearchTerm, searchType]); // Se ejecuta cuando cambia el texto (debounceado) o el tipo

    // Click Outside para cerrar resultados
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
                setShowResults(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleCategoryChange = (val: string) => {
        setCategoryId(val);
        setSubcategoryId('');
        setItems([]);
        const cat = categories.find(c => c.id.toString() === val);
        setSubcategories(cat?.children || []);
    };

    const addItem = (item: any) => {
        const existing = items.find(i => i.unique_id === item.unique_id);
        if (existing) {
            setItems(items.map(i => i.unique_id === item.unique_id ? { ...i, quantity: i.quantity + 1 } : i));
        } else {
            setItems([...items, {
                id: item.id,
                unique_id: item.unique_id, // Usamos el generado por el backend
                name: item.name,
                details: item.details,
                selection_detail: item.selection_detail, // Guardamos el detalle
                type: item.type,
                quantity: 1,
                unit: item.unit
            }]);
        }

        // Limpiamos UI
        setSearchTerm('');
        setShowResults(false);
        Toast.fire({ icon: "success", title: "Agregado" });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (items.length === 0) return Swal.fire('Carrito vacío', 'Agrega al menos un ítem.', 'warning');

        setSubmitting(true);
        try {
            await axios.post(route('cases.store'), {
                citizen_id: citizen.id,
                category_id: categoryId,
                subcategory_id: subcategoryId,
                channel,
                description,
                items
            });
            Toast.fire({ icon: "success", title: "Solicitud creada" });
            onSuccess();
        } catch (error: any) {
            Swal.fire('Error', error.response?.data?.message || 'Error del servidor', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Card className="border-t-4 border-t-green-600 shadow-lg h-full dark:border-green-600 dark:bg-neutral-950">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <ShoppingCart className="h-5 w-5" />
                    Nueva Solicitud
                </CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-5">

                    {/* Selectores Superiores */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg border border-slate-100 dark:bg-neutral-950 dark:border-neutral-800">
                        <div>
                            <Label className="text-xs uppercase text-slate-500 font-bold">Canal</Label>
                            <Select value={channel} onValueChange={setChannel}>
                                <SelectTrigger className="mt-1 bg-white h-9"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Presencial">Presencial</SelectItem>
                                    <SelectItem value="1x10">1x10</SelectItem>
                                    <SelectItem value="Redes Sociales">Redes Sociales</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label className="text-xs uppercase text-slate-500 font-bold">Categoría</Label>
                            <Select value={categoryId} onValueChange={handleCategoryChange}>
                                <SelectTrigger className="mt-1 bg-white h-9"><SelectValue placeholder="Seleccione..." /></SelectTrigger>
                                <SelectContent>
                                    {categories.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Subcategoría (Condicional) */}
                    <div className={`transition-all duration-300 ${!categoryId ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
                        <Label>Tipo Específico de Ayuda</Label>
                        <Select value={subcategoryId} onValueChange={setSubcategoryId} disabled={!categoryId}>
                            <SelectTrigger className="mt-1.5"><SelectValue placeholder="Seleccione subcategoría..." /></SelectTrigger>
                            <SelectContent>
                                {subcategories.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="h-px bg-slate-200"></div>

                    {/* --- ZONA DE BÚSQUEDA --- */}
                    <div className={`space-y-3 transition-opacity ${!subcategoryId ? 'opacity-40 pointer-events-none' : ''}`}>
                        <Label>Agregar Ítems a la Solicitud</Label>

                        {/* Selector de Tipo (Tabs) */}
                        <div className="flex bg-slate-100 p-1 rounded-md w-full sm:w-fit dark:bg-neutral-800">
                            <button
                                type="button"
                                onClick={() => { setSearchType('supply'); setSearchTerm(''); }}
                                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-1.5 rounded text-sm font-medium transition-all ${searchType === 'supply' ? 'bg-white text-blue-600 shadow-sm dark:bg-neutral-700 dark:text-blue-200' : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                <Pill className="w-4 h-4" /> Medicamentos
                            </button>
                            <button
                                type="button"
                                onClick={() => { setSearchType('service'); setSearchTerm(''); }}
                                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-1.5 rounded text-sm font-medium transition-all ${searchType === 'service' ? 'bg-white text-purple-600 shadow-sm dark:bg-neutral-700 dark:text-purple-200' : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                <Stethoscope className="w-4 h-4" /> Servicios Médicos
                            </button>
                        </div>

                        {/* Input de Búsqueda */}
                        <div className="relative" ref={searchContainerRef}>
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                <Input
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    onFocus={() => { if (searchTerm.length >= 2) setShowResults(true); }}
                                    placeholder={searchType === 'supply' ? "Escribe el medicamento (Ej: Losartán)..." : "Escribe el servicio (Ej: Rayos X)..."}
                                    className="pl-9 pr-9 h-10 border-slate-300 focus:border-blue-500 focus:ring-blue-500 dark:border-neutral-600 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                                />
                                {searchTerm && (
                                    <button
                                        type="button"
                                        onClick={() => { setSearchTerm(''); setShowResults(false); }}
                                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </div>

                            {/* Loader Flotante */}
                            {isSearching && (
                                <div className="absolute right-10 top-2.5">
                                    <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                                </div>
                            )}

                            {/* --- RESULTADOS FLOTANTES (Dropdown) --- */}
                            {showResults && (
                                <div className="absolute top-12 left-0 w-full bg-white border border-slate-200 rounded-lg shadow-2xl z-50 max-h-72 overflow-y-auto animate-in fade-in zoom-in-95 dark:bg-neutral-950 dark:border-neutral-800">
                                    {searchResults.length === 0 && !isSearching ? (
                                        <div className="p-4 text-center text-sm text-slate-500">
                                            No encontramos coincidencias para "{searchTerm}"
                                        </div>
                                    ) : (
                                        searchResults.map((item) => (
                                            <div
                                                key={item.id}
                                                className="p-3 hover:bg-slate-50 dark:hover:bg-neutral-800 border-b last:border-0 cursor-pointer flex justify-between items-center group transition-all"
                                                onClick={() => addItem(item)}
                                            >
                                                <div className="flex items-start gap-3">
                                                    {/* Icono según tipo */}
                                                    <div className={`p-2 rounded-full ${item.type === 'supply' ? 'bg-blue-100 text-blue-600 dark:bg-blue-800 dark:text-blue-200' : 'bg-purple-100 text-purple-600 dark:bg-purple-800 dark:text-purple-200'}`}>
                                                        {item.type === 'supply' ? <Pill className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
                                                    </div>

                                                    {/* Contenido Texto */}
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-slate-800 group-hover:text-blue-700 dark:text-slate-200 dark:group-hover:text-blue-200">
                                                            {item.name}
                                                        </span>
                                                        {/* Aquí mostramos la jerarquía o detalle */}
                                                        <span className="text-xs text-slate-500 flex items-center gap-1 dark:text-slate-400">
                                                            {item.type === 'supply' ? 'Concentración:' : 'Institución:'}
                                                            <span className="font-semibold">{item.details}</span>
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Badge Unidad */}
                                                <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded border font-mono uppercase dark:bg-neutral-800 dark:text-slate-400 dark:border-neutral-700">
                                                    {item.unit}
                                                </span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Tabla Carrito */}
                    {items.length > 0 && (
                        <div className="border rounded-lg bg-white overflow-hidden shadow-sm mt-2 dark:bg-neutral-800">
                            <div className="bg-slate-50 dark:bg-neutral-700 px-4 py-2 text-xs font-bold text-slate-500 dark:text-slate-200 uppercase border-b flex justify-between">
                                <span>Ítems Agregados</span>
                                <span>{items.length}</span>
                            </div>
                            <div className="max-h-60 overflow-y-auto">
                                <table className="w-full text-sm text-left">
                                    <tbody className="divide-y">
                                        {items.map((item, idx) => (
                                            <tr key={item.unique_id} className="hover:bg-slate-50/80 dark:hover:bg-neutral-700">
                                                <td className="px-4 py-3">
                                                    <div className="font-medium text-slate-800 dark:text-slate-200">{item.name}</div>
                                                    <div className="text-xs text-slate-500 dark:text-slate-400">
                                                        {item.type === 'service' && item.selection_detail
                                                            ? `Especialidad: ${item.selection_detail} • `
                                                            : ''}
                                                        {item.details}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <Input
                                                        type="number"
                                                        value={item.quantity}
                                                        className="h-8 w-16 text-center mx-auto"
                                                        min={1}
                                                        onChange={(e) => {
                                                            const val = parseInt(e.target.value) || 1;
                                                            const newItems = [...items];
                                                            newItems[idx].quantity = val;
                                                            setItems(newItems);
                                                        }}
                                                    />
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <Button
                                                        type="button" variant="ghost" size="sm"
                                                        className="text-slate-400 hover:text-red-600 h-8 w-8"
                                                        onClick={() => setItems(items.filter((i) => i.unique_id !== item.unique_id))}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    <div>
                        <Label>Observaciones</Label>
                        <Textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            required
                            placeholder="Describa brevemente la necesidad o patología..."
                            className="min-h-[80px]"
                        />
                    </div>

                    <div className="flex justify-end pt-2">
                        <Button type="submit" className="bg-green-600 hover:bg-green-700 w-full sm:w-auto min-w-[200px]" disabled={submitting}>
                            {submitting ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2 h-4 w-4" />}
                            Generar Solicitud
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}