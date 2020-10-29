module.exports = {
  root: true,

  // Rules order is important, please avoid shuffling them
  extends: [
    // Base ESLint recommended rules
    'eslint:recommended',

    // ESLint typescript rules
    // See https://github.com/typescript-eslint/typescript-eslint/tree/master/packages/eslint-plugin#usage
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',

    // `plugin:vue/essential` by default, consider switching to `plugin:vue/strongly-recommended`
    //  or `plugin:vue/recommended` for stricter rules.
    // See https://github.com/vuejs/eslint-plugin-vue#priority-a-essential-error-prevention
    'prettier',
    'prettier/@typescript-eslint',
    'prettier/babel',
    'prettier/standard',
    'prettier/unicorn',
  ],

  plugins: [
    // Required to apply rules which need type information
    '@typescript-eslint',
  ],

  // Must use parserOptions instead of "parser" to allow vue-eslint-parser to keep working
  // See https://eslint.vuejs.org/user-guide/#how-to-use-custom-parser
  // `parser: 'vue-eslint-parser'` is already included with any 'plugin:vue/**' config and should be omitted
  parserOptions: {
    parser: '@typescript-eslint/parser',
    sourceType: 'module',
  },

  env: {
    browser: true,
    node: true,
    amd: true,
    commonjs: true,
    jquery: true,
  },

  globals: {},

  // add your custom rules here
  rules: {
    // allow async-await
    'generator-star-spacing': 'off',
    // allow paren-less arrow functions
    'arrow-parens': 'off',
    'one-var': 'off',
    'import/extensions': 'off',
    'import/no-unresolved': 'off',
    'import/no-extraneous-dependencies': 'off',
    'prefer-promise-reject-errors': 'off',
    quotes: ['error', 'single'],
    '@typescript-eslint/indent': [0, 2],

    // allow console.log during development only
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    // allow debugger during development only
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',

    // Correct typescript linting until at least 2.0.0 major release
    // See https://github.com/typescript-eslint/typescript-eslint/issues/501
    // See https://github.com/typescript-eslint/typescript-eslint/issues/493
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/ban-ts-ignore': 'off',
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/no-var-requires': 'off',
    '@typescript-eslint/ban-types': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/ban-ts-comment': 'off',
    '@typescript-eslint/no-this-alias': 'off',
    '@typescript-eslint/no-namespace': 'off',

    'comma-dangle': 'off',
    'prefer-const': 'off',
    'space-before-function-paren': [
      'warn',
      {
        anonymous: 'always',
        named: 'never',
        asyncArrow: 'always',
      },
    ],
    'no-case-declarations': 'off',
  },
};
