import React, { useState, useEffect } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, Eye, FileText, ChevronLeft, ChevronRight, Inbox } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce'; // Usamos el hook que creamos antes

interface Props {
    cases: {
        data: any[];
        links: any[];
        current_page: number;
        last_page: number;
        total: number;
    };
    filters: {
        search?: string;
        status?: string;
    };
}

export default function CaseIndex({ cases, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || 'pending_all'); // Por defecto ver pendientes
    const debouncedSearch = useDebounce(search, 400);

    // Efecto para recargar la tabla cuando cambian los filtros
    useEffect(() => {
        router.get(
            route('cases.index'),
            { search: debouncedSearch, status },
            { preserveState: true, replace: true }
        );
    }, [debouncedSearch, status]);

    const getStatusBadge = (status: string) => {
        const styles: any = {
            open: "bg-blue-500 hover:bg-blue-600",
            in_progress: "bg-yellow-500 hover:bg-yellow-600",
            approved: "bg-green-500 hover:bg-green-600",
            rejected: "bg-red-500 hover:bg-red-600",
            closed: "bg-slate-500 hover:bg-slate-600"
        };

        const labels: any = {
            open: "Nuevo",
            in_progress: "En progreso",
            approved: "Aprobado",
            rejected: "Rechazado",
            closed: "Cerrado"
        };

        return <Badge className={styles[status] || "bg-gray-500"}>{labels[status] || status}</Badge>;
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Gestión', href: '#' }, { title: 'Bandeja de Casos', href: '/cases' }]}>
            <Head title="Bandeja de Casos" />

            <div className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-w-0 w-full">

                {/* CABECERA Y FILTROS */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Inbox /> Bandeja de Solicitudes
                        </h2>
                        <p className="text-sm text-slate-500">Gestione y audite las solicitudes entrantes.</p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                        {/* Selector de Estatus */}
                        <div className="w-full sm:w-48">
                            <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger>
                                    <Filter className="w-4 h-4 mr-2 text-slate-500" />
                                    <SelectValue placeholder="Filtrar..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pending_all">Pendientes (Todo)</SelectItem>
                                    <SelectItem value="open">Solo Nuevos</SelectItem>
                                    <SelectItem value="approved">Aprobados</SelectItem>
                                    <SelectItem value="rejected">Rechazados</SelectItem>
                                    <SelectItem value="all">Ver Todo el Historial</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Buscador */}
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Buscar folio, cédula..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </div>
                </div>

                {/* TABLA DE RESULTADOS */}
                <Card className="shadow-lg border-t-4 border-t-blue-600">
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-slate-50 dark:bg-neutral-700">
                                <TableRow>
                                    <TableHead>Folio</TableHead>
                                    <TableHead>Beneficiario</TableHead>
                                    <TableHead>Solicitud</TableHead>
                                    <TableHead>Fecha</TableHead>
                                    <TableHead>Estatus</TableHead>
                                    <TableHead className="text-right">Acción</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {cases.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center h-32 text-slate-500 dark:text-slate-400">
                                            No se encontraron solicitudes con estos filtros.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    cases.data.map((item) => (
                                        <TableRow key={item.id} className="hover:bg-slate-50/50 transition-colors dark:hover:bg-neutral-800">
                                            <TableCell className="font-mono font-medium text-blue-700 dark:text-blue-200">
                                                {item.case_number}
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-medium">{item.citizen.first_name} {item.citizen.last_name}</div>
                                                <div className="text-xs text-slate-500">{item.citizen.nationality}-{item.citizen.identification_value}</div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-medium">{item.category?.name}</div>
                                                <div className="text-xs text-slate-500 truncate max-w-[200px]" title={item.description}>
                                                    {item.description}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-xs">
                                                {new Date(item.created_at).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>
                                                {getStatusBadge(item.status)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Link href={route('cases.show', item.id)}>
                                                    <Button size="sm" variant="outline" className="gap-2 hover:bg-blue-50 hover:text-blue-700 border-slate-300 dark:hover:bg-neutral-700 dark:border-neutral-600 dark:text-blue-200">
                                                        <Eye className="w-4 h-4" /> Revisar
                                                    </Button>
                                                </Link>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>

                    {/* PAGINACIÓN */}
                    {cases.total > 10 && (
                        <div className="flex items-center justify-between p-4 border-t">
                            <div className="text-sm text-slate-500">
                                Mostrando {cases.data.length} de {cases.total} registros
                            </div>
                            <div className="flex gap-1">
                                {cases.links.map((link, i) => (
                                    <Link
                                        key={i}
                                        href={link.url || '#'}
                                        preserveState
                                        preserveScroll
                                        className={`px-3 py-1 text-sm rounded border ${link.active
                                            ? 'bg-blue-600 text-white border-blue-600'
                                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 dark:bg-neutral-700 dark:border-neutral-600 dark:text-slate-200 dark:hover:bg-neutral-800'
                                            } ${!link.url && 'opacity-50 pointer-events-none'}`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </Card>
            </div>
        </AppLayout>
    );
}