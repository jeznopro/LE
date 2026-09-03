import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      '/gemini-proxy': {
        target: 'https://gemini.google.com',
        changeOrigin: true,
        secure: true,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
          'Referer': 'https://gemini.google.com/',
          'Origin': 'https://gemini.google.com',
        },
        rewrite: (path) => path.replace(/^\/gemini-proxy/, ''),
        configure: (proxy) => {
          proxy.on('proxyRes', (proxyRes) => {
            // Strip headers that prevent embedding in iframe
            delete proxyRes.headers['x-frame-options'];
            delete proxyRes.headers['content-security-policy'];
            delete proxyRes.headers['content-security-policy-report-only'];
            delete proxyRes.headers['cross-origin-resource-policy'];
            delete proxyRes.headers['cross-origin-opener-policy'];
            delete proxyRes.headers['cross-origin-embedder-policy'];

            if (proxyRes.headers['location']) {
              proxyRes.headers['location'] = proxyRes.headers['location']
                .replace('https://gemini.google.com', '/gemini-proxy')
                .replace(/^\/app/, '/gemini-proxy/app');
            }

            if (proxyRes.headers['set-cookie']) {
              proxyRes.headers['set-cookie'] = (proxyRes.headers['set-cookie'] as string[]).map((cookie: string) =>
                cookie.replace(/Domain=[^;]+;?/i, '').replace(/SameSite=Lax/i, 'SameSite=None')
              );
            }
          });
        },
      },
      '/_/BardChatUi': {
        target: 'https://gemini.google.com',
        changeOrigin: true,
        secure: true,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
          'Referer': 'https://gemini.google.com/',
          'Origin': 'https://gemini.google.com',
        },
      },
    },
  },
})

