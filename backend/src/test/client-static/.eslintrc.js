module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es2020: true,
    mocha: true,
  },
  globals: {
    chai: 'writable',
  },
  extends: ['airbnb/base', 'eslint:recommended', 'prettier'],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  plugins: ['prettier'],
  rules: {
    /* rules I'm overriding but would like to meet */
    'no-async-promise-executor': 'off',
    /* rules as marked as modules but are client-side scripts - if you mark as scripts you get a unresolvable error */
    'import/no-unresolved': 'off',
    'import/extensions': 'off',
    'import/no-absolute-path': 'off',
    /* set personal preferences below */
    'no-console': [
      'error',
      {
        allow: [
          'log',
          'warn',
          'dir',
          'timeLog',
          'assert',
          'clear',
          'count',
          'countReset',
          'group',
          'groupEnd',
          'table',
          'dirxml',
          'error',
          'groupCollapsed',
          'Console',
          'profile',
          'profileEnd',
          'timeStamp',
          'context',
        ],
      },
    ],
    'max-len': [
      'error',
      {
        code: 120, // default 80
        tabWidth: 2, // default 4
        ignoreComments: true,
        ignorePattern: 'it[(].*',
      },
    ],
    'prettier/prettier': ['error'],
  },
};
