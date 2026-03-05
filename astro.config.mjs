import { defineConfig } from 'astro/config';
import alpine from '@astrojs/alpinejs';

export default defineConfig({
    site: 'https://wrieseberg.github.io',
    base: '/Research-Dashboard',
    integrations: [alpine()]
});
