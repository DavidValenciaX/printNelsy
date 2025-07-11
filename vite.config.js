import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  // Configuración del servidor de desarrollo
  server: {
    port: 3000,
    open: true,
    host: true
  },

  // Configuración para el build de producción
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      },
      output: {
        // Configuración para chunks
        manualChunks: {
          // Separar librerías grandes en chunks individuales
          fabric: ['fabric'],
          jspdf: ['jspdf'],
          sweetalert: ['sweetalert2']
        }
      }
    }
  },

  // Configuración de assets
  assetsInclude: ['**/*.woff', '**/*.woff2', '**/*.ttf', '**/*.otf'],

  // Configuración de CSS
  css: {
    devSourcemap: true
  },

  // Configuración de dependencias
  optimizeDeps: {
    include: [
      'fabric',
      'jspdf',
      'sweetalert2'
    ]
  },

  // Configuración de alias para importaciones más limpias
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@core': resolve(__dirname, 'src/core'),
      '@canvas': resolve(__dirname, 'src/canvas'),
      '@image': resolve(__dirname, 'src/image'),
      '@transform': resolve(__dirname, 'src/transform'),
      '@layout': resolve(__dirname, 'src/layout'),
      '@events': resolve(__dirname, 'src/events'),
      '@interactions': resolve(__dirname, 'src/interactions'),
      '@output': resolve(__dirname, 'src/output'),
      '@utils': resolve(__dirname, 'src/utils'),
      '@ui': resolve(__dirname, 'src/ui')
    }
  }
}); 