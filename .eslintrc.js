module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es6: true,
    jest: true,
  },
  extends: ['eslint:recommended', 'plugin:jest/recommended', 'plugin:prettier/recommended'],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  rules: {
    // 错误级别规则
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-var': 'error',
    'prefer-const': 'error',

    // 代码风格规则
    'arrow-body-style': ['error', 'as-needed'],
    'arrow-parens': ['error', 'as-needed'],
    curly: ['error', 'multi-line'],
    'eol-last': 'error',
    // 注释掉quotes规则，使用prettier的规则
    // quotes: ['error', 'single', { allowTemplateLiterals: true }],
    semi: ['error', 'always'],

    // jest规则
    'jest/no-disabled-tests': 'off',
    'jest/no-focused-tests': 'error',
    'jest/no-identical-title': 'error',
    'jest/prefer-to-have-length': 'warn',

    // 空格和缩进规则
    indent: ['error', 2, { SwitchCase: 1 }],
    'object-curly-spacing': ['error', 'always'],

    // prettier规则
    'prettier/prettier': 'warn',
  },
  overrides: [
    {
      files: ['tests/**/*.js'],
      env: {
        jest: true,
      },
      rules: {
        'jest/expect-expect': 'error',
      },
    },
    // 性能测试文件特殊规则
    {
      files: ['tests/performance/*.test.js'],
      rules: {
        'jest/no-export': 'off', // 允许性能测试文件导出模块
      },
    },
  ],
};
