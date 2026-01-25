import AppLayout from '@/layouts/app-layout';
import { Head, Link, usePage } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
    Activity,
    Users,
    FileText,
    CheckCircle2,
    Clock,
    Plus,
    Search,
    ArrowRight,
    Briefcase
} from 'lucide-react';

interface DashboardProps {
    stats: {
        label_pending: string;
        pending: number;
        label_progress: string;
        in_progress: number;
        label_approved: string;
        approved_today: number;
        label_total: string;
        total_citizens: number;
        show_citizens: boolean;
    };
    recent_cases: any[];
    is_manager: boolean;
}

export default function Dashboard({ stats, recent_cases, is_manager }: DashboardProps) {
    const { auth } = usePage<any>().props;

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Buenos días';
        if (hour < 18) return 'Buenas tardes';
        return 'Buenas noches';
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'open': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'in_progress': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'approved': return 'bg-green-100 text-green-700 border-green-200';
            case 'rejected': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    const translateStatus = (status: string) => {
        const map: any = { open: 'Nuevo', in_progress: 'En Proceso', approved: 'Aprobado', rejected: 'Rechazado' };
        return map[status] || status;
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Inicio', href: '/dashboard' }]}>
            <Head title="Dashboard" />

            <div className="flex flex-1 flex-col gap-4 p-4 pt-0 md:gap-8 md:p-8">

                {/* 1. BIENVENIDA */}
                <div className={`flex flex-col md:flex-row justify-between items-start md:items-center rounded-xl p-6 text-white shadow-lg ${is_manager ? 'bg-gradient-to-r from-blue-600 to-indigo-700' : 'bg-gradient-to-r from-emerald-600 to-teal-600'}`}>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            {getGreeting()}, {auth.user.name.split(' ')[0]}! 👋
                        </h1>
                        <p className="text-blue-50 mt-2 text-sm md:text-base opacity-90">
                            {is_manager
                                ? 'Resumen global de la actividad del sistema.'
                                : 'Bienvenido a tu panel de gestión de casos.'}
                        </p>
                    </div>
                    <div className="mt-4 md:mt-0">
                        <Link href={route('cases.create')}>
                            <Button variant="secondary" className="shadow-sm font-semibold text-slate-800 dark:text-slate-200 dark:border-slate-200 dark:hover:border-slate-200 dark:hover:text-slate-200 dark:hover:bg-slate-900 dark:hover:shadow-sm">
                                <Plus className="mr-2 h-4 w-4" /> Nueva Solicitud
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* 2. KPIs (Dinámicos) */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="shadow-sm border-l-4 border-l-blue-500">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-bold uppercase text-slate-500">{stats.label_pending}</CardTitle>
                            <FileText className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.pending}</div>
                            <p className="text-xs text-muted-foreground">{is_manager ? 'En cola general' : 'Creados por ti'}</p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm border-l-4 border-l-yellow-500">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-bold uppercase text-slate-500">{stats.label_progress}</CardTitle>
                            <Clock className="h-4 w-4 text-yellow-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.in_progress}</div>
                            <p className="text-xs text-muted-foreground">Siendo gestionados</p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm border-l-4 border-l-green-500">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-bold uppercase text-slate-500">{stats.label_approved}</CardTitle>
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.approved_today}</div>
                            <p className="text-xs text-muted-foreground">Procesados hoy</p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm border-l-4 border-l-purple-500">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-bold uppercase text-slate-500">{stats.label_total}</CardTitle>
                            {stats.show_citizens ? <Users className="h-4 w-4 text-purple-500" /> : <Briefcase className="h-4 w-4 text-purple-500" />}
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total_citizens}</div>
                            <p className="text-xs text-muted-foreground">{stats.show_citizens ? 'Ciudadanos registrados' : 'Tu historial total'}</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-4 md:gap-8 lg:grid-cols-3">

                    {/* 3. TABLA (Dinámica) */}
                    <Card className="lg:col-span-2 shadow-md">
                        <CardHeader className="flex flex-row items-center">
                            <div className="grid gap-1">
                                <CardTitle>{is_manager ? 'Actividad Reciente del Sistema' : 'Mis Últimas Cargas'}</CardTitle>
                                <CardDescription>
                                    {is_manager ? 'Últimos movimientos de todos los usuarios.' : 'Estado de las últimas solicitudes que registraste.'}
                                </CardDescription>
                            </div>
                            <Button asChild size="sm" className="ml-auto gap-1" variant="ghost">
                                <Link href={route('cases.index')}>
                                    Ver Todo <ArrowRight className="h-4 w-4" />
                                </Link>
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Beneficiario</TableHead>
                                        <TableHead className="hidden xl:table-cell">Categoría</TableHead>
                                        <TableHead>Estatus</TableHead>
                                        <TableHead className="text-right">Hace</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {recent_cases.length > 0 ? (
                                        recent_cases.map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell>
                                                    <div className="font-medium">{item.citizen}</div>
                                                    <div className="text-xs text-slate-400">{item.case_number}</div>
                                                </TableCell>
                                                <TableCell className="hidden xl:table-cell text-sm">
                                                    {item.category}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={getStatusColor(item.status)} variant="outline">
                                                        {translateStatus(item.status)}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right text-xs text-slate-500">
                                                    {item.date}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center h-24 text-slate-500">
                                                No tienes actividad reciente.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    {/* 4. ACCESOS RÁPIDOS (Filtrados) */}
                    <Card className="shadow-md">
                        <CardHeader>
                            <CardTitle>Accesos Rápidos</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4">

                            <Link href={route('cases.index')} className="flex items-center gap-4 rounded-md border p-4 hover:bg-slate-50 transition-colors group dark:hover:bg-slate-800">
                                <div className="p-2 bg-blue-100 rounded-full group-hover:bg-blue-200 transition-colors">
                                    <Search className="h-5 w-5 text-blue-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium leading-none">Consultar Solicitud</p>
                                    <p className="text-sm text-muted-foreground">Buscar por cédula</p>
                                </div>
                            </Link>

                            {is_manager && (
                                <Link href={route('users.index')} className="flex items-center gap-4 rounded-md border p-4 hover:bg-slate-50 transition-colors group dark:hover:bg-slate-800">
                                    <div className="p-2 bg-purple-100 rounded-full group-hover:bg-purple-200 transition-colors">
                                        <Users className="h-5 w-5 text-purple-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium leading-none">Gestionar Usuarios</p>
                                        <p className="text-sm text-muted-foreground">Roles y accesos</p>
                                    </div>
                                </Link>
                            )}

                            {/* Información Genérica para todos */}
                            <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-100 dark:bg-slate-900 dark:border-slate-800">
                                <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Estado del Sistema</h4>
                                <div className="flex items-center gap-2 text-sm text-slate-700">
                                    <span className="relative flex h-3 w-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                    </span>
                                    En Línea
                                </div>
                            </div>

                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}