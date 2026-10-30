import js from '@eslint/js';
import nextPlugin from '@next/eslint-plugin-next';
import pluginQuery from '@tanstack/eslint-plugin-query';
import eslintConfigPrettier from 'eslint-config-prettier';
import importX from 'eslint-plugin-import-x';
import reactCompiler from 'eslint-plugin-react-compiler';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import unusedImports from 'eslint-plugin-unused-imports';
import tsEslint from 'typescript-eslint';

import {
  appPageBoundariesConfig,
  appShellBoundariesConfig,
  featureTestBoundariesConfig,
  layerBoundariesConfig,
  pixelPerfectBoundariesConfig,
  reactQueryBoundariesConfig,
} from './eslint/layer-boundaries/index.mjs';

export default tsEslint.config(
  {
    ignores: ['.next/**', 'node_modules/**', 'out/**', 'build/**', 'dist/**', './next-env.d.ts'],
  },
  js.configs.recommended,
  ...tsEslint.configs.recommended,
  ...pluginQuery.configs['flat/recommended'],
  {
    plugins: {
      '@next/next': nextPlugin,
      'react-hooks': reactHooksPlugin,
    },
    rules: {
      ...reactHooksPlugin.configs.recommended.rules,
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
      'no-console': ['error', { allow: ['warn', 'error'] }],
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
        },
      ],
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'react',
              importNames: ['default'],
              message: "React 17+ does not require importing 'React' globally. Use named hook imports instead.",
            },
          ],
        },
      ],
    },
  },
  {
    plugins: {
      'unused-imports': unusedImports,
      'import-x': importX,
      'react-compiler': reactCompiler,
    },
    rules: {
      'react-compiler/react-compiler': 'error',
      'unused-imports/no-unused-imports': 'error',
      'import-x/no-default-export': 'error',
      'no-duplicate-imports': 'error',
      'react-hooks/exhaustive-deps': 'off',
    },
  },
  {
    files: ['app/**', 'src/application/**', 'src/features/**', 'src/ui/**', 'src/views/**', 'src/*.ts', './*.mjs', './*.ts'],
    rules: {
      'import-x/no-default-export': 'off',
    },
  },
  layerBoundariesConfig,
  appShellBoundariesConfig,
  appPageBoundariesConfig,
  featureTestBoundariesConfig,
  pixelPerfectBoundariesConfig,
  reactQueryBoundariesConfig,
  eslintConfigPrettier,
);
