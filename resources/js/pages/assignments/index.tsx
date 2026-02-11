import { Head, router, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { FileDown, CheckCircle, XCircle, Eye, Filter, TrendingUp, FileText, Package, CheckSquare, Gift } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useState } from 'react';
import Swal from 'sweetalert2';

interface CaseItem {
    id: number;
    social_case_id: number;
    itemable_id: number;
    itemable_type: string;
    quantity: number;
    status: string;
    notes?: string;
    created_at: string;
    itemable: {
        name: string;
    };
    social_case?: {
        case_number: string;
        status: string;
        created_at: string;
        beneficiary: {
            first_name: string;
            last_name: string;
        };
    };
}

interface SocialCase {
    id: number;
    case_number: string;
    beneficiary_id: number;
    category_id: number;
    status: string;
    created_at: string;
    beneficiary: {
        first_name: string;
        last_name: string;
    };
    category: {
        name: string;
    };
    items: CaseItem[];
}

interface Props {
    assignedCases: {
        data: SocialCase[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    assignedItems: {
        data: CaseItem[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    stats: {
        total_cases: number;
        total_items: number;
        pending_cases: number;
        pending_items: number;
        approved_rate: number;
    };
    filters: {
        status?: string;
        type?: string;
        start_date: string;
        end_date: string;
    };
}

const statusColors: Record<string, string> = {
    open: 'bg-blue-500',
    pending: 'bg-yellow-500',
    in_progress: 'bg-yellow-500',
    approved: 'bg-green-500',
    rejected: 'bg-red-500',
    fulfilled: 'bg-purple-500',
    closed: 'bg-gray-500',
};

const statusLabels: Record<string, string> = {
    open: 'Abierto',
    pending: 'En proceso',
    in_progress: 'En revisión',
    approved: 'Aprobado',
    rejected: 'Rechazado',
    fulfilled: 'Entregado',
    closed: 'Cerrado',
};

export default function MyAssignments({ assignedCases, assignedItems, stats, filters }: Props) {
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
    const [typeFilter, setTypeFilter] = useState(filters.type || 'all');
    const [startDate, setStartDate] = useState(filters.start_date);
    const [endDate, setEndDate] = useState(filters.end_date);
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
    const [rejectTarget, setRejectTarget] = useState<{ type: 'item' | 'case'; id: number } | null>(null);

    const rejectForm = useForm({
        reason: '',
    });

    const applyFilters = () => {
        router.get(route('assignments.index'), {
            status: statusFilter !== 'all' ? statusFilter : undefined,
            type: typeFilter !== 'all' ? typeFilter : undefined,
            start_date: startDate,
            end_date: endDate,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const clearFilters = () => {
        setStatusFilter('all');
        setTypeFilter('all');
        setStartDate(filters.start_date);
        setEndDate(filters.end_date);
        router.get(route('assignments.index'));
    };

    const downloadPDF = () => {
        window.open(route('assignments.pdf', {
            status: statusFilter !== 'all' ? statusFilter : undefined,
            type: typeFilter !== 'all' ? typeFilter : undefined,
            start_date: startDate,
            end_date: endDate,
        }), '_blank');
    };

    const handleApproveItem = async (itemId: number) => {
        try {
            await router.post(route('assignments.items.approve', itemId), {}, {
                onSuccess: () => {
                    Swal.fire('¡Aprobado!', 'Item aprobado exitosamente', 'success');
                },
                onError: () => {
                    Swal.fire('Error', 'Error al aprobar el item', 'error');
                },
            });
        } catch (error) {
            Swal.fire('Error', 'Error al aprobar el item', 'error');
        }
    };

    const handleApproveCase = async (caseId: number) => {
        try {
            await router.post(route('assignments.cases.approve', caseId), {}, {
                onSuccess: () => {
                    Swal.fire('¡Aprobado!', 'Caso aprobado exitosamente', 'success');
                },
                onError: () => {
                    Swal.fire('Error', 'Error al aprobar el caso', 'error');
                },
            });
        } catch (error) {
            Swal.fire('Error', 'Error al aprobar el caso', 'error');
        }
    };

    const handleFulfillItem = async (itemId: number) => {
        const result = await Swal.fire({
            title: '¿Marcar como Entregado?',
            text: 'Esto confirmará que el beneficiario ha recibido el beneficio.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, marcar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await router.post(route('assignments.items.fulfill', itemId), {}, {
                    onSuccess: () => {
                        Swal.fire('¡Entregado!', 'El item ha sido marcado como entregado.', 'success');
                    },
                    onError: () => {
                        Swal.fire('Error', 'Error al procesar la entrega', 'error');
                    },
                });
            } catch (error) {
                Swal.fire('Error', 'Error al procesar la entrega', 'error');
            }
        }
    };

    const openRejectDialog = (type: 'item' | 'case', id: number) => {
        setRejectTarget({ type, id });
        setRejectDialogOpen(true);
        rejectForm.reset();
    };

    const handleReject = () => {
        if (!rejectTarget) return;

        const endpoint = rejectTarget.type === 'item'
            ? route('assignments.items.reject', rejectTarget.id)
            : route('assignments.cases.reject', rejectTarget.id);

        rejectForm.post(endpoint, {
            onSuccess: () => {
                Swal.fire('Rechazado', `${rejectTarget.type === 'item' ? 'Item' : 'Caso'} rechazado correctamente`, 'success');
                setRejectDialogOpen(false);
                setRejectTarget(null);
            },
            onError: () => {
                Swal.fire('Error', 'Error al rechazar', 'error');
            },
        });
    };

    return (
        <AppLayout>
            <Head title="Mis Asignaciones" />

            <div className="bg-slate-50/50 min-h-screen">
                <div className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold">Mis Asignaciones</h1>
                            <p className="text-muted-foreground">
                                Gestiona los casos e items asignados a ti
                            </p>
                        </div>
                        <Button
                            onClick={downloadPDF}
                            className="bg-[#ED2224] hover:bg-[#D11B1D] text-white font-medium shadow-sm transition-all active:scale-95"
                        >
                            <FileDown className="h-4 w-4 mr-2" />
                            Descargar PDF
                        </Button>
                    </div>

                    {/* Filtros */}
                    <Card className="shadow-sm border-slate-200">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Filter className="h-5 w-5" />
                                Filtros
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                <div>
                                    <Label>Tipo</Label>
                                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Todos" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todos</SelectItem>
                                            <SelectItem value="cases">Solo Casos</SelectItem>
                                            <SelectItem value="items">Solo Items</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Status</Label>
                                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Todos" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todos</SelectItem>
                                            <SelectItem value="pending">Pendientes</SelectItem>
                                            <SelectItem value="approved">Aprobados</SelectItem>
                                            <SelectItem value="rejected">Rechazados</SelectItem>
                                            <SelectItem value="closed">Cerrados</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Fecha Inicio</Label>
                                    <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                                </div>
                                <div>
                                    <Label>Fecha Fin</Label>
                                    <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                                </div>
                                <div className="flex items-end gap-2">
                                    <Button onClick={applyFilters} className="flex-1">Aplicar</Button>
                                    <Button onClick={clearFilters} variant="outline">Limpiar</Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Estadísticas */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card className="shadow-sm border-slate-200">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Casos Asignados</CardTitle>
                                <FileText className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.total_cases}</div>
                                <p className="text-xs text-muted-foreground">
                                    {stats.pending_cases} pendientes
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="shadow-sm border-slate-200">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Items Asignados</CardTitle>
                                <Package className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.total_items}</div>
                                <p className="text-xs text-muted-foreground">
                                    {stats.pending_items} pendientes
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="shadow-sm border-slate-200">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Pendientes</CardTitle>
                                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {stats.pending_cases + stats.pending_items}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Requieren atención
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="shadow-sm border-slate-200">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Tasa de Aprobación</CardTitle>
                                <CheckSquare className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.approved_rate}%</div>
                                <p className="text-xs text-muted-foreground">
                                    Items aprobados
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Tabs de contenido */}
                    <Tabs defaultValue="cases" className="space-y-4">
                        <TabsList>
                            <TabsTrigger value="cases">Casos Completos ({assignedCases.total})</TabsTrigger>
                            <TabsTrigger value="items">Items Individuales ({assignedItems.total})</TabsTrigger>
                        </TabsList>

                        {/* Tab de Casos */}
                        <TabsContent value="cases" className="space-y-4">
                            <Card className="shadow-sm border-slate-200">
                                <CardHeader>
                                    <CardTitle>Casos Asignados</CardTitle>
                                    <CardDescription>Casos completos asignados para tu revisión</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {assignedCases.data.length === 0 ? (
                                        <p className="text-center text-muted-foreground py-8">
                                            No tienes casos asignados
                                        </p>
                                    ) : (
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Caso #</TableHead>
                                                    <TableHead>Beneficiario</TableHead>
                                                    <TableHead>Categoría</TableHead>
                                                    <TableHead>Items</TableHead>
                                                    <TableHead>Fecha</TableHead>
                                                    <TableHead>Estado</TableHead>
                                                    <TableHead className="text-right">Acciones</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {assignedCases.data.map((caso) => (
                                                    <TableRow key={caso.id}>
                                                        <TableCell className="font-medium">{caso.case_number}</TableCell>
                                                        <TableCell>
                                                            {caso.beneficiary.first_name} {caso.beneficiary.last_name}
                                                        </TableCell>
                                                        <TableCell>{caso.category.name}</TableCell>
                                                        <TableCell>{caso.items.length} items</TableCell>
                                                        <TableCell>
                                                            {format(new Date(caso.created_at), "d 'de' MMM, yyyy", { locale: es })}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge className={statusColors[caso.status]}>
                                                                {statusLabels[caso.status] || caso.status}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-right space-x-2">
                                                            {(caso.status === 'pending' || caso.status === 'in_progress' || caso.status === 'open') && (
                                                                <>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        onClick={() => handleApproveCase(caso.id)}
                                                                    >
                                                                        <CheckCircle className="h-4 w-4 mr-1" />
                                                                        Aprobar Todo
                                                                    </Button>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="destructive"
                                                                        onClick={() => openRejectDialog('case', caso.id)}
                                                                    >
                                                                        <XCircle className="h-4 w-4 mr-1" />
                                                                        Rechazar
                                                                    </Button>
                                                                </>
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Tab de Items */}
                        <TabsContent value="items" className="space-y-4">
                            <Card className="shadow-sm border-slate-200">
                                <CardHeader>
                                    <CardTitle>Items Individuales</CardTitle>
                                    <CardDescription>Items específicos asignados para tu aprobación</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {assignedItems.data.length === 0 ? (
                                        <p className="text-center text-muted-foreground py-8">
                                            No tienes items asignados
                                        </p>
                                    ) : (
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Caso #</TableHead>
                                                    <TableHead>Beneficiario</TableHead>
                                                    <TableHead>Item</TableHead>
                                                    <TableHead>Cantidad</TableHead>
                                                    <TableHead>Fecha</TableHead>
                                                    <TableHead>Estado</TableHead>
                                                    <TableHead className="text-right">Acciones</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {assignedItems.data.map((item) => (
                                                    <TableRow key={item.id}>
                                                        <TableCell className="font-medium">
                                                            {item.social_case?.case_number}
                                                        </TableCell>
                                                        <TableCell>
                                                            {item.social_case?.beneficiary.first_name}{' '}
                                                            {item.social_case?.beneficiary.last_name}
                                                        </TableCell>
                                                        <TableCell>{item.itemable.name}</TableCell>
                                                        <TableCell>{item.quantity}</TableCell>
                                                        <TableCell>
                                                            {format(new Date(item.created_at), "d 'de' MMM, yyyy", { locale: es })}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge className={statusColors[item.status]}>
                                                                {statusLabels[item.status] || item.status}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-right space-x-2">
                                                            {(item.status === 'pending' || item.status === 'in_progress' || item.status === 'open') && (
                                                                <>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        onClick={() => handleApproveItem(item.id)}
                                                                    >
                                                                        <CheckCircle className="h-4 w-4 mr-1" />
                                                                        Aprobar
                                                                    </Button>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="destructive"
                                                                        onClick={() => openRejectDialog('item', item.id)}
                                                                    >
                                                                        <XCircle className="h-4 w-4 mr-1" />
                                                                        Rechazar
                                                                    </Button>
                                                                </>
                                                            )}
                                                            {item.status === 'approved' && (
                                                                <Button
                                                                    size="sm"
                                                                    className="bg-purple-600 hover:bg-purple-700 text-white"
                                                                    onClick={() => handleFulfillItem(item.id)}
                                                                >
                                                                    <Gift className="h-4 w-4 mr-1" />
                                                                    Entregado
                                                                </Button>
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>

            {/* Modal de Rechazo */}
            <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Rechazar {rejectTarget?.type === 'item' ? 'Item' : 'Caso'}</DialogTitle>
                        <DialogDescription>
                            Debes proporcionar un motivo para el rechazo (mínimo 10 caracteres)
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="reason">Motivo del rechazo *</Label>
                            <Textarea
                                id="reason"
                                value={rejectForm.data.reason}
                                onChange={(e) => rejectForm.setData('reason', e.target.value)}
                                placeholder="Explica por qué estás rechazando esto..."
                                rows={4}
                                className={rejectForm.errors.reason ? 'border-red-500' : ''}
                            />
                            {rejectForm.errors.reason && (
                                <p className="text-sm text-red-500 mt-1">{rejectForm.errors.reason}</p>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
                            Cancelar
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleReject}
                            disabled={rejectForm.processing || rejectForm.data.reason.length < 10}
                        >
                            {rejectForm.processing ? 'Rechazando...' : 'Confirmar Rechazo'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
