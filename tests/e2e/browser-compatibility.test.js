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
      }, profile.features);

      // 触发功能测试
      const results = await page.evaluate(() => {
        // 清除控制台捕获
        window.capturedLogs = [];

        // 测试不同功能
        window.logger.info('测试基础日志');

        if (window.browserFeatures.includes('groups')) {
          window.logger.group('分组测试');
          window.logger.info('分组内消息');
          window.logger.groupEnd();
        }

        if (window.browserFeatures.includes('table')) {
          window.logger.table([
            { id: 1, name: '测试1' },
            { id: 2, name: '测试2' },
          ]);
        }

        if (window.browserFeatures.includes('storage')) {
          window.logger.setLogLevel('WARN');
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

      // 创建一个错误并记录
      const error = new Error('测试错误');
      error.code = 'TEST_ERROR';
      window.logger.error('发生错误', error);

      return window.capturedLogs;
    });

    // 验证错误格式化
    expect(errorResults).toContainEqual(
      expect.objectContaining({
        level: 'ERROR',
        message: expect.stringContaining('测试错误'),
      }),
    );

    // 错误应包含堆栈信息
    const errorLog = errorResults.find(log => log.level === 'ERROR');
    expect(errorLog.details).toContain('stack');
  });

  test('应正确处理不同类型的对象', async ({ page }) => {
    // 测试各种对象类型的处理
    const objectResults = await page.evaluate(() => {
      window.capturedLogs = [];

      // 测试不同类型
      window.logger.info('数组测试', [1, 2, 3]);
      window.logger.info('对象测试', { a: 1, b: '2', c: true });
      window.logger.info('嵌套对象', {
        outer: 'value',
        nested: { inner: 'nested value' },
      });
      window.logger.info('Map对象', new Map([['key', 'value']]));

      return window.capturedLogs;
    });

    // 验证对象格式化
    expect(objectResults).toContainEqual(
      expect.objectContaining({
        level: 'INFO',
        message: expect.stringContaining('数组测试'),
        details: expect.stringContaining('1, 2, 3'),
      }),
    );

    expect(objectResults).toContainEqual(
      expect.objectContaining({
        level: 'INFO',
        message: expect.stringContaining('对象测试'),
        details: expect.stringContaining('a'),
      }),
    );

    expect(objectResults).toContainEqual(
      expect.objectContaining({
        level: 'INFO',
        message: expect.stringContaining('嵌套对象'),
        details: expect.stringContaining('nested'),
      }),
    );
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
