import type { ComponentType } from 'react';

type SentryScope = {
    setTag: (key: string, value: string) => void;
    setUser: (user: Record<string, unknown> | null) => void;
    setContext: (name: string, context: Record<string, unknown>) => void;
    setExtra: (key: string, value: unknown) => void;
};

const NOOP_SCOPE: SentryScope = {
    setTag: () => undefined,
    setUser: () => undefined,
    setContext: () => undefined,
    setExtra: () => undefined,
};

export function init(): void {}

export function captureException(): void {}

export function captureMessage(): void {}

export function addBreadcrumb(): void {}

export function setUser(): void {}

export function setContext(): void {}

export function setTag(): void {}

export function configureScope(): void {}

export function withScope<T>(callback: (scope: SentryScope) => T): T {
    return callback(NOOP_SCOPE);
}

export function wrap<P>(Component: ComponentType<P>): ComponentType<P> {
    return Component;
}
