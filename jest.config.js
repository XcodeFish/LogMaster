module.exports = {
  // 指定测试文件匹配模式
  testMatch: [
    '**/tests/unit/**/*.spec.js',
    '**/tests/integration/**/*.spec.js'
  ],

  // 忽略的目录
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],

  // 测试环境
  testEnvironment: 'jsdom',

  // 每个测试前自动清除模拟和实例
  clearMocks: true,

  // 代码覆盖率设置
  collectCoverage: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.d.ts',
    '!**/node_modules/**'
  ],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 95,
      lines: 95,
      statements: 95
    }
  },

  // 报告格式
  coverageReporters: ['text', 'lcov', 'html'],

  // 设置模块别名
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },

  // 变换器配置
  transform: {
    '^.+\\.js$': 'babel-jest'
  },

  // 测试超时设置（毫秒）
  testTimeout: 10000,

  // 详细输出
  verbose: true
};
