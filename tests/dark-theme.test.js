/**
 * @file 暗色主题测试
 * @module tests/dark-theme
 * @author LogMaster
 * @license MIT
 */

import { expect } from 'chai';
import sinon from 'sinon';
import darkTheme from '../src/themes/dark.js';
import { environmentDetector } from '../src/core/utils.js';

describe('暗色主题 (dark.js)', () => {
  // 在每个测试后恢复所有存根
  afterEach(() => {
    sinon.restore();
  });

  describe('基本功能', () => {
    it('应返回完整的暗色主题配置', () => {
      const theme = darkTheme.getTheme();

      // 验证主题结构
      expect(theme).to.be.an('object');
      expect(theme.colors).to.be.an('object');
      expect(theme.icons).to.be.an('object');
      expect(theme.fonts).to.be.an('object');
      expect(theme.styles).to.be.an('object');
      expect(theme.format).to.be.an('object');
      expect(theme.animations).to.be.an('object');
      expect(theme.darkMode).to.be.an('object');

      // 验证暗色主题标记
      expect(theme.isDark).to.be.true;
    });

    it('应正确合并用户自定义主题', () => {
      const userTheme = {
        colors: {
          debug: '#custom-color',
          background: '#custom-bg',
        },
        fonts: {
          size: '15px',
        },
      };

      const mergedTheme = darkTheme.mergeTheme(userTheme);

      // 验证自定义属性被正确合并
      expect(mergedTheme.colors.debug).to.equal('#custom-color');
      expect(mergedTheme.colors.background).to.equal('#custom-bg');
      expect(mergedTheme.fonts.size).to.equal('15px');

      // 验证未覆盖的属性保持原样
      expect(mergedTheme.colors.info).to.not.equal(undefined);
      expect(mergedTheme.colors.error).to.not.equal(undefined);
    });

    it('应返回正确的样式对象', () => {
      const styles = darkTheme.getStyles();

      // 验证样式对象包含所有必要的样式
      expect(styles).to.be.an('object');
      expect(styles.debug).to.be.an('object');
      expect(styles.info).to.be.an('object');
      expect(styles.warn).to.be.an('object');
      expect(styles.error).to.be.an('object');
      expect(styles.badge).to.be.an('object');
      expect(styles.timestamp).to.be.an('object');
    });

    it('应返回简化的兼容主题', () => {
      const compatTheme = darkTheme.getCompatTheme();

      // 验证兼容主题包含必要的颜色
      expect(compatTheme).to.be.an('object');
      expect(compatTheme.debug).to.be.a('string');
      expect(compatTheme.info).to.be.a('string');
      expect(compatTheme.warn).to.be.a('string');
      expect(compatTheme.error).to.be.a('string');
      expect(compatTheme.timestamp).to.be.a('string');
      expect(compatTheme.badge).to.be.a('string');
      expect(compatTheme.stack).to.be.a('string');
    });
  });

  describe('高级功能', () => {
    it('应返回高对比度暗色主题', () => {
      const highContrastTheme = darkTheme.getHighContrastTheme();

      // 验证高对比度主题标记
      expect(highContrastTheme.darkMode.highContrast).to.be.true;

      // 验证颜色对比度增强
      expect(highContrastTheme.colors.text).to.equal('#FFFFFF');
    });

    it('应返回减少动画的暗色主题', () => {
      const reducedMotionTheme = darkTheme.getReducedMotionTheme();

      // 验证减少动画主题标记
      expect(reducedMotionTheme.darkMode.reduceMotion).to.be.true;

      // 验证动画被禁用
      expect(reducedMotionTheme.animations.enabled).to.be.false;
      expect(reducedMotionTheme.animations.duration).to.equal('0s');
    });

    it('应检测系统暗色模式偏好 - 浏览器环境', () => {
      // 模拟浏览器环境
      sinon.stub(environmentDetector, 'isBrowser').returns(true);

      // 模拟matchMedia API
      global.window = {
        matchMedia: sinon.stub().returns({
          matches: true,
        }),
      };

      const result = darkTheme.isSystemDarkMode();
      expect(result).to.be.true;

      // 清理模拟
      delete global.window;
    });

    it('应检测系统暗色模式偏好 - Node.js环境', () => {
      // 模拟Node.js环境
      sinon.stub(environmentDetector, 'isBrowser').returns(false);
      sinon.stub(environmentDetector, 'isNode').returns(true);

      // 保存原始环境变量
      const originalEnv = process.env;

      // 模拟环境变量
      process.env = {
        ...originalEnv,
        DARK_MODE: '1',
      };

      const result = darkTheme.isSystemDarkMode();
      expect(result).to.be.true;

      // 恢复环境变量
      process.env = originalEnv;
    });
  });

  describe('对比度优化', () => {
    it('应优化文本颜色对比度', () => {
      // 创建一个极端的低对比度主题
      const lowContrastTheme = {
        colors: {
          background: '#0D1117', // 深色背景
          debug: '#0E1218', // 与背景非常接近的颜色
          info: '#0F1319',
          warn: '#101420',
          error: '#111521',
        },
      };

      // 应用对比度优化
      const optimizedTheme = darkTheme.mergeTheme(lowContrastTheme);

      // 验证颜色已被优化为更高对比度
      expect(optimizedTheme.colors.debug).to.not.equal('#0E1218');
      expect(optimizedTheme.colors.info).to.not.equal('#0F1319');
      expect(optimizedTheme.colors.warn).to.not.equal('#101420');
      expect(optimizedTheme.colors.error).to.not.equal('#111521');
    });

    it('应根据系统偏好自动应用高对比度模式', () => {
      // 模拟浏览器环境
      sinon.stub(environmentDetector, 'isBrowser').returns(true);

      // 模拟高对比度偏好
      global.window = {
        matchMedia: query => {
          if (query === '(prefers-contrast: more)') {
            return { matches: true };
          }
          return { matches: false };
        },
      };

      const theme = darkTheme.getTheme();

      // 验证高对比度模式已自动应用
      expect(theme.darkMode.highContrast).to.be.true;

      // 清理模拟
      delete global.window;
    });

    it('应根据系统偏好自动应用减少动画模式', () => {
      // 模拟浏览器环境
      sinon.stub(environmentDetector, 'isBrowser').returns(true);

      // 模拟减少动画偏好
      global.window = {
        matchMedia: query => {
          if (query === '(prefers-reduced-motion: reduce)') {
            return { matches: true };
          }
          return { matches: false };
        },
      };

      const theme = darkTheme.getTheme();

      // 验证减少动画模式已自动应用
      expect(theme.darkMode.reduceMotion).to.be.true;
      expect(theme.animations.enabled).to.be.false;

      // 清理模拟
      delete global.window;
    });
  });
});
