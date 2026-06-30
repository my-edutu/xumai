import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    server: {
        port: 3001,
        host: '0.0.0.0',
        allowedHosts: ['company.xum.local'],
        headers: {
            'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
            'Content-Security-Policy': "default-src 'self' * 'unsafe-inline' 'unsafe-eval'; script-src 'self' * 'unsafe-inline' 'unsafe-eval'; style-src 'self' * 'unsafe-inline'; img-src 'self' * data:; connect-src 'self' *;",
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block',
            'Referrer-Policy': 'strict-origin-when-cross-origin'
        }
    }
})
