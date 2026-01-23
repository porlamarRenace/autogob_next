import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { History, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CaseHistory({ cases }: { cases: any[] }) {
    if (!cases || cases.length === 0) return null;

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'open': return <Badge className="bg-blue-500">Abierto</Badge>;
            case 'approved': return <Badge className="bg-green-500">Aprobado</Badge>;
            case 'rejected': return <Badge className="bg-red-500">Rechazado</Badge>;
            case 'closed': return <Badge className="bg-gray-500">Cerrado</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <Card className="mt-6 border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                    <History className="h-5 w-5 text-slate-500" />
                    Historial de Solicitudes
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nro Caso</TableHead>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Categoría</TableHead>
                            <TableHead>Estatus</TableHead>
                            <TableHead className="text-right">Acción</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {cases.map((c) => (
                            <TableRow key={c.id}>
                                <TableCell className="font-medium">{c.case_number}</TableCell>
                                <TableCell>{new Date(c.created_at).toLocaleDateString()}</TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span>{c.category?.name}</span>
                                        <span className="text-xs text-slate-500">{c.subcategory?.name}</span>
                                    </div>
                                </TableCell>
                                <TableCell>{getStatusBadge(c.status)}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon">
                                        <Eye className="h-4 w-4 text-slate-500" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}