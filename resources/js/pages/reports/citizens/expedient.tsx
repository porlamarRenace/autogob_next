import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { FileDown, ArrowLeft, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Citizen {
    id: number;
    first_name: string;
    last_name: string;
    nationality: string;
    identification_value: string;
    phone: string | null;
    street: {
        name: string;
        community: {
            name: string;
            municipality: {
                name: string;
            };
        };
    } | null;
    health_profile: {
        is_disabled: boolean;
        disability_type: string | null;
        has_diabetes: boolean;
        has_hypertension: boolean;
        has_cancer: boolean;
        blood_type: string | null;
        weight: number | null;
        height: number | null;
        notes: string | null;
    } | null;
}

interface CaseItem {
    id: number;
    itemable_id: number;
    itemable_type: string;
    quantity: number;
    status: string;
    fulfilled_at: string | null;
    itemable: {
        name: string;
    };
}

interface Case {
    id: number;
    case_number: string;
    created_at: string;
    status: string;
    category: {
        name: string;
    };
    subcategory: {
        name: string;
    } | null;
    items: CaseItem[];
}

interface Props {
    citizen: Citizen;
    beneficiaryCases: Case[];
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

export default function CitizenExpedient({ citizen, beneficiaryCases }: Props) {
    return (
        <AppLayout>
            <Head title={`Expediente - ${citizen.first_name} ${citizen.last_name}`} />

            {/* 1. Agregado fondo y min-h para consistencia */}
            <div className="bg-slate-50/50 min-h-screen">
                {/* 2. Contenedor con padding y max-width idéntico al reporte */}
                <div className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
                    
                    {/* 3. Header ajustado (flex-col en móvil) */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1 text-center md:text-left">
                            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                                Expediente de {citizen.first_name} {citizen.last_name}
                            </h1>
                            <p className="text-muted-foreground">
                                {citizen.nationality}-{citizen.identification_value}
                            </p>
                        </div>
                        <div className="flex flex-wrap justify-center gap-2">
                            <Button 
                                variant="outline" 
                                onClick={() => window.history.back()}
                                className="shadow-sm active:scale-95 transition-all"
                            >
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Volver
                            </Button>
                            <Button 
                                onClick={() => window.open(route('reports.citizen.pdf', citizen.id), '_blank')}
                                className="bg-[#ED2224] hover:bg-[#D11B1D] text-white font-medium shadow-sm transition-all active:scale-95"
                            >
                                <FileDown className="h-4 w-4 mr-2" />
                                Descargar PDF
                            </Button>
                        </div>
                    </div>

                    {/* 4. Grid para Información Personal y Salud (para que se vean como las cards de stats) */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Información Personal */}
                        <Card className="shadow-sm border-slate-200">
                            <CardHeader>
                                <CardTitle className="text-lg">Información Personal</CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nombre Completo</p>
                                    <p className="text-base font-medium">{citizen.first_name} {citizen.last_name}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cédula</p>
                                    <p className="text-base font-medium">{citizen.nationality}-{citizen.identification_value}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Teléfono</p>
                                    <p className="text-base font-medium">{citizen.phone || 'No registrado'}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Dirección</p>
                                    <p className="text-sm text-slate-600">
                                        {citizen.street
                                            ? `${citizen.street.name}, ${citizen.street.community.name}, ${citizen.street.community.municipality.name}`
                                            : 'No registrada'}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Perfil de Salud */}
                        {citizen.health_profile && (
                            <Card className="shadow-sm border-slate-200">
                                <CardHeader className="flex flex-row items-center space-x-2">
                                    <Activity className="h-5 w-5 text-red-500" />
                                    <CardTitle className="text-lg">Perfil de Salud</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Discapacidad</p>
                                            <Badge 
                                                variant={citizen.health_profile.is_disabled ? "destructive" : "secondary"} 
                                                className="mt-1"
                                            >
                                                {citizen.health_profile.is_disabled 
                                                    ? citizen.health_profile.disability_type || 'Sí' 
                                                    : 'No'}
                                            </Badge>
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tipo de Sangre</p>
                                            <p className="text-base font-bold text-slate-900">
                                                {citizen.health_profile.blood_type || 'No registrado'}
                                            </p>
                                            </div>
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Peso / Altura</p>
                                            <p className="text-base font-medium text-slate-700">
                                                {citizen.health_profile.weight || citizen.health_profile.height
                                                    ? `${citizen.health_profile.weight || '-'} kg / ${citizen.health_profile.height || '-'} cm`
                                                    : 'No registrado'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Diabetes</p>
                                            <p className={`text-sm font-medium ${citizen.health_profile.has_diabetes ? 'text-red-600' : 'text-slate-600'}`}>
                                                {citizen.health_profile.has_diabetes ? 'Sí' : 'No'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Hipertensión</p>
                                            <p className={`text-sm font-medium ${citizen.health_profile.has_hypertension ? 'text-red-600' : 'text-slate-600'}`}>
                                                {citizen.health_profile.has_hypertension ? 'Sí' : 'No'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cáncer</p>
                                            <p className={`text-sm font-medium ${citizen.health_profile.has_cancer ? 'text-red-600' : 'text-slate-600'}`}>
                                                    {citizen.health_profile.has_cancer ? 'Sí' : 'No'}
                                            </p>
                                        </div>

                                        {/* Notas Médicas (Ocupa todo el ancho si existe) */}
                                        {citizen.health_profile.notes && (
                                            <div className="col-span-2 sm:col-span-3 pt-4 border-t border-slate-100">
                                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Notas Médicas</p>
                                                <p className="text-sm text-slate-600 italic bg-slate-50 p-3 rounded-md border border-slate-100">
                                                    {citizen.health_profile.notes}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* 5. Historial de Casos (Estilo Tabla del reporte) */}
                    <Card className="shadow-sm border-slate-200">
                        <CardHeader>
                            <CardTitle>Historial de Casos ({beneficiaryCases.length})</CardTitle>
                            <CardDescription>Últimos casos registrados en el sistema</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {beneficiaryCases.length === 0 ? (
                                <div className="text-center text-muted-foreground py-12">
                                    <p className="text-lg">No hay casos registrados</p>
                                </div>
                            ) : (
                                <div className="space-y-8">
                                    {beneficiaryCases.map((caso) => (
                                        <div key={caso.id} className="border-b last:border-0 pb-6 last:pb-0">
                                            <div className="flex flex-col sm:flex-row justify-between items-start mb-4 gap-2">
                                                <div>
                                                    <span className="text-sm font-bold text-blue-600">{caso.case_number}</span>
                                                    <h3 className="font-semibold">{caso.category.name}</h3>
                                                    <p className="text-xs text-muted-foreground">
                                                        {format(new Date(caso.created_at), "d 'de' MMMM, yyyy", { locale: es })}
                                                    </p>
                                                </div>
                                                <Badge className={`${statusColors[caso.status]} text-white`}>
                                                    {statusLabels[caso.status] || caso.status}
                                                </Badge>
                                            </div>

                                            {caso.items.length > 0 && (
                                                <div className="bg-slate-50 rounded-lg border border-slate-100 overflow-hidden">
                                                    <Table>
                                                        <TableHeader className="bg-slate-100/50">
                                                            <TableRow>
                                                                <TableHead className="h-9">Item</TableHead>
                                                                <TableHead className="h-9 text-center">Cant.</TableHead>
                                                                <TableHead className="h-9 text-right">Estado</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {caso.items.map((item) => (
                                                                <TableRow key={item.id}>
                                                                    <TableCell className="py-2">{item.itemable.name}</TableCell>
                                                                    <TableCell className="py-2 text-center">{item.quantity}</TableCell>
                                                                    <TableCell className="py-2 text-right">
                                                                        <span className={`text-xs font-medium ${caso.status === 'fulfilled' ? 'text-green-600' : 'text-slate-500'}`}>
                                                                            {statusLabels[item.status] || item.status}
                                                                        </span>
                                                                    </TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}