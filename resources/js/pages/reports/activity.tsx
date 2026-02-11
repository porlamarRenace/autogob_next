import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { FileDown, Calendar, TrendingUp, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Stats {
    total: number;
    by_status: Record<string, number>;
    by_category: Array<{
        name: string;
        total: number;
    }>;
}

interface Case {
    id: number;
    case_number: string;
    status: string;
    created_at: string;
    beneficiary: {
        first_name: string;
        last_name: string;
    };
    category: {
        name: string;
    };
}

interface Props {
    stats: Stats;
    cases: Case[];
    filters: {
        start_date: string;
        end_date: string;
    };
    is_manager: boolean;
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

export default function ActivityReport({ stats, cases, filters, is_manager }: Props) {
    const [startDate, setStartDate] = useState(filters.start_date);
    const [endDate, setEndDate] = useState(filters.end_date);
    const [useRange, setUseRange] = useState(filters.start_date !== filters.end_date);

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault();
        if (useRange) {
            router.get(route('reports.activity'), { start_date: startDate, end_date: endDate });
        } else {
            const today = new Date().toISOString().split('T')[0];
            router.get(route('reports.activity'), { start_date: today, end_date: today });
        }
    };

    const downloadPdf = () => {
        window.open(
            route('reports.activity.pdf') + `?start_date=${filters.start_date}&end_date=${filters.end_date}`,
            '_blank'
        );
    };

    const setToday = () => {
        const today = new Date().toISOString().split('T')[0];
        setStartDate(today);
        setEndDate(today);
        setUseRange(false);
        router.get(route('reports.activity'), { start_date: today, end_date: today });
    };

    return (
        <AppLayout>
            <Head title={is_manager ? 'Reporte de Actividad' : 'Mi Cierre de Caja'} />

            <div className="bg-slate-50/50 min-h-screen">
                <div className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold">
                                {is_manager ? 'Reporte de Actividad' : 'Mi Cierre de Caja'}
                            </h1>
                            <p className="text-muted-foreground">
                                {is_manager
                                    ? 'Estadísticas de casos creados en el sistema'
                                    : 'Resumen de tus casos creados'}
                            </p>
                        </div>
                        <Button
                            onClick={downloadPdf}
                            className="bg-[#ED2224] hover:bg-[#D11B1D] text-white font-medium shadow-sm transition-all active:scale-95"
                        >   
                            <FileDown className="h-4 w-4 mr-2" />
                            Descargar PDF
                        </Button>
                    </div>

                    <Card className="shadow-sm border-slate-200">
                        <CardHeader>
                            <CardTitle>Filtros de Fecha</CardTitle>
                            <CardDescription>
                                Selecciona el período para el reporte
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex gap-4">
                                    <Button
                                        type="button"
                                        variant={!useRange ? 'default' : 'outline'}
                                        onClick={setToday}
                                    >
                                        Hoy
                                    </Button>
                                    <Button
                                        type="button"
                                        variant={useRange ? 'default' : 'outline'}
                                        onClick={() => setUseRange(true)}
                                    >
                                        Rango de Fechas
                                    </Button>
                                </div>

                                {useRange && (
                                    <form onSubmit={handleFilter} className="flex flex-col md:flex-row gap-4 md:items-end">
                                        <div className="flex-1 w-full">
                                            <label className="text-sm font-medium mb-2 block">Fecha Inicio</label>
                                            <Input
                                                type="date"
                                                value={startDate}
                                                onChange={(e) => setStartDate(e.target.value)}
                                                required
                                                className="w-full"
                                            />
                                        </div>
                                        <div className="flex-1 w-full">
                                            <label className="text-sm font-medium mb-2 block">Fecha Fin</label>
                                            <Input
                                                type="date"
                                                value={endDate}
                                                onChange={(e) => setEndDate(e.target.value)}
                                                required
                                                className="w-full"
                                            />
                                        </div>
                                        <Button type="submit" className="w-full md:w-auto">
                                            <Calendar className="h-4 w-4 mr-2" />
                                            Aplicar
                                        </Button>
                                    </form>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Estadísticas Generales */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card className="shadow-sm border-slate-200">
                            <CardHeader className="pb-2">
                                <CardDescription>Total de Casos</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-3xl font-bold flex items-center gap-2">
                                    <TrendingUp className="h-6 w-6 text-blue-500" />
                                    {stats.total}
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="shadow-sm border-slate-200">
                            <CardHeader className="pb-2">
                                <CardDescription>Aprobados</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-3xl font-bold flex items-center gap-2 text-green-600">
                                    <CheckCircle className="h-6 w-6" />
                                    {stats.by_status.approved || 0}
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="shadow-sm border-slate-200">
                            <CardHeader className="pb-2">
                                <CardDescription>En Revisión</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-3xl font-bold flex items-center gap-2 text-yellow-600">
                                    <AlertCircle className="h-6 w-6" />
                                    {stats.by_status.in_progress || 0}
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="shadow-sm border-slate-200">
                            <CardHeader className="pb-2">
                                <CardDescription>Rechazados</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-3xl font-bold flex items-center gap-2 text-red-600">
                                    <XCircle className="h-6 w-6" />
                                    {stats.by_status.rejected || 0}
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Desglose por Categoría */}
                    <Card className="shadow-sm border-slate-200">
                        <CardHeader>
                            <CardTitle>Desglose por Categoría</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {stats.by_category.length === 0 ? (
                                <p className="text-center text-muted-foreground py-4">No hay datos para mostrar</p>
                            ) : (
                                <div className="space-y-3">
                                    {stats.by_category.map((cat, index) => (
                                        <div key={index} className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="font-medium">{cat.name}</span>
                                                    <span className="text-sm text-muted-foreground">{cat.total} casos</span>
                                                </div>
                                                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-blue-500"
                                                        style={{ width: `${(cat.total / stats.total) * 100}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Lista de Casos */}
                    <Card className="shadow-sm border-slate-200">
                        <CardHeader>
                            <CardTitle>Casos Creados ({cases.length})</CardTitle>
                            <CardDescription>
                                {filters.start_date === filters.end_date
                                    ? `Casos del ${format(new Date(filters.start_date), "d 'de' MMMM, yyyy", { locale: es })}`
                                    : `Del ${format(new Date(filters.start_date), 'd MMM', { locale: es })} al ${format(new Date(filters.end_date), "d MMM yyyy", { locale: es })}`}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {cases.length === 0 ? (
                                <div className="text-center text-muted-foreground py-12">
                                    <p className="text-lg">No hay casos en este período</p>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Caso</TableHead>
                                            <TableHead>Beneficiario</TableHead>
                                            <TableHead>Categoría</TableHead>
                                            <TableHead>Fecha</TableHead>
                                            <TableHead>Estado</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {cases.map((caso) => (
                                            <TableRow key={caso.id}>
                                                <TableCell className="font-medium">{caso.case_number}</TableCell>
                                                <TableCell>
                                                    {caso.beneficiary.first_name} {caso.beneficiary.last_name}
                                                </TableCell>
                                                <TableCell>{caso.category.name}</TableCell>
                                                <TableCell>
                                                    {format(new Date(caso.created_at), "d MMM yyyy", { locale: es })}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={statusColors[caso.status]}>
                                                        {statusLabels[caso.status] || caso.status}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>

                </div>
            </div>
        </AppLayout >
    );
}
