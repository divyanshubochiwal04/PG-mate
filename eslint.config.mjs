// @ts-check
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import unusedImports from 'eslint-plugin-unused-imports';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  // -------------------------------------------------------------------------
  // Global ignores — never lint generated or vendored files
  // -------------------------------------------------------------------------
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.turbo/**',
      '**/coverage/**',
      '**/*.js',            // only lint TypeScript source
      '**/*.d.ts',
      '**/vitest.config.ts', // vitest config is not project source
    ],
  },

  // -------------------------------------------------------------------------
  // Base JavaScript recommended rules
  // -------------------------------------------------------------------------
  js.configs.recommended,

  // -------------------------------------------------------------------------
  // TypeScript strict + stylistic rules
  // -------------------------------------------------------------------------
  ...tseslint.configs.recommended,
  ...tseslint.configs.stylistic,

  // -------------------------------------------------------------------------
  // Project-wide rules
  // -------------------------------------------------------------------------
  {
    plugins: {
      'unused-imports': unusedImports,
    },
    rules: {
      // --- Unused variables / imports ---
      // Catch dead code before it ships.
      '@typescript-eslint/no-unused-vars': 'off', // delegated to unused-imports below
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],

      // --- TypeScript safety ---
      '@typescript-eslint/no-explicit-any': 'warn',      // warn but allow for interop layers
      '@typescript-eslint/explicit-function-return-type': 'off', // too verbose for small utils
      '@typescript-eslint/no-non-null-assertion': 'error', // prefer explicit guards
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'separate-type-imports' },
      ],

      // --- Code quality ---
      'no-console': ['warn', { allow: ['error', 'warn'] }], // use logger instead
      'eqeqeq': ['error', 'always'],
      'no-var': 'error',
      'prefer-const': 'error',

      // --- Import ordering ---
      'sort-imports': ['error', {
        ignoreCase: true,
        ignoreDeclarationSort: true, // let editor handle declaration order
        ignoreMemberSort: false,
      }],
    },
  },

  // -------------------------------------------------------------------------
  // Prettier — must be last to override formatting rules
  // -------------------------------------------------------------------------
  prettier,
);
