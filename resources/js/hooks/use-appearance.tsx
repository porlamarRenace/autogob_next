import { useCallback, useMemo, useSyncExternalStore } from 'react';

export type ResolvedAppearance = 'light' | 'dark';
export type Appearance = ResolvedAppearance | 'system';

export type UseAppearanceReturn = {
    readonly appearance: Appearance;
    readonly resolvedAppearance: ResolvedAppearance;
    readonly updateAppearance: (mode: Appearance) => void;
};

const listeners = new Set<() => void>();
let currentAppearance: Appearance = 'system';

const prefersDark = (): boolean => {
    if (typeof window === 'undefined') return false;

    return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

const setCookie = (name: string, value: string, days = 365): void => {
    if (typeof document === 'undefined') return;
    const maxAge = days * 24 * 60 * 60;
    document.cookie = `${name}=${value};path=/;max-age=${maxAge};SameSite=Lax`;
};

const getStoredAppearance = (): Appearance => {
    if (typeof window === 'undefined') return 'system';

    return (localStorage.getItem('appearance') as Appearance) || 'system';
};

const isDarkMode = (appearance: Appearance): boolean => {
    // FORCE LIGHT MODE
    return false;
};

const applyTheme = (appearance: Appearance): void => {
    if (typeof document === 'undefined') return;

    // FORCE LIGHT
    document.documentElement.classList.remove('dark');
    document.documentElement.style.colorScheme = 'light';
};

const subscribe = (callback: () => void) => {
    listeners.add(callback);
    return () => listeners.delete(callback);
};

const notify = (): void => listeners.forEach((listener) => listener());

const mediaQuery = (): MediaQueryList | null => {
    if (typeof window === 'undefined') return null;
    return window.matchMedia('(prefers-color-scheme: dark)');
};

const handleSystemThemeChange = (): void => {
    // Do nothing or enforce light
    applyTheme('light');
    notify();
};

export function initializeTheme(): void {
    if (typeof window === 'undefined') return;

    // Force storage to light
    localStorage.setItem('appearance', 'light');
    setCookie('appearance', 'light');

    currentAppearance = 'light';
    applyTheme('light');
}

export function useAppearance(): UseAppearanceReturn {
    // Always return light
    const appearance: Appearance = 'light';

    const resolvedAppearance: ResolvedAppearance = 'light';

    const updateAppearance = useCallback((mode: Appearance): void => {
        // Enforce light even if tried to update
        currentAppearance = 'light';
        localStorage.setItem('appearance', 'light');
        setCookie('appearance', 'light');
        applyTheme('light');
        notify();
    }, []);

    return { appearance, resolvedAppearance, updateAppearance } as const;
}
