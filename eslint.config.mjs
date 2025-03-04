import globals from "globals";
import prettier from 'eslint-plugin-prettier';
import prettierRecommended from 'eslint-plugin-prettier/recommended';
import pluginJs from "@eslint/js";
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
      "curly": ["error", "all"],
      "eqeqeq": ["error", "always"],
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
