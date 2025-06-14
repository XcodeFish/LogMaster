/**
 * @file 常量模块单元测试
 * @module tests/unit/core/constants
 * @author LogMaster Team
 * @license MIT
 */

import {
  LOG_LEVELS,
  LOG_LEVEL_NAMES,
  ENVIRONMENTS,
  DEFAULT_CONFIG,
  THEMES,
} from '../../../src/core/constants.js';

describe('常量模块测试', () => {
  describe('日志级别常量测试', () => {
    test('LOG_LEVELS应包含所有定义的日志级别', () => {
      expect(LOG_LEVELS).toBeDefined();
      expect(LOG_LEVELS.DEBUG).toBeDefined();
      expect(LOG_LEVELS.INFO).toBeDefined();
      expect(LOG_LEVELS.WARN).toBeDefined();
      expect(LOG_LEVELS.ERROR).toBeDefined();
      expect(LOG_LEVELS.SILENT).toBeDefined();
    });

    test('日志级别应按严重程度递增', () => {
      expect(LOG_LEVELS.DEBUG).toBeLessThan(LOG_LEVELS.INFO);
      expect(LOG_LEVELS.INFO).toBeLessThan(LOG_LEVELS.WARN);
      expect(LOG_LEVELS.WARN).toBeLessThan(LOG_LEVELS.ERROR);
      expect(LOG_LEVELS.ERROR).toBeLessThan(LOG_LEVELS.SILENT);
    });

    test('LOG_LEVEL_NAMES应与LOG_LEVELS对应', () => {
      expect(LOG_LEVEL_NAMES).toBeDefined();
      expect(LOG_LEVEL_NAMES[LOG_LEVELS.DEBUG]).toBe('DEBUG');
      expect(LOG_LEVEL_NAMES[LOG_LEVELS.INFO]).toBe('INFO');
      expect(LOG_LEVEL_NAMES[LOG_LEVELS.WARN]).toBe('WARN');
      expect(LOG_LEVEL_NAMES[LOG_LEVELS.ERROR]).toBe('ERROR');
      expect(LOG_LEVEL_NAMES[LOG_LEVELS.SILENT]).toBe('SILENT');
    });
  });

  describe('环境常量测试', () => {
    test('ENVIRONMENTS应包含所有定义的环境', () => {
      expect(ENVIRONMENTS).toBeDefined();
      expect(ENVIRONMENTS.DEVELOPMENT).toBe('development');
      expect(ENVIRONMENTS.TESTING).toBe('testing');
      expect(ENVIRONMENTS.PRODUCTION).toBe('production');
    });
  });

  describe('默认配置测试', () => {
    test('DEFAULT_CONFIG应包含所有必需的配置项', () => {
      expect(DEFAULT_CONFIG).toBeDefined();

      // 日志配置
      expect(DEFAULT_CONFIG.LOG_LEVEL).toBeDefined();
      expect(DEFAULT_CONFIG.MAX_STRING_LENGTH).toBeGreaterThan(0);
      expect(DEFAULT_CONFIG.MAX_ARRAY_LENGTH).toBeGreaterThan(0);

      // 视觉配置
      expect(DEFAULT_CONFIG.USE_COLORS).toBeDefined();
      expect(DEFAULT_CONFIG.SHOW_TIMESTAMP).toBeDefined();
      expect(DEFAULT_CONFIG.SHOW_BADGE).toBeDefined();

      // 堆栈配置
      expect(DEFAULT_CONFIG.STACK_TRACE_ENABLED).toBeDefined();
      expect(DEFAULT_CONFIG.STACK_TRACE_LIMIT).toBeGreaterThan(0);
    });

    test('DEFAULT_CONFIG的值类型应正确', () => {
      expect(typeof DEFAULT_CONFIG.LOG_LEVEL).toBe('number');
      expect(typeof DEFAULT_CONFIG.MAX_STRING_LENGTH).toBe('number');
      expect(typeof DEFAULT_CONFIG.MAX_ARRAY_LENGTH).toBe('number');
      expect(typeof DEFAULT_CONFIG.USE_COLORS).toBe('boolean');
      expect(typeof DEFAULT_CONFIG.SHOW_TIMESTAMP).toBe('boolean');
      expect(typeof DEFAULT_CONFIG.SHOW_BADGE).toBe('boolean');
      expect(typeof DEFAULT_CONFIG.STACK_TRACE_ENABLED).toBe('boolean');
      expect(typeof DEFAULT_CONFIG.STACK_TRACE_LIMIT).toBe('number');
    });
  });

  describe('主题常量测试', () => {
    test('THEMES应包含预定义主题', () => {
      expect(THEMES).toBeDefined();
      expect(THEMES.DEFAULT).toBeDefined();
      expect(THEMES.DARK).toBeDefined();
      expect(THEMES.MINIMAL).toBeDefined();
    });

    test('每个主题应包含所有日志级别的颜色定义', () => {
      const requiredFields = ['debug', 'info', 'warn', 'error', 'timestamp'];

      const checkTheme = theme => {
        requiredFields.forEach(field => {
          expect(theme[field]).toBeDefined();
          expect(typeof theme[field]).toBe('string');
        });
      };

      checkTheme(THEMES.DEFAULT);
      checkTheme(THEMES.DARK);
      checkTheme(THEMES.MINIMAL);
    });
  });
});
