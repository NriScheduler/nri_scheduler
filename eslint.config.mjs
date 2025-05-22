import globals from "globals";
import prettier from 'eslint-plugin-prettier';
import prettierRecommended from 'eslint-plugin-prettier/recommended';
import pluginJs from "@eslint/js";
import importSort from "eslint-plugin-simple-import-sort";
import nodeImport from 'eslint-plugin-node-import';
import typescriptParser from '@typescript-eslint/parser';
import tsPlugin from'@typescript-eslint/eslint-plugin';
import react from "eslint-plugin-react";


/** @type {import('eslint').Linter.Config[]} */
export default [
  {files: ["**/*.{ts,tsx}"]},
  {
    languageOptions: {
      globals: globals.browser,
      parser: typescriptParser,
      parserOptions: {
        project: ['./tsconfig.json'],
      },
    }
  },
  pluginJs.configs.recommended,
  prettierRecommended,
  react.configs.flat.recommended,
  {
    plugins: {
      "simple-import-sort": importSort,
      'node-import': nodeImport,
      '@typescript-eslint': tsPlugin,
      react,
      prettier,
    },
    settings: {
      react: {
        version: "18.3.1"
      }
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      "prefer-const": "error",
      "no-console": ["error", { allow: ["info", "warn", "error"] }],
      "curly": ["error", "all"],
      "eqeqeq": ["error", "always"],
      "no-duplicate-imports": "error",
      "node-import/prefer-node-protocol": "error",
      "simple-import-sort/imports": ["error", {
        groups: [
          // Стили
          ["^.+\\.s?css$"],
          ["^node:"],
          ["^preact", "^react"],
          // Библиотеки начинающиеся на @, Библиотеки НЕ начинающиеся на @
          ["^@", "^[^@.]"],
          // Относительные пути
          ["^\\./\\w+", "^\\.\\./\\w+", "^\\.\\./\\.\\./\\w+", "^\\.\\./\\.\\./\\.\\./\\w+", "^\\.\\./\\.\\./\\.\\./\\.\\./\\w+", "^\\.\\./\\.\\./\\.\\./\\.\\./\\.\\./\\w+"],
        ],
      }],
      "simple-import-sort/exports": "error",
      "no-shadow": "off",
      "@typescript-eslint/no-shadow": "error",
      "react/react-in-jsx-scope": "off",
    },
  },
  {
    ignores: [
      "eslint.config.mjs",
      ".cargo",
      ".cargo-husky",
      ".git",
      ".vscode",
      "migrations",
      "node_modules",
      "postgres",
      "server",
      "static",
      "target",
    ]
  }
];
