/**
 * @file 响应式行为测试
 * @module tests/e2e/responsive-behavior
 * @author LogMaster Team
 * @license MIT
 */

import { test, expect } from '@playwright/test';
import { LogMasterPage } from './pages/LogMasterPage';

// 定义需要测试的设备尺寸
const viewports = [
  { name: '桌面大屏', width: 1920, height: 1080 },
  { name: '桌面小屏', width: 1280, height: 720 },
  { name: '平板竖屏', width: 768, height: 1024 },
  { name: '手机横屏', width: 667, height: 375 },
  { name: '手机竖屏', width: 375, height: 667 },
];

test.describe('LogMaster 响应式行为测试', () => {
  let logMasterPage;

  for (const viewport of viewports) {
    test(`在 ${viewport.name} (${viewport.width}x${viewport.height}) 下应正确显示`, async ({
      page,
    }) => {
      // 设置视口大小
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });

      // 等待视口设置应用
      await new Promise(r => setTimeout(r, 500));

      // 初始化页面
      logMasterPage = new LogMasterPage(page);
      await logMasterPage.goto();

      // 等待页面加载完成
      await new Promise(r => setTimeout(r, 1000));

      // 清除日志
      await logMasterPage.clearLogs();

      // 等待清除完成
      await new Promise(r => setTimeout(r, 500));

      // 测试基本日志功能
      await logMasterPage.testBasicLog();

      // 等待日志生成
      await new Promise(r => setTimeout(r, 500));

      // 测试对象日志功能
      await logMasterPage.testObjectLog();

      // 等待日志生成
      await new Promise(r => setTimeout(r, 500));

      // 测试表格功能
      await logMasterPage.testTable();

      // 等待日志生成
      await new Promise(r => setTimeout(r, 500));

      // 验证日志是否正确生成，无论视口大小
      const logs = await logMasterPage.getCapturedLogs();

      // 基本验证
      expect(logs.some(log => log.level === 'INFO' || log.message.includes('信息'))).toBeTruthy();
      expect(logs.some(log => log.level === 'ERROR' || log.message.includes('错误'))).toBeTruthy();

      // 验证对象日志
      expect(
        logs.some(log => log.message.includes('对象') || log.message.includes('数组')),
      ).toBeTruthy();

      // 验证表格日志
      expect(
        logs.some(
          log =>
            log.type === 'table' || log.message.includes('Table') || log.message.includes('表格'),
        ),
      ).toBeTruthy();
    });
  }

  test('动态调整视口大小时日志显示应保持一致', async ({ page }) => {
    // 初始大屏
    await page.setViewportSize({ width: 1920, height: 1080 });

    // 等待视口设置
    await new Promise(r => setTimeout(r, 500));

    // 初始化页面
    logMasterPage = new LogMasterPage(page);
    await logMasterPage.goto();

    // 等待页面加载
    await new Promise(r => setTimeout(r, 1000));

    await logMasterPage.clearLogs();

    // 等待清除完成
    await new Promise(r => setTimeout(r, 500));

    // 在大屏上生成一些日志
    await logMasterPage.testObjectLog();

    // 等待日志生成
    await new Promise(r => setTimeout(r, 1000));

    const largeViewportLogs = await logMasterPage.getCapturedLogs();

    // 切换到小屏
    await page.setViewportSize({ width: 375, height: 667 });

    // 等待视口调整
    await new Promise(r => setTimeout(r, 1000));

    await logMasterPage.clearLogs();

    // 等待清除完成
    await new Promise(r => setTimeout(r, 500));

    // 在小屏上生成相同的日志
    await logMasterPage.testObjectLog();

    // 等待日志生成
    await new Promise(r => setTimeout(r, 1000));

    const smallViewportLogs = await logMasterPage.getCapturedLogs();

    // 确认日志内容相同（不考虑时间戳等可变信息）
    expect(smallViewportLogs.length).toBe(largeViewportLogs.length);

    // 比较每个日志的级别和类型
    for (let i = 0; i < smallViewportLogs.length; i++) {
      expect(smallViewportLogs[i].level).toBe(largeViewportLogs[i].level);
      expect(smallViewportLogs[i].type).toBe(largeViewportLogs[i].type);
    }
  });
});
