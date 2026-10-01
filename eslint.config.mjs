import reactHooks from 'eslint-plugin-react-hooks';
import tseslintParser from '@typescript-eslint/parser';

export default [
  {
    files: ['**/*.tsx'],
    languageOptions: {
      parser: tseslintParser,
      parserOptions: { ecmaVersion: 2022, sourceType: 'module', ecmaFeatures: { jsx: true } }
    },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      'react-hooks/exhaustive-deps': 'error'
    }
  }
];
