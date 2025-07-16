import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'fs';
const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));

export default defineConfig({
    plugins: [react()],
    server: {
        open: true,
    },
    base: '/inbox-board/',
    define: {
        'import.meta.env.VITE_APP_VERSION': JSON.stringify(pkg.version),
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    // Split vendor libraries
                    'react-vendor': ['react', 'react-dom'],
                    'mui-vendor': ['@mui/material', '@mui/icons-material'],
                    'dexie-vendor': ['dexie', 'dexie-react-hooks'],
                    'router-vendor': ['react-router-dom'],
                    'utils-vendor': ['tldts', 'web-vitals']
                }
            }
        },
        // Increase chunk size warning limit
        chunkSizeWarningLimit: 1000,
        // Enable source maps for debugging
        sourcemap: false,
        // Optimize dependencies
        commonjsOptions: {
            include: [/node_modules/]
        }
    },
    // Optimize dependencies
    optimizeDeps: {
        include: [
            'react',
            'react-dom',
            '@mui/material',
            '@mui/icons-material',
            'dexie',
            'dexie-react-hooks',
            'react-router-dom'
        ]
    }
}); 