import React, { useState, useEffect, useMemo } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, useForm, router } from '@inertiajs/react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Plus, Pencil, Trash2, Pill, Search } from 'lucide-react';
import Swal from 'sweetalert2';
import PaginationLinks from '@/components/ui/pagination-links';
import { useDebounce } from '@/hooks/useDebounce';

export default function SuppliesManager({ supplies, filters, parentCategories }: any) {
    const [search, setSearch] = useState(filters.search || '');
    const debouncedSearch = useDebounce(search, 300);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);

    // Estado para categoría padre seleccionada (para filtrar subcategorías)
    const [selectedParentId, setSelectedParentId] = useState<string>('');

    useEffect(() => {
        router.get(route('supplies.index'), { search: debouncedSearch }, { preserveState: true, replace: true });
    }, [debouncedSearch]);

    const { data, setData, post, put, reset, processing, errors } = useForm({
        name: '',
        concentration: '',
        unit: 'Unidad',
        category_id: '' // Este es el ID de la subcategoría
    });

    // Subcategorías filtradas por categoría padre seleccionada
    const filteredSubcategories = useMemo(() => {
        if (!selectedParentId) return [];
        const parent = parentCategories.find((p: any) => p.id.toString() === selectedParentId);
        return parent?.children || [];
    }, [selectedParentId, parentCategories]);

    const openModal = (item?: any) => {
        if (item) {
            setEditingItem(item);
            // Al editar, necesitamos encontrar la categoría padre de la subcategoría
            const parentId = item.category?.parent_id?.toString() || item.category?.id?.toString() || '';
            const categoryId = item.category_id?.toString() || '';

            // Si la categoría del item no tiene parent_id, es una categoría padre (sin subcategoría)
            if (item.category && !item.category.parent_id) {
                setSelectedParentId(categoryId);
                setData({
                    name: item.name,
                    concentration: item.concentration || '',
                    unit: item.unit,
                    category_id: '' // No hay subcategoría, solo padre
                });
            } else {
                setSelectedParentId(parentId);
                setData({
                    name: item.name,
                    concentration: item.concentration || '',
                    unit: item.unit,
                    category_id: categoryId
                });
            }
        } else {
            setEditingItem(null);
            setSelectedParentId('');
            reset();
            setData('category_id', '');
        }
        setIsModalOpen(true);
    };

    const handleParentChange = (parentId: string) => {
        setSelectedParentId(parentId);
        setData('category_id', ''); // Limpiar subcategoría al cambiar padre
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Si no hay subcategoría seleccionada pero hay categoría padre, usar el padre
        // Si es "_none", usar el padre
        const finalCategoryId = data.category_id === '_none' || !data.category_id
            ? selectedParentId
            : data.category_id;

        // Actualizar data antes de enviar
        setData('category_id', finalCategoryId);

        const action = editingItem ? put : post;
        const url = editingItem ? route('supplies.update', editingItem.id) : route('supplies.store');

        // Usar setTimeout para dar tiempo a React a actualizar el estado
        setTimeout(() => {
            action(url, {
                onSuccess: () => {
                    setIsModalOpen(false);
                    Swal.fire('Guardado', 'Insumo guardado correctamente', 'success');
                }
            });
        }, 0);
    };

    const handleDelete = (id: number) => {
        Swal.fire({ title: '¿Eliminar?', icon: 'warning', showCancelButton: true, confirmButtonText: 'Sí' })
            .then((r) => { if (r.isConfirmed) router.delete(route('supplies.destroy', id)); });
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Configuración', href: '#' }, { title: 'Insumos', href: '#' }]}>
            <Head title="Insumos Médicos" />
            <div className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-w-0 w-full">

                <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Pill className="text-blue-600" /> Insumos y Medicamentos
                    </h2>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                            <Input placeholder="Buscar insumo..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
                        </div>
                        <Button onClick={() => openModal()} className="bg-blue-600 hover:bg-blue-700">
                            <Plus className="mr-2 h-4 w-4" /> Nuevo
                        </Button>
                    </div>
                </div>

                <Card className="shadow-md border-t-4 border-t-blue-600">
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-slate-50 dark:bg-neutral-800">
                                    <TableRow>
                                        <TableHead className="w-[40%] sm:w-auto">Nombre Comercial</TableHead>
                                        <TableHead>Categoría</TableHead>
                                        <TableHead>Concentración</TableHead>
                                        <TableHead>Presentación</TableHead>
                                        <TableHead className="text-right">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {supplies.data.length === 0 ? (
                                        <TableRow><TableCell colSpan={5} className="text-center py-8 text-slate-500">No hay registros.</TableCell></TableRow>
                                    ) : supplies.data.map((sup: any) => (
                                        <TableRow key={sup.id}>
                                            <TableCell className="font-medium align-top sm:align-middle">
                                                <div className="flex flex-col">
                                                    <span>{sup.name}</span>
                                                    <div className="flex flex-col text-xs text-slate-500 mt-0.5 md:hidden">
                                                        {sup.concentration && (
                                                            <span className="md:hidden">
                                                                {sup.concentration}
                                                            </span>
                                                        )}
                                                        <span className="sm:hidden opacity-80">
                                                            {sup.unit}
                                                        </span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="align-top sm:align-middle">
                                                {sup.category ? (
                                                    <div className="flex flex-col gap-0.5">
                                                        {sup.category.parent && (
                                                            <span className="text-xs text-slate-400">{sup.category.parent.name}</span>
                                                        )}
                                                        <span className="inline-flex w-fit items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                                            {sup.category.name}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400 text-xs">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell>{sup.concentration || '-'}</TableCell>
                                            <TableCell><span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-xs border whitespace-nowrap">{sup.unit}</span></TableCell>
                                            <TableCell className="text-right align-top sm:align-middle">
                                                <div className="flex justify-end gap-1">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openModal(sup)}><Pencil className="h-4 w-4 text-blue-600" /></Button>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(sup.id)}><Trash2 className="h-4 w-4 text-red-600" /></Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                        <PaginationLinks links={supplies.links} from={supplies.from} to={supplies.to} total={supplies.total} />
                    </CardContent>
                </Card>

                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingItem ? 'Editar Insumo' : 'Nuevo Insumo'}</DialogTitle>
                            <DialogDescription>Complete los campos para {editingItem ? 'actualizar el' : 'registrar un nuevo'} insumo.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">

                            {/* SELECTOR DE CATEGORÍA PADRE */}
                            <div>
                                <Label>Categoría Principal *</Label>
                                <Select
                                    value={selectedParentId}
                                    onValueChange={handleParentChange}
                                >
                                    <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Seleccione categoría..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {parentCategories.map((cat: any) => (
                                            <SelectItem key={cat.id} value={cat.id.toString()}>
                                                {cat.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* SELECTOR DE SUBCATEGORÍA (solo si hay subcategorías) */}
                            {filteredSubcategories.length > 0 && (
                                <div>
                                    <Label>Subcategoría</Label>
                                    <Select
                                        value={data.category_id}
                                        onValueChange={(val) => setData('category_id', val)}
                                    >
                                        <SelectTrigger className="mt-1">
                                            <SelectValue placeholder="Seleccione subcategoría (opcional)..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="_none">-- Sin subcategoría --</SelectItem>
                                            {filteredSubcategories.map((sub: any) => (
                                                <SelectItem key={sub.id} value={sub.id.toString()}>
                                                    {sub.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {errors.category_id && <span className="text-red-500 text-xs">{errors.category_id}</span>}

                            <div>
                                <Label>Nombre *</Label>
                                <Input value={data.name} onChange={e => setData('name', e.target.value)} required />
                                {errors.name && <span className="text-red-500 text-xs">{errors.name}</span>}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Concentración (Opcional)</Label>
                                    <Input value={data.concentration} onChange={e => setData('concentration', e.target.value)} placeholder="Ej: 500mg" />
                                </div>
                                <div>
                                    <Label>Unidad/Presentación *</Label>
                                    <Input value={data.unit} onChange={e => setData('unit', e.target.value)} placeholder="Ej: Caja, Blister" required />
                                    {errors.unit && <span className="text-red-500 text-xs">{errors.unit}</span>}
                                </div>
                            </div>

                            <div className="flex justify-end pt-2">
                                <Button type="submit" disabled={processing || !selectedParentId} className="bg-blue-600">Guardar</Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
