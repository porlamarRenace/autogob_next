import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileDown, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Item {
    itemable_id: number;
    itemable_type: string;
    total_delivered: number;
    last_delivery: string;
    itemable: {
        name: string;
    };
}

interface Props {
    items: Item[];
    filters: {
        start_date: string;
        end_date: string;
    };
}

export default function StockReport({ items, filters }: Props) {
    const [startDate, setStartDate] = useState(filters.start_date);
    const [endDate, setEndDate] = useState(filters.end_date);

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('reports.stock'), { start_date: startDate, end_date: endDate }, {
            preserveState: true
        });
    };

    const downloadPdf = () => {
        window.open(
            route('reports.stock.pdf') + `?start_date=${startDate}&end_date=${endDate}`,
            '_blank'
        );
    };

    const totalItems = items.reduce((sum, item) => sum + Number(item.total_delivered), 0);

    return (
        <AppLayout>
            <Head title="Reporte de Stock" />

            <div className="bg-slate-50/50 min-h-screen">
                <div className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold">Reporte de Stock</h1>
                            <p className="text-muted-foreground">
                                Items entregados por rango de fechas
                            </p>
                        </div>
                        <Button onClick={downloadPdf}>
                            <FileDown className="h-4 w-4 mr-2" />
                            Descargar PDF
                        </Button>
                    </div>

                    <Card className="shadow-sm border-slate-200">
                        <CardHeader>
                            <CardTitle>Filtros de Fecha</CardTitle>
                            <CardDescription>
                                Selecciona el rango de fechas para el reporte
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
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
                                    Aplicar Filtros
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="shadow-sm border-slate-200">
                            <CardHeader className="pb-2">
                                <CardDescription>Total de Items Entregados</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-3xl font-bold">{totalItems}</p>
                            </CardContent>
                        </Card>
                        <Card className="shadow-sm border-slate-200">
                            <CardHeader className="pb-2">
                                <CardDescription>Tipos de Items</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-3xl font-bold">{items.length}</p>
                            </CardContent>
                        </Card>
                        <Card className="shadow-sm border-slate-200">
                            <CardHeader className="pb-2">
                                <CardDescription>Período</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm font-medium">
                                    {format(new Date(startDate), 'd MMM', { locale: es })} - {format(new Date(endDate), 'd MMM yyyy', { locale: es })}
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="shadow-sm border-slate-200">
                        <CardHeader>
                            <CardTitle>Items Entregados</CardTitle>
                            <CardDescription>
                                Detalle de items entregados en el período seleccionado
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {items.length === 0 ? (
                                <div className="text-center text-muted-foreground py-12">
                                    <p className="text-lg">No hay items entregados en este período</p>
                                    <p className="text-sm">Intenta seleccionar un rango de fechas diferente</p>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Item</TableHead>
                                            <TableHead>Tipo</TableHead>
                                            <TableHead className="text-right">Cantidad Entregada</TableHead>
                                            <TableHead>Última Entrega</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {items.map((item, index) => (
                                            <TableRow key={index}>
                                                <TableCell className="font-medium">
                                                    {item.itemable.name}
                                                </TableCell>
                                                <TableCell>
                                                    {item.itemable_type.includes('Supply') ? 'Insumo' : 'Servicio'}
                                                </TableCell>
                                                <TableCell className="text-right font-semibold">
                                                    {item.total_delivered}
                                                </TableCell>
                                                <TableCell>
                                                    {item.last_delivery
                                                        ? format(new Date(item.last_delivery), "d 'de' MMMM, yyyy", { locale: es })
                                                        : '-'}
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
