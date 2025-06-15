/**
 * @file Playwright配置文件
 * @author LogMaster Team
 * @license MIT
 */

const { devices } = require('@playwright/test');

module.exports = {
  testDir: './tests/e2e',
  timeout: 60000,
  forbidOnly: false,
  retries: 1,
  workers: 1,
  reporter: [['html'], ['json', { outputFile: 'test-results/e2e-results.json' }]],

  use: {
    trace: 'on',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // 暂时只测试Chromium，减少测试负载
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
    // {
    //   name: 'edge',
    //   use: { ...devices['Desktop Edge'] },
    // },
    // // 移动浏览器测试
    // {
    //   name: 'mobile-chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'mobile-safari',
    //   use: { ...devices['iPhone 12'] },
    // },
  ],

  // 本地开发服务器配置
  webServer: {
    command: 'npx http-server -p 8080',
    port: 8080,
    reuseExistingServer: true,
    timeout: 30000,
  },
};
