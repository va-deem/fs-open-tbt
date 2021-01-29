module.exports = {
  env: {
    node: true,
    commonjs: true,
    es6: true,
    jest: true,
  },
  extends: [
    'eslint:recommended',
    'airbnb',
  ],
  parserOptions: { ecmaVersion: 12 },
  rules: {
    'no-console': 0,
    'object-curly-newline': ['warn', {
      ObjectExpression: {
        multiline: true,
        minProperties: 4,
      },
      ObjectPattern: 'never',
      ImportDeclaration: 'never',
      ExportDeclaration: {
        multiline: true,
        minProperties: 4,
      },
    }],
  },
};
