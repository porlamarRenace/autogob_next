import React, { useState, useEffect } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, useForm, router } from '@inertiajs/react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Plus, Pencil, Trash2, Stethoscope, Search, X } from 'lucide-react';
import Swal from 'sweetalert2';
import PaginationLinks from '@/components/ui/pagination-links';
import { useDebounce } from '@/hooks/useDebounce';

interface Props {
    services: {
        data: any[];
        links: any[];
        from: number; to: number; total: number;
    };
    institutions: any[];
    filters: { search?: string };
}

export default function ServicesManager({ services, institutions, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const debouncedSearch = useDebounce(search, 300);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);

    // Búsqueda automática
    useEffect(() => {
        router.get(route('services.index'), { search: debouncedSearch }, { preserveState: true, replace: true });
    }, [debouncedSearch]);

    // Formulario
    const { data, setData, post, put, reset, processing } = useForm({
        name: '',
        institution_id: '',
        specialties: [] as any[]
    });

    const openModal = (item?: any) => {
        if (item) {
            setEditingItem(item);
            setData({
                name: item.name,
                institution_id: item.institution_id?.toString() || '',
                specialties: item.specialties ? JSON.parse(JSON.stringify(item.specialties)) : []
            });
        } else {
            setEditingItem(null);
            reset();
            setData('specialties', []);
        }
        setIsModalOpen(true);
    };

    const addSpecialty = () => {
        const newId = data.specialties.length > 0 ? Math.max(...data.specialties.map(s => s.id)) + 1 : 1;
        setData('specialties', [...data.specialties, { id: newId, nombre: '' }]);
    };

    const removeSpecialty = (idx: number) => {
        const updated = [...data.specialties];
        updated.splice(idx, 1);
        setData('specialties', updated);
    };

    const updateSpecialtyName = (idx: number, val: string) => {
        const updated = [...data.specialties];
        updated[idx].nombre = val;
        setData('specialties', updated);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const action = editingItem ? put : post;
        const url = editingItem ? route('services.update', editingItem.id) : route('services.store');

        action(url, {
            onSuccess: () => {
                setIsModalOpen(false);
                Swal.fire('Guardado', 'Servicio actualizado correctamente', 'success');
            }
        });
    };

    const handleDelete = (id: number) => {
        Swal.fire({ title: '¿Eliminar?', icon: 'warning', showCancelButton: true, confirmButtonText: 'Sí' })
            .then((r) => { if (r.isConfirmed) router.delete(route('services.destroy', id)); });
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Configuración', href: '#' }, { title: 'Servicios', href: '#' }]}>
            <Head title="Servicios Médicos" />
            <div className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-w-0 w-full">

                {/* Header + Buscador */}
                <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Stethoscope className="text-purple-600" /> Servicios Médicos
                    </h2>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                            <Input placeholder="Buscar servicio..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 focus-visible:ring-[#005BBB]/30 focus-visible:border-[#005BBB] [&:-webkit-autofill]:shadow-[0_0_0_1000px_white_inset]" />
                        </div>
                        <Button onClick={() => openModal()} className="bg-purple-600 hover:bg-purple-700">
                            <Plus className="mr-2 h-4 w-4" /> Nuevo
                        </Button>
                    </div>
                </div>

                <Card className="shadow-md border-t-4 border-t-purple-600">
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-slate-50 dark:bg-neutral-800">
                                <TableRow>
                                    <TableHead>Servicio Principal</TableHead>
                                    <TableHead>Institución</TableHead>
                                    <TableHead>Especialidades</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {services.data.length === 0 ? (
                                    <TableRow><TableCell colSpan={4} className="text-center py-8 text-slate-500">No hay registros.</TableCell></TableRow>
                                ) : services.data.map((srv: any) => (
                                    <TableRow key={srv.id}>
                                        <TableCell className="font-medium">{srv.name}</TableCell>
                                        <TableCell>{srv.institution?.name}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1">
                                                {srv.specialties && srv.specialties.slice(0, 3).map((s: any) => (
                                                    <span key={s.id} className="text-[10px] bg-slate-100 px-2 py-1 rounded border dark:bg-neutral-700">{s.nombre}</span>
                                                ))}
                                                {srv.specialties && srv.specialties.length > 3 && (
                                                    <span className="text-[10px] text-slate-400 dark:text-neutral-400">+{srv.specialties.length - 3} más</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" onClick={() => openModal(srv)}><Pencil className="h-4 w-4 text-blue-600" /></Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(srv.id)}><Trash2 className="h-4 w-4 text-red-600" /></Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>

                        {/* PAGINACIÓN */}
                        <PaginationLinks links={services.links} from={services.from} to={services.to} total={services.total} />
                    </CardContent>
                </Card>

                {/* MODAL */}
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogContent className="max-w-xl">
                        <DialogHeader><DialogTitle>{editingItem ? 'Editar Servicio' : 'Nuevo Servicio'}</DialogTitle></DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <Label>Nombre</Label>
                                <Input value={data.name} onChange={e => setData('name', e.target.value)} required className="focus-visible:ring-[#005BBB]/30 focus-visible:border-[#005BBB] [&:-webkit-autofill]:shadow-[0_0_0_1000px_white_inset]" />
                            </div>
                            <div>
                                <Label>Institución</Label>
                                <Select value={data.institution_id} onValueChange={v => setData('institution_id', v)}>
                                    <SelectTrigger><SelectValue placeholder="Seleccione..." /></SelectTrigger>
                                    <SelectContent>
                                        {institutions.map((i: any) => <SelectItem key={i.id} value={i.id.toString()}>{i.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="border rounded-md p-3 bg-slate-50 dark:bg-neutral-800">
                                <div className="flex justify-between mb-2">
                                    <Label className="text-xs font-bold uppercase text-slate-500">Sub-Especialidades</Label>
                                    <Button type="button" size="sm" variant="outline" onClick={addSpecialty}><Plus className="h-3 w-3 mr-1" /> Agregar</Button>
                                </div>
                                <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                                    {data.specialties.map((spec, idx) => (
                                        <div key={idx} className="flex gap-2">
                                            <Input value={spec.nombre} onChange={e => updateSpecialtyName(idx, e.target.value)} className="h-8 bg-white border border-slate-200 dark:border-white focus-visible:ring-[#005BBB]/30 focus-visible:border-[#005BBB] [&:-webkit-autofill]:shadow-[0_0_0_1000px_white_inset]" placeholder="Ej: Pediátrica" />
                                            <Button type="button" size="icon" variant="ghost" onClick={() => removeSpecialty(idx)} className="h-8 w-8 text-red-500"><X className="h-4 w-4" /></Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="flex justify-end pt-2">
                                <Button type="submit" disabled={processing} className="bg-purple-600">Guardar</Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}