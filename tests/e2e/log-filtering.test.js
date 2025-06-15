/**
 * @file 日志过滤功能测试
 * @module tests/e2e/log-filtering
 * @author LogMaster Team
 * @license MIT
 */

import { test, expect } from '@playwright/test';
import { LogMasterPage } from './pages/LogMasterPage';

test.describe('LogMaster 日志过滤功能测试', () => {
  let logMasterPage;

  test.beforeEach(async ({ page }) => {
    logMasterPage = new LogMasterPage(page);
    await logMasterPage.goto();
    await logMasterPage.clearLogs();
  });

  test('日志级别过滤应正确工作', async () => {
    // 首先生成所有级别的日志
    await logMasterPage.testBasicLog();

    // 等待日志生成
    await new Promise(r => setTimeout(r, 500));

    // 获取当前所有日志
    const allLogs = await logMasterPage.getCapturedLogs();

    // 确认所有级别的日志都存在
    expect(allLogs.some(log => log.level === 'DEBUG' || log.message.includes('调试'))).toBeTruthy();
    expect(allLogs.some(log => log.level === 'INFO' || log.message.includes('信息'))).toBeTruthy();
    expect(allLogs.some(log => log.level === 'WARN' || log.message.includes('警告'))).toBeTruthy();
    expect(allLogs.some(log => log.level === 'ERROR' || log.message.includes('错误'))).toBeTruthy();

    // 设置日志级别为WARN
    await logMasterPage.clearLogs();
    await logMasterPage.setLogLevel('WARN');

    // 等待设置应用
    await new Promise(r => setTimeout(r, 500));

    await logMasterPage.testBasicLog();

    // 等待日志生成
    await new Promise(r => setTimeout(r, 500));

    // 获取过滤后的日志
    const warnLevelLogs = await logMasterPage.getCapturedLogs();
    const userLogs = warnLevelLogs.filter(log => log.level !== 'SYSTEM');

    // 验证只有WARN和ERROR级别的日志
    const hasDebug = userLogs.some(log => log.level === 'DEBUG' || log.message.includes('调试'));
    const hasInfo = userLogs.some(log => log.level === 'INFO' || log.message.includes('信息'));
    const hasWarn = userLogs.some(log => log.level === 'WARN' || log.message.includes('警告'));
    const hasError = userLogs.some(log => log.level === 'ERROR' || log.message.includes('错误'));

    expect(hasDebug).toBeFalsy();
    expect(hasInfo).toBeFalsy();
    expect(hasWarn).toBeTruthy();
    expect(hasError).toBeTruthy();

    // 设置日志级别为ERROR
    await logMasterPage.clearLogs();
    await logMasterPage.setLogLevel('ERROR');

    // 等待设置应用
    await new Promise(r => setTimeout(r, 500));

    await logMasterPage.testBasicLog();

    // 等待日志生成
    await new Promise(r => setTimeout(r, 500));

    // 获取过滤后的日志
    const errorLevelLogs = await logMasterPage.getCapturedLogs();
    const userErrorLogs = errorLevelLogs.filter(log => log.level !== 'SYSTEM');

    // 验证只有ERROR级别的日志
    const hasDebugInError = userErrorLogs.some(
      log => log.level === 'DEBUG' || log.message.includes('调试'),
    );
    const hasInfoInError = userErrorLogs.some(
      log => log.level === 'INFO' || log.message.includes('信息'),
    );
    const hasWarnInError = userErrorLogs.some(
      log => log.level === 'WARN' || log.message.includes('警告'),
    );
    const hasErrorInError = userErrorLogs.some(
      log => log.level === 'ERROR' || log.message.includes('错误'),
    );

    expect(hasDebugInError).toBeFalsy();
    expect(hasInfoInError).toBeFalsy();
    expect(hasWarnInError).toBeFalsy();
    expect(hasErrorInError).toBeTruthy();
  });

  test('日志级别设置应在页面刷新后保持', async ({ page }) => {
    // 设置日志级别为ERROR
    await logMasterPage.setLogLevel('ERROR');

    // 等待设置应用和保存
    await new Promise(r => setTimeout(r, 1000));

    // 记录当前设置状态
    const savedSettings = await page.evaluate(() => localStorage.getItem('logmaster_settings'));

    // 验证设置已保存
    expect(savedSettings).toBeTruthy();
    expect(savedSettings).toContain('ERROR');

    // 刷新页面
    await page.reload();
    await page.waitForSelector(logMasterPage.loggerReadySelector);

    // 等待页面完全加载和设置应用
    await new Promise(r => setTimeout(r, 1000));

    // 清除可能已存在的日志
    await logMasterPage.clearLogs();

    // 等待清除完成
    await new Promise(r => setTimeout(r, 500));

    // 生成所有级别的日志
    await logMasterPage.testBasicLog();

    // 等待日志生成
    await new Promise(r => setTimeout(r, 1000));

    // 获取日志
    const logsAfterReload = await logMasterPage.getCapturedLogs();

    // 排除系统日志
    const userLogs = logsAfterReload.filter(log => log.level !== 'SYSTEM');

    // 验证仍然只有ERROR级别的日志
    const hasDebug = userLogs.some(log => log.level === 'DEBUG' || log.message.includes('调试'));
    const hasInfo = userLogs.some(log => log.level === 'INFO' || log.message.includes('信息'));
    const hasWarn = userLogs.some(log => log.level === 'WARN' || log.message.includes('警告'));
    const hasError = userLogs.some(log => log.level === 'ERROR' || log.message.includes('错误'));

    expect(hasDebug).toBeFalsy();
    expect(hasInfo).toBeFalsy();
    expect(hasWarn).toBeFalsy();
    expect(hasError).toBeTruthy();
  });

  test('localStorage不可用时应使用内存中的设置', async () => {
    // 禁用localStorage
    await logMasterPage.disableLocalStorage();

    // 等待localStorage禁用生效
    await new Promise(r => setTimeout(r, 1000));

    // 设置日志级别为ERROR
    await logMasterPage.setLogLevel('ERROR');

    // 等待设置应用
    await new Promise(r => setTimeout(r, 1000));

    // 清空日志
    await logMasterPage.clearLogs();

    // 等待清空完成
    await new Promise(r => setTimeout(r, 500));

    // 测试基础日志
    await logMasterPage.testBasicLog();

    // 等待日志生成
    await new Promise(r => setTimeout(r, 1000));

    // 获取日志
    const logs = await logMasterPage.getCapturedLogs();
    const userLogs = logs.filter(log => log.level !== 'SYSTEM');

    // 验证设置已应用
    const hasDebug = userLogs.some(log => log.level === 'DEBUG' || log.message.includes('调试'));
    const hasInfo = userLogs.some(log => log.level === 'INFO' || log.message.includes('信息'));
    const hasWarn = userLogs.some(log => log.level === 'WARN' || log.message.includes('警告'));
    const hasError = userLogs.some(log => log.level === 'ERROR' || log.message.includes('错误'));

    expect(hasDebug).toBeFalsy();
    expect(hasInfo).toBeFalsy();
    expect(hasWarn).toBeFalsy();
    expect(hasError).toBeTruthy();

    // 验证即便localStorage不可用，设置仍然被记住
    await logMasterPage.clearLogs();

    // 等待清空完成
    await new Promise(r => setTimeout(r, 500));

    // 再次测试
    await logMasterPage.testBasicLog();

    // 等待日志生成
    await new Promise(r => setTimeout(r, 1000));

    // 获取新日志
    const newLogs = await logMasterPage.getCapturedLogs();
    const newUserLogs = newLogs.filter(log => log.level !== 'SYSTEM');

    // 验证仍然只有ERROR日志
    expect(
      newUserLogs.some(log => log.level === 'DEBUG' || log.message.includes('调试')),
    ).toBeFalsy();
    expect(
      newUserLogs.some(log => log.level === 'INFO' || log.message.includes('信息')),
    ).toBeFalsy();
    expect(
      newUserLogs.some(log => log.level === 'WARN' || log.message.includes('警告')),
    ).toBeFalsy();
    expect(
      newUserLogs.some(log => log.level === 'ERROR' || log.message.includes('错误')),
    ).toBeTruthy();

    // 恢复localStorage
    await logMasterPage.restoreLocalStorage();

    // 等待恢复完成
    await new Promise(r => setTimeout(r, 500));
  });
});
