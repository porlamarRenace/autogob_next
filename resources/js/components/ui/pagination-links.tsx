import { Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
    links: any[];
    from: number;
    to: number;
    total: number;
}

export default function PaginationLinks({ links, from, to, total }: PaginationProps) {
    if (links.length <= 3) return null; // No mostrar si solo hay 1 página

    return (
        <div className="flex items-center justify-between px-4 py-3 border-t bg-slate-50/50 dark:bg-neutral-800">
            <div className="text-xs text-slate-500 dark:text-neutral-400">
                Mostrando <span className="font-medium">{from}</span> a <span className="font-medium">{to}</span> de <span className="font-medium">{total}</span> resultados
            </div>
            <div className="flex gap-1">
                {links.map((link, i) => {
                    if (!link.url && link.label === '...') {
                        return <span key={i} className="px-2 py-1 text-slate-400">...</span>;
                    }

                    let label = link.label;
                    if (link.label.includes('Previous')) label = <ChevronLeft className="h-4 w-4" />;
                    if (link.label.includes('Next')) label = <ChevronRight className="h-4 w-4" />;

                    return (
                        <Button
                            key={i}
                            variant={link.active ? 'default' : 'outline'}
                            size="sm"
                            className={`h-8 px-3 ${!link.url ? 'opacity-50 pointer-events-none' : ''} ${link.active ? 'bg-blue-600 dark:bg-white' : 'text-slate-600 border-slate-300 hover:bg-blue-600 hover:text-white'}`}
                            asChild={!!link.url}
                        >
                            {link.url ? (
                                <Link href={link.url} preserveState preserveScroll>{label}</Link>
                            ) : (
                                <span>{label}</span>
                            )}
                        </Button>
                    );
                })}
            </div>
        </div>
    );
}