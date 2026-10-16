import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return;
          }

          if (id.includes('xlsx')) return 'vendor-xlsx';
          if (id.includes('/@supabase/')) return 'vendor-supabase';
          if (id.includes('/@aws-sdk/') || id.includes('/@smithy/')) return 'vendor-aws';
          if (id.includes('@tanstack/react-query') || id.includes('@tanstack/query-core')) return 'vendor-react-query';
          if (id.includes('@tanstack/react-table') || id.includes('@tanstack/table-core')) return 'vendor-react-table';
          if (id.includes('react-router-dom') || id.includes('react-router')) return 'vendor-router';
          if (id.includes('lucide-react')) return 'vendor-icons';
          if (id.includes('@radix-ui')) return 'vendor-radix';
          if (id.includes('react') || id.includes('scheduler')) return 'vendor-react';

          return 'vendor-misc';
        },
      },
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    }
  }
});
