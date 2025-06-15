/**
 * @file LogMaster页面对象模型
 * @module tests/e2e/pages/LogMasterPage
 * @author LogMaster Team
 * @license MIT
 */

export class LogMasterPage {
  /**
   * 构造函数
   * @param {import('@playwright/test').Page} page Playwright页面对象
   */
  constructor(page) {
    this.page = page;
    this.loggerReadySelector = '[data-testid="logger-ready"]';
    this.logDisplaySelector = '#log-display';
    this.featuresDisplaySelector = '#features-display';
  }

  /**
   * 导航到测试页面
   */
  async goto() {
    await this.page.goto('http://localhost:8080/compatibility-test.html');
    await this.page.waitForSelector(this.loggerReadySelector);
  }

  /**
   * 设置浏览器特性支持
   * @param {Array<string>} features 支持的特性列表
   */
  async setFeatures(features) {
    await this.page.evaluate(featureList => {
      window.browserFeatures = featureList;
      window.initLogger();
    }, features);
  }

  /**
   * 切换特定特性支持
   * @param {string} feature 要切换的特性
   */
  async toggleFeature(feature) {
    await this.page.click(`button:text("切换${feature}支持")`);
  }

  /**
   * 测试基本日志功能
   */
  async testBasicLog() {
    await this.page.click('button:text("基础日志")');
  }

  /**
   * 测试彩色日志功能
   */
  async testColoredLog() {
    await this.page.click('button:text("彩色日志")');
  }

  /**
   * 测试对象日志功能
   */
  async testObjectLog() {
    await this.page.click('button:text("对象日志")');
  }

  /**
   * 测试错误日志功能
   */
  async testErrorLog() {
    await this.page.click('button:text("错误日志")');
  }

  /**
   * 测试分组功能
   */
  async testGrouping() {
    await this.page.click('button:text("分组功能")');
  }

  /**
   * 测试表格功能
   */
  async testTable() {
    await this.page.click('button:text("表格功能")');
  }

  /**
   * 设置日志级别
   * @param {'DEBUG'|'INFO'|'WARN'|'ERROR'} level 日志级别
   */
  async setLogLevel(level) {
    await this.page.click(`button:text("${level}级别")`);
  }

  /**
   * 设置主题
   * @param {'default'|'dark'} theme 主题名称
   */
  async setTheme(theme) {
    const buttonText = theme === 'default' ? '默认主题' : '暗色主题';
    await this.page.click(`button:text("${buttonText}")`);
  }

  /**
   * 清除日志
   */
  async clearLogs() {
    await this.page.click('button:text("清空日志")');
  }

  /**
   * 获取捕获的日志
   * @returns {Promise<Array<Object>>} 日志对象数组
   */
  async getCapturedLogs() {
    return this.page.evaluate(() => window.capturedLogs);
  }

  /**
   * 获取当前支持的特性
   * @returns {Promise<Array<string>>} 特性列表
   */
  async getCurrentFeatures() {
    return this.page.evaluate(() => window.browserFeatures);
  }

  /**
   * 模拟localStorage不可用
   */
  async disableLocalStorage() {
    await this.page.evaluate(() => {
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
  }

  /**
   * 恢复localStorage
   */
  async restoreLocalStorage() {
    await this.page.evaluate(() => {
      Object.defineProperty(window, 'localStorage', {
        get: function () {
          return window.originalStorage;
        },
      });
    });
  }

  /**
   * 检查日志是否包含特定文本
   * @param {string} text 要搜索的文本
   * @returns {Promise<boolean>} 是否找到文本
   */
  async logContains(text) {
    const logs = await this.getCapturedLogs();
    return logs.some(
      log => log.message.includes(text) || (log.details && log.details.includes(text)),
    );
  }

  /**
   * 获取指定级别的所有日志
   * @param {'DEBUG'|'INFO'|'WARN'|'ERROR'|'SYSTEM'} level 日志级别
   * @returns {Promise<Array<Object>>} 指定级别的日志
   */
  async getLogsByLevel(level) {
    const logs = await this.getCapturedLogs();
    return logs.filter(log => log.level === level);
  }

  /**
   * 获取当前主题信息
   */
  async getThemeInfo() {
    return this.page.evaluate(() => {
      if (window.logger && window.logger.getThemeInfo) {
        return window.logger.getThemeInfo();
      } else {
        // 回退方案：尝试从localStorage中获取
        try {
          const settings = JSON.parse(localStorage.getItem('logmaster_settings') || '{}');
          return {
            currentTheme: settings.theme || 'default',
          };
        } catch (err) {
          return { currentTheme: 'default' };
        }
      }
    });
  }
}
