module.exports = {
    // https://eslint.org/docs/user-guide/configuring#configuration-cascading-and-hierarchy
    // This option interrupts the configuration hierarchy at this file
    // Remove this if you have a higher level ESLint config file (it usually happens into a monorepos)
    root: true,

    parserOptions: {
        parser: '@typescript-eslint/parser',
        ecmaVersion: 2018, // Allows for the parsing of modern ECMAScript features
        sourceType: 'module', // Allows for the use of imports
    },

    env: {
        browser: true,
    },

    // Rules order is important, please avoid shuffling them
    extends: [
        // Base ESLint recommended rules
        // 'eslint:recommended',


        // Uncomment any of the lines below to choose desired strictness,
        // but leave only one uncommented!
        // See https://eslint.vuejs.org/rules/#available-rules
        'plugin:vue/vue3-essential', // or equivalent
        // 'plugin:vue/strongly-recommended', // Priority B: Strongly Recommended (Improving Readability)
        // 'plugin:vue/recommended', // Priority C: Recommended (Minimizing Arbitrary Choices and Cognitive Overhead)
    ],

    plugins: [
        // https://eslint.vuejs.org/user-guide/#why-doesn-t-it-work-on-vue-file
        // required to lint *.vue files
        'vue',
        'no-relative-import-paths',
        // https://github.com/typescript-eslint/typescript-eslint/issues/389#issuecomment-509292674
    ],

    globals: {
        ga: true, // Google Analytics
        cordova: true,
        __statics: true,
        process: true,
        Capacitor: true,
        chrome: true,
    },

    // add your custom rules here
    rules: {
        'prefer-promise-reject-errors': 'off',

        'no-relative-import-paths/no-relative-import-paths': [
            'error', { 'allowSameFolder': false, 'rootDir': 'src', 'prefix': '~' },
        ],

        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/explicit-module-boundary-types': 'off',

        // allow debugger during development only
        'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',

        'comma-dangle': ['error', 'always-multiline'],
        'indent': ['error', 4],
        'quotes': ['error', 'single'],
        // 'max-len': ['error', { 'code': 120 }],
        'eol-last': ['error', 'always'],
        'object-curly-spacing': ['error', 'always'],
        'array-bracket-spacing': ['error', 'never'],
        'space-in-parens': ['error', 'never'],
        'computed-property-spacing': ['error', 'never'],
        'comma-spacing': ['error', { 'before': false, 'after': true }],
        'no-trailing-spaces': 'error',
        'eqeqeq': 'error',
        'semi': ['error', 'always'],
        'arrow-parens': [2, 'as-needed', { 'requireForBlockBody': true }],
        'arrow-body-style': ['error', 'as-needed'],
        'object-property-newline': ['error', { 'allowAllPropertiesOnSameLine': true }],
        'curly': 'error',
        'brace-style': ['error', '1tbs', { 'allowSingleLine': false }],
        'no-return-assign': ['error', 'always'],
        'no-param-reassign': 'error',


        'vue/html-indent': ['warn', 4, { 'baseIndent': 0 }],
        'vue/max-attributes-per-line': ['warn', {
            'singleline': {
                'max': 3,
            },
            'multiline': {
                'max': 1,
            },
        }],
        'vue/first-attribute-linebreak': ['error', {
            'singleline': 'ignore',
            'multiline': 'below',
        }],
        'vue/component-tags-order': ['error', {
            'order': ['script', 'template', 'style'],
        }],
        'vue/html-self-closing': ['error', {
            'html': {
                'void': 'never',
                'normal': 'never',
                'component': 'always',
            },
            'svg': 'always',
        }],
        'vue/multi-word-component-names': 'error',
        'vue/no-static-inline-styles': ['error', {
            'allowBinding': false,
        }],
        'vue/attributes-order': ['error', {
            'order': [
                'DEFINITION',
                'LIST_RENDERING',
                'CONDITIONALS',
                'RENDER_MODIFIERS',
                'GLOBAL',
                ['UNIQUE', 'SLOT'],
                'TWO_WAY_BINDING',
                'OTHER_DIRECTIVES',
                'OTHER_ATTR',
                'EVENTS',
                'CONTENT',
            ],
            'alphabetical': false,
        }],
        'vue/html-closing-bracket-newline': ['error', {
            'singleline': 'never',
            'multiline': 'always',
        }],
        'vue/component-options-name-casing': ['error', 'PascalCase'],
        'vue/component-definition-name-casing': ['error', 'PascalCase'],
        'vue/component-name-in-template-casing': ['error', 'PascalCase'],
    },
    overrides: [
        {
            'files': ['**/*.ts', '**/*.tsx', '**/*/.vue'],
            'env': { 'browser': true, 'es6': true, 'node': true },
            'extends': [
                'plugin:@typescript-eslint/eslint-recommended',
                'plugin:@typescript-eslint/recommended',
                'plugin:vue/vue3-essential',
            ],
            'parserOptions': {
                'ecmaFeatures': { 'jsx': true },
                'ecmaVersion': 2018,
                'sourceType': 'module',
                'project': './tsconfig.json',
                'parser': '@typescript-eslint/parser',
            },
            'plugins': ['vue', '@typescript-eslint'],
            'rules': {
                '@typescript-eslint/no-explicit-any': 1,
            },
        },
    ],
};
