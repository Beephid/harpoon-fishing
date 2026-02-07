import { defineConfig } from 'vite';

export default defineConfig(({ command }) => ({
    root: '.',
    publicDir: 'assets',
    base: command === 'build' ? '/harpoon-fishing/' : '/',
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
    },
    server: {
        port: 3000,
        open: true,
    },
}));
