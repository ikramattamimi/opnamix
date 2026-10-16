import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'node_modules', 'supabase/functions', 'lib/database.types.ts'] },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      // Hanya aturan hooks klasik. Aturan React Compiler di preset v7
      // (set-state-in-effect, purity, dst.) ditinjau di fase 5.
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      // Sementara: `any` dibersihkan di fase 3 T4, setelah itu kembali ke error.
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  {
    files: ['*.{js,ts}'],
    languageOptions: { globals: globals.node },
  },
);
