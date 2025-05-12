import { defineConfig, globalIgnores } from "eslint/config";

export default [
 {
    ignores: ['node_modules', 'dist', 'app/themes/material']
  },
  {
    files: ['app/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        console: 'readonly',
        window: 'readonly',
        document: 'readonly'
      }
    },
    rules: {
      semi: ['warn', 'always'],
      quotes: ['warn', 'single'],
      'no-unused-vars': 'warn',
      'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off'
    }
  }
];
