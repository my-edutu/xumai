/// <reference types="nativewind/types" />

// Expo Camera types
declare module 'expo-camera' {
    export const CameraView: React.ComponentType<any>;
    export function useCameraPermissions(): [any, () => Promise<any>];
    export type CameraType = 'front' | 'back';
}

// Vite environment variable types
interface ImportMetaEnv {
    readonly VITE_SUPABASE_URL: string;
    readonly VITE_SUPABASE_ANON_KEY: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}

// Expo environment variable types
declare namespace NodeJS {
    interface ProcessEnv {
        EXPO_PUBLIC_SUPABASE_URL?: string;
        EXPO_PUBLIC_SUPABASE_ANON_KEY?: string;
    }
}
