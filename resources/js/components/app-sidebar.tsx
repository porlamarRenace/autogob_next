import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import { create, index } from '@/routes/cases';
import { Link, usePage } from '@inertiajs/react';
import { LayoutGrid, FilePlus, FileText, Users, UserPlus, Briefcase, List, Pill, Package, BarChart } from 'lucide-react';
import AppLogo from './app-logo';

// 1. Extendemos la interfaz para soportar permisos
interface ExtendedNavItem {
    title: string;
    href: any;
    icon: any;
    permission?: string;
}
type PageProps<T extends Record<string, unknown> = Record<string, unknown>> = T & {
    auth: {
        user: User;
        permissions: string[];
    };
};
interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at: string;
    roles: string[];
}

export function AppSidebar() {
    const { auth } = usePage<PageProps>().props;
    const userPermissions = auth.permissions || [];

    const rawNavItems: ExtendedNavItem[] = [
        {
            title: 'Dashboard',
            href: dashboard(),
            icon: LayoutGrid,
        },
        {
            title: 'Crear Caso',
            href: create(),
            icon: FilePlus,
            permission: 'create cases',
        },
        {
            title: 'Bandeja de Casos',
            href: index(),
            icon: FileText,
            permission: 'view cases',
        },
        {
            title: 'Usuarios',
            href: route('users.index'),
            icon: Users,
            permission: 'manage users',
        },
        {
            title: 'Roles',
            href: route('roles.index'),
            icon: UserPlus,
            permission: 'manage roles',
        },
        {
            title: 'Insumos',
            href: route('supplies.index'),
            icon: Pill,
            permission: 'manage settings',
        },
        {
            title: 'Categorías',
            href: route('categories.index'),
            icon: List,
            permission: 'manage settings',
        },
        {
            title: 'Servicios',
            href: route('services.index'),
            icon: Briefcase,
            permission: 'manage settings',
        },
        {
            title: 'Inventario',
            href: route('stock.index'),
            icon: Package,
            permission: 'manage stock',
        },
        {
            title: 'Reportes',
            href: route('reports.index'),
            icon: BarChart,
            permission: 'view reports',
        }
    ];

    const filteredNavItems = rawNavItems.filter((item) => {
        if (!item.permission) return true;

        return userPermissions.includes(item.permission);
    });

    const footerNavItems: any[] = []; // Vacío como lo tenías

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                {/* 5. Pasamos la lista FILTRADA */}
                <NavMain items={filteredNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}