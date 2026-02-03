import React from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, useForm } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileText, Download, Calendar } from 'lucide-react';

export default function ReportsIndex() {
    const approvedAidsForm = useForm({
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0],
    });

    const submitApprovedAids = (e: React.FormEvent) => {
        e.preventDefault();

        // Usamos window.open con GET para evitar problemas CSRF (419) y facilitar la descarga
        const url = route('reports.approved-aids', {
            start_date: approvedAidsForm.data.start_date,
            end_date: approvedAidsForm.data.end_date
        });

        window.open(url, '_blank');
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Administración', href: '#' }, { title: 'Reportes', href: '#' }]}>
            <Head title="Reportes y Estadísticas" />
            <div className="py-8 max-w-7xl mx-auto px-4">

                <div className="mb-8">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <FileText className="text-blue-600" /> Reportes Administrativos
                    </h2>
                    <p className="text-slate-500">Generación de informes y estadísticas del sistema.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                    {/* Reporte 1: Ayudas Aprobadas */}
                    <Card className="border-t-4 border-t-emerald-500 hover:shadow-lg transition-shadow">
                        <CardHeader>
                            <CardTitle className="text-lg">Ayudas Aprobadas</CardTitle>
                            <CardDescription>Listado de ayudas entregadas o aprobadas por período.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={submitApprovedAids} className="space-y-4">
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <Label>Desde</Label>
                                        <div className="relative">
                                            <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                                            <Input
                                                type="date"
                                                className="pl-8"
                                                value={approvedAidsForm.data.start_date}
                                                onChange={e => approvedAidsForm.setData('start_date', e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <Label>Hasta</Label>
                                        <div className="relative">
                                            <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                                            <Input
                                                type="date"
                                                className="pl-8"
                                                value={approvedAidsForm.data.end_date}
                                                onChange={e => approvedAidsForm.setData('end_date', e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>
                                <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">
                                    <Download className="mr-2 h-4 w-4" /> Descargar PDF
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Placeholder Reporte 2 */}
                    <Card className="opacity-60 border-t-4 border-t-slate-300">
                        <CardHeader>
                            <CardTitle className="text-lg">Reporte de Stock</CardTitle>
                            <CardDescription>Inventario actual y valoración.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button variant="outline" className="w-full" disabled>
                                Próximamente
                            </Button>
                        </CardContent>
                    </Card>

                </div>
            </div>
        </AppLayout>
    );
}
