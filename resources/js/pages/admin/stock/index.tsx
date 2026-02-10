import React, { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, router, useForm } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Package, Plus, Minus, Search, AlertTriangle, History, TrendingUp, TrendingDown, PackageX } from 'lucide-react';
import Swal from 'sweetalert2';
import PaginationLinks from '@/components/ui/pagination-links';

interface Supply {
    id: number;
    name: string;
    unit: string;
    concentration: string | null;
    current_stock: number;
    min_stock: number;
    is_low_stock: boolean;
    category: { name: string; parent?: { name: string } } | null;
    movements_count: number;
}

interface Props {
    supplies: { data: Supply[]; links: any; from: number; to: number; total: number };
    filters: { search?: string; low_stock?: string };
    stats: { total_items: number; low_stock_count: number; out_of_stock: number };
}

export default function StockIndex({ supplies, filters, stats }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [showLowStock, setShowLowStock] = useState(filters.low_stock === 'true');
    const [entryModal, setEntryModal] = useState<Supply | null>(null);
    const [exitModal, setExitModal] = useState<Supply | null>(null);

    const entryForm = useForm({
        supply_id: '',
        quantity: '',
        reason: 'purchase',
        notes: '',
    });

    const exitForm = useForm({
        supply_id: '',
        quantity: '',
        reason: 'loss',
        notes: '',
    });

    const handleSearch = () => {
        router.get(route('stock.index'), {
            search,
            low_stock: showLowStock ? 'true' : undefined
        }, { preserveState: true, replace: true });
    };

    const openEntryModal = (supply: Supply) => {
        setEntryModal(supply);
        entryForm.setData('supply_id', supply.id.toString());
    };

    const openExitModal = (supply: Supply) => {
        setExitModal(supply);
        exitForm.setData('supply_id', supply.id.toString());
    };

    const submitEntry = (e: React.FormEvent) => {
        e.preventDefault();
        entryForm.post(route('stock.entry'), {
            onSuccess: () => {
                setEntryModal(null);
                entryForm.reset();
                Swal.fire('Éxito', 'Entrada de stock registrada', 'success');
            }
        });
    };

    const submitExit = (e: React.FormEvent) => {
        e.preventDefault();
        exitForm.post(route('stock.exit'), {
            onSuccess: () => {
                setExitModal(null);
                exitForm.reset();
                Swal.fire('Éxito', 'Salida de stock registrada', 'success');
            }
        });
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Administración', href: '#' }, { title: 'Inventario', href: '#' }]}>
            <Head title="Control de Inventario" />
            <div className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-w-0 w-full">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Package className="text-emerald-600" /> Control de Inventario
                    </h2>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <Card className="border-l-4 border-l-blue-500">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-500">Total Insumos</p>
                                    <p className="text-2xl font-bold">{stats.total_items}</p>
                                </div>
                                <Package className="h-10 w-10 text-blue-500 opacity-50" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-l-4 border-l-amber-500">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-500">Stock Bajo</p>
                                    <p className="text-2xl font-bold text-amber-600">{stats.low_stock_count}</p>
                                </div>
                                <AlertTriangle className="h-10 w-10 text-amber-500 opacity-50" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-l-4 border-l-red-500">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-500">Sin Stock</p>
                                    <p className="text-2xl font-bold text-red-600">{stats.out_of_stock}</p>
                                </div>
                                <PackageX className="h-10 w-10 text-red-500 opacity-50" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <Card className="mb-6">
                    <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="Buscar insumo..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                                    className="pl-9"
                                />
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={showLowStock}
                                    onChange={e => {
                                        setShowLowStock(e.target.checked);
                                        router.get(route('stock.index'), {
                                            search,
                                            low_stock: e.target.checked ? 'true' : undefined
                                        }, { preserveState: true, replace: true });
                                    }}
                                    className="rounded border-slate-300"
                                />
                                <span className="text-sm">Solo stock bajo</span>
                            </label>
                            <Button onClick={handleSearch} variant="outline">
                                <Search className="h-4 w-4 mr-2" /> Buscar
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Table */}
                <Card className="shadow-md border-t-4 border-t-emerald-600">
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-slate-50 dark:bg-neutral-800">
                                <TableRow>
                                    <TableHead>Insumo</TableHead>
                                    <TableHead>Categoría</TableHead>
                                    <TableHead className="text-center">Stock Actual</TableHead>
                                    <TableHead className="text-center">Mínimo</TableHead>
                                    <TableHead className="text-center">Estado</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {supplies.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                                            No hay insumos registrados.
                                        </TableCell>
                                    </TableRow>
                                ) : supplies.data.map((supply) => (
                                    <TableRow key={supply.id} className={supply.is_low_stock ? 'bg-amber-50 dark:bg-amber-950/20' : ''}>
                                        <TableCell>
                                            <div>
                                                <span className="font-medium">{supply.name}</span>
                                                {supply.concentration && (
                                                    <span className="text-xs text-slate-500 ml-2">{supply.concentration}</span>
                                                )}
                                                <span className="text-xs text-slate-400 block">{supply.unit}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {supply.category ? (
                                                <div className="flex flex-col gap-0.5">
                                                    {supply.category.parent && (
                                                        <span className="text-xs text-slate-400">{supply.category.parent.name}</span>
                                                    )}
                                                    <Badge variant="secondary">{supply.category.name}</Badge>
                                                </div>
                                            ) : '-'}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <span className={`text-lg font-bold ${supply.current_stock === 0
                                                ? 'text-red-600'
                                                : supply.is_low_stock
                                                    ? 'text-amber-600'
                                                    : 'text-emerald-600'
                                                }`}>
                                                {supply.current_stock}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-center text-slate-500">
                                            {supply.min_stock}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {supply.current_stock === 0 ? (
                                                <Badge variant="destructive">Sin Stock</Badge>
                                            ) : supply.is_low_stock ? (
                                                <Badge className="bg-amber-500">Stock Bajo</Badge>
                                            ) : (
                                                <Badge className="bg-emerald-500">OK</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => openEntryModal(supply)}
                                                    title="Registrar entrada"
                                                >
                                                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => openExitModal(supply)}
                                                    disabled={supply.current_stock === 0}
                                                    title="Registrar salida"
                                                >
                                                    <TrendingDown className="h-4 w-4 text-red-600" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => router.visit(route('stock.movements', supply.id))}
                                                    title="Ver historial"
                                                >
                                                    <History className="h-4 w-4 text-blue-600" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        <PaginationLinks links={supplies.links} from={supplies.from} to={supplies.to} total={supplies.total} />
                    </CardContent>
                </Card>

                {/* Entry Modal */}
                <Dialog open={!!entryModal} onOpenChange={() => setEntryModal(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <TrendingUp className="text-emerald-600" /> Registrar Entrada
                            </DialogTitle>
                            <DialogDescription>
                                Agregando stock a: <strong>{entryModal?.name}</strong>
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={submitEntry} className="space-y-4">
                            <div>
                                <Label>Cantidad *</Label>
                                <Input
                                    type="number"
                                    min={1}
                                    value={entryForm.data.quantity}
                                    onChange={e => entryForm.setData('quantity', e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <Label>Motivo *</Label>
                                <Select value={entryForm.data.reason} onValueChange={v => entryForm.setData('reason', v)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="purchase">Compra</SelectItem>
                                        <SelectItem value="donation">Donación</SelectItem>
                                        <SelectItem value="return">Devolución</SelectItem>
                                        <SelectItem value="adjustment">Ajuste de Inventario</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Notas (opcional)</Label>
                                <Textarea
                                    value={entryForm.data.notes}
                                    onChange={e => entryForm.setData('notes', e.target.value)}
                                    placeholder="Ej: Factura #12345, Donación de ONG..."
                                />
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button type="button" variant="outline" onClick={() => setEntryModal(null)}>Cancelar</Button>
                                <Button type="submit" disabled={entryForm.processing} className="bg-emerald-600">
                                    <Plus className="h-4 w-4 mr-2" /> Registrar Entrada
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Exit Modal */}
                <Dialog open={!!exitModal} onOpenChange={() => setExitModal(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <TrendingDown className="text-red-600" /> Registrar Salida
                            </DialogTitle>
                            <DialogDescription>
                                Retirando stock de: <strong>{exitModal?.name}</strong> (Disponible: {exitModal?.current_stock})
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={submitExit} className="space-y-4">
                            <div>
                                <Label>Cantidad *</Label>
                                <Input
                                    type="number"
                                    min={1}
                                    max={exitModal?.current_stock}
                                    value={exitForm.data.quantity}
                                    onChange={e => exitForm.setData('quantity', e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <Label>Motivo *</Label>
                                <Select value={exitForm.data.reason} onValueChange={v => exitForm.setData('reason', v)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="loss">Merma/Pérdida</SelectItem>
                                        <SelectItem value="adjustment">Ajuste de Inventario</SelectItem>
                                        <SelectItem value="other">Otro</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Notas (opcional)</Label>
                                <Textarea
                                    value={exitForm.data.notes}
                                    onChange={e => exitForm.setData('notes', e.target.value)}
                                    placeholder="Explique el motivo de la salida..."
                                />
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button type="button" variant="outline" onClick={() => setExitModal(null)}>Cancelar</Button>
                                <Button type="submit" disabled={exitForm.processing} variant="destructive">
                                    <Minus className="h-4 w-4 mr-2" /> Registrar Salida
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
