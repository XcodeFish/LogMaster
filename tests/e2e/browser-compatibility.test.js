/**
 * @file 浏览器兼容性测试
 * @module tests/e2e/browser-compatibility
 * @author LogMaster Team
 * @license MIT
 */

import { test, expect } from '@playwright/test';

// 测试矩阵，定义不同的浏览器特性组合
const compatibilityMatrix = [
  { name: '现代浏览器', features: ['colors', 'groups', 'table', 'storage'] },
  { name: '基本浏览器', features: ['colors', 'storage'] },
  { name: '有限浏览器', features: [] },
];

// 浏览器功能测试套件
test.describe('LogMaster 浏览器兼容性测试', () => {
  // 在每个测试前预先加载LogMaster
  test.beforeEach(async ({ page }) => {
    // 导航到测试页面
    await page.goto('http://localhost:8080/compatibility-test.html');

    // 等待LogMaster完成加载
    await page.waitForSelector('[data-testid="logger-ready"]');
  });

  // 针对每种浏览器特性组合进行测试
  for (const profile of compatibilityMatrix) {
    test(`在${profile.name}环境下应正确降级功能`, async ({ page }) => {
      // 配置浏览器环境特性支持
      await page.evaluate(features => {
        window.browserFeatures = features;

        // 重新初始化LogMaster以应用新特性
        window.initLogger();

        // 确保capturedLogs数组被正确初始化
        if (!window.capturedLogs) {
          window.capturedLogs = [];
        }
      }, profile.features);

      // 触发功能测试
      const results = await page.evaluate(() => {
        // 清除控制台捕获
        window.capturedLogs = [];

        // 测试不同功能
        window.testBasicLog(); // 使用测试函数代替直接调用

        if (window.browserFeatures.includes('groups')) {
          window.testGrouping(); // 使用测试函数代替直接调用
        }

        // 始终测试表格功能，无论是否支持表格
        window.testTable();

        if (window.browserFeatures.includes('storage')) {
          window.setLogLevel('WARN');
          // 获取保存到存储的设置
          const savedSettings = localStorage.getItem('logmaster_settings');
          return {
            logs: window.capturedLogs,
            features: window.browserFeatures,
            savedSettings,
          };
        }

        return {
          logs: window.capturedLogs,
          features: window.browserFeatures,
        };
      });

      // 基础日志功能应始终有效
      expect(results.logs).toContainEqual(
        expect.objectContaining({
          level: 'INFO',
          message: expect.stringContaining('测试基础日志'),
        }),
      );

      // 根据特性检查分组功能
      if (profile.features.includes('groups')) {
        expect(results.logs).toContainEqual(
          expect.objectContaining({ type: 'group', message: expect.stringContaining('分组测试') }),
        );
      }

      // 根据特性检查表格功能
      if (profile.features.includes('table')) {
        expect(results.logs).toContainEqual(expect.objectContaining({ type: 'table' }));
      } else {
        // 没有表格支持时应降级为普通日志
        expect(results.logs).toContainEqual(
          expect.objectContaining({ level: 'INFO', message: expect.stringContaining('id') }),
        );
      }

      // 根据特性检查存储功能
      if (profile.features.includes('storage')) {
        expect(results.savedSettings).toBeTruthy();
        expect(results.savedSettings).toContain('WARN');
      }
    });
  }

  test('在不同浏览器中样式应正确降级', async ({ page, browserName }) => {
    // 根据不同浏览器调整测试
    const supportsStyles = ['chromium', 'firefox', 'webkit'].includes(browserName);

    // 触发彩色日志输出
    const colorResults = await page.evaluate(() => {
      window.capturedLogs = [];
      window.logger.info('测试彩色输出');
      return window.capturedLogs;
    });

    if (supportsStyles) {
      // 现代浏览器应支持彩色样式
      expect(colorResults).toContainEqual(expect.objectContaining({ hasStyle: true }));
    } else {
      // 其他浏览器应降级为无样式
      expect(colorResults).toContainEqual(expect.objectContaining({ hasStyle: false }));
    }
  });

  test('错误对象应在所有浏览器中正确格式化', async ({ page }) => {
    // 测试错误格式化
    const errorResults = await page.evaluate(() => {
      window.capturedLogs = [];

      // 使用测试函数代替直接调用
      window.testErrorLog();

      return window.capturedLogs;
    });

    // 验证错误格式化 - 检查是否有错误级别的日志
    expect(errorResults).toContainEqual(
      expect.objectContaining({
        level: 'ERROR',
      }),
    );

    // 获取错误日志并验证其信息
    const errorLog = errorResults.find(log => log.level === 'ERROR');
    expect(errorLog).toBeTruthy();

    // 验证消息包含错误信息
    expect(errorLog.message).toContain('错误');

    // 检查是否有详情信息
    expect(errorLog.details).toBeDefined();

    // 如果详情存在，确认包含"stack"字符串
    if (errorLog.details) {
      expect(errorLog.details).toContain('stack');
    } else {
      // 如果没有详情，这个测试将会失败
      expect('no details found').toBe('details should be present');
    }
  });

  test('应正确处理不同类型的对象', async ({ page }) => {
    // 测试各种对象类型的处理
    const objectResults = await page.evaluate(() => {
      window.capturedLogs = [];

      // 使用测试函数代替直接调用
      window.testObjectLog();

      return window.capturedLogs;
    });

    // 验证对象格式化 - 更灵活的匹配
    // 检查是否有包含"数组测试"的日志
    const arrayLog = objectResults.find(
      log => log.level === 'INFO' && log.message.includes('数组测试'),
    );
    expect(arrayLog).toBeTruthy();

    // 检查是否有包含"对象测试"的日志
    const objectLog = objectResults.find(
      log => log.level === 'INFO' && log.message.includes('对象测试'),
    );
    expect(objectLog).toBeTruthy();

    // 检查是否有包含"嵌套对象"的日志
    const nestedLog = objectResults.find(
      log => log.level === 'INFO' && log.message.includes('嵌套对象'),
    );
    expect(nestedLog).toBeTruthy();

    // 检查是否有包含"Map对象"的日志
    const mapLog = objectResults.find(
      log => log.level === 'INFO' && log.message.includes('Map对象'),
    );
    expect(mapLog).toBeTruthy();
  });

  test('localStorage不可用时应降级为内存存储', async ({ page }) => {
    // 禁用localStorage
    await page.evaluate(() => {
      // 保存原始localStorage
      window.originalStorage = window.localStorage;

      // 模拟localStorage不可用
      Object.defineProperty(window, 'localStorage', {
        get: function () {
          throw new Error('localStorage不可用');
        },
      });

      // 重新初始化LogMaster
      window.initLogger();
    });

    // 测试存储操作
    const storageResults = await page.evaluate(() => {
      try {
        // 尝试保存设置
        window.logger.setLogLevel('ERROR');
        window.logger.setTheme('dark');

        // 检查是否成功（不会抛出错误）
        return { success: true };
      } catch (err) {
        return { success: false, error: err.message };
      }
    });

    // 验证降级存储工作正常
    expect(storageResults.success).toBe(true);

    // 恢复localStorage
    await page.evaluate(() => {
      Object.defineProperty(window, 'localStorage', {
        get: function () {
          return window.originalStorage;
        },
      });
    });
  });
});

/**
 * 注意：这些测试需要一个测试服务器提供compatibility-test.html页面
 * 该页面应包含以下内容:
 *
 * 1. LogMaster库的引用
 * 2. 一个全局logger实例
 * 3. capturedLogs数组用于捕获控制台输出
 * 4. 一个data-testid="logger-ready"标记
 * 5. browserFeatures数组以模拟不同浏览器功能
 * 6. initLogger()函数以重新初始化LogMaster
 */
