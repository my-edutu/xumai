import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      allowedHosts: ['user.xum.local'],
      headers: {
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        'Content-Security-Policy': "default-src 'self' https://*.supabase.co https://*.hetzner.com; script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://*.tailwindcss.com https://*.clerk.accounts.dev https://*.clerk.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.tailwindcss.com https://*.tailwindcss.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https://*.supabase.co https://img.clerk.com; connect-src 'self' https://*.supabase.co https://*.hetzner.com https://*.clerk.accounts.dev https://*.clerk.com https://clerk-telemetry.com; worker-src 'self' blob:; frame-ancestors 'none';",
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin'
      }
    },
    plugins: [react()],
    define: {
      '__DEV__': JSON.stringify(mode !== 'production'),
      'process.env.NODE_ENV': JSON.stringify(mode),
      // Inline publishable Supabase/Clerk credentials for web builds. Metro inlines
      // process.env.EXPO_PUBLIC_* automatically, but Vite does not — without
      // these the web bundle ships placeholder credentials, every DB call
      // fails, and screens silently fall back to mock data.
      'process.env.EXPO_PUBLIC_SUPABASE_URL': JSON.stringify(env.EXPO_PUBLIC_SUPABASE_URL || env.VITE_SUPABASE_URL || ''),
      'process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY': JSON.stringify(env.EXPO_PUBLIC_SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY || ''),
      'process.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL || env.EXPO_PUBLIC_SUPABASE_URL || ''),
      'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY || env.EXPO_PUBLIC_SUPABASE_ANON_KEY || ''),
      'process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY': JSON.stringify(env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || env.VITE_CLERK_PUBLISHABLE_KEY || ''),
      'global': 'globalThis',
    },
    resolve: {
      alias: [
        { find: /^@\//, replacement: path.resolve(__dirname, 'core/') },
        { find: /^@api/, replacement: path.resolve(__dirname, 'api') },
        { find: /^@sentry\/react-native$/, replacement: path.resolve(__dirname, './sentry-web-shim.ts') },
        { find: /^react-native$/, replacement: path.resolve(__dirname, './react-native-web-shim.js') },
      ]
    },
    optimizeDeps: {
      esbuildOptions: {
        loader: {
          '.js': 'jsx',
        },
      },
      include: ['expo-linear-gradient', 'expo-av', 'expo-camera', 'expo-media-library', 'expo-file-system']
    },
    build: {
      commonjsOptions: {
        transformMixedEsModules: true,
      },
      rollupOptions: {
        onwarn(warning, warn) {
          // Suppress JSX warnings in node_modules
          if (warning.code === 'PLUGIN_WARNING') return;
          warn(warning);
        }
      }
    },
    esbuild: {
      loader: 'tsx',
      include: /\.[jt]sx?$/,
      exclude: [],
    }
  };
});
