/**
 * @file 用户行为场景测试
 * @module tests/e2e/user-scenarios
 * @author LogMaster Team
 * @license MIT
 */

import { test, expect } from '@playwright/test';
import { LogMasterPage } from './pages/LogMasterPage';

test.describe('LogMaster 用户场景测试', () => {
  let logMasterPage;

  test.beforeEach(async ({ page }) => {
    logMasterPage = new LogMasterPage(page);
    await logMasterPage.goto();
    await logMasterPage.clearLogs();
  });

  test('场景1: 开发人员调试应用程序', async ({ page }) => {
    // 清空日志以便测试
    await logMasterPage.clearLogs();

    // 等待清空完成
    await new Promise(r => setTimeout(r, 500));

    // 使用测试函数代替直接调用
    await page.evaluate(() => {
      if (typeof window.testDeveloperDebugging === 'function') {
        window.testDeveloperDebugging();
      } else {
        console.error('testDeveloperDebugging 函数不存在');
      }
    });

    // 等待日志生成
    await new Promise(r => setTimeout(r, 1000));

    // 验证所有日志都被正确捕获
    const logs = await logMasterPage.getCapturedLogs();

    expect(logs.some(log => log.level === 'DEBUG' && log.message.includes('初始化'))).toBeTruthy();
    expect(logs.some(log => log.level === 'INFO' && log.message.includes('已启动'))).toBeTruthy();
    expect(
      logs.some(log => log.level === 'DEBUG' && log.message.includes('用户配置')),
    ).toBeTruthy();
    expect(
      logs.some(log => log.level === 'ERROR' && log.message.includes('配置失败')),
    ).toBeTruthy();

    // 验证错误日志包含详细信息
    const errorLog = logs.find(log => log.level === 'ERROR');
    expect(errorLog).toBeTruthy();
    if (errorLog) {
      expect(errorLog.details).toBeTruthy();
      expect(errorLog.details).toContain('stack');
    }
  });

  test('场景2: 生产环境日志筛选', async ({ page }) => {
    // 清空日志以便测试
    await logMasterPage.clearLogs();

    // 等待清空完成
    await new Promise(r => setTimeout(r, 500));

    // 使用测试函数代替直接调用
    await page.evaluate(() => {
      if (typeof window.testProductionLogging === 'function') {
        window.testProductionLogging();
      } else {
        console.error('testProductionLogging 函数不存在');
      }
    });

    // 等待日志生成
    await new Promise(r => setTimeout(r, 1000));

    // 验证只有错误日志被记录
    const logs = await logMasterPage.getCapturedLogs();
    const userLogs = logs.filter(log => log.level !== 'SYSTEM');

    expect(userLogs.length).toBe(2); // 只有两条错误日志
    expect(userLogs.every(log => log.level === 'ERROR')).toBeTruthy();
    expect(userLogs.some(log => log.message.includes('严重错误'))).toBeTruthy();
    expect(userLogs.some(log => log.message.includes('另一个错误'))).toBeTruthy();

    // 验证不存在其他级别的日志
    expect(userLogs.some(log => log.level === 'DEBUG')).toBeFalsy();
    expect(userLogs.some(log => log.level === 'INFO')).toBeFalsy();
    expect(userLogs.some(log => log.level === 'WARN')).toBeFalsy();
  });

  test('场景3: 在遇到错误后使用分组组织相关日志', async ({ page }) => {
    // 确保支持分组功能
    await logMasterPage.setFeatures(['colors', 'groups', 'table', 'storage']);

    // 清空日志以便测试
    await logMasterPage.clearLogs();

    // 等待清空完成
    await new Promise(r => setTimeout(r, 500));

    // 使用testGrouping函数
    await page.evaluate(() => {
      if (typeof window.testGrouping === 'function') {
        window.testGrouping();
      } else {
        console.error('testGrouping 函数不存在');
      }
    });

    // 等待日志生成
    await new Promise(r => setTimeout(r, 1000));

    // 获取所有日志
    const logs = await logMasterPage.getCapturedLogs();

    // 验证分组结构
    const groupIndex = logs.findIndex(
      log => log.type === 'group' && log.message.includes('用户认证流程'),
    );
    expect(groupIndex).toBeGreaterThanOrEqual(0);

    const nestedGroupIndex = logs.findIndex(
      log => log.type === 'group' && log.message.includes('凭证验证'),
    );
    expect(nestedGroupIndex).toBeGreaterThan(groupIndex);

    // 验证错误日志存在于嵌套分组中
    const errorIndex = logs.findIndex(
      log => log.level === 'ERROR' && log.message.includes('令牌已过期'),
    );
    expect(errorIndex).toBeGreaterThan(nestedGroupIndex);

    // 确认分组结束标记存在
    expect(logs.filter(log => log.type === 'groupEnd').length).toBeGreaterThanOrEqual(2);
  });
});
