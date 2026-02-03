import React from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
    User, Phone, MapPin, Calendar, Activity, FileText, CheckCircle, XCircle, Clock,
    Download, HeartPulse, UserCheck, ShieldCheck
} from 'lucide-react';
import { format, differenceInYears } from 'date-fns';
import { es } from 'date-fns/locale';

interface Citizen {
    id: number;
    first_name: string;
    last_name: string;
    nationality: string;
    identification_value: string;
    birth_date: string;
    phone: string;
    photo_url: string | null;
    gender: 'M' | 'F';
    street?: {
        name: string;
        community?: {
            name: string;
            municipality?: {
                name: string;
                state?: { name: string }
            }
        }
    };
    health_profile?: {
        has_disability: boolean;
        disability_type: string;
        has_chronic_condition: boolean;
        chronic_condition_type: string;
        requires_medication: boolean;
        is_pregnant: boolean;
        is_bedridden: boolean;
    };
    representative?: {
        first_name: string;
        last_name: string;
        identification_value: string;
    };
}

interface CaseItem {
    id: number;
    quantity: number;
    status: string;
    itemable?: { name: string; unit: string };
    approved_quantity?: number;
}

interface SocialCase {
    id: number;
    case_number: string;
    status: string;
    created_at: string;
    description: string;
    category?: { name: string };
    subcategory?: { name: string };
    items: CaseItem[];
    beneficiary?: Citizen;
}

interface Stats {
    total_cases_beneficiary: number;
    total_cases_applicant: number;
    approved_items: number;
    fulfilled_items: number;
    rejected_items: number;
}

interface Props {
    citizen: Citizen;
    beneficiary_cases: SocialCase[];
    applicant_cases: SocialCase[];
    stats: Stats;
}

