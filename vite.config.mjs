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
                    // Split vendor libraries more aggressively for mobile
                    'react-vendor': ['react', 'react-dom'],
                    'mui-vendor': ['@mui/material', '@mui/icons-material'],
                    'dexie-vendor': ['dexie', 'dexie-react-hooks'],
                    'router-vendor': ['react-router-dom'],
                    'utils-vendor': ['tldts', 'web-vitals'],
                    // Separate heavy components
                    'notistack-vendor': ['notistack']
                }
            }
        },
        // Increase chunk size warning limit
        chunkSizeWarningLimit: 1000,
        // Disable source maps for production
        sourcemap: false,
        // Optimize dependencies
        commonjsOptions: {
            include: [/node_modules/]
        },
        // Target modern browsers for better optimization
        target: 'esnext',
        // Minify more aggressively
        minify: 'terser',
        terserOptions: {
            compress: {
                drop_console: true,
                drop_debugger: true,
                pure_funcs: ['console.log', 'console.info', 'console.debug']
            }
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
            'react-router-dom',
            'notistack'
        ],
        // Exclude heavy dependencies from pre-bundling
        exclude: ['tldts']
    }
}); 