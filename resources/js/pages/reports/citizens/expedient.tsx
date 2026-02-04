import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { FileDown, ArrowLeft } from 'lucide-react';
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

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">
                            Expediente de {citizen.first_name} {citizen.last_name}
                        </h1>
                        <p className="text-muted-foreground">
                            {citizen.nationality}-{citizen.identification_value}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => window.history.back()}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Volver
                        </Button>
                        <Button onClick={() => window.open(route('reports.citizen.pdf', citizen.id), '_blank')}>
                            <FileDown className="h-4 w-4 mr-2" />
                            Descargar PDF
                        </Button>
                    </div>
                </div>

                {/* Información Personal */}
                <Card>
                    <CardHeader>
                        <CardTitle>Información Personal</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Nombre Completo</p>
                            <p className="text-lg">{citizen.first_name} {citizen.last_name}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Cédula</p>
                            <p className="text-lg">{citizen.nationality}-{citizen.identification_value}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Teléfono</p>
                            <p className="text-lg">{citizen.phone || 'No registrado'}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Dirección</p>
                            <p className="text-lg">
                                {citizen.street
                                    ? `${citizen.street.name}, ${citizen.street.community.name}, ${citizen.street.community.municipality.name}`
                                    : 'No registrada'}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Perfil de Salud */}
                {citizen.health_profile && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Perfil de Salud</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Discapacidad</p>
                                <p className="text-lg">
                                    {citizen.health_profile.is_disabled
                                        ? citizen.health_profile.disability_type || 'Sí'
                                        : 'No'}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Tipo de Sangre</p>
                                <p className="text-lg">{citizen.health_profile.blood_type || 'No registrado'}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Diabetes</p>
                                <p className="text-lg">{citizen.health_profile.has_diabetes ? 'Sí' : 'No'}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Hipertensión</p>
                                <p className="text-lg">{citizen.health_profile.has_hypertension ? 'Sí' : 'No'}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Cáncer</p>
                                <p className="text-lg">{citizen.health_profile.has_cancer ? 'Sí' : 'No'}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Peso/Altura</p>
                                <p className="text-lg">
                                    {citizen.health_profile.weight || citizen.health_profile.height
                                        ? `${citizen.health_profile.weight || '-'}kg / ${citizen.health_profile.height || '-'}cm`
                                        : 'No registrado'}
                                </p>
                            </div>
                            {citizen.health_profile.notes && (
                                <div className="col-span-2">
                                    <p className="text-sm font-medium text-muted-foreground">Notas Médicas</p>
                                    <p className="text-sm">{citizen.health_profile.notes}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Historial de Casos */}
                <Card>
                    <CardHeader>
                        <CardTitle>Historial de Casos ({beneficiaryCases.length})</CardTitle>
                        <CardDescription>Últimos 50 casos registrados</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {beneficiaryCases.length === 0 ? (
                            <p className="text-center text-muted-foreground py-8">
                                No hay casos registrados para este ciudadano
                            </p>
                        ) : (
                            <div className="space-y-6">
                                {beneficiaryCases.map((caso) => (
                                    <div key={caso.id} className="border rounded-lg p-4 space-y-3">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h3 className="font-semibold text-lg">{caso.case_number}</h3>
                                                <p className="text-sm text-muted-foreground">
                                                    {caso.category.name}
                                                    {caso.subcategory && ` - ${caso.subcategory.name}`}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {format(new Date(caso.created_at), "d 'de' MMMM, yyyy", { locale: es })}
                                                </p>
                                            </div>
                                            <Badge className={statusColors[caso.status]}>
                                                {statusLabels[caso.status] || caso.status}
                                            </Badge>
                                        </div>

                                        {caso.items.length > 0 && (
                                            <div>
                                                <p className="text-sm font-medium mb-2">Items solicitados:</p>
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead>Item</TableHead>
                                                            <TableHead>Cantidad</TableHead>
                                                            <TableHead>Estado</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {caso.items.map((item) => (
                                                            <TableRow key={item.id}>
                                                                <TableCell>{item.itemable.name}</TableCell>
                                                                <TableCell>{item.quantity}</TableCell>
                                                                <TableCell>
                                                                    <Badge variant="outline" className={statusColors[item.status]}>
                                                                        {statusLabels[item.status] || item.status}
                                                                    </Badge>
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
        </AppLayout>
    );
}
