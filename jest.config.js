/**
 * Jest 配置文件
 */
module.exports = {
  // 指定测试文件匹配模式
  testMatch: [
    '**/tests/unit/**/*.spec.js',
    '**/tests/integration/**/*.spec.js',
    '**/tests/**/*.test.js',
  ],

  // 忽略的目录
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/tests/e2e/'],

  // 测试环境
  testEnvironment: 'jsdom',

  // 每个测试前自动清除模拟和实例
  clearMocks: true,

  // 代码覆盖率设置
  collectCoverage: false,
  coverageDirectory: 'coverage',
  collectCoverageFrom: ['src/**/*.js', '!src/**/*.d.ts', '!**/node_modules/**'],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 95,
      lines: 95,
      statements: 95,
    },
  },

  // 报告格式
  coverageReporters: ['text', 'lcov', 'html'],

  // 设置模块别名
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },

  // 变换器配置
  transform: {
    '^.+\\.js$': ['babel-jest', { configFile: './babel.config.js' }],
  },

  // 支持ESM的依赖包
  transformIgnorePatterns: ['/node_modules/(?!chai|sinon).+\\.js$'],

  // 设置测试超时时间（毫秒）
  testTimeout: 10000,

  // 详细输出
  verbose: true,

  // ESLint配置
  // 忽略测试文件中的某些ESLint规则
  globals: {
    __TESTING__: true,
  },
};
