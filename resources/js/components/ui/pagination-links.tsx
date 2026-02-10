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
    if (links.length <= 3) return null;

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t bg-slate-50/50 dark:bg-neutral-800 gap-3 sm:gap-0">
            <div className="text-xs text-slate-500 dark:text-neutral-400 text-center sm:text-left">
                Mostrando <span className="font-medium">{from}</span> a <span className="font-medium">{to}</span> de <span className="font-medium">{total}</span> resultados
            </div>

            <div className="flex flex-wrap justify-center gap-1">
                {links.map((link, i) => {
                    const isPrevious = link.label.includes('Previous') || link.label.includes('&laquo;');
                    const isNext = link.label.includes('Next') || link.label.includes('&raquo;');
                    const isDots = link.label === '...';

                    const activeIndex = links.findIndex(l => l.active);
                    const isAdjacent = i === activeIndex - 1 || i === activeIndex + 1;

                    const isMobileVisible = isPrevious || isNext || link.active || isDots || isAdjacent;
                    const visibilityClass = isMobileVisible ? 'flex' : 'hidden sm:flex';

                    let content;
                    if (isPrevious) {
                        content = <ChevronLeft className="h-4 w-4" />;
                    } else if (isNext) {
                        content = <ChevronRight className="h-4 w-4" />;
                    } else {
                        content = <span dangerouslySetInnerHTML={{ __html: link.label }}></span>;
                    }

                    if (!link.url && isDots) {
                        return <span key={i} className="px-2 py-1 text-slate-400 hidden sm:inline-block">...</span>;
                    }

                    return (
                        <Button
                            key={i}
                            variant={link.active ? 'default' : 'outline'}
                            size="sm"
                            className={`
                                h-9 min-w-[38px] px-3 ${visibilityClass} items-center justify-center
                                ${!link.url ? 'opacity-50 pointer-events-none' : ''} 
                                ${link.active
                                    ? 'bg-blue-600 dark:bg-white text-white dark:text-black hover:bg-blue-700'
                                    : 'text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800'
                                }
                            `}
                            asChild={!!link.url}
                        >
                            {link.url ? (
                                <Link
                                    href={link.url}
                                    preserveState
                                    preserveScroll
                                    only={['supplies']}
                                >
                                    {content}
                                </Link>
                            ) : (
                                <span>{content}</span>
                            )}
                        </Button>
                    );
                })}
            </div>
        </div>
    );
}