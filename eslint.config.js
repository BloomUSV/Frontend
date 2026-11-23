
import { defineConfig } from 'eslint/config';
import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import google from 'eslint-config-google';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
  recommendedConfig: js.configs.recommended,
});

const removedRules = [
  'valid-jsdoc',
  'require-jsdoc',
];

const googleConfig = compat.config(google).map((config) => {
  const rules = { ...config.rules };

  for (const rule of removedRules) {
    delete rules[rule];
  }

  return {
    ...config,
    files: ['**/*.{js,jsx}'],
    rules,
  };
});

export default defineConfig([
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'coverage/**',
    ],
  },

  ...googleConfig,
  ...tseslint.configs.recommended,

  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      ...reactHooks.configs.flat.recommended.rules,

      'indent': ['error', 2],
      'max-len': [
        'error',
        { code: 80, ignoreUrls: true },
      ],
      'quotes': ['error', 'single', { avoidEscape: true }],
      'semi': ['error', 'always'],
      'no-var': 'error',
      'prefer-const': 'error',
      'curly': ['error', 'all'],
    },
  },

  prettier,
]);
