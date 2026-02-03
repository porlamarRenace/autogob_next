import React from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, TrendingUp, TrendingDown, Calendar, User, FileText } from 'lucide-react';
import PaginationLinks from '@/components/ui/pagination-links';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface StockMovement {
    id: number;
    type: 'entry' | 'exit';
    quantity: number;
    reason_label: string;
    notes: string | null;
    created_at: string;
    user: { name: string };
    reference_type?: string;
    reference_id?: number;
}

interface Supply {
    id: number;
    name: string;
    unit: string;
    current_stock: number;
    category: { name: string };
}

interface Props {
    supply: Supply;
    movements: { data: StockMovement[]; links: any; from: number; to: number; total: number };
}

export default function StockMovements({ supply, movements }: Props) {
    return (
        <AppLayout breadcrumbs={[
            { title: 'Administración', href: '#' },
            { title: 'Inventario', href: route('stock.index') },
            { title: 'Movimientos', href: '#' }
        ]}>
            <Head title={`Movimientos - ${supply.name}`} />
            <div className="py-8 max-w-7xl mx-auto px-4">

                <div className="flex items-center gap-4 mb-6">
                    <Button variant="outline" size="icon" asChild>
                        <Link href={route('stock.index')}>
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                            Historial de Movimientos: {supply.name}
                        </h2>
                        <p className="text-slate-500 text-sm">
                            Stock Actual: <span className="font-bold text-slate-900">{supply.current_stock} {supply.unit}</span>
                        </p>
                    </div>
                </div>

                <Card className="shadow-md">
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-slate-50 dark:bg-neutral-800">
                                <TableRow>
                                    <TableHead>Fecha</TableHead>
                                    <TableHead>Tipo</TableHead>
                                    <TableHead>Cantidad</TableHead>
                                    <TableHead>Motivo</TableHead>
                                    <TableHead>Usuario</TableHead>
                                    <TableHead>Notas / Referencia</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {movements.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                                            No hay movimientos registrados.
                                        </TableCell>
                                    </TableRow>
                                ) : movements.data.map((movement) => (
                                    <TableRow key={movement.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-slate-400" />
                                                {format(new Date(movement.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {movement.type === 'entry' ? (
                                                <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-none">
                                                    Entrada
                                                </Badge>
                                            ) : (
                                                <Badge className="bg-red-100 text-red-800 hover:bg-red-200 border-none">
                                                    Salida
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <span className={`font-bold ${movement.type === 'entry' ? 'text-emerald-600' : 'text-red-600'}`}>
                                                {movement.type === 'entry' ? '+' : '-'}{movement.quantity}
                                            </span>
                                        </TableCell>
                                        <TableCell>{movement.reason_label}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                                <User className="h-3 w-3" />
                                                {movement.user.name}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="max-w-xs text-sm">
                                                {movement.notes}
                                                {movement.reference_type && (
                                                    <div className="mt-1 text-xs text-blue-600 flex items-center gap-1">
                                                        <FileText className="h-3 w-3" />
                                                        Ref: {movement.reference_type.split('\\').pop()} #{movement.reference_id}
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        <PaginationLinks links={movements.links} from={movements.from} to={movements.to} total={movements.total} />
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
