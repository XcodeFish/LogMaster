/**
 * @file 主题系统测试
 * @author LogMaster
 */

// 模拟测试环境
const mockConsole = {
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  group: jest.fn(),
  groupEnd: jest.fn(),
};

// 保存原始控制台
const originalConsole = global.console;

// 替换控制台
global.console = { ...originalConsole, ...mockConsole };

// 导入需要测试的模块
import LogMaster from '../src/LogMaster.js';
import themes from '../src/themes/index.js';
import defaultTheme from '../src/themes/default.js';
import darkTheme from '../src/themes/dark.js';
import minimalTheme from '../src/themes/minimal.js';

// 测试套件
describe('主题系统测试', () => {
  // 每个测试后重置模拟
  afterEach(() => {
    jest.clearAllMocks();
  });

  // 测试完成后恢复原始控制台
  afterAll(() => {
    global.console = originalConsole;
  });

  // 测试默认主题
  test('默认主题应该正确加载', () => {
    const theme = defaultTheme.getTheme();
    expect(theme).toBeDefined();
    expect(theme.colors).toBeDefined();
    expect(theme.colors.debug).toBeDefined();
    expect(theme.colors.info).toBeDefined();
    expect(theme.colors.warn).toBeDefined();
    expect(theme.colors.error).toBeDefined();
  });

  // 测试暗色主题
  test('暗色主题应该正确加载', () => {
    const theme = darkTheme.getTheme();
    expect(theme).toBeDefined();
    expect(theme.colors).toBeDefined();
    expect(theme.colors.background).toBe('#1e1e1e');
  });

  // 测试简约主题
  test('简约主题应该正确加载', () => {
    const theme = minimalTheme.getTheme();
    expect(theme).toBeDefined();
    expect(theme.simplifyOutput).toBe(true);
    expect(theme.reduceVisualNoise).toBe(true);
  });

  // 测试主题API
  test('主题API应该正确工作', () => {
    // 获取主题
    const defaultThemeObj = themes.getTheme('default');
    expect(defaultThemeObj).toBeDefined();

    const darkThemeObj = themes.getTheme('dark');
    expect(darkThemeObj).toBeDefined();

    const minimalThemeObj = themes.getTheme('minimal');
    expect(minimalThemeObj).toBeDefined();

    // 合并主题
    const userTheme = {
      colors: {
        debug: '#123456',
      },
    };

    const mergedTheme = themes.mergeTheme(userTheme, 'dark');
    expect(mergedTheme).toBeDefined();
    expect(mergedTheme.colors.debug).toBe('#123456');
    expect(mergedTheme.colors.background).toBe('#1e1e1e');

    // 生成样式
    const styles = themes.generateStyles(mergedTheme);
    expect(styles).toBeDefined();
    expect(styles.debug).toContain('#123456');
  });

  // 测试LogMaster主题集成
  test('LogMaster应该正确使用主题', () => {
    // 创建LogMaster实例
    const logger = new LogMaster({
      theme: 'dark',
    });

    // 检查主题是否正确设置
    expect(logger._theme).toBeDefined();
    expect(logger._theme.badge).toBe('#333333');

    // 切换主题
    logger.setTheme('minimal');
    expect(logger._theme).toBeDefined();
    expect(logger._theme.badge).toBe('#f8f8f8');

    // 自定义主题
    const customTheme = {
      debug: '#abcdef',
      info: '#123456',
      warn: '#789abc',
      error: '#def012',
      badge: '#345678',
    };

    logger.setTheme(customTheme);
    expect(logger._theme).toBeDefined();
    expect(logger._theme.debug).toBe('#abcdef');
    expect(logger._theme.badge).toBe('#345678');

    // 重置配置
    logger.resetConfig();
    expect(logger._theme).toBeDefined();
    expect(logger._theme.badge).not.toBe('#345678');
  });

  // 测试环境适配
  test('主题应该适应不同环境', () => {
    // 模拟浏览器环境
    global.window = {
      chrome: true,
      matchMedia: () => ({
        matches: false,
      }),
    };
    global.document = {};

    const browserTheme = defaultTheme.getTheme();
    expect(browserTheme).toBeDefined();

    // 清除浏览器环境
    delete global.window;
    delete global.document;

    // 模拟Node.js环境
    global.process = {
      versions: { node: '14.0.0' },
      stdout: { isTTY: true },
      env: { FORCE_COLOR: '1' },
    };

    const nodeTheme = defaultTheme.getTheme();
    expect(nodeTheme).toBeDefined();

    // 清除Node.js环境
    delete global.process;
  });
});
