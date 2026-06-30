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
        'Content-Security-Policy': "default-src 'self' https://*.supabase.co https://*.hetzner.com; script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://*.tailwindcss.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.tailwindcss.com https://*.tailwindcss.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https://*.supabase.co; connect-src 'self' https://*.supabase.co https://*.hetzner.com; frame-ancestors 'none';",
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
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
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
