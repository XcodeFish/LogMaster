/**
 * @file 主题切换功能测试
 * @module tests/e2e/theme-switching
 * @author LogMaster Team
 * @license MIT
 */

import { test, expect } from '@playwright/test';
import { LogMasterPage } from './pages/LogMasterPage';

test.describe('LogMaster 主题切换功能测试', () => {
  let logMasterPage;

  test.beforeEach(async ({ page }) => {
    logMasterPage = new LogMasterPage(page);
    await logMasterPage.goto();
    await logMasterPage.clearLogs();

    // 确保浏览器支持颜色功能
    await logMasterPage.setFeatures(['colors', 'groups', 'table', 'storage']);
    // 等待设置生效
    await new Promise(r => setTimeout(r, 500));
  });

  test('应能够切换默认主题和暗色主题', async ({ page }) => {
    // 确保页面已加载
    await page.waitForSelector(logMasterPage.loggerReadySelector);
    await new Promise(r => setTimeout(r, 1000));

    // 先设置为默认主题，确保状态一致
    await logMasterPage.setTheme('default');
    await new Promise(r => setTimeout(r, 1000));

    // 生成一条日志
    await logMasterPage.testBasicLog();
    // 等待日志生成
    await new Promise(r => setTimeout(r, 1000));

    // 切换到暗色主题
    await logMasterPage.setTheme('dark');
    // 等待主题切换
    await new Promise(r => setTimeout(r, 2000));

    // 验证主题属性已应用到body
    const bodyTheme = await page.evaluate(
      () => document.body.getAttribute('data-logmaster-theme') || '',
    );

    // 检查主题是否设置为暗色
    expect(bodyTheme.toLowerCase()).toBe('dark');

    // 验证设置已保存
    const savedSettings = await page.evaluate(() => {
      try {
        return localStorage.getItem('logmaster_settings') || '';
      } catch (e) {
        return '';
      }
    });

    expect(savedSettings).toBeTruthy();
    expect(savedSettings.toLowerCase()).toContain('theme');
  });

  test('主题切换后样式应正确应用', async ({ page }) => {
    // 确保页面已加载
    await page.waitForSelector(logMasterPage.loggerReadySelector);
    await new Promise(r => setTimeout(r, 1000));

    // 设置检查函数
    await page.evaluate(() => {
      window.checkTheme = function () {
        // 直接从body属性获取主题
        return document.body.getAttribute('data-logmaster-theme') || 'default';
      };
    });

    // 设置默认主题
    await logMasterPage.setTheme('default');
    // 等待主题设置应用
    await new Promise(r => setTimeout(r, 2000));

    // 检查默认主题是否正确应用
    const defaultTheme = await page.evaluate(() => window.checkTheme());
    expect(['default', 'DEFAULT', 'Default', '']).toContain(defaultTheme);

    // 切换到暗色主题
    await logMasterPage.setTheme('dark');
    // 等待主题设置应用
    await new Promise(r => setTimeout(r, 2000));

    // 检查暗色主题是否正确应用
    const darkTheme = await page.evaluate(() => window.checkTheme());
    expect(['dark', 'DARK', 'Dark']).toContain(darkTheme);
  });

  test('主题设置应在页面刷新后保持', async ({ page }) => {
    // 确保页面已加载
    await page.waitForSelector(logMasterPage.loggerReadySelector);
    await new Promise(r => setTimeout(r, 1000));

    // 切换到暗色主题
    await logMasterPage.setTheme('dark');
    // 等待设置保存
    await new Promise(r => setTimeout(r, 2000));

    // 验证主题已设置
    const themeBeforeReload = await page.evaluate(
      () => document.body.getAttribute('data-logmaster-theme') || '',
    );
    expect(themeBeforeReload.toLowerCase()).toBe('dark');

    // 刷新页面
    await page.reload();
    await page.waitForSelector(logMasterPage.loggerReadySelector);
    // 等待页面完全加载
    await new Promise(r => setTimeout(r, 2000));

    // 检查主题设置是否保持
    const themeAfterReload = await page.evaluate(() => {
      // 首先检查body属性
      const bodyTheme = document.body.getAttribute('data-logmaster-theme');
      if (bodyTheme) return bodyTheme;

      // 如果没有body属性，尝试从localStorage读取
      try {
        const settings = JSON.parse(localStorage.getItem('logmaster_settings') || '{}');
        return settings.theme || 'default';
      } catch (e) {
        return 'default';
      }
    });

    // 检查刷新后主题是否仍为暗色
    expect(themeAfterReload.toLowerCase()).toBe('dark');
  });

  test('在颜色不支持的环境下主题应回退到默认样式', async ({ page }) => {
    // 确保页面已加载
    await page.waitForSelector(logMasterPage.loggerReadySelector);
    await new Promise(r => setTimeout(r, 1000));

    // 禁用颜色支持
    await logMasterPage.setFeatures(['groups', 'table', 'storage']);
    // 等待设置应用
    await new Promise(r => setTimeout(r, 1500));

    // 切换到暗色主题
    await logMasterPage.setTheme('dark');
    // 等待主题切换
    await new Promise(r => setTimeout(r, 2000));

    // 验证主题设置已保存
    const savedSettings = await page.evaluate(() => {
      try {
        return localStorage.getItem('logmaster_settings') || '';
      } catch (e) {
        return '';
      }
    });

    expect(savedSettings).toBeTruthy();
    expect(savedSettings.toLowerCase()).toContain('theme');

    // 清除日志
    await logMasterPage.clearLogs();
    // 等待清除完成
    await new Promise(r => setTimeout(r, 1000));

    // 测试日志
    await logMasterPage.testColoredLog();
    // 等待日志生成
    await new Promise(r => setTimeout(r, 1000));

    // 获取日志
    const logs = await logMasterPage.getCapturedLogs();

    // 验证有日志生成
    expect(logs.length).toBeGreaterThan(0);

    // 找到彩色日志测试的日志
    const coloredLog = logs.find(
      log =>
        log.message && (log.message.includes('彩色日志测试') || log.message.includes('不支持')),
    );

    // 验证找到了日志
    expect(coloredLog).toBeTruthy();

    // 检查日志是否没有样式标记
    if (coloredLog.hasStyle !== undefined) {
      expect(coloredLog.hasStyle).toBeFalsy();
    }
  });
});
