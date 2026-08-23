import { defineConfig } from 'vite';

// Configuracao do Vite. O build final vai para a pasta dist,
// que e a pasta que o Netlify publica.
export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true
  },
  server: {
    port: 5173,
    open: true
  }
});
