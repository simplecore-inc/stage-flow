import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';

export default [
  // Base JavaScript configuration
  js.configs.recommended,
  
  // Enhanced test files configuration (must come before other configurations)
  {
    files: ['**/__tests__/**/*.{ts,tsx}', '**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}', '**/setup.ts', '**/test/**/*.{ts,tsx}', 'packages/*/src/__tests__/**/*.{ts,tsx}', 'packages/*/src/**/*.test.{ts,tsx}', 'packages/*/src/**/*.spec.{ts,tsx}'],
    languageOptions: {
      globals: {
        // Vitest globals
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        vi: 'readonly',
        vitest: 'readonly',
        
        // Vitest advanced globals
        expectTypeOf: 'readonly',
        assertType: 'readonly',
        expectType: 'readonly',
        mock: 'readonly',
        spyOn: 'readonly',
        mockFn: 'readonly',
        mockObject: 'readonly',
        mockModule: 'readonly',
        mockFunction: 'readonly',
        mockImplementation: 'readonly',
        mockReturnValue: 'readonly',
        mockResolvedValue: 'readonly',
        mockRejectedValue: 'readonly',
        
        // Jest globals (for compatibility)
        jest: 'readonly',
        
        // Testing Library globals
        screen: 'readonly',
        render: 'readonly',
        fireEvent: 'readonly',
        waitFor: 'readonly',
        waitForElementToBeRemoved: 'readonly',
        within: 'readonly',
        cleanup: 'readonly',
        act: 'readonly',
        
        // Testing Library queries
        getByRole: 'readonly',
        getByLabelText: 'readonly',
        getByPlaceholderText: 'readonly',
        getByText: 'readonly',
        getByDisplayValue: 'readonly',
        getByAltText: 'readonly',
        getByTitle: 'readonly',
        getByTestId: 'readonly',
        
        // Common test globals
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        console: 'readonly',
        
        // Node.js globals for test files
        process: 'readonly',
        Buffer: 'readonly',
        global: 'readonly',
        NodeJS: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        
        // Browser globals for test files
        window: 'readonly',
        document: 'readonly',
        HTMLElement: 'readonly',
        Event: 'readonly',
        EventTarget: 'readonly',
        
        // TypeScript globals for tests
        JSX: 'readonly',
        React: 'readonly',
      },
    },
    rules: {
      // Relaxed rules for test files
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      'no-console': 'off',
      'react/display-name': 'off',
      'react/prop-types': 'off',
      'react/jsx-key': 'warn', // Allow missing keys in test files
      'no-undef': 'error',
    },
  },
  
  // TypeScript and React configuration for all source files
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2021,
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        // Common globals
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        
        // Node.js globals
        process: 'readonly',
        Buffer: 'readonly',
        global: 'readonly',
        NodeJS: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
        
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        Storage: 'readonly',
        globalThis: 'readonly',
        HTMLElement: 'readonly',
        HTMLFormElement: 'readonly',
        FormData: 'readonly',
        Event: 'readonly',
        EventTarget: 'readonly',
        Location: 'readonly',
        Navigator: 'readonly',
        History: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        fetch: 'readonly',
        Request: 'readonly',
        Response: 'readonly',
        Headers: 'readonly',
        AbortController: 'readonly',
        AbortSignal: 'readonly',
        
        // TypeScript/React globals
        JSX: 'readonly',
        React: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      react,
      'react-hooks': reactHooks,
    },
    rules: {
      // TypeScript rules
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-empty-function': 'warn',
      
      // React rules
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react/display-name': 'warn',
      'react/jsx-key': 'error',
      'react/jsx-no-duplicate-props': 'error',
      'react/jsx-no-undef': 'error',
      'react/jsx-uses-react': 'off',
      'react/jsx-uses-vars': 'error',
      'react/no-children-prop': 'error',
      'react/no-danger-with-children': 'error',
      'react/no-deprecated': 'warn',
      'react/no-direct-mutation-state': 'error',
      'react/no-find-dom-node': 'error',
      'react/no-is-mounted': 'error',
      'react/no-render-return-value': 'error',
      'react/no-string-refs': 'error',
      'react/no-unescaped-entities': 'error',
      'react/no-unknown-property': 'error',
      'react/require-render-return': 'error',
      
      // React Hooks rules
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      
      // General ESLint rules
      'no-unused-vars': 'off', // Handled by TypeScript
      'no-undef': 'error',
      'no-console': 'warn',
      'no-debugger': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  
  // Core package specific configuration
  {
    files: ['packages/core/**/*.{ts,tsx}', '!packages/core/**/__tests__/**/*.{ts,tsx}', '!packages/core/**/*.test.{ts,tsx}', '!packages/core/**/*.spec.{ts,tsx}', '!packages/core/**/test/**/*.{ts,tsx}'],
    rules: {
      // Core package specific rules
      '@typescript-eslint/no-explicit-any': 'error', // Stricter for core
      '@typescript-eslint/explicit-function-return-type': 'off', // Disabled for test files
      '@typescript-eslint/explicit-module-boundary-types': 'warn',
      'no-console': 'error', // No console in core package
    },
  },
  
  // Plugins package specific configuration
  {
    files: ['packages/plugins/**/*.{ts,tsx}', '!packages/plugins/**/__tests__/**/*.{ts,tsx}', '!packages/plugins/**/*.test.{ts,tsx}', '!packages/plugins/**/*.spec.{ts,tsx}', '!packages/plugins/**/test/**/*.{ts,tsx}'],
    rules: {
      // Plugin package specific rules
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-console': 'warn', // Allow console for plugin debugging
      '@typescript-eslint/no-empty-function': 'off', // Allow empty functions for plugin hooks
    },
  },
        
  // React package specific configuration
  {
    files: ['packages/react/**/*.{ts,tsx}', '!packages/react/**/__tests__/**/*.{ts,tsx}', '!packages/react/**/*.test.{ts,tsx}', '!packages/react/**/*.spec.{ts,tsx}', '!packages/react/**/test/**/*.{ts,tsx}'],
    rules: {
      // React package specific rules
      'react/jsx-key': 'error',
      'react/display-name': 'warn',
      'react/prop-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off', // Disabled for test files
      'no-console': 'warn',
    },
  },
  
  // Testing package specific configuration
  {
    files: ['packages/testing/**/*.{ts,tsx}', '!packages/testing/**/__tests__/**/*.{ts,tsx}', '!packages/testing/**/*.test.{ts,tsx}', '!packages/testing/**/*.spec.{ts,tsx}', '!packages/testing/**/test/**/*.{ts,tsx}'],
    rules: {
      // Testing package specific rules
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      'no-console': 'off',
      'react/display-name': 'off',
      },
    },
  
  // Type definition files configuration
  {
    files: ['**/*.d.ts', '**/types/**/*.{ts,tsx}'],
    rules: {
      // Relaxed rules for type definitions
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      'no-console': 'off',
      'react/display-name': 'off',
    },
  },
  
  // Example files configuration
  {
    files: ['examples/**/*.{ts,tsx}'],
    rules: {
      // Relaxed rules for example files
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      'no-console': 'off',
      'react/display-name': 'off',
      'react/prop-types': 'off',
      'react/jsx-key': 'warn',
    },
  },
  
  // Configuration files
  {
    files: ['**/*.config.{js,mjs,ts}', '**/rollup.config.{js,mjs,ts}', '**/vitest.config.{js,mjs,ts}'],
    languageOptions: {
      globals: {
        process: 'readonly',
        Buffer: 'readonly',
        global: 'readonly',
        NodeJS: 'readonly',
        console: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
    },
  },
  
  // Ignore patterns
  {
    ignores: [
      'dist/',
      'node_modules/',
      '.turbo/',
      'coverage/',
      '*.min.js',
      '*.bundle.js',
      '.next/',
      '.cache/',
      'build/',
      'out/',
    ],
  },
]; 