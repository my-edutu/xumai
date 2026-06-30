import React from 'react';
import { View, Text } from 'react-native';

import * as Sentry from '@sentry/react-native';

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

export class GlobalErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
    constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('[GlobalErrorBoundary] Uncaught error:', error.message);
        console.error('[GlobalErrorBoundary] Component stack:', errorInfo.componentStack);
        
        Sentry.captureException(error, {
            extra: {
                componentStack: errorInfo.componentStack,
            },
        });
    }

    render() {
        if (this.state.hasError) {
            return (
                <View style={{ flex: 1, backgroundColor: '#0a0d1d', justifyContent: 'center', alignItems: 'center', padding: 32 }}>
                    <Text style={{ fontSize: 48, marginBottom: 16 }}>💥</Text>
                    <Text style={{ fontSize: 20, fontWeight: '700', color: '#ffffff', marginBottom: 8 }}>Something went wrong</Text>
                    <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', textAlign: 'center', lineHeight: 22, marginBottom: 16 }}>
                        The app encountered an unexpected error during startup.
                    </Text>
                    <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', textAlign: 'center', fontFamily: 'monospace' }}>
                        {this.state.error?.message || 'Unknown error'}
                    </Text>
                </View>
            );
        }
        return this.props.children;
    }
}
