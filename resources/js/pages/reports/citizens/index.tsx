import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileDown, Eye, Search } from 'lucide-react';

interface Citizen {
    id: number;
    first_name: string;
    last_name: string;
    nationality: string;
    identification_value: string;
    phone: string | null;
    beneficiary_cases_count: number;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface Props {
    citizens: {
        data: Citizen[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        links: PaginationLink[];
    };
    search: string;
}

export default function CitizensList({ citizens, search: initialSearch }: Props) {
    const [search, setSearch] = useState(initialSearch || '');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('reports.citizens'), { search }, {
            preserveState: true,
            preserveScroll: true
        });
    };

    const handlePageChange = (url: string | null) => {
        if (!url) return;
        router.get(url, {}, {
            preserveState: true,
            preserveScroll: true
        });
    };

    return (
        <AppLayout>
            <Head title="Expedientes de Ciudadanos" />

            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">Expedientes de Ciudadanos</h1>
                    <p className="text-muted-foreground">
                        Listado de todos los ciudadanos registrados en el sistema
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Búsqueda de Ciudadanos</CardTitle>
                        <CardDescription>
                            Busca por nombre o cédula
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSearch} className="flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="text"
                                    placeholder="Buscar por nombre o cédula..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            <Button type="submit">Buscar</Button>
                            {search && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setSearch('');
                                        router.get(route('reports.citizens'));
                                    }}
                                >
                                    Limpiar
                                </Button>
                            )}
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>
                            Ciudadanos Registrados ({citizens.total})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nombre</TableHead>
                                    <TableHead>Cédula</TableHead>
                                    <TableHead>Teléfono</TableHead>
                                    <TableHead>Casos</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {citizens.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                                            No se encontraron ciudadanos
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    citizens.data.map((citizen) => (
                                        <TableRow key={citizen.id}>
                                            <TableCell className="font-medium">
                                                {citizen.first_name} {citizen.last_name}
                                            </TableCell>
                                            <TableCell>
                                                {citizen.nationality}-{citizen.identification_value}
                                            </TableCell>
                                            <TableCell>{citizen.phone || '-'}</TableCell>
                                            <TableCell>{citizen.beneficiary_cases_count}</TableCell>
                                            <TableCell className="text-right space-x-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => router.get(route('reports.citizens.expedient', citizen.id))}
                                                >
                                                    <Eye className="h-4 w-4 mr-1" />
                                                    Ver Expediente
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="default"
                                                    onClick={() => window.open(route('reports.citizen.pdf', citizen.id), '_blank')}
                                                >
                                                    <FileDown className="h-4 w-4 mr-1" />
                                                    PDF
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>

                        {/* Paginación */}
                        {citizens.last_page > 1 && (
                            <div className="flex justify-center gap-2 mt-6">
                                {citizens.links.map((link, index) => (
                                    <Button
                                        key={index}
                                        size="sm"
                                        variant={link.active ? 'default' : 'outline'}
                                        disabled={!link.url}
                                        onClick={() => handlePageChange(link.url)}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
