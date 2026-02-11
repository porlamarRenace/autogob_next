import React, { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, useForm, router } from '@inertiajs/react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Plus, Pencil, Trash2, Layers, FolderTree } from 'lucide-react';
import Swal from 'sweetalert2';
import PaginationLinks from '@/components/ui/pagination-links';

export default function CategoriesManager({ categories, parents }: any) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);

    const { data, setData, post, put, reset, processing, transform } = useForm({
        name: '',
        parent_id: 'none'
    });

    const openModal = (item?: any) => {
        if (item) {
            setEditingItem(item);
            setData({ name: item.name, parent_id: item.parent_id?.toString() || 'none' });
        } else {
            setEditingItem(null);
            reset();
            setData('parent_id', 'none');
        }
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        transform((data) => ({
            ...data,
            parent_id: data.parent_id === 'none' ? null : data.parent_id
        }));

        const action = editingItem ? put : post;
        const url = editingItem ? route('categories.update', editingItem.id) : route('categories.store');

        action(url, {
            onSuccess: () => {
                setIsModalOpen(false);
                Swal.fire('Guardado', 'Categoría guardada correctamente', 'success');
            }
        });
    };

    const handleDelete = (id: number) => {
        Swal.fire({ title: '¿Eliminar?', text: 'Si tiene subcategorías, no se podrá eliminar.', icon: 'warning', showCancelButton: true, confirmButtonText: 'Sí' })
            .then((r) => {
                if (r.isConfirmed) {
                    router.delete(route('categories.destroy', id), {
                        onError: (errors) => Swal.fire('Error', Object.values(errors)[0], 'error')
                    });
                }
            });
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Configuración', href: '#' }, { title: 'Categorías', href: '#' }]}>
            <Head title="Categorías" />
            <div className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-w-0 w-full">

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div className="text-center md:text-left">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center justify-center md:justify-start gap-2">
                            <Layers className="text-orange-600 shrink-0" /> 
                            <span>Categorías</span>
                        </h2>
                    </div>

                    <Button 
                        onClick={() => openModal()} 
                        className="bg-orange-600 hover:bg-orange-700 w-full md:w-auto justify-center shadow-md transition-all active:scale-95"
                    >
                        <Plus className="mr-2 h-4 w-4" /> Nueva Categoría
                    </Button>
                </div>

                <Card className="shadow-md border-t-4 border-t-orange-600">
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-slate-50 dark:bg-neutral-800">
                                <TableRow>
                                    <TableHead>Nombre</TableHead>
                                    <TableHead>Tipo</TableHead>
                                    <TableHead>Categoría Padre</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {categories.data.length === 0 ? (
                                    <TableRow><TableCell colSpan={4} className="text-center py-8 text-slate-500">No hay registros.</TableCell></TableRow>
                                ) : categories.data.map((cat: any) => (
                                    <TableRow key={cat.id}>
                                        <TableCell className="font-medium">{cat.name}</TableCell>
                                        <TableCell>
                                            {cat.parent_id
                                                ? <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">Subcategoría</span>
                                                : <span className="bg-slate-100 text-slate-800 text-xs px-2 py-1 rounded font-bold">Principal</span>
                                            }
                                        </TableCell>
                                        <TableCell>
                                            {cat.parent && (
                                                <div className="flex items-center gap-2 text-slate-500">
                                                    <FolderTree className="h-3 w-3" /> {cat.parent.name}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" onClick={() => openModal(cat)}><Pencil className="h-4 w-4 text-blue-600" /></Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(cat.id)}><Trash2 className="h-4 w-4 text-red-600" /></Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        <PaginationLinks links={categories.links} from={categories.from} to={categories.to} total={categories.total} />
                    </CardContent>
                </Card>

                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogContent>
                        <DialogHeader><DialogTitle>{editingItem ? 'Editar Categoría' : 'Nueva Categoría'}</DialogTitle></DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div><Label>Nombre</Label><Input value={data.name} onChange={e => setData('name', e.target.value)} required /></div>
                            <div>
                                <Label>Categoría Padre (Opcional)</Label>
                                <Select value={data.parent_id} onValueChange={v => setData('parent_id', v)}>
                                    <SelectTrigger><SelectValue placeholder="Seleccione..." /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">-- Es Categoría Principal --</SelectItem>
                                        {parents.map((p: any) => (
                                            // Evitar que una categoría sea su propio padre al editar
                                            p.id !== editingItem?.id && <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex justify-end pt-2"><Button type="submit" disabled={processing} className="bg-orange-600">Guardar</Button></div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}