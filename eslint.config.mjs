// @ts-check
import globals from 'globals';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig(tseslint.configs.recommended, {
  files: ['**/*.ts', '**/*.tsx', '**/*.mts', '**/*.cts'],
  ignores: ['**/dist/**', '**/node_modules/**', '**/coverage/**'],
  languageOptions: {
    globals: {
      ...globals.node,
    },
  },
  rules: {
    '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
  },
});