export default function CitizenExpedient({ citizen, beneficiary_cases, applicant_cases, stats }: Props) {

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            open: 'bg-blue-100 text-blue-800',
            in_review: 'bg-amber-100 text-amber-800',
            approved: 'bg-emerald-100 text-emerald-800',
            rejected: 'bg-red-100 text-red-800',
            closed: 'bg-slate-100 text-slate-800',
        };
        const labels: Record<string, string> = {
            open: 'Abierto',
            in_review: 'En Revisión',
            approved: 'Aprobado',
            rejected: 'Rechazado',
            closed: 'Cerrado',
        };
        return <Badge className={`border-none ${styles[status] || 'bg-gray-100'}`}>{labels[status] || status}</Badge>;
    };

    const age = citizen.birth_date ? differenceInYears(new Date(), new Date(citizen.birth_date)) : 'N/A';

    return (
        <AppLayout breadcrumbs={[{ title: 'Expedientes', href: '#' }, { title: `${citizen.first_name} ${citizen.last_name}`, href: '#' }]}>
            <Head title={`Expediente: ${citizen.first_name} ${citizen.last_name}`} />

            <div className="py-8 max-w-7xl mx-auto px-4 space-y-6">

                {/* HEADLINE & ACTIONS */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
                        Expediente del Ciudadano
                    </h2>
                    <div className="flex gap-2">
                        <Button variant="outline" asChild>
                            <a href={route('reports.citizen.pdf', citizen.id)} target="_blank" rel="noopener noreferrer">
                                <Download className="mr-2 h-4 w-4" /> Exportar PDF
                            </a>
                        </Button>
                    </div>
                </div>

                {/* PROFILE CARD */}
                <Card className="border-t-4 border-t-blue-600 shadow-md">
                    <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row gap-6">
                            <div className="flex-shrink-0 flex flex-col items-center">
                                <Avatar className="h-32 w-32 border-4 border-white shadow-lg">
                                    <AvatarImage src={citizen.photo_url || undefined} alt={citizen.first_name} />
                                    <AvatarFallback className="text-2xl bg-slate-200">
                                        {citizen.first_name[0]}{citizen.last_name[0]}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="mt-4 text-center">
                                    <Badge variant="outline" className="font-mono text-base px-3 py-1 bg-slate-50">
                                        {citizen.nationality}-{citizen.identification_value}
                                    </Badge>
                                </div>
                            </div>

                            <div className="flex-grow space-y-4">
                                <div>
                                    <h3 className="text-2xl font-bold">{citizen.first_name} {citizen.last_name}</h3>
                                    <div className="flex flex-wrap gap-4 text-slate-500 mt-1">
                                        <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> {age} años</span>
                                        <span className="flex items-center gap-1"><User className="h-4 w-4" /> {citizen.gender === 'M' ? 'Masculino' : 'Femenino'}</span>
                                        <span className="flex items-center gap-1"><Phone className="h-4 w-4" /> {citizen.phone}</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 dark:bg-neutral-900 p-4 rounded-lg text-sm">
                                    <div className="space-y-1">
                                        <p className="font-semibold flex items-center gap-2"><MapPin className="h-4 w-4 text-slate-400" /> Dirección</p>
                                        <p className="text-slate-600 pl-6">
                                            {citizen.street ? (
                                                <>
                                                    {citizen.street.name}, {citizen.street.community?.name}<br />
                                                    {citizen.street.community?.municipality?.name}, {citizen.street.community?.municipality?.state?.name}
                                                </>
                                            ) : 'Dirección no registrada'}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="font-semibold flex items-center gap-2"><HeartPulse className="h-4 w-4 text-red-400" /> Perfil de Salud</p>
                                        <div className="text-slate-600 pl-6 space-y-1">
                                            {citizen.health_profile ? (
                                                <>
                                                    {citizen.health_profile.has_disability && <Badge variant="secondary" className="mr-1">Discapacidad: {citizen.health_profile.disability_type}</Badge>}
                                                    {citizen.health_profile.has_chronic_condition && <Badge variant="secondary" className="mr-1">Crónico: {citizen.health_profile.chronic_condition_type}</Badge>}
                                                    {citizen.health_profile.is_pregnant && <Badge variant="secondary" className="mr-1 bg-pink-100 text-pink-800">Embarazada</Badge>}
                                                    {citizen.health_profile.is_bedridden && <Badge variant="secondary" className="mr-1 bg-red-100 text-red-800">Encamado</Badge>}
                                                    {!citizen.health_profile.has_disability && !citizen.health_profile.has_chronic_condition && !citizen.health_profile.is_pregnant && !citizen.health_profile.is_bedridden && (
                                                        <span>Sin condiciones reportadas</span>
                                                    )}
                                                </>
                                            ) : <span>Sin perfil de salud</span>}
                                        </div>
                                    </div>
                                </div>

                                {citizen.representative && (
                                    <div className="text-sm border-l-2 border-blue-300 pl-3">
                                        <span className="font-semibold">Representante:</span> {citizen.representative.first_name} {citizen.representative.last_name} ({citizen.representative.identification_value})
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* STATS OVERVIEW */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                            <FileText className="h-8 w-8 text-blue-500 mb-2" />
                            <div className="text-2xl font-bold">{stats.total_cases_beneficiary}</div>
                            <div className="text-xs text-slate-500">Ayudas Recibidas</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                            <CheckCircle className="h-8 w-8 text-emerald-500 mb-2" />
                            <div className="text-2xl font-bold">{stats.approved_items}</div>
                            <div className="text-xs text-slate-500">Items Aprobados</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                            <UserCheck className="h-8 w-8 text-purple-500 mb-2" />
                            <div className="text-2xl font-bold">{stats.fulfilled_items}</div>
                            <div className="text-xs text-slate-500">Items Entregados</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                            <Activity className="h-8 w-8 text-amber-500 mb-2" />
                            <div className="text-2xl font-bold">{stats.total_cases_applicant}</div>
                            <div className="text-xs text-slate-500">Gestiones (Solicitante)</div>
                        </CardContent>
                    </Card>
                </div>

                {/* TABS FOR HISTORY */}
                <Tabs defaultValue="beneficiary" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                        <TabsTrigger value="beneficiary" className="flex items-center gap-2">
                            <HeartPulse className="h-4 w-4" /> Historial de Ayudas (Beneficiario)
                        </TabsTrigger>
                        <TabsTrigger value="applicant" className="flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4" /> Historial de Gestiones (Solicitante)
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="beneficiary">
                        <div className="space-y-4">
                            {beneficiary_cases.length === 0 ? (
                                <Card className="p-8 text-center text-slate-500">No hay registros de ayudas recibidas.</Card>
                            ) : beneficiary_cases.map(socialCase => (
                                <Card key={socialCase.id} className="overflow-hidden hover:shadow-md transition-shadow">
                                    <div className="flex border-l-4 border-blue-500">
                                        <div className="flex-grow p-4">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <h4 className="font-bold flex items-center gap-2">
                                                        <Link href={route('cases.show', socialCase.id)} className="hover:underline text-blue-700">
                                                            {socialCase.case_number}
                                                        </Link>
                                                        {getStatusBadge(socialCase.status)}
                                                    </h4>
                                                    <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                                                        <Clock className="h-3 w-3" />
                                                        {format(new Date(socialCase.created_at), 'dd PPP', { locale: es })}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <Badge variant="outline">{socialCase.category?.name}</Badge>
                                                    {socialCase.subcategory && <div className="text-xs text-slate-400 mt-1">{socialCase.subcategory.name}</div>}
                                                </div>
                                            </div>

                                            <p className="text-sm text-slate-600 mb-4 bg-slate-50 p-2 rounded italic">
                                                "{socialCase.description}"
                                            </p>

                                            <div className="space-y-2">
                                                <h5 className="text-xs font-semibold uppercase text-slate-400 tracking-wider">Items Solicitados</h5>
                                                {socialCase.items.map(item => (
                                                    <div key={item.id} className="flex items-center justify-between text-sm border-b border-slate-100 last:border-0 pb-1">
                                                        <span className="flex items-center gap-2">
                                                            <span>• {item.itemable?.name || 'Item genérico'}</span>
                                                            <span className="text-slate-400 text-xs">x{item.quantity} {item.itemable?.unit}</span>
                                                        </span>
                                                        <div className="flex items-center gap-2">
                                                            {item.status === 'approved' && <Badge className="bg-emerald-500 text-white text-[10px]">Aprobado</Badge>}
                                                            {item.status === 'fulfilled' && <Badge className="bg-blue-600 text-white text-[10px]">Entregado</Badge>}
                                                            {item.status === 'rejected' && <Badge variant="destructive" className="text-[10px]">Rechazado</Badge>}
                                                            {(item.status === 'open' || item.status === 'in_review') && <Badge variant="outline" className="text-[10px]">Pendiente</Badge>}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="applicant">
                        <div className="space-y-4">
                            {applicant_cases.length === 0 ? (
                                <Card className="p-8 text-center text-slate-500">No hay registros de gestiones realizadas para terceros.</Card>
                            ) : applicant_cases.map(socialCase => (
                                <Card key={socialCase.id} className="hover:shadow-md transition-shadow">
                                    <CardContent className="p-4">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="font-bold">
                                                    <Link href={route('cases.show', socialCase.id)} className="hover:underline text-blue-700">
                                                        {socialCase.case_number}
                                                    </Link>
                                                </h4>
                                                <p className="text-sm text-slate-500 mt-1">
                                                    Beneficiario: <strong>{socialCase.beneficiary?.first_name} {socialCase.beneficiary?.last_name}</strong>
                                                </p>
                                                <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                                                    <Clock className="h-3 w-3" />
                                                    {format(new Date(socialCase.created_at), 'dd/MM/yyyy', { locale: es })}
                                                </p>
                                            </div>
                                            <div>
                                                {getStatusBadge(socialCase.status)}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>
                </Tabs>

            </div>
        </AppLayout>
    );
}
