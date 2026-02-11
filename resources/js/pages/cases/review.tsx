import React, { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react'; // Usar router para visitas manuales
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle2, XCircle, FileText, User, UserPlus, Save, ArrowLeft, ShieldAlert, Gift, Download } from 'lucide-react';
import Swal from 'sweetalert2';
import axios from 'axios';
import CaseAttachments from '@/components/CaseAttachments';

interface Props {
    socialCase: any;
    specialists: any[];
    can: { assign: boolean; review: boolean };
}

export default function Review({ socialCase, specialists, can }: Props) {
    const [processing, setProcessing] = useState(false);

    // Estado local para el estado del caso
    const [caseStatus, setCaseStatus] = useState(socialCase.status);

    // Estado para Asignación
    const [selectedSpecialist, setSelectedSpecialist] = useState(socialCase.assigned_to?.toString() || '');

    // Estado para Revisión (Items)
    const [itemsReview, setItemsReview] = useState(
        socialCase.items.map((item: any) => ({
            id: item.id,
            name: item.itemable?.name || 'Ítem',
            requested_qty: item.quantity,
            approved_qty: item.approved_quantity !== null ? item.approved_quantity : item.quantity,
            status: item.status, // pending, approved, rejected, fulfilled
            review_note: item.review_note || '',
            unit: item.itemable?.unit || 'UND',
            fulfilled_at: item.fulfilled_at || null
        }))
    );

    // Estado para items seleccionados (para asignación granular)
    const [selectedItems, setSelectedItems] = useState<number[]>([]);

    // --- LÓGICA DE ASIGNACIÓN ---
    const handleAssign = () => {
        if (!selectedSpecialist) return Swal.fire('Error', 'Seleccione un especialista', 'warning');

        const isGranular = selectedItems.length > 0;
        const confirmText = isGranular
            ? `¿Asignar ${selectedItems.length} ítem(s) al especialista seleccionado?`
            : '¿Asignar el caso completo al especialista?';

        Swal.fire({
            title: 'Confirmar Asignación',
            text: confirmText,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, asignar'
        }).then((result) => {
            if (result.isConfirmed) {
                router.put(route('cases.assign', socialCase.id), {
                    assigned_to: selectedSpecialist,
                    item_ids: isGranular ? selectedItems : null
                }, {
                    onSuccess: () => {
                        Swal.fire('Asignado', 'La asignación se ha procesado correctamente.', 'success');
                        setSelectedItems([]); // Limpiar selección
                    },
                    preserveScroll: true
                });
            }
        });
    };

    // Toggle selección de ítem
    const toggleSelectItem = (itemId: number) => {
        setSelectedItems(prev =>
            prev.includes(itemId)
                ? prev.filter(id => id !== itemId)
                : [...prev, itemId]
        );
    };

    // Toggle seleccionar todos
    const toggleSelectAll = () => {
        if (selectedItems.length === itemsReview.length) {
            setSelectedItems([]);
        } else {
            setSelectedItems(itemsReview.map((i: any) => i.id));
        }
    };

    // --- LÓGICA DE REVISIÓN ---
    const handleStatusChange = (index: number, newStatus: string) => {
        const updated = [...itemsReview];
        updated[index].status = newStatus;
        if (newStatus === 'rejected') updated[index].approved_qty = 0;
        else if (newStatus === 'approved' && updated[index].approved_qty === 0) updated[index].approved_qty = updated[index].requested_qty;
        setItemsReview(updated);
    };

    const handleQtyChange = (index: number, val: string) => {
        const updated = [...itemsReview];
        updated[index].approved_qty = parseInt(val) || 0;
        setItemsReview(updated);
    };

    // --- MARCAR COMO CUMPLIDO ---
    const handleFulfill = async (index: number, itemId: number) => {
        const result = await Swal.fire({
            title: '¿Marcar como cumplido?',
            text: 'Esto indica que el ítem fue entregado o el servicio realizado.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, marcar cumplido',
            cancelButtonText: 'Cancelar'
        });

        if (!result.isConfirmed) return;

        try {
            const response = await axios.post(`/api/cases/${socialCase.id}/items/${itemId}/fulfill`);
            if (response.data.success) {
                const updated = [...itemsReview];
                updated[index].status = 'fulfilled';
                updated[index].fulfilled_at = new Date().toISOString();
                setItemsReview(updated);

                if (response.data.case_status) {
                    setCaseStatus(response.data.case_status);
                }

                Swal.fire('¡Cumplido!', response.data.message, 'success').then(() => {
                    if (response.data.case_closed) {
                        window.location.reload();
                    }
                });
            }
        } catch (error: any) {
            Swal.fire('Error', error.response?.data?.message || 'No se pudo procesar', 'error');
        }
    };

    const submitReview = async () => {
        // Calculamos si aprobamos o rechazamos el caso global
        // Lógica: Si hay AL MENOS UN item aprobado, el caso se considera aprobado (se entregará algo).
        // Si TODO está rechazado, el caso se rechaza.
        const anyApproved = itemsReview.some((i: any) => i.status === 'approved');
        const globalStatus = anyApproved ? 'approved' : 'rejected';

        const result = await Swal.fire({
            title: 'Confirmar Decisión',
            text: `Se procesará el caso como ${globalStatus.toUpperCase()}. ¿Continuar?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, finalizar revisión',
            cancelButtonText: 'Volver'
        });

        if (result.isConfirmed) {
            setProcessing(true);
            try {
                await axios.post(route('cases.review', socialCase.id), {
                    items: itemsReview,
                    general_status: globalStatus
                });
                Swal.fire('Procesado', 'Auditoría guardada exitosamente', 'success').then(() => {
                    window.location.href = '/cases'; // Volver a la bandeja
                });
            } catch (error) {
                Swal.fire('Error', 'No se pudo procesar', 'error');
                setProcessing(false);
            }
        }
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Casos', href: '/cases' }, { title: `Gestión #${socialCase.case_number}`, href: '#' }]}>
            <Head title={`Gestión ${socialCase.case_number}`} />

            <div className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <ShieldAlert className="text-blue-600" /> Centro de Control
                        </h2>
                        <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                            <span>Folio: {socialCase.case_number}</span>
                            <span className="text-slate-300">|</span>
                            <span>Estado Actual: <Badge variant="outline">{socialCase.status.toUpperCase().replace('_', ' ')}</Badge></span>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            asChild
                            className="bg-[#ED2224] hover:bg-[#D11B1D] text-white hover:text-white border-none font-medium shadow-sm transition-all active:scale-95"
                        >
                            <a href={route('reports.case.pdf', socialCase.id)} target="_blank" rel="noopener noreferrer">
                                <Download className="mr-2 h-4 w-4" /> Descargar PDF
                            </a>
                        </Button>
                        <Button variant="outline" onClick={() => window.history.back()}>
                            <ArrowLeft className="mr-2 h-4 w-4" /> Volver a la bandeja
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* COLUMNA IZQUIERDA: INFO + ASIGNACIÓN */}
                    <div className="lg:col-span-1 space-y-6">

                        {/* 1. TARJETA DE BENEFICIARIO (Resumen) */}
                        <Card className="bg-slate-50 border-slate-200 dark:bg-neutral-950">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-bold text-slate-500 uppercase">Beneficiario</CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm space-y-2">
                                <div className="text-lg font-medium">{socialCase.citizen.first_name} {socialCase.citizen.last_name}</div>
                                <div className="font-mono text-slate-500">{socialCase.citizen.nationality}-{socialCase.citizen.identification_value}</div>
                                {socialCase.citizen.age !== null && socialCase.citizen.age !== undefined && (
                                    <div className="text-slate-600 dark:text-slate-400">Edad: <span className="font-semibold">{socialCase.citizen.age} años</span></div>
                                )}
                                {socialCase.description && (
                                    <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                                        <span className="text-xs font-bold text-slate-400 uppercase">Observación del caso</span>
                                        <p className="text-slate-600 dark:text-slate-300 mt-0.5">{socialCase.description}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* 2. TARJETA DE ASIGNACIÓN (Solo si tiene permiso 'assign') */}
                        {can.assign && caseStatus !== 'closed' && (
                            <Card className="border-t-4 border-t-orange-500 shadow-md">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <UserPlus className="h-5 w-5 text-orange-600" />
                                        {socialCase.assigned_to
                                            ? (selectedItems.length > 0 ? 'Asignar Ítems' : 'Reasignar Caso')
                                            : (selectedItems.length > 0 ? 'Asignar Ítems' : 'Asignar Caso')
                                        }
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="text-sm text-slate-500">
                                        {selectedItems.length > 0
                                            ? `Se asignarán ${selectedItems.length} ítem(s) seleccionados al usuario.`
                                            : 'Se asignará TODO el caso al usuario (Cabecera).'
                                        }
                                    </div>
                                    <div>
                                        <Label>Seleccionar Funcionario</Label>
                                        <Select value={selectedSpecialist} onValueChange={setSelectedSpecialist}>
                                            <SelectTrigger className="mt-1.5">
                                                <SelectValue placeholder="Seleccione..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {specialists.map((user) => (
                                                    <SelectItem key={user.id} value={user.id.toString()}>
                                                        {user.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <Button
                                        className="w-full bg-orange-600 hover:bg-orange-700"
                                        onClick={handleAssign}
                                        disabled={!selectedSpecialist}
                                    >
                                        <Save className="mr-2 h-4 w-4" />
                                        Guardar Asignación
                                    </Button>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* COLUMNA DERECHA: AUDITORÍA DE ÍTEMS */}
                    <div className="lg:col-span-2">
                        {can.review ? (
                            <Card className="shadow-lg border-t-4 border-t-purple-600 h-full">
                                <CardHeader className="border-b bg-slate-50/50 dark:bg-neutral-950">
                                    <CardTitle className="flex justify-between items-center">
                                        <span>Decisión y Auditoría</span>
                                    </CardTitle>
                                    <p className="text-sm text-slate-500 font-normal mt-1">
                                        Revise cada ítem solicitado. Puede aprobar cantidades parciales y asignar ítems individualmente.
                                    </p>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    {can.assign && (
                                                        <TableHead className="w-10 text-center">
                                                            <input
                                                                type="checkbox"
                                                                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                                                                checked={selectedItems.length === itemsReview.length && itemsReview.length > 0}
                                                                onChange={toggleSelectAll}
                                                            />
                                                        </TableHead>
                                                    )}
                                                    <TableHead className="pl-6">Descripción</TableHead>
                                                    <TableHead className="text-center">Solicitado</TableHead>
                                                    <TableHead className="text-center w-32">Aprobar</TableHead>
                                                    <TableHead className="text-center w-36 pr-6">Acción</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {itemsReview.map((item: any, idx: number) => (
                                                    <TableRow key={item.id} className={item.status === 'rejected' ? 'bg-red-50/40 dark:bg-red-500/40' : item.status === 'approved' ? 'bg-green-50/40 dark:bg-green-500/40' : ''}>
                                                        {can.assign && (
                                                            <TableCell className="text-center align-top pt-4">
                                                                <input
                                                                    type="checkbox"
                                                                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                                                                    checked={selectedItems.includes(item.id)}
                                                                    onChange={() => toggleSelectItem(item.id)}
                                                                />
                                                            </TableCell>
                                                        )}
                                                        <TableCell className="pl-6 align-top pt-4">
                                                            <div className="font-medium text-slate-800 dark:text-slate-200">{item.name}</div>
                                                            <div className="text-xs text-slate-500 mb-1">
                                                                Asignado a: <span className="font-semibold">{socialCase.items.find((i: any) => i.id === item.id)?.assigned_to?.name || 'General'}</span>
                                                            </div>
                                                            <Input
                                                                placeholder="Nota (Ej: Sin stock)..."
                                                                className="focus-visible:ring-[#005BBB]/30 focus-visible:border-[#005BBB] [&:-webkit-autofill]:shadow-[0_0_0_1000px_white_inset]"
                                                                value={item.review_note}
                                                                onChange={(e) => {
                                                                    const up = [...itemsReview];
                                                                    up[idx].review_note = e.target.value;
                                                                    setItemsReview(up);
                                                                }}
                                                            />
                                                        </TableCell>

                                                        <TableCell className="text-center align-top pt-4">
                                                            <div className="text-lg font-bold text-slate-500">{item.requested_qty}</div>
                                                            <div className="text-[10px] uppercase">{item.unit}</div>
                                                        </TableCell>

                                                        <TableCell className="text-center align-top pt-3">
                                                            <Input
                                                                type="number"
                                                                className={`h-9 text-center font-bold focus-visible:ring-[#005BBB]/30 focus-visible:border-[#005BBB] [&:-webkit-autofill]:shadow-[0_0_0_1000px_white_inset] ${item.status === 'rejected' ? 'text-slate-300 bg-slate-50' :
                                                                    item.approved_qty < item.requested_qty ? 'text-orange-600 border-orange-300' : 'text-green-600'
                                                                    }`}
                                                                value={item.approved_qty}
                                                                onChange={(e) => handleQtyChange(idx, e.target.value)}
                                                                disabled={item.status === 'rejected' || caseStatus === 'closed' || caseStatus === 'rejected'}
                                                                min={0}
                                                                max={item.requested_qty}
                                                            />
                                                        </TableCell>

                                                        <TableCell className="text-center align-top pt-3 pr-6">
                                                            <div className="flex justify-end gap-1">
                                                                {/* Botón Cumplido - solo para ítems aprobados */}
                                                                {item.status === 'approved' && (
                                                                    <Button
                                                                        size="icon"
                                                                        variant="outline"
                                                                        className="h-9 w-9 rounded-full text-purple-600 hover:bg-purple-100 hover:text-purple-700 border-purple-300"
                                                                        onClick={() => handleFulfill(idx, item.id)}
                                                                        title="Marcar como Cumplido/Entregado"
                                                                    >
                                                                        <Gift className="h-5 w-5" />
                                                                    </Button>
                                                                )}
                                                                {/* Badge de Cumplido */}
                                                                {item.status === 'fulfilled' && (
                                                                    <Badge className="bg-purple-600 text-white text-xs">
                                                                        ✓ Cumplido
                                                                    </Badge>
                                                                )}
                                                                {/* Botones de Aprobar/Rechazar - solo si no está cumplido */}
                                                                {item.status !== 'fulfilled' && (
                                                                    <>
                                                                        <Button
                                                                            size="icon"
                                                                            variant={item.status === 'approved' ? 'default' : 'outline'}
                                                                            className={`h-9 w-9 rounded-full ${item.status === 'approved' ? 'bg-green-600 hover:bg-green-700' : 'text-slate-400 dark:hover:bg-green-600 '}`}
                                                                            onClick={() => handleStatusChange(idx, 'approved')}
                                                                            disabled={caseStatus === 'closed' || caseStatus === 'rejected'}
                                                                            title="Aprobar Ítem"
                                                                        >
                                                                            <CheckCircle2 className="h-5 w-5" />
                                                                        </Button>
                                                                        <Button
                                                                            size="icon"
                                                                            variant={item.status === 'rejected' ? 'destructive' : 'outline'}
                                                                            className={`h-9 w-9 rounded-full ${item.status === 'rejected' ? '' : 'text-slate-400 hover:text-red-500 hover:border-red-200'}`}
                                                                            onClick={() => handleStatusChange(idx, 'rejected')}
                                                                            disabled={caseStatus === 'closed' || caseStatus === 'rejected'}
                                                                            title="Rechazar Ítem"
                                                                        >
                                                                            <XCircle className="h-5 w-5" />
                                                                        </Button>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>

                                    {/* Footer con Botón Final */}
                                    {caseStatus !== 'closed' && caseStatus !== 'rejected' && (
                                        <div className="p-6 bg-slate-50 dark:bg-neutral-950 border-t flex flex-col md:flex-row justify-between items-center gap-4">
                                            <div className="text-xs text-slate-500 max-w-sm">
                                                * Al finalizar, el caso cambiará de estatus automáticamente según los ítems aprobados.
                                            </div>
                                            <Button
                                                size="lg"
                                                onClick={submitReview}
                                                disabled={processing}
                                                className="bg-purple-700 hover:bg-purple-800 text-white shadow-md w-full md:w-auto"
                                            >
                                                {processing ? 'Procesando...' : <><Save className="mr-2 h-4 w-4" /> Finalizar Revisión</>}
                                            </Button>
                                        </div>
                                    )}
                                    {(caseStatus === 'closed' || caseStatus === 'rejected') && (
                                        <div className="p-6 bg-slate-50 dark:bg-neutral-950 border-t text-center text-sm text-gray-500">
                                            Este caso ha sido finalizado ({caseStatus === 'closed' ? 'Cerrado' : 'Rechazado'}). No se pueden realizar más cambios.
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="h-full flex items-center justify-center p-12 border-2 border-dashed rounded-lg bg-slate-50 text-slate-400">
                                No tienes permisos para auditar/aprobar ítems.
                            </div>
                        )}
                    </div>
                </div>

                {/* SECCIÓN DE ARCHIVOS ADJUNTOS - Ancho completo abajo */}
                <div className="mt-6">
                    <CaseAttachments
                        caseId={socialCase.id}
                        initialAttachments={socialCase.media?.filter((m: any) => m.collection_name === 'attachments').map((m: any) => ({
                            id: m.id,
                            name: m.file_name,
                            url: m.original_url || `/storage/${m.id}/${m.file_name}`,
                            size: m.size,
                            description: m.custom_properties?.description || '',
                            mime_type: m.mime_type
                        })) || []}
                        canUpload={caseStatus !== 'closed'}
                        canDelete={caseStatus !== 'closed'}
                    />
                </div>
            </div>
        </AppLayout>
    );
}